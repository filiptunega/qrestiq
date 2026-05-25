import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const users = [
    { name: 'Admin', email: 'admin@example.com', password: 'password' },
];

for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [u.name, u.email, hash]
    );
    console.log(`Vytvorený: ${u.email}`);
}
await pool.end();