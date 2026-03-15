import { applyCors } from '../../lib/cors.js';
import { supabase } from '../../lib/db.js';
import { calculateRiskScore } from '../../controllers/riskCalculator.js';
import { detectAnomaly } from '../../src/ml/anomaly.js';

/**
 * POST /api/assessments
 * Submit a new risk assessment with anomaly detection.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { userData, answers, completionTime } = req.body;

        if (!userData || !answers) {
            return res.status(400).json({
                success: false,
                error: 'Missing userData or answers'
            });
        }

        const assessmentId = userData.assessmentType || 'colorectal';
        let assessmentConfig = null;

        // Fetch assessment config from Supabase
        try {
            const { data: ct, error } = await supabase
                .from('cancer_types')
                .select('*')
                .eq('id', assessmentId)
                .single();

            if (ct && !error) {
                assessmentConfig = {
                    familyWeight: parseFloat(ct.family_weight ?? ct.familyweight) || 10,
                    ageRiskThreshold: parseInt(ct.age_risk_threshold ?? ct.ageriskthreshold) || 0,
                    ageRiskWeight: parseFloat(ct.age_risk_weight ?? ct.ageriskweight) || 0,
                    ethnicityRisk: {
                        chinese: parseFloat(ct.ethnicity_risk_chinese ?? ct.ethnicityrisk_chinese) || 0,
                        malay: parseFloat(ct.ethnicity_risk_malay ?? ct.ethnicityrisk_malay) || 0,
                        indian: parseFloat(ct.ethnicity_risk_indian ?? ct.ethnicityrisk_indian) || 0,
                        caucasian: parseFloat(ct.ethnicity_risk_caucasian ?? ct.ethnicityrisk_caucasian) || 0,
                        others: parseFloat(ct.ethnicity_risk_others ?? ct.ethnicityrisk_others) || 0
                    }
                };
            }
        } catch (err) {
            console.warn('Failed to load assessment config, using defaults:', err);
        }

        // Calculate risk score
        const riskResult = calculateRiskScore(userData, answers, assessmentId, assessmentConfig);

        // Run anomaly detection
        let anomalyResult = { score: 0, flags: [], status: 'valid', method: 'none' };
        try {
            anomalyResult = detectAnomaly({
                age: userData.age,
                completionTime: completionTime || 0,
                answers
            });
        } catch (err) {
            console.warn('Anomaly detection skipped:', err.message);
        }

        // Prepare data for Supabase insert
        const assessmentEntry = {
            age: userData.age,
            gender: userData.gender,
            ethnicity: userData.ethnicity || null,
            family_history: userData.familyHistory || false,
            contact_email: userData.contactEmail || null,
            contact_phone: userData.contactPhone || null,
            assessment_type: assessmentId,
            risk_score: riskResult.totalScore,
            risk_level: riskResult.riskLevel,
            category_risks: riskResult.categoryRisks,
            questions_answers: answers,
            completion_time: completionTime || null,
            anomaly_score: anomalyResult.score,
            anomaly_flags: anomalyResult.flags,
            status: anomalyResult.status
        };

        // Insert into Supabase
        const { data: assessment, error } = await supabase
            .from('assessments')
            .insert(assessmentEntry)
            .select()
            .single();

        if (error) throw error;

        const isHighRisk = riskResult.riskLevel === 'HIGH';

        const responseData = {
            assessmentId: assessment.id,
            riskScore: riskResult.totalScore,
            riskLevel: riskResult.riskLevel,
            isHighRisk,
            categoryRisks: riskResult.categoryRisks,
            recommendations: riskResult.recommendations,
            qualityCheck: anomalyResult
        };

        if (userData.assessmentType === 'generic' && riskResult.cancerTypeScores) {
            responseData.cancerTypeScores = riskResult.cancerTypeScores;
        }

        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error('Assessment submission error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
