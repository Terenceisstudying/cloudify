/**
 * Risk Calculator Controller (MVC Pattern)
 * Contains business logic for risk score calculation
 */

const RISK_WEIGHTS = {
    HIGH: 15,
    MEDIUM: 8,
    LOW: 3
};

const RISK_CATEGORIES = {
    DIET: 'Diet & Nutrition',
    LIFESTYLE: 'Lifestyle',
    MEDICAL: 'Medical History',
    FAMILY: 'Family & Genetics'
};

/**
 * Calculate risk score from user data and answers
 */
export function calculateRiskScore(userData, answers) {
    let totalScore = 0;
    const categoryRisks = {
        [RISK_CATEGORIES.DIET]: 0,
        [RISK_CATEGORIES.LIFESTYLE]: 0,
        [RISK_CATEGORIES.MEDICAL]: 0,
        [RISK_CATEGORIES.FAMILY]: 0
    };

    // Base risk from demographics
    if (userData.gender === 'Male') totalScore += 5;
    if (userData.familyHistory === 'Yes') {
        totalScore += RISK_WEIGHTS.HIGH;
        categoryRisks[RISK_CATEGORIES.FAMILY] += RISK_WEIGHTS.HIGH;
    }
    if (userData.age >= 50) totalScore += RISK_WEIGHTS.MEDIUM;

    // Calculate from answers
    answers.forEach(answer => {
        if (answer.isRisk) {
            const weight = RISK_WEIGHTS[answer.risk] || RISK_WEIGHTS.LOW;
            totalScore += weight;
            categoryRisks[answer.category] = (categoryRisks[answer.category] || 0) + weight;
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
 * Generate personalized recommendations
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

