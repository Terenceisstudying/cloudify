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
        // Try 'translations' first, then 'ui_translations' as fallback
        let { data, error } = await supabase
            .from('settings')
            .select('key, value')
            .eq('key', 'translations')
            .single();
            
        if (error || !data) {
            const fallback = await supabase
                .from('settings')
                .select('key, value')
                .eq('key', 'ui_translations')
                .single();
            data = fallback.data;
        }

        if (!data || !data.value) {
            // DIAGNOSTIC LOGGING: Check what IS in the table
            const { data: allKeys } = await supabase.from('settings').select('key');
            const keysFound = (allKeys || []).map(k => k.key);
            console.warn(`Translations not found. Available keys in settings table: [${keysFound.join(', ')}]`);
            
            return res.status(200).json({});
        }

        return res.status(200).json(data.value);
    } catch (err) {
        console.error('Translations endpoint error:', err);
        return res.status(500).json({ error: err.message });
    }
}
