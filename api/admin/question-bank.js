import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';

/**
 * /api/admin/question-bank
 * Multi-method handler for question bank CRUD.
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

        // GET ?action=export
        if (req.method === 'GET' && action === 'export') {
            const [qRes, aRes] = await Promise.all([
                supabase.from('questions').select('*'),
                supabase.from('question_assignments').select('*')
            ]);
            
            const date = new Date().toISOString().slice(0, 10);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="question-bank-backup-${date}.json"`);
            return res.status(200).send(JSON.stringify({ 
                exportedAt: new Date().toISOString(), 
                questions: qRes.data || [], 
                assignments: aRes.data || [] 
            }, null, 2));
        }

        // GET — list all
        if (req.method === 'GET') {
            const { data: questions, error } = await supabase
                .from('questions')
                .select('*, question_assignments(*)');

            if (error) throw error;

            const bankView = (questions || []).map(q => ({
                id: q.id,
                prompt_en: q.prompt_en || '',
                prompt_zh: q.prompt_zh || '',
                prompt_ms: q.prompt_ms || '',
                prompt_ta: q.prompt_ta || '',
                explanationYes_en: q.explanationyes_en || '',
                explanationYes_zh: q.explanationyes_zh || '',
                explanationYes_ms: q.explanationyes_ms || '',
                explanationYes_ta: q.explanationyes_ta || '',
                explanationNo_en: q.explanationno_en || '',
                explanationNo_zh: q.explanationno_zh || '',
                explanationNo_ms: q.explanationno_ms || '',
                explanationNo_ta: q.explanationno_ta || '',
                assignments: (q.question_assignments || []).map(a => ({
                    id: a.id,
                    assessmentId: a.assessmentid,
                    targetCancerType: a.targetcancertype,
                    weight: parseFloat(a.weight) || 0,
                    yesValue: parseFloat(a.yesvalue) || 0,
                    noValue: parseFloat(a.novalue) || 0,
                    category: a.category,
                    minAge: a.minage
                }))
            }));
            
            return res.status(200).json({ success: true, data: bankView });
        }

        // POST — create
        if (req.method === 'POST') {
            const {
                id: newId,
                prompt_en, prompt_zh, prompt_ms, prompt_ta,
                explanationYes_en, explanationYes_zh, explanationYes_ms, explanationYes_ta,
                explanationNo_en, explanationNo_zh, explanationNo_ms, explanationNo_ta
            } = req.body;

            const { data: newEntry, error } = await supabase
                .from('questions')
                .insert({
                    id: newId,
                    prompt_en, prompt_zh, prompt_ms, prompt_ta,
                    explanationyes_en: explanationYes_en, 
                    explanationyes_zh: explanationYes_zh, 
                    explanationyes_ms: explanationYes_ms, 
                    explanationyes_ta: explanationYes_ta,
                    explanationno_en: explanationNo_en, 
                    explanationno_zh: explanationNo_zh, 
                    explanationno_ms: explanationNo_ms, 
                    explanationno_ta: explanationNo_ta
                })
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, data: newEntry });
        }

        // PUT ?id=xxx — update
        if (req.method === 'PUT' && id) {
            const {
                prompt_en, prompt_zh, prompt_ms, prompt_ta,
                explanationYes_en, explanationYes_zh, explanationYes_ms, explanationYes_ta,
                explanationNo_en, explanationNo_zh, explanationNo_ms, explanationNo_ta
            } = req.body;

            const updates = {};
            const fields = {
                prompt_en, prompt_zh, prompt_ms, prompt_ta,
                explanationyes_en: explanationYes_en, 
                explanationyes_zh: explanationYes_zh, 
                explanationyes_ms: explanationYes_ms, 
                explanationyes_ta: explanationYes_ta,
                explanationno_en: explanationNo_en, 
                explanationno_zh: explanationNo_zh, 
                explanationno_ms: explanationNo_ms, 
                explanationno_ta: explanationNo_ta,
                updated_at: new Date().toISOString()
            };
            for (const [key, val] of Object.entries(fields)) {
                if (val !== undefined) updates[key] = val;
            }

            const { data: updated, error } = await supabase
                .from('questions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, data: updated });
        }

        // DELETE ?id=xxx
        if (req.method === 'DELETE' && id) {
            // Check active assignments
            const { data: assignments, error: countError } = await supabase
                .from('question_assignments')
                .select('id')
                .eq('questionid', id);

            if (countError) throw countError;

            if (assignments && assignments.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Cannot delete question that has active assignments. Remove all assignments first.'
                });
            }

            const { error: delError } = await supabase
                .from('questions')
                .delete()
                .eq('id', id);

            if (delError) throw delError;
            return res.status(200).json({ success: true, message: 'Question deleted successfully' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Question bank error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
