import { QuestionLoader } from './questionLoader.js';

/**
 * Default metadata for cancer types
 * This provides icons and descriptions
 */
const DEFAULT_METADATA = {
    'colorectal': {
        icon: '🩺',
        description: 'Check your colorectal cancer risk and get personalized recommendations.'
    },
    'breast': {
        icon: '🎀',
        description: 'Assess your risk factors for breast cancer and learn prevention strategies.'
    },
    'cervical': {
        icon: '🌸',
        description: 'Evaluate your risk for cervical cancer and discover screening options.'
    },
    'lung': {
        icon: '🫁',
        description: 'Assess your lung cancer risk factors and learn about early detection.'
    },
    'prostate': {
        icon: '♂️',
        description: 'Evaluate your prostate cancer risk and discover screening guidelines.'
    },
    'default': {
        icon: '🏥',
        description: 'Assess your cancer risk and get personalized recommendations.'
    }
};

let cachedAssessments = null;

/**
 * Load all available assessments from the CSV file
 */
export async function loadAssessments() {
    if (cachedAssessments) {
        return cachedAssessments;
    }

    try {
        const cancerTypes = await QuestionLoader.getAllCancerTypes();
        
        cachedAssessments = cancerTypes.map(cancerType => {
            const metadata = DEFAULT_METADATA[cancerType.toLowerCase()] || DEFAULT_METADATA['default'];
            const displayName = cancerType.charAt(0).toUpperCase() + cancerType.slice(1);
            
            return {
                id: cancerType.toLowerCase(),
                name: `${displayName} Cancer`,
                icon: metadata.icon,
                description: metadata.description,
                title: `${displayName} Cancer Risk Assessment`,
                subtitle: 'Answer a few questions to get your personalized risk assessment and prevention plan.',
                familyLabel: `Has a close relative (parent, sibling, child) had ${cancerType.toLowerCase()} cancer?`
            };
        });
        
        return cachedAssessments;
    } catch (error) {
        console.error('Error loading assessments:', error);
        return [];
    }
}

/**
 * Get assessment by ID
 */
export async function getAssessmentById(id) {
    const assessments = await loadAssessments();
    return assessments.find(assessment => assessment.id === id);
}

/**
 * Clear cache (useful for testing or reloading)
 */
export function clearCache() {
    cachedAssessments = null;
}