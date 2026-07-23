import { Router } from 'express';
import authRoutes        from './auth.routes';
import productRoutes     from './product.routes';
import saleRoutes        from './sale.routes';
import expenseRoutes     from './expense.routes';
import employeeRoutes    from './employee.routes';
import dashboardRoutes   from './dashboard.routes';
import cashSessionRoutes from './cashSession.routes';

const router = Router();

router.use('/auth',          authRoutes);
router.use('/products',      productRoutes);
router.use('/sales',         saleRoutes);
router.use('/expenses',      expenseRoutes);
router.use('/employees',     employeeRoutes);
router.use('/dashboard',     dashboardRoutes);
router.use('/cash-sessions', cashSessionRoutes);

export default router;
