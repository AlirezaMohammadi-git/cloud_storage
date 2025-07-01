
import pg from "pg"
const { Pool } = pg;
require('dotenv').config();

const poolConfig = {
    connectionString: "postgres://joe:helloKitty@localhost:5432/mylocaldatabase"
};
export const pool = new Pool(poolConfig);

// Optional: Handle connection errors
pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
    process.exit(-1);
});