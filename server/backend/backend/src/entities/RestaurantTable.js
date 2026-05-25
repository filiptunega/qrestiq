/**
 * RestaurantTable entita — odráža stĺpce tabuľky `restaurant_tables`.
 */
export class RestaurantTable {
    /** @type {number} */
    id;

    /** @type {number} */
    number;

    /** @type {boolean} */
    isActive;

    /** @type {Date} */
    createdAt;

    constructor({ id, number, isActive, createdAt }) {
        this.id        = id;
        this.number    = number;
        this.isActive  = isActive;
        this.createdAt = createdAt;
    }
}
