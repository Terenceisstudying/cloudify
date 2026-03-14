import { applyCors } from '../../lib/cors.js';
import { supabase } from '../../lib/db.js';

function mapLocalized(ct, lang) {
    return {
        id: ct.id,
        icon: ct.icon,
        name: ct[`name_${lang}`] || ct.name_en,
        description: ct[`description_${lang}`] || ct.description_en,
        familyLabel: ct[`familylabel_${lang}`] || ct.familylabel_en,
        familyWeight: parseFloat(ct.familyweight) || 10,
        genderFilter: ct.genderfilter || 'all',
        ageRiskThreshold: parseInt(ct.ageriskthreshold) || 0,
        ageRiskWeight: parseFloat(ct.ageriskweight) || 0,
        ethnicityRisk: {
            chinese: parseFloat(ct.ethnicityrisk_chinese) || 0,
            malay: parseFloat(ct.ethnicityrisk_malay) || 0,
            indian: parseFloat(ct.ethnicityrisk_indian) || 0,
            caucasian: parseFloat(ct.ethnicityrisk_caucasian) || 0,
            others: parseFloat(ct.ethnicityrisk_others) || 0
        },
        visible: ct.visible !== false
    };
}

/**
 * GET /api/questions/cancer-types
 * Returns all visible cancer types with localized fields.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { lang = 'en', id } = req.query;

        if (id) {
            const { data, error } = await supabase
                .from('cancer_types')
                .select('*')
                .eq('id', id)
                .eq('visible', true)
                .single();
                
            if (error) {
                if (error.code === 'PGRST116') return res.status(404).json({ success: false, error: 'Cancer type not found' });
                throw error;
            }
            return res.status(200).json({ success: true, data: mapLocalized(data, lang) });
        }

        const { data, error } = await supabase
            .from('cancer_types')
            .select('*')
            .eq('visible', true)
            .order('sort_order', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw error;
        
        const cancerTypes = data.map(ct => mapLocalized(ct, lang));
        return res.status(200).json({ success: true, data: cancerTypes });
    } catch (error) {
        console.error('Error fetching cancer types:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
