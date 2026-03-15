/**
 * Anomaly Detection Model Training Script
 * 
 * Trains an Isolation Forest model on synthetic assessment data
 * for detecting anomalous submissions (spam, bots, inconsistent answers).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import isoForest from 'isolation-forest';
const { IsolationForest } = isoForest;

class StandardScaler {
    constructor() {
        this.mean = [];
        this.std = [];
    }
    fitTransform(X) {
        if (!X || X.length === 0) return X;
        const featuresCount = X[0].length;
        
        // Calculate mean
        this.mean = new Array(featuresCount).fill(0);
        for (let i = 0; i < X.length; i++) {
            for (let j = 0; j < featuresCount; j++) {
                this.mean[j] += X[i][j];
            }
        }
        for (let j = 0; j < featuresCount; j++) {
            this.mean[j] /= X.length;
        }
        
        // Calculate standard deviation
        this.std = new Array(featuresCount).fill(0);
        for (let i = 0; i < X.length; i++) {
            for (let j = 0; j < featuresCount; j++) {
                this.std[j] += Math.pow(X[i][j] - this.mean[j], 2);
            }
        }
        for (let j = 0; j < featuresCount; j++) {
            this.std[j] = Math.sqrt(this.std[j] / X.length);
            if (this.std[j] === 0) this.std[j] = 1; // Prevent division by zero
        }
        
        // Transform
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
 * Train the Isolation Forest model
 */
async function trainModel() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Anomaly Detection Model Training');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Load synthetic data
    const dataPath = path.join(__dirname, '..', 'data', 'synthetic-assessments.json');
    
    if (!fs.existsSync(dataPath)) {
        console.error('Error: Synthetic data not found!');
        console.error('Run "npm run generate:synthetic" first to generate training data.');
        process.exit(1);
    }
    
    console.log('Loading synthetic data...');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`✓ Loaded ${data.length} assessments`);
    
    // Extract features
    console.log('\nExtracting features...');
    const X = data.map(extractFeatures);
    const labels = data.map(d => d.isAnomaly ? 1 : 0);
    
    const anomalyCount = labels.filter(l => l === 1).length;
    console.log(`✓ Features extracted (${anomalyCount} anomalies, ${data.length - anomalyCount} normal)`);
    
    // Normalize features
    console.log('\nNormalizing features...');
    const scaler = new StandardScaler();
    const X_scaled = scaler.fitTransform(X);
    console.log('✓ Features normalized');
    
    // Train Isolation Forest
    console.log('\nTraining Isolation Forest model...');
    console.log('  - n_estimators: 100');
    console.log('  - contamination: 0.05 (expected 5% anomaly rate)');
    console.log('  - max_samples: 256');
    
    const model = new IsolationForest({
        n_estimators: 100,
        contamination: 0.05,
        max_samples: 256,
        randomState: 42
    });
    
    model.fit(X_scaled);
    console.log('✓ Model trained');
    
    // Evaluate on training data
    console.log('\nEvaluating model...');
    const predictions = model.predict(X_scaled);
    const predictedAnomalies = predictions.filter(p => p === -1).length;  // -1 = anomaly
    
    // Calculate precision and recall
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    
    for (let i = 0; i < predictions.length; i++) {
        const actual = labels[i];
        const predicted = predictions[i] === -1 ? 1 : 0;
        
        if (actual === 1 && predicted === 1) truePositives++;
        if (actual === 0 && predicted === 1) falsePositives++;
        if (actual === 1 && predicted === 0) falseNegatives++;
    }
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    console.log(`\n  Evaluation Metrics:`);
    console.log(`  - Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`  - Recall: ${(recall * 100).toFixed(1)}%`);
    console.log(`  - F1 Score: ${(f1Score * 100).toFixed(1)}%`);
    console.log(`  - Predicted anomalies: ${predictedAnomalies}`);
    
    // Save model
    console.log('\nSaving model...');
    const modelData = {
        model: model,
        scaler: {
            mean: scaler.mean,
            std: scaler.std
        },
        featureNames: ['age', 'completionTime', 'yesRatio', 'answerVariance', 'hasContradiction'],
        thresholds: {
            review: 0.6,    // Score > 0.6 → flag for review
            reject: 0.85    // Score > 0.85 → auto-reject
        },
        metrics: {
            precision,
            recall,
            f1Score,
            trainedAt: new Date().toISOString(),
            trainingSamples: data.length
        }
    };
    
    const modelPath = path.join(__dirname, '..', 'src', 'ml', 'anomaly-model.json');
    fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
    console.log(`✓ Model saved to: ${modelPath}`);
    
    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Training Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n  Model ready for deployment.`);
    console.log(`  Next steps:`);
    console.log(`  1. Test model with sample assessments`);
    console.log(`  2. Integrate with /api/assessments endpoint`);
    console.log(`  3. Monitor performance in production`);
    console.log(`\n  Thresholds:`);
    console.log(`  - Review: anomaly score > 0.6 (flag for admin review)`);
    console.log(`  - Reject: anomaly score > 0.85 (auto-reject submission)`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return modelData;
}

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('train-anomaly-model.js')) {
    trainModel().catch(err => {
        fs.writeFileSync('err.txt', err.stack || err.toString());
        console.error('Training failed:', err);
        process.exit(1);
    });
}

export { trainModel };
