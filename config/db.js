import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

let poolExport;

// If we are in test mode, return a mocked pool that resolves immediately, 
// since tests rely on a mocked database or different mechanism
if (process.env.NODE_ENV === 'test') {
    const mockPool = {
        query: async () => ({ rows: [] }),
        connect: async () => ({
            query: async () => ({ rows: [] }),
            release: () => {}
        }),
        end: async () => {}
    };
    poolExport = mockPool;
} else {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    pool.connect((err, client, release) => {
        if (err) {
            console.error('Failed to connect to database:', err.message);
            // Don't exit in cloud-native, it might just be the old code path being loaded
            if (!process.env.VERCEL) {
                // process.exit(1); 
            }
        } else {
            release();
            console.log('✓ Database connected successfully');
        }
    });

    poolExport = pool;
}

export default poolExport;