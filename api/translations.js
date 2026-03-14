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
            
        const translations = data ? data.value : {};
        return res.status(200).json(translations);
    } catch (err) {
        console.error('Translations endpoint error:', err);
        return res.status(500).json({ error: err.message });
    }
}
