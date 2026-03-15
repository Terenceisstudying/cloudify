import { applyCors } from '../../lib/cors.js';
import emailService from '../../services/emailService.js';

/**
 * POST /api/assessments/send-results
 * Send assessment results to user via email.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        let { contact, riskScore, riskLevel, userData, categoryRisks, recommendations, assessmentType, cancerTypeScores } = req.body;

        if (!contact) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address'
            });
        }

        if (typeof recommendations === 'string') {
            try {
                recommendations = JSON.parse(recommendations);
            } catch (e) {
                console.warn('Could not parse recommendations string:', e);
            }
        }

        await emailService.sendAssessmentResults(contact, {
            riskScore,
            riskLevel,
            userData,
            categoryRisks,
            recommendations,
            assessmentType,
            cancerTypeScores
        });

        return res.status(200).json({
            success: true,
            message: `Results sent successfully to ${contact}`
        });
    } catch (error) {
        console.error('Error sending results:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send email. Please try again later.'
        });
    }
}
