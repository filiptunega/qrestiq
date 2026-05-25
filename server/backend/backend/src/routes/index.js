import { Router } from 'express';
import authRoutes  from './authRoutes.js';
import userRoutes  from './userRoutes.js';
import tableRoutes from './tableRoutes.js';
import menuRoutes  from './menuRoutes.js';
import orderRoutes from './orderRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth',   authRoutes);
router.use('/users',  userRoutes);
router.use('/tables', tableRoutes);
router.use('/menu',   menuRoutes);
router.use('/orders', orderRoutes);

export default router;
