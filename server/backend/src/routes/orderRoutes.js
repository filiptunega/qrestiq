import { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new OrderController();

// ─── Verejné endpointy (bez loginu) ──────────────────────────────────────────

// Zákazník môže vytvoriť objednávku bez loginu
router.post('/', (req, res, next) => controller.store(req, res, next));

// Zákazník môže sledovať stav svojej objednávky podľa ID — BEZ autentifikácie
router.get('/track/:id', (req, res, next) => controller.track(req, res, next));

// ─── Chránené endpointy (personál musí byť prihlásený) ───────────────────────
router.get('/', authMiddleware, (req, res, next) => controller.index(req, res, next));
router.get('/:id', authMiddleware, (req, res, next) => controller.show(req, res, next));
router.patch('/:id/status', authMiddleware, (req, res, next) => controller.updateStatus(req, res, next));

export default router;