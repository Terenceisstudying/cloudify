import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';

function mapAssessmentRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        age: row.age,
        gender: row.gender,
        familyHistory: row.family_history,
        assessmentType: row.assessment_type,
        riskScore: row.risk_score,
        riskLevel: row.risk_level,
        categoryRisks: row.category_risks || {},
        questionsAnswers: row.questions_answers || [],
        timestamp: row.created_at
    };
}

/**
 * /api/admin/assessments
 * Multi-method handler for admin assessment management.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Valid authentication token required' });
    }

    try {
        const { id, action, sub, age } = req.query;

        // GET ?action=export — CSV export
        if (req.method === 'GET' && action === 'export') {
            const { data: rawAssessments, error } = await supabase
                .from('assessments')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            
            const assessments = rawAssessments.map(mapAssessmentRow);
            
            const headers = ['id', 'age', 'gender', 'familyHistory', 'assessmentType', 'riskScore', 'riskLevel', 'categoryRisks', 'questionsAnswers', 'timestamp'];
            const escapeField = (val) => {
                if (val === null || val === undefined) return '';
                const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            };
            const rows = [headers.join(',')];
            for (const a of assessments) {
                rows.push(headers.map(h => escapeField(a[h])).join(','));
            }
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="assessments.csv"');
            return res.status(200).send(rows.join('\r\n'));
        }

        // GET ?id=xxx&sub=assignments — assignments for assessment
        if (req.method === 'GET' && id && sub === 'assignments') {
            const userAge = age ? parseInt(age) : null;
            let query = supabase
                .from('question_assignments')
                .select('*, questions(*)')
                .ilike('assessmentid', id);

            if (userAge !== null) {
                query = query.or(`minage.lte.${userAge},minage.is.null`);
            }

            const { data: assignmentsData, error } = await query;
            if (error) throw error;

            const assignments = (assignmentsData || []).map(a => {
                const q = a.questions || {};
                return {
                    id: a.id,
                    questionId: a.questionid,
                    assessmentId: a.assessmentid,
                    targetCancerType: a.targetcancertype,
                    weight: parseFloat(a.weight) || 0,
                    yesValue: parseFloat(a.yesvalue) || 0,
                    noValue: parseFloat(a.novalue) || 0,
                    category: a.category,
                    minAge: a.minage,
                    prompt_en: q.prompt_en,
                    prompt_zh: q.prompt_zh,
                    prompt_ms: q.prompt_ms,
                    prompt_ta: q.prompt_ta,
                    explanationYes_en: q.explanationyes_en,
                    explanationYes_zh: q.explanationyes_zh,
                    explanationYes_ms: q.explanationyes_ms,
                    explanationYes_ta: q.explanationyes_ta,
                    explanationNo_en: q.explanationno_en,
                    explanationNo_zh: q.explanationno_zh,
                    explanationNo_ms: q.explanationno_ms,
                    explanationNo_ta: q.explanationno_ta
                };
            });

            return res.status(200).json({ success: true, data: assignments });
        }

        // PUT ?id=xxx&sub=assignments — replace assignments
        if (req.method === 'PUT' && id && sub === 'assignments') {
            const normalizedId = String(id).toLowerCase();
            const { assignments } = req.body;
            if (!Array.isArray(assignments)) {
                return res.status(400).json({ success: false, error: 'assignments array is required' });
            }
            const newAssignments = assignments
                .filter(a => a.questionId)
                .map(a => {
                    const rawTarget = a.targetCancerType || a.cancerType || (normalizedId === 'generic' ? '' : normalizedId);
                    return {
                        questionid: a.questionId,
                        assessmentid: normalizedId,
                        targetcancertype: rawTarget ? String(rawTarget).toLowerCase().trim() : '',
                        weight: a.weight ?? 0,
                        yesvalue: a.yesValue ?? 100,
                        novalue: a.noValue ?? 0,
                        category: a.category ?? '',
                        minage: a.minAge ?? null
                    };
                });
                
            // Delete old assignments
            const { error: delError } = await supabase
                .from('question_assignments')
                .delete()
                .ilike('assessmentid', normalizedId);
            if (delError) throw delError;

            // Insert new assignments
            if (newAssignments.length > 0) {
                const { error: insError } = await supabase
                    .from('question_assignments')
                    .insert(newAssignments);
                if (insError) throw insError;
            }

            return res.status(200).json({ success: true, data: { updated: newAssignments.length } });
        }

        // GET — list all assessments
        if (req.method === 'GET') {
            const { data: rawAssessments, error } = await supabase
                .from('assessments')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            
            const assessments = rawAssessments.map(mapAssessmentRow);
            return res.status(200).json({ success: true, data: assessments });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admin assessments error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
