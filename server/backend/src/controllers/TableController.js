import { TableService } from '../models/TableService.js';
import { TableView }    from '../views/QrestiqViews.js';

const tableService = new TableService();

/**
 * TableController
 *
 * GET /api/tables        — zoznam aktívnych stolov
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
}
