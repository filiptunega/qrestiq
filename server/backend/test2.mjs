import pool from '/app/src/config/database.js';

const { rows } = await pool.query('SELECT current_database(), count(*) FROM users');
console.log(rows);
await pool.end();
