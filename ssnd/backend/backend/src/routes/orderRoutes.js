import { Router }          from 'express';
import { OrderController } from '../controllers/OrderController.js';

const router     = Router();
const controller = new OrderController();

router.get  ('/',          (req, res, next) => controller.index(req, res, next));
router.get  ('/:id',       (req, res, next) => controller.show(req, res, next));
router.post ('/',          (req, res, next) => controller.store(req, res, next));
router.patch('/:id/status',(req, res, next) => controller.updateStatus(req, res, next));

export default router;
