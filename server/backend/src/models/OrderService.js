import pool          from '../config/database.js';
import { Order }     from '../entities/Order.js';
import { OrderItem } from '../entities/Order.js';

/**
 * OrderService — Model pre orders a order_items.
 */
export class OrderService {

    /**
     * Vráti všetky objednávky (voliteľne filtrované podľa statusu).
     * @param {{ status?: string }} [opts]
     * @returns {Promise<Order[]>}
     */
    async findAll({ status } = {}) {
        const params = [];
        let where = '';
        if (status) {
            params.push(status);
            where = `WHERE o.status = $1`;
        }

        const { rows } = await pool.query(
            `SELECT o.id, o.table_id, rt.number AS table_number,
                    o.status, o.note, o.total, o.created_at, o.updated_at
             FROM orders o
             JOIN restaurant_tables rt ON rt.id = o.table_id
             ${where}
             ORDER BY o.created_at DESC`,
            params
        );

        const orders = rows.map(r => this.#toEntity(r));

        // Načítame položky pre všetky objednávky naraz
        if (orders.length) {
            const ids = orders.map(o => o.id);
            const { rows: itemRows } = await pool.query(
                `SELECT id, order_id, menu_item_id, name, price, quantity
                 FROM order_items
                 WHERE order_id = ANY($1::bigint[])`,
                [ids]
            );

            const itemsByOrder = itemRows.reduce((acc, r) => {
                if (!acc[r.order_id]) acc[r.order_id] = [];
                acc[r.order_id].push(this.#toItemEntity(r));
                return acc;
            }, {});

            orders.forEach(o => { o.items = itemsByOrder[o.id] ?? []; });
        }

        return orders;
    }

    /**
     * Nájde jednu objednávku podľa ID vrátane jej položiek.
     * @param {number} id
     * @returns {Promise<Order|null>}
     */
    async findById(id) {
        const { rows } = await pool.query(
            `SELECT o.id, o.table_id, rt.number AS table_number,
                    o.status, o.note, o.total, o.created_at, o.updated_at
             FROM orders o
             JOIN restaurant_tables rt ON rt.id = o.table_id
             WHERE o.id = $1`,
            [id]
        );
        if (!rows.length) return null;

        const order = this.#toEntity(rows[0]);

        const { rows: itemRows } = await pool.query(
            `SELECT id, order_id, menu_item_id, name, price, quantity
             FROM order_items WHERE order_id = $1`,
            [id]
        );
        order.items = itemRows.map(r => this.#toItemEntity(r));

        return order;
    }

    /**
     * Vytvorí novú objednávku s jej položkami v jednej transakcii.
     *
     * @param {{
     *   tableId: number,
     *   note: string,
     *   items: Array<{ menuItemId: number, name: string, price: number, quantity: number }>
     * }} data
     * @returns {Promise<Order>}
     */
    async create(data) {
        const total = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const client = await (await import('../config/database.js')).default.connect();
        try {
            await client.query('BEGIN');

            const { rows: [orderRow] } = await client.query(
                `INSERT INTO orders (table_id, note, total)
                 VALUES ($1, $2, $3)
                 RETURNING id, table_id, status, note, total, created_at, updated_at`,
                [data.tableId, data.note, total.toFixed(2)]
            );

            const itemInserts = data.items.map((item, i) => {
                const base = i * 4;
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
            });

            const itemValues = data.items.flatMap(item => [
                orderRow.id,
                item.menuItemId,
                item.name,
                item.price,
                // quantity is separate — rebuild placeholders properly below
            ]);

            // Rebuild with 5 columns
            const placeholders = data.items.map((_, i) => {
                const b = i * 5;
                return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5})`;
            }).join(',');

            const flatValues = data.items.flatMap(item => [
                orderRow.id,
                item.menuItemId,
                item.name,
                item.price,
                item.quantity,
            ]);

            await client.query(
                `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
                 VALUES ${placeholders}`,
                flatValues
            );

            await client.query('COMMIT');

            return this.findById(orderRow.id);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Aktualizuje status objednávky.
     * @param {number} id
     * @param {string} status
     * @returns {Promise<Order|null>}
     */
    async updateStatus(id, status) {
        const { rowCount } = await pool.query(
            `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
            [status, id]
        );
        if (!rowCount) return null;
        return this.findById(id);
    }

    #toEntity(row) {
        return new Order({
            id:          row.id,
            tableId:     row.table_id,
            tableNumber: row.table_number,
            status:      row.status,
            note:        row.note,
            total:       row.total,
            items:       [],
            createdAt:   row.created_at,
            updatedAt:   row.updated_at,
        });
    }

    #toItemEntity(row) {
        return new OrderItem({
            id:         row.id,
            orderId:    row.order_id,
            menuItemId: row.menu_item_id,
            name:       row.name,
            price:      row.price,
            quantity:   row.quantity,
        });
    }
}
