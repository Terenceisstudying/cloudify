import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: !!process.env.DATABASE_URL || !!process.env.SUPABASE_URL,
            email: !!process.env.EMAIL_USER
        }
    });
}
