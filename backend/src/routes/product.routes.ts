import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  listProducts, createProduct, updateProduct, deleteProduct,
  listCategories, createCategory, adjustStock,
} from '../controllers/productController';

const router = Router();
router.use(requireAuth);
router.get('/', listProducts);
router.get('/categories', listCategories);
router.post('/categories', requireRole('admin'), createCategory);
router.post('/', requireRole('admin'), createProduct);
router.patch('/:id', requireRole('admin'), updateProduct);
router.delete('/:id', requireRole('admin'), deleteProduct);
router.post('/:id/stock', adjustStock);
export default router;
