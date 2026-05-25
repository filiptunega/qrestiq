/**
 * OrderItem entita — jedna položka v objednávke.
 */
export class OrderItem {
    /** @type {number} */
    id;

    /** @type {number} */
    orderId;

    /** @type {number} */
    menuItemId;

    /** @type {string} */
    name;

    /** @type {number} */
    price;

    /** @type {number} */
    quantity;

    constructor({ id, orderId, menuItemId, name, price, quantity }) {
        this.id         = id;
        this.orderId    = orderId;
        this.menuItemId = menuItemId;
        this.name       = name;
        this.price      = Number(price);
        this.quantity   = quantity;
    }
}

/**
 * Order entita — odráža stĺpce tabuľky `orders`.
 */
export class Order {
    /** @type {number} */
    id;

    /** @type {number} */
    tableId;

    /** @type {number|null} */
    tableNumber;

    /** @type {string} */
    status;

    /** @type {string} */
    note;

    /** @type {number} */
    total;

    /** @type {OrderItem[]} */
    items;

    /** @type {Date} */
    createdAt;

    /** @type {Date} */
    updatedAt;

    constructor({ id, tableId, tableNumber, status, note, total, items, createdAt, updatedAt }) {
        this.id          = id;
        this.tableId     = tableId;
        this.tableNumber = tableNumber ?? null;
        this.status      = status;
        this.note        = note;
        this.total       = Number(total);
        this.items       = items ?? [];
        this.createdAt   = createdAt;
        this.updatedAt   = updatedAt;
    }
}
