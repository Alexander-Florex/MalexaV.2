import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createExpense, listExpenses, deleteExpense } from '../controllers/expenseController';

const router = Router();
router.use(requireAuth);

router.get('/', listExpenses);
router.post('/', createExpense);                        // empleados Y admins pueden cargar gastos
router.delete('/:id', requireRole('admin'), deleteExpense); // solo admin puede eliminar
export default router;
