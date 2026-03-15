import { applyCors } from '../../lib/cors.js';
import { supabase } from '../../lib/db.js';

/**
 * GET /api/questions/by-assessment
 * Returns questions for a given assessmentId.
 * Query: ?assessmentId=colorectal&age=45&lang=en
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { assessmentId, age, lang = 'en' } = req.query;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                error: 'assessmentId is required'
            });
        }

        const userAge = age ? parseInt(age) : null;

        let query = supabase
            .from('question_assignments')
            .select(`
                weight, yesvalue, novalue, category, targetcancertype, minage, questionid,
                questions!inner(*)
            `)
            .ilike('assessmentid', assessmentId);

        if (userAge !== null) {
            query = query.lte('minage', userAge).or(`minage.is.null`);
            // Note: Since Supabase sometimes struggles with complex ORs with CTEs, 
            // another approach is fetching and filtering in memory, but Supabase OR works if written right:
            // `.or('minage.lte.' + userAge + ',minage.is.null')`
        }

        // Apply correct OR filter for minage
        if (userAge !== null) {
            // Re-initialize query without the wrong lte/or above just to be safe:
            query = supabase
                .from('question_assignments')
                .select(`
                    weight, yesvalue, novalue, category, targetcancertype, minage, questionid,
                    questions!inner(*)
                `)
                .ilike('assessmentid', assessmentId)
                .or(`minage.lte.${userAge},minage.is.null`);
        }

        const { data: assignments, error } = await query;

        if (error) throw error;

        // Map localization exactly like the original model
        const questions = assignments.map(assign => {
            const bank = assign.questions || {};

            const prompt = bank[`prompt_${lang}`] || bank.prompt_en || '';
            const explanationYes = bank[`explanationyes_${lang}`] || bank.explanationyes_en || '';
            const explanationNo = bank[`explanationno_${lang}`] || bank.explanationno_en || '';

            return {
                id: assign.questionid,
                prompt,
                weight: assign.weight,
                yesValue: assign.yesvalue,
                noValue: assign.novalue,
                category: assign.category,
                explanationYes,
                explanationNo,
                cancerType: assign.targetcancertype,
                targetCancerType: assign.targetcancertype,
                minAge: assign.minage
            };
        });

        return res.status(200).json({ success: true, data: questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
