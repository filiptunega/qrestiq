import { AuthService } from '../models/AuthService.js';
import { AuthView }    from '../views/AuthView.js';

const authService = new AuthService();

/**
 * AuthController — Controller pre autentifikáciu.
 *
 * Koordinuje Filter → Service → View, neobsahuje SQL ani formátovanie.
 */
export class AuthController {

    /**
     * POST /api/auth/login
     *
     * Telo:  { email, password }
     * Odpoveď: { token, user } alebo 401
     */
    async login(req, res, next) {
        try {
            const email    = String(req.body.email    ?? '').trim().toLowerCase();
            const password = String(req.body.password ?? '');

            if (!email || !password) {
                return AuthView.validationError(res, ['Email a heslo sú povinné.']);
            }

            const result = await authService.login(email, password);

            if (!result) {
                return AuthView.unauthorized(res);
            }

            AuthView.loginSuccess(res, result.token, result.user);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/auth/me
     *
     * Vyžaduje platný JWT (authMiddleware nastaví req.user).
     */
    me(req, res) {
        AuthView.me(res, req.user);
    }
}
