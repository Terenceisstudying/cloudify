/**
 * Anomaly Detection Service
 * 
 * Uses a trained Isolation Forest model to detect anomalous
 * assessment submissions (spam, bots, inconsistent answers).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import isoForest from 'isolation-forest';
const { IsolationForest } = isoForest;

class StandardScaler {
    constructor(mean, std) {
        this.mean = mean || [];
        this.std = std || [];
    }
    transform(X) {
        if (!X || X.length === 0) return X;
        const featuresCount = X[0].length;
       
        const X_scaled = [];
        for (let i = 0; i < X.length; i++) {
            const row = new Array(featuresCount);
            for (let j = 0; j < featuresCount; j++) {
                row[j] = (X[i][j] - this.mean[j]) / this.std[j];
            }
            X_scaled.push(row);
        }
        return X_scaled;
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load model (cached after first load)
let modelInstance = null;
let modelData = null;

/**
 * Load the trained anomaly detection model
 */
export function loadModel() {
    if (modelInstance && modelData) {
        return { model: modelInstance, data: modelData };
    }
    
    const modelPath = path.join(__dirname, 'anomaly-model.json');
    
    if (!fs.existsSync(modelPath)) {
        console.warn('Warning: Anomaly detection model not found. Run "npm run train:ml" first.');
        return null;
    }
    
    modelData = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
    modelInstance = new IsolationForest();
    Object.assign(modelInstance, modelData.model);
    
    console.log('✓ Anomaly detection model loaded');
    return { model: modelInstance, data: modelData };
}

/**
 * Calculate variance of answers
 */
function calculateVariance(answers) {
    const yesCount = answers.filter(a => a.answer === 'Yes').length;
    const ratio = yesCount / answers.length;
    return 1 - Math.abs(0.5 - ratio) * 2;
}

/**
 * Extract features from assessment for ML model
 */
function extractFeatures(assessment) {
    return [
        assessment.age / 100,  // Normalize to 0-1
        assessment.completionTime / 300,  // Normalize
        assessment.answers.filter(a => a.answer === 'Yes').length / assessment.answers.length,
        calculateVariance(assessment.answers),
        assessment.answers.some(a => 
            a.questionId === 'never_smoked' && a.answer === 'Yes'
        ) || assessment.answers.some(a =>
            a.questionId === 'smoking_years' && a.answer !== 'No' && a.answer !== '0'
        ) ? 1 : 0
    ];
}

/**
 * Detect anomalies in an assessment submission
 * @param {object} assessment - Assessment data
 * @returns {object} Anomaly detection result
 */
export function detectAnomaly(assessment) {
    const loaded = loadModel();
    
    // If model not available, use rule-based detection only
    if (!loaded) {
        return detectAnomalyRules(assessment);
    }
    
    const { model, data } = loaded;
    
    // Extract and scale features
    const features = extractFeatures(assessment);
    const scaler = new StandardScaler(data.scaler.mean, data.scaler.std);
    const scaled = scaler.transform([features])[0];
    
    // Get anomaly score (convert from {-1, 1} to {0, 1})
    const prediction = model.predict([scaled])[0];
    const score = prediction === -1 ? 0.85 : 0.15;  // High score for anomalies
    
    // Determine flags based on feature analysis
    const flags = [];
    
    if (assessment.completionTime < 30) {
        flags.push('TOO_FAST');
    }
    
    const yesRatio = assessment.answers.filter(a => a.answer === 'Yes').length / assessment.answers.length;
    if (yesRatio > 0.95 || yesRatio < 0.05) {
        flags.push('UNIFORM_PATTERN');
    }
    
    if (features[4] === 1) {
        flags.push('INCONSISTENT_ANSWERS');
    }
    
    if (assessment.age < 18 || assessment.age > 90) {
        flags.push('EXTREME_PROFILE');
    }
    
    // Determine status based on score
    let status = 'valid';
    if (score > data.thresholds.reject) {
        status = 'rejected';
    } else if (score > data.thresholds.review) {
        status = 'pending_review';
    }
    
    return {
        score,
        flags,
        status,
        method: 'ml'
    };
}

/**
 * Rule-based anomaly detection (fallback when ML model unavailable)
 */
export function detectAnomalyRules(assessment) {
    const flags = [];
    let score = 0.1;
    
    // Rule 1: Too fast
    if (assessment.completionTime < 30) {
        flags.push('TOO_FAST');
        score = 0.9;
    }
    
    // Rule 2: Uniform pattern
    const yesRatio = assessment.answers.filter(a => a.answer === 'Yes').length / assessment.answers.length;
    if (yesRatio > 0.95 || yesRatio < 0.05) {
        flags.push('UNIFORM_PATTERN');
        score = Math.max(score, 0.85);
    }
    
    // Rule 3: Contradictions
    const hasContradiction = assessment.answers.some(a => 
        a.questionId === 'never_smoked' && a.answer === 'Yes'
    ) || assessment.answers.some(a =>
        a.questionId === 'smoking_years' && a.answer !== 'No' && a.answer !== '0'
    );
    
    if (hasContradiction) {
        flags.push('INCONSISTENT_ANSWERS');
        score = Math.max(score, 0.95);
    }
    
    // Rule 4: Extreme profile
    if (assessment.age < 18 || assessment.age > 90) {
        flags.push('EXTREME_PROFILE');
        score = Math.max(score, 0.8);
    }
    
    // Determine status
    let status = 'valid';
    if (score > 0.85) {
        status = 'rejected';
    } else if (score > 0.6) {
        status = 'pending_review';
    }
    
    return {
        score,
        flags,
        status,
        method: 'rules'
    };
}

/**
 * Get model metadata
 */
export function getModelMetadata() {
    const loaded = loadModel();
    
    if (!loaded) {
        return {
            available: false,
            message: 'Model not trained. Run "npm run train:ml" first.'
        };
    }
    
    return {
        available: true,
        metrics: loaded.data.metrics,
        thresholds: loaded.data.thresholds,
        featureNames: loaded.data.featureNames
    };
}

export default {
    loadModel,
    detectAnomaly,
    detectAnomalyRules,
    getModelMetadata
};
