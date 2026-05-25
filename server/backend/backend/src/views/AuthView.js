/**
 * AuthView — View pre autentifikáciu.
 *
 * Formátuje a odosiela HTTP odpovede pre auth endpointy.
 */
export class AuthView {

    /**
     * Úspešné prihlásenie — vráti token a základné info o používateľovi.
     */
    static loginSuccess(res, token, user) {
        res.json({ token, user });
    }

    /**
     * 401 — zlé prihlasovacie údaje.
     */
    static unauthorized(res) {
        res.status(401).json({ message: 'Nesprávny email alebo heslo.' });
    }

    /**
     * 422 — chýbajúce polia.
     */
    static validationError(res, errors) {
        res.status(422).json({ errors });
    }

    /**
     * Aktuálny prihlásený používateľ (z JWT payload-u).
     */
    static me(res, user) {
        res.json({ id: user.sub, email: user.email, name: user.name });
    }
}
