import { Router }         from 'express';
import { MenuController } from '../controllers/MenuController.js';

const router     = Router();
const controller = new MenuController();

router.get('/grouped', (req, res, next) => controller.grouped(req, res, next));
router.get('/',        (req, res, next) => controller.index(req, res, next));
router.get('/:id',     (req, res, next) => controller.show(req, res, next));

export default router;
