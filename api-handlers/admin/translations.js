import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';

const str = (v) => (typeof v === 'string' ? v : '');
const langObj = (obj) => {
    if (!obj || typeof obj !== 'object') return { en: '', zh: '', ms: '', ta: '' };
    return { en: str(obj.en), zh: str(obj.zh), ms: str(obj.ms), ta: str(obj.ta) };
};

/**
 * /api/admin/translations
 * GET  — get translations config
 * PUT  — update translations config
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Valid authentication token required' });
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'translations')
                .single();
            const translations = data ? data.value : {};
            return res.status(200).json({ success: true, data: translations });
        }

        if (req.method === 'PUT') {
            const body = req.body;
            if (!body || typeof body !== 'object') {
                return res.status(400).json({ success: false, error: 'Invalid translations body' });
            }
            const normalized = {};
            for (const [group, keys] of Object.entries(body)) {
                if (!keys || typeof keys !== 'object') continue;
                normalized[group] = {};
                for (const [key, val] of Object.entries(keys)) {
                    normalized[group][key] = langObj(val);
                }
            }
            
            const { error: upsertError } = await supabase
                .from('settings')
                .upsert({ key: 'translations', value: normalized }, { onConflict: 'key' });
                
            if (upsertError) throw upsertError;

            return res.status(200).json({ success: true, data: normalized });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (err) {
        console.error('[Admin Translations] Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
