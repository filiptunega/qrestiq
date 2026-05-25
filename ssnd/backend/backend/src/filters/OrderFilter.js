/**
 * OrderFilter — očistí surový vstup pre vytvorenie objednávky.
 */
export class OrderFilter {

    /**
     * @param {object} body  surové req.body
     * @returns {{ tableNumber: any, note: string, items: any[] }}
     */
    static forCreate(body) {
        return {
            tableNumber: body.tableNumber,
            note:        String(body.note ?? '').trim().slice(0, 500),
            items:       Array.isArray(body.items) ? body.items : [],
        };
    }

    /**
     * @param {object} body
     * @returns {{ status: string }}
     */
    static forStatusUpdate(body) {
        return {
            status: String(body.status ?? '').trim().toLowerCase(),
        };
    }
}
