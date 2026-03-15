import { applyCors } from '../lib/cors.js';
import { supabase } from '../lib/db.js';

/**
 * GET /api/translations
 * Public translations configuration.
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
            .eq('key', 'translations')
            .single();
            
        if (error) {
            console.error('Database error fetching translations:', error);
            if (error.code !== 'PGRST116') throw error;
        }

        if (!data || !data.value) {
            console.warn('Translations key not found or empty in settings table');
            return res.status(200).json({});
        }

        return res.status(200).json(data.value);
    } catch (err) {
        console.error('Translations endpoint error:', err);
        return res.status(500).json({ error: err.message });
    }
}
