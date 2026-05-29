/**
 * TableView — formátuje HTTP odpovede pre stoly.
 */
export class TableView {
    static list(res, tables) {
        res.json(tables.map(TableView.#formatPublic));
    }

    static listAdmin(res, tables) {
        res.json(tables.map(TableView.#formatAdmin));
    }

    static single(res, table) {
        res.json(TableView.#formatAdmin(table));
    }

    static created(res, table) {
        res.status(201).json(TableView.#formatAdmin(table));
    }

    static #formatPublic(t) {
        return { id: t.id, number: t.number };
    }

    static #formatAdmin(t) {
        return { id: t.id, number: t.number, isActive: t.isActive, createdAt: t.createdAt };
    }
}

/**
 * MenuView — formátuje HTTP odpovede pre menu.
 */
export class MenuView {
    /** Vráti menu ako flat pole */
    static list(res, items) {
        res.json(items.map(MenuView.#format));
    }

    /** Vráti menu zoskupené podľa kategórií */
    static grouped(res, grouped) {
        const result = {};
        for (const [cat, items] of Object.entries(grouped)) {
            result[cat] = items.map(MenuView.#format);
        }
        res.json(result);
    }

    static notFound(res) {
        res.status(404).json({ message: 'Položka menu nebola nájdená.' });
    }

    static #format(item) {
        return {
            id: item.id,
            category: item.category,
            name: item.name,
            description: item.description,
            price: item.price,
            imgUrl: item.imgUrl,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }
}

/**
 * OrderView — formátuje HTTP odpovede pre objednávky.
 */
export class OrderView {
    static list(res, orders) {
        res.json(orders.map(OrderView.#format));
    }

    static single(res, order) {
        res.json(OrderView.#format(order));
    }

    static created(res, order) {
        res.status(201).json(OrderView.#format(order));
    }

    static notFound(res) {
        res.status(404).json({ message: 'Objednávka nebola nájdená.' });
    }

    static validationError(res, errors) {
        res.status(422).json({ errors });
    }

    /**
     * Verejný tracking endpoint — zákazník vidí len bezpečné informácie.
     * Neobsahuje interné IDs (table_id), iba číslo stola a verejné dáta.
     */
    static tracked(res, order) {
        res.json(OrderView.#formatPublic(order));
    }

    static #format(order) {
        return {
            id: order.id,
            tableNumber: order.tableNumber,
            status: order.status,
            note: order.note,
            total: order.total,
            createdAt: order.createdAt,
            items: (order.items ?? []).map(i => ({
                menuItemId: i.menuItemId,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
            })),
        };
    }

    /** Obmedzený formát pre zákazníka — bez interných IDs */
    static #formatPublic(order) {
        return {
            id: order.id,
            tableNumber: order.tableNumber,
            status: order.status,
            note: order.note,
            total: order.total,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            items: (order.items ?? []).map(i => ({
                name: i.name,
                price: i.price,
                quantity: i.quantity,
            })),
        };
    }
}