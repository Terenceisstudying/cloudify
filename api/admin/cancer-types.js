import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';
import { getQuizWeightTarget, computeGenericWeightValidity } from '../../controllers/riskCalculator.js';

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
        visible: ct.visible !== false
    };
}

function unmapCancerTypeData(data) {
    return {
        id: data.id,
        icon: data.icon || '',
        name_en: data.name_en || '',
        name_zh: data.name_zh || '',
        name_ms: data.name_ms || '',
        name_ta: data.name_ta || '',
        description_en: data.description_en || '',
        description_zh: data.description_zh || '',
        description_ms: data.description_ms || '',
        description_ta: data.description_ta || '',
        familylabel_en: data.familyLabel_en ?? data.familylabel_en ?? '',
        familylabel_zh: data.familyLabel_zh ?? data.familylabel_zh ?? '',
        familylabel_ms: data.familyLabel_ms ?? data.familylabel_ms ?? '',
        familylabel_ta: data.familyLabel_ta ?? data.familylabel_ta ?? '',
        familyweight: data.familyWeight ?? data.familyweight ?? 10,
        genderfilter: data.genderFilter ?? data.genderfilter ?? 'all',
        ageriskthreshold: data.ageRiskThreshold ?? data.ageriskthreshold ?? 0,
        ageriskweight: data.ageRiskWeight ?? data.ageriskweight ?? 0,
        ethnicityrisk_chinese: data.ethnicityRisk_chinese ?? data.ethnicityrisk_chinese ?? 0,
        ethnicityrisk_malay: data.ethnicityRisk_malay ?? data.ethnicityrisk_malay ?? 0,
        ethnicityrisk_indian: data.ethnicityRisk_indian ?? data.ethnicityrisk_indian ?? 0,
        ethnicityrisk_caucasian: data.ethnicityRisk_caucasian ?? data.ethnicityrisk_caucasian ?? 0,
        ethnicityrisk_others: data.ethnicityRisk_others ?? data.ethnicityrisk_others ?? 0,
        sort_order: data.sortOrder ?? data.sort_order ?? 0,
        visible: data.visible !== false
    };
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
            return res.status(200).json({ success: true, data: mapCancerTypeRow(updated) });
        }

        // GET — list all or single
        if (req.method === 'GET') {
            if (id) {
                const { data: ct, error: ctError } = await supabase
                    .from('cancer_types')
                    .select('*')
                    .eq('id', id)
                    .single();
                    
                if (ctError || !ct) {
                    return res.status(404).json({ success: false, error: 'Cancer type not found' });
                }
                const cancerType = mapCancerTypeRow(ct);
                const assessmentId = (id || '').toLowerCase();
                
                // Get question assignments
                const { data: assignmentsData } = await supabase
                    .from('question_assignments')
                    .select('*, questions(*)')
                    .ilike('assessmentid', id);
                    
                const assignments = (assignmentsData || []).map(a => ({
                    id: a.id,
                    questionId: a.questionid,
                    assessmentId: a.assessmentid,
                    targetCancerType: a.targetcancertype,
                    weight: parseFloat(a.weight) || 0,
                    yesValue: parseFloat(a.yesvalue) || 0,
                    noValue: parseFloat(a.novalue) || 0,
                    category: a.category,
                    minAge: a.minage,
                    questionData: a.questions
                }));

                const totalWeight = assignments.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0);
                const quizTarget = getQuizWeightTarget(cancerType);

                if (assessmentId === 'generic') {
                    const { weightByTarget, targetCount, isValid } = computeGenericWeightValidity(assignments, cancerType);
                    return res.status(200).json({
                        success: true,
                        data: { ...cancerType, questions: assignments, questionCount: assignments.length, totalWeight: totalWeight.toFixed(2), quizWeightTarget: quizTarget, targetCount, weightByTarget, isValid }
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: { ...cancerType, questions: assignments, questionCount: assignments.length, totalWeight: totalWeight.toFixed(2), quizWeightTarget: quizTarget, isValid: assignments.length > 0 && Math.round(totalWeight * 100) === Math.round(quizTarget * 100) }
                });
            }

            // List all
            const { data: cancerTypesData, error: listError } = await supabase
                .from('cancer_types')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('id', { ascending: true });
            if (listError) throw listError;
            
            const cancerTypes = cancerTypesData.map(mapCancerTypeRow);

            const { data: allAssignmentsData } = await supabase
                .from('question_assignments')
                .select('weight, assessmentid');
            const assignments = allAssignmentsData || [];

            const cancerTypesWithStats = cancerTypes.map(ct => {
                const aid = (ct.id || '').toLowerCase();
                const typeAssignments = assignments.filter(a => a.assessmentid && String(a.assessmentid).toLowerCase() === aid);
                const totalWeight = typeAssignments.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0);
                const quizTarget = getQuizWeightTarget(ct);
                
                if (aid === 'generic') {
                    // For aggregate we just pass empty array or partial to computeGenericWeightValidity 
                    // To keep it simple, we may assume isValid is fetched differently, but we approximate:
                    const { weightByTarget, targetCount, isValid } = computeGenericWeightValidity(typeAssignments, ct);
                    return { ...ct, questionCount: typeAssignments.length, totalWeight: totalWeight.toFixed(2), quizWeightTarget: quizTarget, targetCount, weightByTarget, isValid };
                }
                return { ...ct, questionCount: typeAssignments.length, totalWeight: totalWeight.toFixed(2), quizWeightTarget: quizTarget, isValid: typeAssignments.length > 0 && Math.round(totalWeight * 100) === Math.round(quizTarget * 100) };
            });
            return res.status(200).json({ success: true, data: cancerTypesWithStats });
        }

        // POST — create
        if (req.method === 'POST') {
            const { id: newId, ...cancerTypeData } = req.body;
            if (!newId) {
                return res.status(400).json({ success: false, error: 'Cancer type ID is required' });
            }
            
            // check existing
            const { data: existing } = await supabase.from('cancer_types').select('id').eq('id', newId).single();
            if (existing) {
                return res.status(400).json({ success: false, error: 'Cancer type with this ID already exists' });
            }

            const dbData = unmapCancerTypeData({ id: newId.toLowerCase().trim(), ...cancerTypeData });
            const { data: created, error } = await supabase
                .from('cancer_types')
                .insert(dbData)
                .select()
                .single();
            if (error) throw error;
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
            return res.status(200).json({ success: true, data: mapCancerTypeRow(updated) });
        }

        // DELETE ?id=xxx
        if (req.method === 'DELETE' && id) {
            await supabase.from('question_assignments').delete().ilike('assessmentid', id);
            await supabase.from('cancer_types').delete().eq('id', id);
            return res.status(200).json({ success: true, message: 'Cancer type and all associated questions deleted' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Cancer types error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
