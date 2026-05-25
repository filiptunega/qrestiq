import { Router }           from 'express';
import { UserController }   from '../controllers/UserController.js';
import { authMiddleware }   from '../middleware/authMiddleware.js';

const router         = Router();
const userController = new UserController();

// Všetky user operácie vyžadujú prihlásenie (len admin)
router.get   ('/',    authMiddleware, (req, res, next) => userController.index(req, res, next));
router.get   ('/:id', authMiddleware, (req, res, next) => userController.show(req, res, next));
router.post  ('/',    authMiddleware, (req, res, next) => userController.store(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => userController.destroy(req, res, next));

export default router;
