import { Router }         from 'express';
import { MenuController } from '../controllers/MenuController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router     = Router();
const controller = new MenuController();

// ---- Verejné endpointy ----
router.get('/grouped',          (req, res, next) => controller.grouped(req, res, next));
router.get('/',                 (req, res, next) => controller.index(req, res, next));

// ---- Chránené admin endpointy ----
router.get('/admin/all',        authMiddleware, (req, res, next) => controller.adminAll(req, res, next));
router.get('/admin/categories', authMiddleware, (req, res, next) => controller.adminCategories(req, res, next));
router.post('/',                authMiddleware, (req, res, next) => controller.create(req, res, next));
router.put('/:id',              authMiddleware, (req, res, next) => controller.update(req, res, next));
router.delete('/:id',           authMiddleware, (req, res, next) => controller.destroy(req, res, next));

// Verejný detail (za adminskými, aby /admin/* neskočilo na /:id)
router.get('/:id',              (req, res, next) => controller.show(req, res, next));

export default router;
