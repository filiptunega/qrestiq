import pool           from '../config/database.js';
import { MenuItem }   from '../entities/MenuItem.js';

/**
 * MenuService — Model pre menu_items.
 */
export class MenuService {

    /**
     * Vráti všetky aktívne položky menu, zoradené podľa kategórie a sort_order.
     * @returns {Promise<MenuItem[]>}
     */
    async findAllActive() {
        const { rows } = await pool.query(
            `SELECT id, category, name, description, price, img_url, is_active, sort_order, created_at, updated_at
             FROM menu_items
             WHERE is_active = TRUE
             ORDER BY category, sort_order, id`
        );
        return rows.map(r => this.#toEntity(r));
    }

    /**
     * Vráti VŠETKY položky vrátane neaktívnych (pre admin).
     * @returns {Promise<MenuItem[]>}
     */
    async findAll() {
        const { rows } = await pool.query(
            `SELECT id, category, name, description, price, img_url, is_active, sort_order, created_at, updated_at
             FROM menu_items
             ORDER BY category, sort_order, id`
        );
        return rows.map(r => this.#toEntity(r));
    }

    /**
     * Nájde položku podľa ID.
     * @param {number} id
     * @returns {Promise<MenuItem|null>}
     */
    async findById(id) {
        const { rows } = await pool.query(
            `SELECT id, category, name, description, price, img_url, is_active, sort_order, created_at, updated_at
             FROM menu_items WHERE id = $1`,
            [id]
        );
        return rows.length ? this.#toEntity(rows[0]) : null;
    }

    /**
     * Vráti menu zoskupené podľa kategórií (objekt { kategória: [položky] }).
     * @returns {Promise<Record<string, MenuItem[]>>}
     */
    async findGroupedByCategory() {
        const items = await this.findAllActive();
        return items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});
    }

    /**
     * Vytvorí novú položku menu.
     * @param {{ category, name, description, price, imgUrl, isActive, sortOrder }} data
     * @returns {Promise<MenuItem>}
     */
    async create({ category, name, description, price, imgUrl, isActive, sortOrder }) {
        const { rows } = await pool.query(
            `INSERT INTO menu_items (category, name, description, price, img_url, is_active, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, category, name, description, price, img_url, is_active, sort_order, created_at, updated_at`,
            [category, name, description ?? '', price, imgUrl ?? '', isActive ?? true, sortOrder ?? 0]
        );
        return this.#toEntity(rows[0]);
    }

    /**
     * Aktualizuje existujúcu položku menu.
     * @param {number} id
     * @param {{ category?, name?, description?, price?, imgUrl?, isActive?, sortOrder? }} data
     * @returns {Promise<MenuItem|null>}
     */
    async update(id, { category, name, description, price, imgUrl, isActive, sortOrder }) {
        const { rows } = await pool.query(
            `UPDATE menu_items
             SET category    = COALESCE($1, category),
                 name        = COALESCE($2, name),
                 description = COALESCE($3, description),
                 price       = COALESCE($4, price),
                 img_url     = COALESCE($5, img_url),
                 is_active   = COALESCE($6, is_active),
                 sort_order  = COALESCE($7, sort_order),
                 updated_at  = NOW()
             WHERE id = $8
             RETURNING id, category, name, description, price, img_url, is_active, sort_order, created_at, updated_at`,
            [category ?? null, name ?? null, description ?? null, price ?? null,
             imgUrl ?? null, isActive ?? null, sortOrder ?? null, id]
        );
        return rows.length ? this.#toEntity(rows[0]) : null;
    }

    /**
     * Vymaže položku menu podľa ID.
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const { rowCount } = await pool.query(
            `DELETE FROM menu_items WHERE id = $1`, [id]
        );
        return rowCount > 0;
    }

    /**
     * Vráti zoznam unikátnych kategórií.
     * @returns {Promise<string[]>}
     */
    async getCategories() {
        const { rows } = await pool.query(
            `SELECT DISTINCT category FROM menu_items ORDER BY category`
        );
        return rows.map(r => r.category);
    }

    #toEntity(row) {
        return new MenuItem({
            id:          row.id,
            category:    row.category,
            name:        row.name,
            description: row.description,
            price:       row.price,
            imgUrl:      row.img_url,
            isActive:    row.is_active,
            sortOrder:   row.sort_order,
            createdAt:   row.created_at,
            updatedAt:   row.updated_at,
        });
    }
}
