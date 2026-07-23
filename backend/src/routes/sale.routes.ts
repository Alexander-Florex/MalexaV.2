import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createSale, listSales, getSale } from '../controllers/saleController';

const router = Router();
router.use(requireAuth);

router.get('/', listSales);
router.get('/:id', getSale);
router.post('/', createSale);

export default router;
