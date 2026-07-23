import { Router } from 'express';
import { login, registerTenant } from '../controllers/authController';

const router = Router();
router.post('/login', login);
router.post('/register', registerTenant);

export default router;
