import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';
import { getQuizWeightTarget, computeGenericWeightValidity } from '../../controllers/riskCalculator.js';
import { CancerTypeModel } from '../../models/cancerTypeModel.js';

const model = new CancerTypeModel();

function mapCancerTypeRow(ct) {
    if (!ct) return null;
    return {
        id: ct.id,
        icon: ct.icon,
        name_en: ct.name_en,
        name_zh: ct.name_zh,
        name_ms: ct.name_ms,
        name_ta: ct.name_ta,
        description_en: ct.description_en,
        description_zh: ct.description_zh,
        description_ms: ct.description_ms,
        description_ta: ct.description_ta,
        familyLabel_en: ct.familylabel_en,
        familyLabel_zh: ct.familylabel_zh,
        familyLabel_ms: ct.familylabel_ms,
        familyLabel_ta: ct.familylabel_ta,
        familyWeight: ct.familyweight,
        genderFilter: ct.genderfilter,
        ageRiskThreshold: ct.ageriskthreshold,
        ageRiskWeight: ct.ageriskweight,
        ethnicityRisk_chinese: ct.ethnicityrisk_chinese,
        ethnicityRisk_malay: ct.ethnicityrisk_malay,
        ethnicityRisk_indian: ct.ethnicityrisk_indian,
        ethnicityRisk_caucasian: ct.ethnicityrisk_caucasian,
        ethnicityRisk_others: ct.ethnicityrisk_others,
        sortOrder: ct.sort_order,
        visible: ct.visible === true || ct.visible === 'true'
    };
}

function unmapCancerTypeData(data) {
    const unmapped = {
        icon: data.icon,
        name_en: data.name_en,
        name_zh: data.name_zh,
        name_ms: data.name_ms,
        name_ta: data.name_ta,
        description_en: data.description_en,
        description_zh: data.description_zh,
        description_ms: data.description_ms,
        description_ta: data.description_ta,
        familylabel_en: data.familyLabel_en ?? data.familylabel_en,
        familylabel_zh: data.familyLabel_zh ?? data.familylabel_zh,
        familylabel_ms: data.familyLabel_ms ?? data.familylabel_ms,
        familylabel_ta: data.familyLabel_ta ?? data.familylabel_ta,
        familyweight: data.familyWeight ?? data.familyweight,
        genderfilter: data.genderFilter ?? data.genderfilter,
        ageriskthreshold: data.ageRiskThreshold ?? data.ageriskthreshold,
        ageriskweight: data.ageRiskWeight ?? data.ageriskweight,
        ethnicityrisk_chinese: data.ethnicityRisk_chinese ?? data.ethnicityrisk_chinese,
        ethnicityrisk_malay: data.ethnicityRisk_malay ?? data.ethnicityrisk_malay,
        ethnicityrisk_indian: data.ethnicityRisk_indian ?? data.ethnicityrisk_indian,
        ethnicityrisk_caucasian: data.ethnicityRisk_caucasian ?? data.ethnicityrisk_caucasian,
        ethnicityrisk_others: data.ethnicityRisk_others ?? data.ethnicityrisk_others,
        sort_order: data.sortOrder ?? data.sort_order,
        visible: data.visible === undefined ? undefined : (data.visible === true || data.visible === 'true')
    };

    // Remove undefined fields to allow partial updates
    Object.keys(unmapped).forEach(key => {
        if (unmapped[key] === undefined) delete unmapped[key];
    });

    return unmapped;
}

/**
 * /api/admin/cancer-types
 * Multi-method handler for cancer type CRUD.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Valid authentication token required' });
    }

    try {
        const { id, action } = req.query;

        // PUT ?action=reorder
        if (req.method === 'PUT' && action === 'reorder') {
            const { orderedIds } = req.body;
            if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
                return res.status(400).json({ success: false, error: 'orderedIds array is required' });
            }
            await Promise.all(orderedIds.map((cid, idx) =>
                supabase.from('cancer_types').update({ sort_order: idx }).eq('id', cid)
            ));
            await model.writeAssessmentsSnapshot();
            return res.status(200).json({ success: true, message: 'Reordered successfully' });
        }

        // PATCH ?id=xxx&action=visibility
        if (req.method === 'PATCH' && id && action === 'visibility') {
            const { visible } = req.body;
            if (typeof visible !== 'boolean') {
                return res.status(400).json({ success: false, error: 'visible must be a boolean' });
            }
            const { data: updated, error } = await supabase
                .from('cancer_types')
                .update({ visible })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await model.writeAssessmentsSnapshot();
            return res.status(200).json({ success: true, data: mapCancerTypeRow(updated) });
        }

        // GET — list all or single
        if (req.method === 'GET') {
            if (id) {
                const [ctRes, qRes] = await Promise.all([
                    supabase.from('cancer_types').select('*').eq('id', id).single(),
                    supabase.from('questions').select('*, question_assignments(*)').ilike('question_assignments.assessmentid', id)
                ]);

                if (ctRes.error) {
                    if (ctRes.error.code === 'PGRST116') return res.status(404).json({ success: false, error: 'Cancer type not found' });
                    throw ctRes.error;
                }

                const questions = (qRes.data || [])
                    .filter(q => q.question_assignments && q.question_assignments.length > 0)
                    .map(q => ({
                        id: q.id,
                        prompt_en: q.prompt_en,
                        ...q.question_assignments[0],
                        weight: parseFloat(q.question_assignments[0].weight) || 0
                    }));

                return res.status(200).json({ success: true, data: { ...mapCancerTypeRow(ctRes.data), questions } });
            }

            const { data: types, error } = await supabase
                .from('cancer_types')
                .select('*, question_assignments(weight)')
                .order('sort_order', { ascending: true })
                .order('id', { ascending: true });

            if (error) throw error;

            const results = types.map(t => {
                const totalWeight = (t.question_assignments || []).reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0);
                return {
                    ...mapCancerTypeRow(t),
                    questionCount: (t.question_assignments || []).length,
                    totalWeight
                };
            });

            return res.status(200).json({ success: true, data: results });
        }

        // POST — create
        if (req.method === 'POST') {
            const dbData = unmapCancerTypeData(req.body);
            if (!dbData.id) {
                return res.status(400).json({ success: false, error: 'ID is required' });
            }
            
            // Set default visible to false if not provided
            if (dbData.visible === undefined) dbData.visible = false;

            const { data: created, error } = await supabase
                .from('cancer_types')
                .insert(dbData)
                .select()
                .single();
            if (error) throw error;
            await model.writeAssessmentsSnapshot();
            return res.status(200).json({ success: true, data: mapCancerTypeRow(created) });
        }

        // PUT ?id=xxx — update
        if (req.method === 'PUT' && id) {
            const dbData = unmapCancerTypeData({ id, ...req.body });
            const { data: updated, error } = await supabase
                .from('cancer_types')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await model.writeAssessmentsSnapshot();
            return res.status(200).json({ success: true, data: mapCancerTypeRow(updated) });
        }

        // DELETE ?id=xxx
        if (req.method === 'DELETE' && id) {
            await supabase.from('question_assignments').delete().ilike('assessmentid', id);
            await supabase.from('cancer_types').delete().eq('id', id);
            await model.writeAssessmentsSnapshot();
            return res.status(200).json({ success: true, message: 'Cancer type and all associated questions deleted' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Cancer types error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
