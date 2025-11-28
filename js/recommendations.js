import { RISK_CATEGORIES } from './constants.js';

/**
 * Generate personalized recommendations based on user's risk profile
 */
export function getRecommendations(gameState) {
    const categoryRisks = gameState.getCategoryRisks();
    const recommendations = [];

    // Diet Recommendations
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

    // Lifestyle Recommendations
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

    // Medical/Screening Recommendations
    const medicalRisk = categoryRisks[RISK_CATEGORIES.MEDICAL];
    const familyRisk = categoryRisks[RISK_CATEGORIES.FAMILY];
    const userAge = gameState.getUserData().age;

    if (medicalRisk > 0 || familyRisk > 0 || userAge >= 45) {
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

    // General Risk Reduction
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
