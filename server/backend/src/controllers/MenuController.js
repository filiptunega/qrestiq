import { MenuService } from '../models/MenuService.js';
import { MenuView }    from '../views/QrestiqViews.js';

const menuService = new MenuService();

/**
 * MenuController
 *
 * GET /api/menu           — všetky aktívne položky (flat pole)
 * GET /api/menu/grouped   — zoskupené podľa kategórie (objekt)
 * GET /api/menu/:id       — jedna položka
 */
export class MenuController {

    async index(_req, res, next) {
        try {
            const items = await menuService.findAllActive();
            MenuView.list(res, items);
        } catch (err) {
            next(err);
        }
    }

    async grouped(_req, res, next) {
        try {
            const grouped = await menuService.findGroupedByCategory();
            MenuView.grouped(res, grouped);
        } catch (err) {
            next(err);
        }
    }

    async show(req, res, next) {
        try {
            const item = await menuService.findById(Number(req.params.id));
            if (!item) return MenuView.notFound(res);
            MenuView.list(res, [item]);
        } catch (err) {
            next(err);
        }
    }
}
