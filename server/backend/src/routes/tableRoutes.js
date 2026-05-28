import { Router }          from 'express';
import { TableController } from '../controllers/TableController.js';
import { authMiddleware }  from '../middleware/authMiddleware.js';

const router     = Router();
const controller = new TableController();

// Verejný endpoint — len aktívne stoly (pre zákazníkov)
router.get('/',    (req, res, next) => controller.index(req, res, next));

// Staff endpointy — vyžadujú autentifikáciu
router.get   ('/all', authMiddleware, (req, res, next) => controller.indexAll(req, res, next));
router.post  ('/',    authMiddleware, (req, res, next) => controller.create(req, res, next));
router.put   ('/:id', authMiddleware, (req, res, next) => controller.update(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => controller.destroy(req, res, next));

export default router;
