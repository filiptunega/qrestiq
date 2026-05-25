import { Router }          from 'express';
import { TableController } from '../controllers/TableController.js';

const router     = Router();
const controller = new TableController();

router.get('/', (req, res, next) => controller.index(req, res, next));

export default router;
