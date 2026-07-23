import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';
import { AuthedRequest } from '../middleware/auth';
import { CashSession, Sale, Expense, User } from '../models';
import { emitToTenant } from '../sockets/socket';

async function computeRunningTotals(tenantId: number, session: CashSession) {
  const since = session.opened_at;
  const [totalVentas, ventasEfectivo, totalGastos] = await Promise.all([
    // Total de ventas por todos los medios de pago — es lo que se muestra como "Total ventas"
    Sale.sum('total', {
      where: { tenant_id: tenantId, created_at: { [Op.gte]: since } },
    }),
    // Solo ventas en efectivo — es lo único que realmente entra a la caja física
    Sale.sum('total', {
      where: { tenant_id: tenantId, created_at: { [Op.gte]: since }, payment_method: 'efectivo' },
    }),
    // Solo gastos pagados en efectivo salen de la caja física
    Expense.sum('amount', {
      where: { tenant_id: tenantId, expense_date: { [Op.gte]: since }, payment_method: 'efectivo' },
    }),
  ]);
  const cashSales      = Number(totalVentas)    || 0; // total ventas (todos los medios)
  const cashOnlySales   = Number(ventasEfectivo) || 0; // solo efectivo, para el cálculo de caja física
  const cashExpenses   = Number(totalGastos)    || 0;
  const expectedCash   = Number(session.opening_amount) + cashOnlySales - cashExpenses;
  return { cashSales, otherSales: cashOnlySales, cashExpenses, expectedCash };
}

export async function getCurrent(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const session = await CashSession.findOne({
      where: { tenant_id: tenantId, status: 'abierta' },
      include: [{ model: User, as: 'OpenedBy', attributes: ['id', 'name'] }],
      order: [['opened_at', 'DESC']],
    });
    if (!session) return res.json({ session: null });
    const totals = await computeRunningTotals(tenantId, session);
    res.json({ session, totals });
  } catch (err) { next(err); }
}

const openSchema = z.object({ openingAmount: z.number().nonnegative() });

export async function openSession(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const userId   = req.auth!.userId;
    const { openingAmount } = openSchema.parse(req.body);

    const existing = await CashSession.findOne({ where: { tenant_id: tenantId, status: 'abierta' } });
    if (existing) return res.status(409).json({ error: 'Ya hay una caja abierta' });

    const session = await CashSession.create({ tenant_id: tenantId, opened_by: userId, opening_amount: openingAmount });

    emitToTenant(tenantId, 'activity', {
      message: `Se abrió la caja con <strong>$${openingAmount.toLocaleString('es-AR')}</strong>`,
      at: new Date().toISOString(),
    });
    emitToTenant(tenantId, 'cash:changed', {});

    res.status(201).json(session);
  } catch (err) { next(err); }
}

const closeSchema = z.object({ closingAmount: z.number().nonnegative(), notes: z.string().optional() });

export async function closeSession(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const userId   = req.auth!.userId;
    const { closingAmount, notes } = closeSchema.parse(req.body);

    const session = await CashSession.findOne({ where: { tenant_id: tenantId, status: 'abierta' } });
    if (!session) return res.status(404).json({ error: 'No hay una caja abierta' });

    const totals     = await computeRunningTotals(tenantId, session);
    const difference = closingAmount - totals.expectedCash;

    await session.update({
      closed_by:         userId,
      closing_amount:    closingAmount,
      expected_amount:   totals.expectedCash,
      difference_amount: difference,
      closed_at:         new Date(),
      status:            'cerrada',
      notes:             notes ?? null,
    });

    emitToTenant(tenantId, 'activity', {
      message: `Se cerró la caja. Diferencia: <strong>${difference >= 0 ? '+' : ''}$${difference.toLocaleString('es-AR')}</strong>`,
      at: new Date().toISOString(),
    });
    emitToTenant(tenantId, 'cash:changed', {});

    res.json({ session, totals });
  } catch (err) { next(err); }
}

export async function listSessions(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const sessions = await CashSession.findAll({
      where: { tenant_id: tenantId },
      include: [
        { model: User, as: 'OpenedBy', attributes: ['id', 'name'] },
        { model: User, as: 'ClosedBy', attributes: ['id', 'name'] },
      ],
      order: [['opened_at', 'DESC']],
      limit: 30,
    });
    res.json(sessions);
  } catch (err) { next(err); }
}
