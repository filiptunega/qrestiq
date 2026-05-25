import bcrypt from 'bcrypt';
import jwt    from 'jsonwebtoken';
import pool   from '../config/database.js';

const JWT_SECRET  = process.env.JWT_SECRET  ?? 'change-me-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? '8h';

/**
 * AuthService — Model pre autentifikáciu.
 *
 * Zodpovedá za overenie prihlasovacích údajov a vydanie JWT tokenu.
 */
export class AuthService {

    /**
     * Overí email + heslo a vráti podpísaný JWT token.
     *
     * @param {string} email
     * @param {string} password  — heslo v čistom texte
     * @returns {Promise<{ token: string, user: object } | null>}
     *          null ak credentials nesedia
     */
    async login(email, password) {
        // 1. Načítame používateľa vrátane hash-u (bežné SELECT ho vynecháva)
        const { rows } = await pool.query(
            'SELECT id, email, name, password_hash, is_active FROM users WHERE email = $1',
            [email]
        );

        if (!rows.length) return null;

        const row = rows[0];

        // 2. Porovnáme heslo s hashom
        const match = await bcrypt.compare(password, row.password_hash);
        if (!match) return null;

        // 3. Overíme, že účet je aktívny
        if (!row.is_active) return null;

        // 4. Vydáme JWT
        const payload = { sub: row.id, email: row.email, name: row.name };
        const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return {
            token,
            user: { id: row.id, email: row.email, name: row.name },
        };
    }
}
