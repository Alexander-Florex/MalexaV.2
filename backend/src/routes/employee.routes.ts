import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listEmployees, createEmployee, updateEmployee } from '../controllers/employeeController';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', listEmployees);
router.post('/', createEmployee);
router.patch('/:id', updateEmployee);

export default router;
