const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

/**
 * OrderValidator — overí vstup pre objednávky.
 */
export class OrderValidator {

    /**
     * @param {{ tableNumber: any, items: any[] }} data
     * @returns {string[]}
     */
    static forCreate(data) {
        const errors = [];

        if (data.tableNumber === undefined || data.tableNumber === null) {
            errors.push('Číslo stola je povinné.');
        } else if (!Number.isInteger(Number(data.tableNumber)) || Number(data.tableNumber) <= 0) {
            errors.push('Číslo stola musí byť kladné celé číslo.');
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            errors.push('Objednávka musí obsahovať aspoň jednu položku.');
        } else {
            data.items.forEach((item, idx) => {
                if (!item.menuItemId) {
                    errors.push(`Položka ${idx + 1}: chýba menuItemId.`);
                }
                if (!item.quantity || item.quantity < 1) {
                    errors.push(`Položka ${idx + 1}: quantity musí byť aspoň 1.`);
                }
            });
        }

        return errors;
    }

    /**
     * @param {{ status: string }} data
     * @returns {string[]}
     */
    static forStatusUpdate(data) {
        const errors = [];
        if (!VALID_STATUSES.includes(data.status)) {
            errors.push(`Neplatný status. Povolené hodnoty: ${VALID_STATUSES.join(', ')}.`);
        }
        return errors;
    }
}
