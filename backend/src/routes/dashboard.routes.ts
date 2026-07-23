import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getSummary, getReports } from '../controllers/dashboardController';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/summary', getSummary);
router.get('/reports', getReports);

export default router;
