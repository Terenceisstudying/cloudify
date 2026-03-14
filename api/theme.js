import { applyCors } from '../lib/cors.js';
import { supabase } from '../lib/db.js';

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
 * GET /api/theme
 * Public theme configuration.
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
            .eq('key', 'theme')
            .single();
            
        // Ignore error if not found, normalizeTheme handles empty objects
        const theme = data ? data.value : {};
        return res.status(200).json(normalizeTheme(theme));
    } catch (err) {
        console.error('Theme endpoint error:', err);
        return res.status(500).json({ error: err.message });
    }
}
