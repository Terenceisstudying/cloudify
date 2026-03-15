import { applyCors } from '../lib/cors.js';
import { supabase } from '../lib/db.js';

/**
 * GET /api/assessments-snapshot
 * Dynamic replacement for the legacy assessments-snapshot.json file.
 * Returns only visible cancer types for the frontend landing page.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Fetch visible cancer types directly from Supabase
        const { data: rawTypes, error } = await supabase
            .from('cancer_types')
            .select('*')
            .eq('visible', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        // Map to the format expected by the frontend
        const data = (rawTypes || []).map(ct => ({
            id: ct.id,
            icon: ct.icon,
            name: ct.name_en, // Default to English for the snapshot
            name_en: ct.name_en,
            name_zh: ct.name_zh,
            name_ms: ct.name_ms,
            name_ta: ct.name_ta,
            description: ct.description_en,
            description_en: ct.description_en,
            description_zh: ct.description_zh,
            description_ms: ct.description_ms,
            description_ta: ct.description_ta,
            genderFilter: ct.genderfilter,
            visible: true
        }));
        
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Assessments snapshot endpoint error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
