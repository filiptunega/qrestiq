import pool                from '../config/database.js';
import { RestaurantTable } from '../entities/RestaurantTable.js';

/**
 * TableService — Model pre restaurant_tables.
 */
export class TableService {

    /**
     * Vráti všetky aktívne stoly.
     * @returns {Promise<RestaurantTable[]>}
     */
    async findAllActive() {
        const { rows } = await pool.query(
            'SELECT id, number, is_active, created_at FROM restaurant_tables WHERE is_active = TRUE ORDER BY number'
        );
        return rows.map(r => this.#toEntity(r));
    }

    /**
     * Nájde stôl podľa čísla stola.
     * @param {number} number
     * @returns {Promise<RestaurantTable|null>}
     */
    async findByNumber(number) {
        const { rows } = await pool.query(
            'SELECT id, number, is_active, created_at FROM restaurant_tables WHERE number = $1',
            [number]
        );
        return rows.length ? this.#toEntity(rows[0]) : null;
    }

    /**
     * Nájde stôl podľa ID.
     * @param {number} id
     * @returns {Promise<RestaurantTable|null>}
     */
    async findById(id) {
        const { rows } = await pool.query(
            'SELECT id, number, is_active, created_at FROM restaurant_tables WHERE id = $1',
            [id]
        );
        return rows.length ? this.#toEntity(rows[0]) : null;
    }

    #toEntity(row) {
        return new RestaurantTable({
            id:        row.id,
            number:    row.number,
            isActive:  row.is_active,
            createdAt: row.created_at,
        });
    }
}
