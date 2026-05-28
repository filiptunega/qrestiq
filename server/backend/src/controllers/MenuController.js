import { MenuService } from '../models/MenuService.js';
import { MenuView }    from '../views/QrestiqViews.js';

const menuService = new MenuService();

/**
 * MenuController
 *
 * Verejné (bez autorizácie):
 *   GET /api/menu           — všetky aktívne položky (flat pole)
 *   GET /api/menu/grouped   — zoskupené podľa kategórie (objekt)
 *   GET /api/menu/:id       — jedna položka
 *
 * Chránené (vyžaduje JWT — len staff):
 *   GET    /api/menu/admin/all       — všetky položky vrátane neaktívnych
 *   GET    /api/menu/admin/categories — zoznam kategórií
 *   POST   /api/menu                 — nová položka
 *   PUT    /api/menu/:id             — aktualizácia položky
 *   DELETE /api/menu/:id             — vymazanie položky
 */
export class MenuController {

    // ---- Verejné endpointy ----

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

    // ---- Chránené admin endpointy ----

    async adminAll(_req, res, next) {
        try {
            const items = await menuService.findAll();
            MenuView.list(res, items);
        } catch (err) {
            next(err);
        }
    }

    async adminCategories(_req, res, next) {
        try {
            const categories = await menuService.getCategories();
            res.json(categories);
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const { category, name, description, price, imgUrl, isActive, sortOrder } = req.body;

            if (!category || !name || price === undefined) {
                return res.status(400).json({ message: 'Povinné polia: category, name, price.' });
            }
            if (isNaN(Number(price)) || Number(price) < 0) {
                return res.status(400).json({ message: 'Cena musí byť nezáporné číslo.' });
            }

            const item = await menuService.create({
                category,
                name,
                description,
                price: Number(price),
                imgUrl,
                isActive,
                sortOrder,
            });
            res.status(201).json(item);
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { category, name, description, price, imgUrl, isActive, sortOrder } = req.body;

            if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
                return res.status(400).json({ message: 'Cena musí byť nezáporné číslo.' });
            }

            const item = await menuService.update(id, {
                category,
                name,
                description,
                price: price !== undefined ? Number(price) : undefined,
                imgUrl,
                isActive,
                sortOrder,
            });

            if (!item) return MenuView.notFound(res);
            res.json(item);
        } catch (err) {
            next(err);
        }
    }

    async destroy(req, res, next) {
        try {
            const id = Number(req.params.id);
            const deleted = await menuService.delete(id);
            if (!deleted) return MenuView.notFound(res);
            res.status(204).end();
        } catch (err) {
            next(err);
        }
    }
}
