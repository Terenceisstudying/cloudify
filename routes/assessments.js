import express from 'express';
import { AssessmentModel } from '../models/assessmentModel.js';
import { calculateRiskScore } from '../controllers/riskCalculator.js';

const router = express.Router();
const assessmentModel = new AssessmentModel();

/**
 * POST /api/assessments
 * Submit a new risk assessment
 */
router.post('/', async (req, res) => {
    try {
        const { userData, answers } = req.body;

        // Validate input
        if (!userData || !answers) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing userData or answers' 
            });
        }

        // Calculate risk score
        const riskResult = calculateRiskScore(userData, answers);

        // Store assessment (anonymous - no PII)
        const assessment = await assessmentModel.createAssessment({
            age: userData.age,
            gender: userData.gender,
            familyHistory: userData.familyHistory,
            riskScore: riskResult.totalScore,
            riskLevel: riskResult.riskLevel,
            categoryRisks: riskResult.categoryRisks,
            questionsAnswers: answers, // Store detailed questions and answers as JSON
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                assessmentId: assessment.id,
                riskScore: riskResult.totalScore,
                riskLevel: riskResult.riskLevel,
                categoryRisks: riskResult.categoryRisks,
                recommendations: riskResult.recommendations
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/assessments/stats
 * Get aggregate statistics (for analytics - no PII)
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await assessmentModel.getStatistics();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export { router as assessmentsRouter };

