import { readFileSync } from "fs";
import pool from "../config/database.js";

const menuPath = process.argv[2] ?? "/app/menu.json";
const menuJson = JSON.parse(readFileSync(menuPath, "utf-8"));

async function seed() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        let total = 0;
        for (const [category, items] of Object.entries(menuJson)) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                await client.query(
                    `INSERT INTO menu_items (id, category, name, description, price, img_url, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7)
                     ON CONFLICT (id) DO UPDATE SET
                         category=EXCLUDED.category, name=EXCLUDED.name,
                         description=EXCLUDED.description, price=EXCLUDED.price,
                         img_url=EXCLUDED.img_url, sort_order=EXCLUDED.sort_order,
                         updated_at=NOW()`,
                    [item.id, category, item.name, item.desc ?? "", item.price, item.img ?? "", i]
                );
                total++;
            }
        }
        await client.query("SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items))");
        await client.query("COMMIT");
        console.log("✓ Seed dokončený: " + total + " položiek.");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("✗ Seed zlyhal:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}
seed();
