import { TableService } from '../models/TableService.js';
import { TableView }    from '../views/QrestiqViews.js';

const tableService = new TableService();

/**
 * TableController
 *
 * GET    /api/tables          — zoznam aktívnych stolov (verejné)
 * GET    /api/tables/all      — všetky stoly vrátane neaktívnych (staff)
 * POST   /api/tables          — vytvorenie stola (staff)
 * PUT    /api/tables/:id      — úprava stola (staff)
 * DELETE /api/tables/:id      — vymazanie stola (staff)
 */
export class TableController {

    async index(_req, res, next) {
        try {
            const tables = await tableService.findAllActive();
            TableView.list(res, tables);
        } catch (err) {
            next(err);
        }
    }

    async indexAll(_req, res, next) {
        try {
            const tables = await tableService.findAll();
            TableView.listAdmin(res, tables);
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const number = parseInt(req.body?.number);
            if (!number || number < 1) {
                return res.status(422).json({ message: 'Číslo stola musí byť kladné celé číslo.' });
            }
            const table = await tableService.create(number);
            TableView.created(res, table);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ message: `Stôl číslo ${req.body?.number} už existuje.` });
            }
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const { isActive, number } = req.body ?? {};

            const fields = {};
            if (isActive !== undefined) fields.isActive = Boolean(isActive);
            if (number   !== undefined) {
                const n = parseInt(number);
                if (!n || n < 1) return res.status(422).json({ message: 'Číslo stola musí byť kladné celé číslo.' });
                fields.number = n;
            }

            const table = await tableService.update(id, fields);
            if (!table) return res.status(404).json({ message: 'Stôl nenájdený.' });
            TableView.single(res, table);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ message: `Stôl s týmto číslom už existuje.` });
            }
            next(err);
        }
    }

    async destroy(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const deleted = await tableService.delete(id);
            if (!deleted) return res.status(404).json({ message: 'Stôl nenájdený.' });
            res.status(204).end();
        } catch (err) {
            next(err);
        }
    }
}
