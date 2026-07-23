import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getCurrent, openSession, closeSession, listSessions } from '../controllers/cashSessionController';

const router = Router();
router.use(requireAuth);

// Sin requireRole('admin') — empleados y admins pueden gestionar la caja
router.get('/current', getCurrent);
router.get('/',        listSessions);
router.post('/open',   openSession);
router.post('/close',  closeSession);

export default router;
