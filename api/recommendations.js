import { applyCors } from '../lib/cors.js';
import { supabase } from '../lib/db.js';

/**
 * GET /api/recommendations
 * Public recommendations configuration.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'recommendations')
            .single();
            
        const recommendations = data ? data.value : {};
        return res.status(200).json(recommendations);
    } catch (err) {
        console.error('Recommendations endpoint error:', err);
        return res.status(500).json({ error: err.message });
    }
}
