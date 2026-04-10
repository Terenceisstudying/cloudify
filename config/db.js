import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    max: 10,
    // Kill stuck queries after 30s (quiz and admin queries finish in ms; anything
    // longer indicates a runaway query holding a pool slot). Kill idle-in-transaction
    // sessions after 60s so orphaned transactions don't block the pool forever.
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 60000
});

// Log unexpected pool errors without crashing
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err.message);
});

/**
 * Attempt to connect to the database with retries.
 * Resolves when connected, rejects after all retries fail.
 */
async function waitForConnection(retries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const client = await pool.connect();
            client.release();
            console.log('Database connected successfully');
            return;
        } catch (err) {
            console.error(`Database connection attempt ${attempt}/${retries} failed: ${err.message}`);
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw new Error('Could not connect to database after multiple attempts');
}

export default pool;
export { waitForConnection };
