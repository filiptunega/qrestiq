import { Router }         from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router         = Router();
const authController = new AuthController();

// Verejné endpointy
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Chránený endpoint — overí token
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
