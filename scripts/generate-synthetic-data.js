/**
 * Synthetic Data Generator for Anomaly Detection Training
 * 
 * Generates realistic fake assessments based on Singapore demographic statistics.
 * Used to train the Isolation Forest anomaly detection model.
 * 
 * Sources:
 * - Singapore Department of Statistics
 * - Health Promotion Board (HPB) 2020 reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Singapore demographic distributions
const DEMOGRAPHICS = {
    age: { mean: 45, std: 15, min: 21, max: 85 },
    gender: { male: 0.49, female: 0.51 },
    ethnicity: { 
        chinese: 0.74, 
        malay: 0.13, 
        indian: 0.09, 
        others: 0.04 
    },
    familyHistory: 0.15  // 15% have family history of cancer
};

// Question answer probabilities (based on Singapore health statistics)
const QUESTION_PROBS = {
    smoker: 0.18,                    // 18% smoking rate (HPB 2020)
    alcohol: 0.25,                   // 25% drink regularly
    exercise: 0.40,                  // 40% exercise regularly
    unhealthy_diet: 0.35,            // 35% poor diet
    family_cancer: 0.15,             // 15% family history
    age_over_50: 0.45,               // 45% over 50
    bmi_high: 0.25,                  // 25% overweight/obese
    screening_delay: 0.30,           // 30% delay screening
    chronic_disease: 0.20,           // 20% have chronic disease
    stress_high: 0.35                // 35% high stress
};

// Question IDs matching the existing question bank
const QUESTION_IDS = [
    'q_smoker',
    'q_alcohol',
    'q_exercise',
    'q_diet',
    'q_family_cancer',
    'q_age_screening',
    'q_bmi',
    'q_screening_delay',
    'q_chronic_disease',
    'q_stress'
];

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random choice from an array with weighted probabilities
 */
function randomChoice(choices, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < choices.length; i++) {
        if (random < weights[i]) {
            return choices[i];
        }
        random -= weights[i];
    }
    
    return choices[choices.length - 1];
}

/**
 * Generate a random number from a Gaussian (normal) distribution
 */
function gaussianRandom(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num * std + mean;
    
    return Math.max(DEMOGRAPHICS.age.min, Math.min(DEMOGRAPHICS.age.max, Math.round(num)));
}

/**
 * Calculate variance of answers (how varied are the responses)
 */
function calculateVariance(answers) {
    const yesCount = answers.filter(a => a.answer === 'Yes').length;
    const ratio = yesCount / answers.length;
    // Variance is highest when ratio is 0.5 (50/50 split)
    return 1 - Math.abs(0.5 - ratio) * 2;
}

/**
 * Generate realistic answers based on demographics and health statistics
 */
function generateRealisticAnswers(profile) {
    const answers = [];
    
    for (let i = 0; i < QUESTION_IDS.length; i++) {
        const questionId = QUESTION_IDS[i];
        const key = questionId.replace('q_', '');
        const baseProb = QUESTION_PROBS[key] || 0.5;
        
        // Adjust probability based on profile
        let prob = baseProb;
        
        // Age affects certain answers
        if (questionId === 'q_age_screening' && profile.age < 50) {
            prob = 0.2;  // Younger people less likely to need screening
        } else if (questionId === 'q_age_screening' && profile.age >= 50) {
            prob = 0.7;  // Older people more likely
        }
        
        // Family history affects certain answers
        if (questionId === 'q_family_cancer' && profile.familyHistory) {
            prob = 0.9;
        } else if (questionId === 'q_family_cancer' && !profile.familyHistory) {
            prob = 0.05;
        }
        
        answers.push({
            questionId,
            answer: Math.random() < prob ? 'Yes' : 'No'
        });
    }
    
    return answers;
}

/**
 * Generate a normal (non-anomalous) assessment
 */
function generateNormalAssessment() {
    const answers = generateRealisticAnswers({
        age: gaussianRandom(DEMOGRAPHICS.age.mean, DEMOGRAPHICS.age.std),
        familyHistory: Math.random() < DEMOGRAPHICS.familyHistory
    });
    
    return {
        age: gaussianRandom(DEMOGRAPHICS.age.mean, DEMOGRAPHICS.age.std),
        gender: randomChoice(['Male', 'Female'], [DEMOGRAPHICS.gender.male, DEMOGRAPHICS.gender.female]),
        ethnicity: randomChoice(
            ['Chinese', 'Malay', 'Indian', 'Others'], 
            [DEMOGRAPHICS.ethnicity.chinese, DEMOGRAPHICS.ethnicity.malay, DEMOGRAPHICS.ethnicity.indian, DEMOGRAPHICS.ethnicity.others]
        ),
        familyHistory: Math.random() < DEMOGRAPHICS.familyHistory,
        answers,
        completionTime: randomInt(90, 300),  // 1.5-5 minutes (normal range)
        isAnomaly: false,
        anomalyType: null
    };
}

