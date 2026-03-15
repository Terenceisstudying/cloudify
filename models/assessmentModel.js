import db from '../lib/db.js';

export class AssessmentModel {
    async createAssessment(assessmentData) {
        try {
            const { data, error } = await db.supabase
                .from('assessments')
                .insert({
                    age: assessmentData.age,
                    gender: assessmentData.gender,
                    family_history: assessmentData.familyHistory,
                    assessment_type: assessmentData.assessmentType,
                    risk_score: assessmentData.riskScore,
                    risk_level: assessmentData.riskLevel,
                    category_risks: assessmentData.categoryRisks,
                    questions_answers: assessmentData.questionsAnswers,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating assessment:', error);
            throw error;
        }
    }

    async getAllAssessments() {
        try {
            const { data, error } = await db.supabase
                .from('assessments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting assessments:', error);
            throw error;
        }
    }

    async getAssessmentStats() {
        try {
            const { data, error } = await db.supabase
                .from('assessments')
                .select('assessment_type, risk_level, created_at');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting assessment stats:', error);
            throw error;
        }
    }
}
