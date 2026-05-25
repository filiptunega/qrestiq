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
