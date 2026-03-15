/**
 * ML Prediction Endpoint
 * 
 * POST /api/predict
 * Returns anomaly detection results for an assessment submission.
 */

import { applyCors } from '../../lib/cors.js';
import { detectAnomaly, getModelMetadata } from '../../src/ml/anomaly.js';

export default async function handler(req, res) {
    // Apply CORS headers
    applyCors(req, res);
    
    // Handle different HTTP methods
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        // Return model metadata
        const metadata = getModelMetadata();
        return res.status(200).json(metadata);
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'METHOD_NOT_ALLOWED',
            message: 'Only POST method is supported'
        });
    }
    
    try {
        // Parse request body
        const { userData, answers, completionTime } = req.body;
        
        // Validate input
        if (!userData || !answers || !Array.isArray(answers)) {
            return res.status(400).json({
                error: 'INVALID_INPUT',
                message: 'Missing required fields: userData, answers'
            });
        }
        
        // Create assessment object
        const assessment = {
            age: userData.age || 0,
            gender: userData.gender || '',
            ethnicity: userData.ethnicity || '',
            familyHistory: userData.familyHistory || false,
            answers,
            completionTime: completionTime || 0
        };
        
        // Run anomaly detection
        const result = detectAnomaly(assessment);
        
        // Return result
        return res.status(200).json({
            anomalyDetection: result,
            timestamp: new Date().toISOString(),
            modelInfo: {
                type: 'Isolation Forest',
                method: result.method
            }
        });
        
    } catch (error) {
        console.error('ML prediction error:', error);
        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to process anomaly detection'
        });
    }
}

export const config = {
    api: {
        bodyParser: true
    }
};
