/**
 * MenuItem entita — odráža stĺpce tabuľky `menu_items`.
 */
export class MenuItem {
    /** @type {number} */
    id;

    /** @type {string} */
    category;

    /** @type {string} */
    name;

    /** @type {string} */
    description;

    /** @type {number} */
    price;

    /** @type {string} */
    imgUrl;

    /** @type {boolean} */
    isActive;

    /** @type {number} */
    sortOrder;

    /** @type {Date} */
    createdAt;

    /** @type {Date} */
    updatedAt;

    constructor({ id, category, name, description, price, imgUrl, isActive, sortOrder, createdAt, updatedAt }) {
        this.id          = id;
        this.category    = category;
        this.name        = name;
        this.description = description;
        this.price       = Number(price);
        this.imgUrl      = imgUrl;
        this.isActive    = isActive;
        this.sortOrder   = sortOrder;
        this.createdAt   = createdAt;
        this.updatedAt   = updatedAt;
    }
}
