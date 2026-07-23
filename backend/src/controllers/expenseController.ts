import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthedRequest } from '../middleware/auth';
import { Expense } from '../models';
import { emitToTenant } from '../sockets/socket';

const createSchema = z.object({
  category: z.string().min(2),
  description: z.string().optional(),
  amount: z.number().positive(),
  expenseDate: z.string(), // 'YYYY-MM-DD'
});

export async function createExpense(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const userId = req.auth!.userId;
    const data = createSchema.parse(req.body);

    const expense = await Expense.create({
      tenant_id: tenantId,
      user_id: userId,
      category: data.category,
      description: data.description ?? null,
      amount: data.amount,
      expense_date: data.expenseDate,
    });

    emitToTenant(tenantId, 'activity', {
      message: `Nuevo gasto cargado: <strong>${data.category}</strong> $${data.amount.toLocaleString('es-AR')}`,
      at: new Date().toISOString(),
    });

    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

export async function listExpenses(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const expenses = await Expense.findAll({
      where: { tenant_id: tenantId },
      order: [['expense_date', 'DESC']],
      limit: 100,
    });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const id = Number(req.params.id);
    const expense = await Expense.findOne({ where: { id, tenant_id: tenantId } });
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
    await expense.destroy();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
