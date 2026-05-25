import { Router }          from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { authMiddleware }  from '../middleware/authMiddleware.js';

const router     = Router();
const controller = new OrderController();

// Zákazník môže vytvoriť objednávku bez loginu
router.post ('/',          (req, res, next) => controller.store(req, res, next));

// Personál musí byť prihlásený — prezeranie a zmena stavu objednávok
router.get  ('/',          authMiddleware, (req, res, next) => controller.index(req, res, next));
router.get  ('/:id',       authMiddleware, (req, res, next) => controller.show(req, res, next));
router.patch('/:id/status',authMiddleware, (req, res, next) => controller.updateStatus(req, res, next));

export default router;
