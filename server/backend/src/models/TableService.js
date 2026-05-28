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

    /**
     * Vráti všetky stoly (vrátane neaktívnych).
     * @returns {Promise<RestaurantTable[]>}
     */
    async findAll() {
        const { rows } = await pool.query(
            'SELECT id, number, is_active, created_at FROM restaurant_tables ORDER BY number'
        );
        return rows.map(r => this.#toEntity(r));
    }

    /**
     * Vytvorí nový stôl.
     * @param {number} number
     * @returns {Promise<RestaurantTable>}
     */
    async create(number) {
        const { rows } = await pool.query(
            'INSERT INTO restaurant_tables (number) VALUES ($1) RETURNING id, number, is_active, created_at',
            [number]
        );
        return this.#toEntity(rows[0]);
    }

    /**
     * Aktualizuje is_active a/alebo number stola.
     * @param {number} id
     * @param {{ isActive?: boolean, number?: number }} fields
     * @returns {Promise<RestaurantTable|null>}
     */
    async update(id, { isActive, number } = {}) {
        const setClauses = [];
        const values     = [];

        if (isActive !== undefined) {
            values.push(isActive);
            setClauses.push(`is_active = $${values.length}`);
        }
        if (number !== undefined) {
            values.push(number);
            setClauses.push(`number = $${values.length}`);
        }
        if (setClauses.length === 0) return this.findById(id);

        values.push(id);
        const { rows } = await pool.query(
            `UPDATE restaurant_tables SET ${setClauses.join(', ')} WHERE id = $${values.length}
             RETURNING id, number, is_active, created_at`,
            values
        );
        return rows.length ? this.#toEntity(rows[0]) : null;
    }

    /**
     * Vymaže stôl podľa ID.
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const { rowCount } = await pool.query(
            'DELETE FROM restaurant_tables WHERE id = $1',
            [id]
        );
        return rowCount > 0;
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
