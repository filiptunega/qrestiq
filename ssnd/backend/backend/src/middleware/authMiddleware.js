import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

/**
 * authMiddleware — ochráni route overením JWT tokenu.
 *
 * Očakáva hlavičku:  Authorization: Bearer <token>
 * Ak je token platný, pripojí dekódovaný payload na req.user.
 */
export function authMiddleware(req, res, next) {
    const header = req.headers['authorization'] ?? '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Chýba autorizačný token.' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Token je neplatný alebo vypršal.' });
    }
}
