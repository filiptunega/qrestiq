import pool from '/app/src/config/database.js';
import bcrypt from 'bcrypt';

const { rows } = await pool.query(
  'SELECT id, email, name, password_hash, is_active FROM users WHERE email = $1',
  ['admin@example.com']
);

const row = rows[0];
console.log('is_active:', row.is_active);
console.log('hash:', JSON.stringify(row.password_hash));
const match = await bcrypt.compare('heslo1234', row.password_hash);
console.log('match:', match);
await pool.end();
