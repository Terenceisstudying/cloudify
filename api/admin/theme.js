import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';

const SCREEN_KEYS = ['landing', 'cancerSelection', 'onboarding', 'game', 'results'];

function normalizeTheme(theme) {
    if (!theme || typeof theme !== 'object') theme = {};
    const str = (v) => (typeof v === 'string' ? v : '');
    const num = (v, def) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : def; };
    const screens = {};
    SCREEN_KEYS.forEach(key => {
        const s = theme.screens && theme.screens[key];
        screens[key] = {
            backgroundImage: str(s && s.backgroundImage),
            backgroundMusic: str(s && s.backgroundMusic),
            backgroundOpacity: num(s && s.backgroundOpacity, 1)
        };
    });
    return {
        screens,
        mascotMale: str(theme.mascotMale),
        mascotFemale: str(theme.mascotFemale),
        mascotMaleGood: str(theme.mascotMaleGood),
        mascotFemaleGood: str(theme.mascotFemaleGood),
        mascotMaleShocked: str(theme.mascotMaleShocked),
        mascotFemaleShocked: str(theme.mascotFemaleShocked)
    };
}

/**
 * /api/admin/theme
 * GET  — get theme config
 * PUT  — update theme config
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
                .eq('key', 'theme')
                .single();
            const theme = data ? data.value : {};
            return res.status(200).json(normalizeTheme(theme));
        }

        if (req.method === 'PUT') {
            const theme = req.body;
            if (!theme || typeof theme !== 'object') {
                return res.status(400).json({ success: false, error: 'Invalid theme body' });
            }
            const str = (v) => (typeof v === 'string' ? v : '');
            const num = (v, def) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : def; };

            let existing = {};
            try { 
                const { data } = await supabase.from('settings').select('value').eq('key', 'theme').single();
                if (data) existing = data.value;
            } catch (e) { /* use empty */ }

            const screens = theme.screens && typeof theme.screens === 'object' ? theme.screens : {};
            const mascotKeys = ['mascotMale', 'mascotFemale', 'mascotMaleGood', 'mascotFemaleGood', 'mascotMaleShocked', 'mascotFemaleShocked'];
            const out = { screens: {} };
            mascotKeys.forEach(k => {
                out[k] = str(theme[k] !== undefined && theme[k] !== null ? theme[k] : existing[k]);
            });
            SCREEN_KEYS.forEach(key => {
                const s = screens[key];
                const ex = existing.screens && existing.screens[key];
                out.screens[key] = {
                    backgroundImage: str(s && s.backgroundImage !== undefined ? s.backgroundImage : (ex && ex.backgroundImage)),
                    backgroundMusic: str(s && s.backgroundMusic !== undefined ? s.backgroundMusic : (ex && ex.backgroundMusic)),
                    backgroundOpacity: num(s && s.backgroundOpacity, num(ex && ex.backgroundOpacity, 1))
                };
            });
            
            const { error: upsertError } = await supabase
                .from('settings')
                .upsert({ key: 'theme', value: out }, { onConflict: 'key' });
                
            if (upsertError) throw upsertError;
            
            return res.status(200).json({ success: true, theme: out });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (err) {
        console.error('[Admin Theme] Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
