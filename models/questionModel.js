import db from '../lib/db.js';

function mapAssignment(row) {
    if (!row) return null;
    return {
        id: row.id,
        questionId: row.questionid,
        assessmentId: row.assessmentid,
        targetCancerType: row.targetcancertype,
        weight: row.weight,
        yesValue: row.yesvalue,
        noValue: row.novalue,
        category: row.category,
        minAge: row.minage
    };
}

export class QuestionModel {
    async getAllQuestions() {
        try {
            const { data, error } = await db.supabase
                .from('questions')
                .select('*, question_assignments(*)');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting all questions:', error);
            throw error;
        }
    }

    async getQuestionsByAssessment(assessmentId) {
        try {
            const { data, error } = await db.supabase
                .from('questions')
                .select('*, question_assignments!inner(*)')
                .eq('question_assignments.assessmentid', assessmentId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting questions by assessment:', error);
            throw error;
        }
    }

    async getAssignmentsByAssessment(assessmentId) {
        try {
            const { data, error } = await db.supabase
                .from('question_assignments')
                .select('*')
                .eq('assessmentid', assessmentId);

            if (error) throw error;
            return data.map(mapAssignment);
        } catch (error) {
            console.error('Error getting assignments:', error);
            throw error;
        }
    }

    async saveAssignments(assessmentId, assignments) {
        try {
            // Delete existing assignments for this assessment
            const { error: deleteError } = await db.supabase
                .from('question_assignments')
                .delete()
                .eq('assessmentid', assessmentId);

            if (deleteError) throw deleteError;

            if (assignments.length === 0) return true;

            // Insert new assignments
            const { error: insertError } = await db.supabase
                .from('question_assignments')
                .insert(assignments.map(a => ({
                    questionid: a.questionId,
                    assessmentid: assessmentId,
                    targetcancertype: a.targetCancerType,
                    weight: a.weight,
                    yesvalue: a.yesValue,
                    novalue: a.noValue,
                    category: a.category,
                    minage: a.minAge
                })));

            if (insertError) throw insertError;
            return true;
        } catch (error) {
            console.error('Error saving assignments:', error);
            throw error;
        }
    }
}
