import { Response, NextFunction } from 'express';
import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import { AuthedRequest } from '../middleware/auth';
import { Sale, Expense, Product, User, StockMovement } from '../models';
import { sequelize } from '../config/db';

function startOfToday() { const d=new Date(); d.setHours(0,0,0,0); return d; }
function startOfMonth()  { const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }
function daysAgo(n:number) { const d=new Date(); d.setDate(d.getDate()-n); d.setHours(0,0,0,0); return d; }

export async function getSummary(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const [ventasHoy, ventasUltimos7, gastosMes, stockBajoRows, productosActivos] = await Promise.all([
      Sale.sum('total', { where: { tenant_id: tenantId, created_at: { [Op.gte]: startOfToday() } } }),
      Sale.findAll({
        attributes: [[fn('DATE', col('created_at')),'day'],[fn('SUM',col('total')),'total']],
        where: { tenant_id: tenantId, created_at: { [Op.gte]: daysAgo(6) } },
        group: [literal('DATE(created_at)') as unknown as string],
        order: [[literal('DATE(created_at)'),'ASC']], raw: true,
      }),
      Expense.sum('amount', { where: { tenant_id: tenantId, expense_date: { [Op.gte]: startOfMonth() } } }),
      Product.findAll({
        where: { tenant_id: tenantId, active: true, stock: { [Op.lte]: 5 } },
        attributes: ['id'], raw: true,
      }),
      Product.count({ where: { tenant_id: tenantId, active: true } }),
    ]);

    const recentSales = await Sale.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: User, attributes: ['name'] }],
      order: [['created_at','DESC']], limit: 5,
    });
    const recentExpenses = await Expense.findAll({
      where: { tenant_id: tenantId }, order: [['created_at','DESC']], limit: 5,
    });
    const recentStock = await StockMovement.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: Product, attributes: ['name'] }],
      order: [['created_at','DESC']], limit: 5,
    });

    const activity = [
      ...recentSales.map((s:any) => ({
        message: `<strong>${s.User?.name ?? 'Empleado'}</strong> registró venta de <strong>$${Number(s.total).toLocaleString('es-AR')}</strong>`,
        at: s.created_at,
      })),
      ...recentExpenses.map((e) => ({
        message: `Gasto: <strong>${e.category}</strong> $${Number(e.amount).toLocaleString('es-AR')}`,
        at: e.created_at,
      })),
      ...recentStock.map((m:any) => ({
        message: `Stock de <strong>${(m as any).Product?.name ?? 'Producto'}</strong>: ${m.quantity > 0 ? '+' : ''}${m.quantity}`,
        at: m.created_at,
      })),
    ].sort((a,b) => new Date(b.at).getTime()-new Date(a.at).getTime()).slice(0,8);

    res.json({
      ventasHoy: Number(ventasHoy)||0,
      gastosMes: Number(gastosMes)||0,
      stockBajo: stockBajoRows.length,
      productosActivos,
      ventasUltimos7Dias: ventasUltimos7,
      actividadReciente: activity,
    });
  } catch (err) { next(err); }
}

function monthsAgo(n:number){ const d=new Date(); d.setMonth(d.getMonth()-n); d.setDate(1); d.setHours(0,0,0,0); return d; }
function ymLabel(d:Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

export async function getReports(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const since30 = daysAgo(30);
    const since6m = monthsAgo(5);

    const [ventasPorCategoria, topProductos, gastosPorCategoria, ventasPorEmpleado, salesByMonth, expensesByMonth] =
      await Promise.all([
        sequelize.query(
          `SELECT COALESCE(c.name,'Sin categoría') AS categoria, SUM(si.subtotal) AS total
           FROM sale_items si JOIN sales s ON s.id=si.sale_id
           JOIN products p ON p.id=si.product_id LEFT JOIN categories c ON c.id=p.category_id
           WHERE s.tenant_id=:tid AND s.created_at>=:since GROUP BY categoria ORDER BY total DESC`,
          { replacements:{tid:tenantId,since:since30}, type:QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT p.id, p.name, SUM(si.quantity) AS cantidad, SUM(si.subtotal) AS total
           FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id
           WHERE s.tenant_id=:tid AND s.created_at>=:since
           GROUP BY p.id,p.name ORDER BY cantidad DESC LIMIT 5`,
          { replacements:{tid:tenantId,since:since30}, type:QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT category AS categoria, SUM(amount) AS total FROM expenses
           WHERE tenant_id=:tid AND expense_date>=:since GROUP BY categoria ORDER BY total DESC`,
          { replacements:{tid:tenantId,since:since30}, type:QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT u.name AS empleado, SUM(s.total) AS total, COUNT(s.id) AS cantidad
           FROM sales s JOIN users u ON u.id=s.user_id
           WHERE s.tenant_id=:tid AND s.created_at>=:since GROUP BY u.id,u.name ORDER BY total DESC`,
          { replacements:{tid:tenantId,since:since30}, type:QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT DATE_FORMAT(created_at,'%Y-%m') AS ym, SUM(total) AS total
           FROM sales WHERE tenant_id=:tid AND created_at>=:since GROUP BY ym ORDER BY ym ASC`,
          { replacements:{tid:tenantId,since:since6m}, type:QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT DATE_FORMAT(expense_date,'%Y-%m') AS ym, SUM(amount) AS total
           FROM expenses WHERE tenant_id=:tid AND expense_date>=:since GROUP BY ym ORDER BY ym ASC`,
          { replacements:{tid:tenantId,since:since6m}, type:QueryTypes.SELECT }
        ),
      ]);

    const salesMap = new Map((salesByMonth as any[]).map(r=>[r.ym,Number(r.total)]));
    const expMap   = new Map((expensesByMonth as any[]).map(r=>[r.ym,Number(r.total)]));
    const ingresosVsGastos = [];
    for(let i=5;i>=0;i--){ const d=monthsAgo(i); const ym=ymLabel(d); ingresosVsGastos.push({month:ym,ingresos:salesMap.get(ym)??0,gastos:expMap.get(ym)??0}); }

    res.json({ ventasPorCategoria, topProductos, gastosPorCategoria, ventasPorEmpleado, ingresosVsGastos });
  } catch (err) { next(err); }
}
