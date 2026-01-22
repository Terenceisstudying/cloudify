/**
 * Risk Calculator Controller (MVC Pattern)
 * Contains business logic for percentage-based risk score calculation
 * 
 * New Scoring System:
 * - Each question has a 'weight' (percentage contribution to total risk)
 * - Each answer (Yes/No) has a value (0-100%) that determines how much of the weight is added
 * - Final score = sum of (weight * answerValue / 100) for all questions
 * - Score is clamped to 0-100%
 */

const RISK_CATEGORIES = {
    DIET: 'Diet & Nutrition',
    LIFESTYLE: 'Lifestyle',
    MEDICAL: 'Medical History',
    FAMILY: 'Family & Genetics'
};

/**
 * Calculate risk score from user data and answers using percentage-based scoring
 * @param {Object} userData - User demographic data
 * @param {Array} answers - Array of answer objects with question details
 * @returns {Object} - Risk assessment results
 */
export function calculateRiskScore(userData, answers) {
    let totalScore = 0;
    const categoryRisks = {
        [RISK_CATEGORIES.DIET]: 0,
        [RISK_CATEGORIES.LIFESTYLE]: 0,
        [RISK_CATEGORIES.MEDICAL]: 0,
        [RISK_CATEGORIES.FAMILY]: 0
    };

    // Base risk from family history (adds fixed percentage)
    if (userData.familyHistory === 'Yes') {
        const familyHistoryWeight = 10; // 10% base risk for family history
        totalScore += familyHistoryWeight;
        categoryRisks[RISK_CATEGORIES.FAMILY] += familyHistoryWeight;
    }

    // Calculate from answers using percentage-based scoring
    answers.forEach(answer => {
        const weight = parseFloat(answer.weight) || 0;
        const yesValue = parseFloat(answer.yesValue) ?? 100;
        const noValue = parseFloat(answer.noValue) ?? 0;
        
        // Determine which value to use based on user's answer
        let answerValue = 0;
        if (answer.userAnswer === 'Yes') {
            answerValue = yesValue;
        } else if (answer.userAnswer === 'No') {
            answerValue = noValue;
        }
        
        // Calculate contribution: weight * (answerValue / 100)
        const contribution = weight * (answerValue / 100);
        
        if (contribution > 0) {
            totalScore += contribution;
            const category = answer.category || RISK_CATEGORIES.LIFESTYLE;
            categoryRisks[category] = (categoryRisks[category] || 0) + contribution;
        }
    });

    // Clamp score to 0-100
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine risk level
    let riskLevel = 'LOW';
    if (totalScore >= 66) riskLevel = 'HIGH';
    else if (totalScore >= 33) riskLevel = 'MEDIUM';

    // Generate recommendations
    const recommendations = generateRecommendations(categoryRisks, userData.age);

    return {
        totalScore: Math.round(totalScore),
        riskLevel,
        categoryRisks,
        recommendations
    };
}

/**
 * Calculate the contribution of a single answer
 * @param {Object} question - Question object with weight, yesValue, noValue
 * @param {string} userAnswer - User's answer ('Yes' or 'No')
 * @returns {number} - Risk contribution percentage
 */
export function calculateAnswerContribution(question, userAnswer) {
    const weight = parseFloat(question.weight) || 0;
    const yesValue = parseFloat(question.yesValue) ?? 100;
    const noValue = parseFloat(question.noValue) ?? 0;
    
    let answerValue = 0;
    if (userAnswer === 'Yes') {
        answerValue = yesValue;
    } else if (userAnswer === 'No') {
        answerValue = noValue;
    }
    
    return weight * (answerValue / 100);
}

/**
 * Validate that question weights for a cancer type sum to approximately 100%
 * @param {Array} questions - Array of questions for a specific cancer type
 * @returns {Object} - Validation result with isValid flag and details
 */
export function validateQuestionWeights(questions) {
    const totalWeight = questions.reduce((sum, q) => sum + (parseFloat(q.weight) || 0), 0);
    const tolerance = 1; // Allow 1% tolerance for rounding
    const isValid = Math.abs(totalWeight - 100) <= tolerance;
    
    return {
        isValid,
        totalWeight: Math.round(totalWeight * 100) / 100,
        difference: Math.round((100 - totalWeight) * 100) / 100,
        message: isValid 
            ? 'Weights are valid (sum to ~100%)' 
            : `Weights sum to ${totalWeight.toFixed(2)}%, should be 100%`
    };
}

/**
 * Auto-calculate equal weights for questions without custom weights
 * @param {Array} questions - Array of questions
 * @returns {Array} - Questions with calculated weights
 */
export function autoCalculateWeights(questions) {
    const questionsWithoutWeight = questions.filter(q => !q.weight || q.weight === '');
    const questionsWithWeight = questions.filter(q => q.weight && q.weight !== '');
    
    const usedWeight = questionsWithWeight.reduce((sum, q) => sum + parseFloat(q.weight), 0);
    const remainingWeight = 100 - usedWeight;
    const autoWeight = questionsWithoutWeight.length > 0 
        ? remainingWeight / questionsWithoutWeight.length 
        : 0;
    
    return questions.map(q => {
        if (!q.weight || q.weight === '') {
            return { ...q, weight: autoWeight.toFixed(2) };
        }
        return q;
    });
}

/**
 * Generate personalized recommendations based on category risks
 */
function generateRecommendations(categoryRisks, userAge) {
    const recommendations = [];

    if (categoryRisks[RISK_CATEGORIES.DIET] > 0) {
        recommendations.push({
            title: 'Improve Your Diet',
            actions: [
                'Add more fiber: Aim for 25-30g daily from fruits, vegetables, and whole grains',
                'Limit red meat to 1-2 servings per week',
                'Avoid processed meats like bacon, hot dogs, and deli meats',
                'Try Mediterranean diet patterns with fish, olive oil, and vegetables'
            ]
        });
    }

    if (categoryRisks[RISK_CATEGORIES.LIFESTYLE] > 0) {
        recommendations.push({
            title: 'Get Active & Healthy',
            actions: [
                'Start with 30 minutes of moderate activity 5 days a week',
                'Include both cardio (walking, swimming) and strength training',
                'Take movement breaks every hour if you sit at a desk',
                'Maintain a healthy weight through balanced diet and exercise',
                'Limit alcohol consumption and avoid smoking'
            ]
        });
    }

    if (categoryRisks[RISK_CATEGORIES.MEDICAL] > 0 || categoryRisks[RISK_CATEGORIES.FAMILY] > 0 || userAge >= 45) {
        recommendations.push({
            title: 'Schedule Screening',
            actions: [
                'Screening is recommended starting at age 45 (earlier with family history)',
                'Options include colonoscopy, FIT test, or stool DNA test',
                'Early detection can prevent 90% of CRC deaths',
                'Talk to your doctor about which screening is right for you'
            ]
        });
    }

    recommendations.push({
        title: 'Reduce Risk Behaviors',
        actions: [
            'Quit smoking or seek support to quit (increases cancer risk significantly)',
            'Limit alcohol to no more than 1 drink per day',
            'Manage chronic conditions like diabetes with your doctor',
            'Stay up to date with all recommended health screenings'
        ]
    });

    return recommendations;
}