/**
 * Generate an anomalous assessment with known anomaly type
 */
function generateAnomalousAssessment() {
    // Choose anomaly type with weighted probabilities
    const anomalyType = randomChoice(
        ['TOO_FAST', 'UNIFORM', 'CONTRADICTION', 'EXTREME'], 
        [0.4, 0.3, 0.2, 0.1]  // 40% too fast, 30% uniform, 20% contradiction, 10% extreme
    );
    
    let assessment = generateNormalAssessment();
    
    switch (anomalyType) {
        case 'TOO_FAST':
            // Completion time < 30 seconds (bot-like)
            assessment.completionTime = randomInt(5, 25);
            break;
            
        case 'UNIFORM':
            // All answers are the same (not reading questions)
            const allYes = Math.random() > 0.5;
            assessment.answers = assessment.answers.map(a => ({
                ...a,
                answer: allYes ? 'Yes' : 'No'
            }));
            break;
            
        case 'CONTRADICTION':
            // Inject contradictory answers
            assessment.answers.push(
                { questionId: 'never_smoked', answer: 'Yes' },
                { questionId: 'smoking_years', answer: String(randomInt(10, 30)) }
            );
            break;
            
        case 'EXTREME':
            // Impossible or extreme values
            assessment.age = randomChoice([10, 95, 120, 5, 150], [1, 1, 1, 1, 1]);
            break;
    }
    
    assessment.isAnomaly = true;
    assessment.anomalyType = anomalyType;
    
    return assessment;
}

/**
 * Extract features for ML model training
 */
function extractFeatures(assessment) {
    return {
        age: assessment.age / 100,  // Normalize to 0-1
        completionTime: assessment.completionTime / 300,  // Normalize
        yesRatio: assessment.answers.filter(a => a.answer === 'Yes').length / assessment.answers.length,
        answerVariance: calculateVariance(assessment.answers),
        hasContradiction: assessment.answers.some(a => 
            a.questionId === 'never_smoked' && a.answer === 'Yes'
        ) || assessment.answers.some(a =>
            a.questionId === 'smoking_years' && a.answer !== 'No' && a.answer !== '0'
        ) ? 1 : 0,
        isAnomaly: assessment.isAnomaly ? 1 : 0,
        anomalyType: assessment.anomalyType
    };
}

function generateDataset() {
    console.log('Generating synthetic assessment data...');
    try {
        const data = [];
        
        // Generate 95% normal assessments
        const normalCount = 950;
        console.log(`Generating ${normalCount} normal assessments...`);
        for (let i = 0; i < normalCount; i++) {
            data.push(generateNormalAssessment());
        }
        
        // Generate 5% anomalous assessments
        const anomalyCount = 50;
        console.log(`Generating ${anomalyCount} anomalous assessments...`);
        for (let i = 0; i < anomalyCount; i++) {
            data.push(generateAnomalousAssessment());
        }
        
        // Extract features for ML
        const features = data.map(extractFeatures);
        
        // Save raw data
        const outputPath = path.join(__dirname, '..', 'data', 'synthetic-assessments.json');
        console.log("Writing to:", outputPath);
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`\n✓ Raw data saved to: ${outputPath}`);
        
        // Save features for training
        const featuresPath = path.join(__dirname, '..', 'src', 'ml', 'synthetic-features.json');
        console.log("Writing to:", featuresPath);
        fs.writeFileSync(featuresPath, JSON.stringify(features, null, 2));
        console.log(`✓ Features saved to: ${featuresPath}`);
        
        // Print summary
        const anomalyTypes = {};
        data.filter(d => d.isAnomaly).forEach(d => {
            anomalyTypes[d.anomalyType] = (anomalyTypes[d.anomalyType] || 0) + 1;
        });
        
        console.log('\n📊 Dataset Summary:');
        console.log(`   Total assessments: ${data.length}`);
        console.log(`   Normal: ${normalCount} (${(normalCount/data.length*100).toFixed(1)}%)`);
        console.log(`   Anomalous: ${anomalyCount} (${(anomalyCount/data.length*100).toFixed(1)}%)`);
        console.log('\n   Anomaly breakdown:');
        for (const [type, count] of Object.entries(anomalyTypes)) {
            console.log(`   - ${type}: ${count}`);
        }
        
        return { data, features };
    } catch (err) {
        fs.writeFileSync('err.txt', err.stack || err.toString());
        console.error("===== ERRROR =====");
        console.error("Wrote error to err.txt");
        process.exit(1);
    }
}

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('generate-synthetic-data.js')) {
    generateDataset();
}

export {
    generateDataset,
    generateNormalAssessment,
    generateAnomalousAssessment,
    extractFeatures
};
