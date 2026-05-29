import { OrderService } from '../models/OrderService.js';
import { TableService } from '../models/TableService.js';
import { MenuService } from '../models/MenuService.js';
import { OrderFilter } from '../filters/OrderFilter.js';
import { OrderValidator } from '../validators/OrderValidator.js';
import { OrderView } from '../views/QrestiqViews.js';

const orderService = new OrderService();
const tableService = new TableService();
const menuService = new MenuService();

/**
 * OrderController
 *
 * GET    /api/orders              — všetky objednávky (voliteľne ?status=pending)  [auth]
 * GET    /api/orders/:id          — jedna objednávka                               [auth]
 * GET    /api/orders/track/:id    — sledovanie stavu objednávky zákazníkom          [public]
 * POST   /api/orders              — vytvor objednávku                              [public]
 * PATCH  /api/orders/:id/status   — zmeň status                                   [auth]
 */
export class OrderController {

    async index(req, res, next) {
        try {
            const status = req.query.status || undefined;
            const orders = await orderService.findAll({ status });
            OrderView.list(res, orders);
        } catch (err) {
            next(err);
        }
    }

    async show(req, res, next) {
        try {
            const order = await orderService.findById(Number(req.params.id));
            if (!order) return OrderView.notFound(res);
            OrderView.single(res, order);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/orders/track/:id
     *
     * Verejný endpoint — zákazník vidí len obmedzené informácie o svojej objednávke:
     * stav, stôl, položky a celkovú sumu. Bez citlivých interných dát.
     */
    async track(req, res, next) {
        try {
            const id = Number(req.params.id);
            if (!id || id <= 0) return OrderView.notFound(res);

            const order = await orderService.findById(id);
            if (!order) return OrderView.notFound(res);

            OrderView.tracked(res, order);
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/orders
     *
     * Body:
     * {
     *   "tableNumber": 5,
     *   "note": "bez cesnaku",
     *   "items": [
     *     { "menuItemId": 1, "quantity": 2 },
     *     { "menuItemId": 21, "quantity": 1 }
     *   ]
     * }
     */
    async store(req, res, next) {
        try {
            // 1. Filter
            const data = OrderFilter.forCreate(req.body);

            // 2. Validácia vstupu
            const errors = OrderValidator.forCreate(data);
            if (errors.length) return OrderView.validationError(res, errors);

            // 3. Overenie stola
            const table = await tableService.findByNumber(Number(data.tableNumber));
            if (!table) {
                return OrderView.validationError(res, [`Stôl číslo ${data.tableNumber} neexistuje alebo nie je aktívny.`]);
            }

            // 4. Overenie a obohatenie položiek z menu (snapshot ceny + mena)
            const enrichedItems = [];
            for (const rawItem of data.items) {
                const menuItem = await menuService.findById(Number(rawItem.menuItemId));
                if (!menuItem) {
                    return OrderView.validationError(res, [`Položka menu s ID ${rawItem.menuItemId} neexistuje.`]);
                }
                enrichedItems.push({
                    menuItemId: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: Number(rawItem.quantity),
                });
            }

            // 5. Uloženie
            const order = await orderService.create({
                tableId: table.id,
                note: data.note,
                items: enrichedItems,
            });

            // 6. Odpoveď
            OrderView.created(res, order);
        } catch (err) {
            next(err);
        }
    }

    /**
     * PATCH /api/orders/:id/status
     *
     * Body: { "status": "confirmed" }
     */
    async updateStatus(req, res, next) {
        try {
            const data = OrderFilter.forStatusUpdate(req.body);
            const errors = OrderValidator.forStatusUpdate(data);
            if (errors.length) return OrderView.validationError(res, errors);

            const order = await orderService.updateStatus(Number(req.params.id), data.status);
            if (!order) return OrderView.notFound(res);

            OrderView.single(res, order);
        } catch (err) {
            next(err);
        }
    }
}