import { RISK_CATEGORIES } from './constants.js';

export const QUESTIONS = [
    // High-Risk
    {
        id: 'symptoms',
        prompt: "I've seen blood in my stool or had a big change in bowel habits, but I haven't seen a doctor.",
        risk: 'HIGH',
        category: RISK_CATEGORIES.MEDICAL,
        correctAnswer: 'No',
        explanation: "These are potential warning signs. You must see a doctor to get them checked out."
    },
    {
        id: 'polyps',
        prompt: "A doctor told me I had colon polyps in the past, but I've missed my follow-up appointment.",
        risk: 'HIGH',
        category: RISK_CATEGORIES.MEDICAL,
        correctAnswer: 'No',
        explanation: "Past polyps increase your risk. Regular follow-ups are critical for prevention."
    },
    {
        id: 'ibd',
        prompt: "I have been diagnosed with Inflammatory Bowel Disease (IBD), like Crohn's or colitis.",
        risk: 'HIGH',
        category: RISK_CATEGORIES.MEDICAL,
        correctAnswer: 'No',
        explanation: "IBD significantly increases your risk. Regular screening is essential."
    },
    {
        id: 'screening-missed',
        prompt: "I was given a take-home screening kit (like a FIT kit) but I haven't sent it back.",
        risk: 'HIGH',
        category: RISK_CATEGORIES.MEDICAL,
        correctAnswer: 'No',
        explanation: "The best test is the one that gets done! Screening is the #1 way to catch CRC early."
    },

    // Medium-Risk
    {
        id: 'smoking',
        prompt: "I am a current smoker.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.LIFESTYLE,
        correctAnswer: 'No',
        explanation: "Smoking increases the risk of many cancers, including colorectal cancer."
    },
    {
        id: 'alcohol',
        prompt: "I drink more than one alcoholic beverage per day on average.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.LIFESTYLE,
        correctAnswer: 'No',
        explanation: "Heavy or regular alcohol use is a known risk factor for CRC."
    },
    {
        id: 'processed-meat',
        prompt: "I eat processed meats (like hot dogs, bacon, or ham) most weeks.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.DIET,
        correctAnswer: 'No',
        explanation: "Processed meats are strongly linked to an increased risk of colorectal cancer."
    },
    {
        id: 'red-meat',
        prompt: "I eat red meat (like beef or lamb) more than 3 times per week.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.DIET,
        correctAnswer: 'No',
        explanation: "High red meat consumption can increase your risk. Try swapping in fish or chicken."
    },
    {
        id: 'sedentary',
        prompt: "I am mostly sedentary and get less than 30 minutes of intentional exercise most days.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.LIFESTYLE,
        correctAnswer: 'No',
        explanation: "A sedentary lifestyle is a key risk factor. Regular activity helps keep your colon healthy."
    },
    {
        id: 'fiber',
        prompt: "I rarely eat high-fiber foods like fruits, vegetables, or whole grains.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.DIET,
        correctAnswer: 'No',
        explanation: "Fiber is crucial for a healthy colon. It helps move waste through your system."
    },
    {
        id: 'weight',
        prompt: "I am currently overweight.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.LIFESTYLE,
        correctAnswer: 'No',
        explanation: "Being overweight or obese increases your risk of developing colorectal cancer."
    },
    {
        id: 'diabetes',
        prompt: "I have been diagnosed with Type 2 diabetes.",
        risk: 'MEDIUM',
        category: RISK_CATEGORIES.MEDICAL,
        correctAnswer: 'No',
        explanation: "Type 2 diabetes has been linked to an increased risk of colorectal cancer."
    },

    // Low-Risk
    {
        id: 'grains',
        prompt: "I usually choose white bread and white rice over whole-grain options.",
        risk: 'LOW',
        category: RISK_CATEGORIES.DIET,
        correctAnswer: 'No',
        explanation: "Whole grains contain more fiber, which is important for colon health."
    },
    {
        id: 'cooking',
        prompt: "I often cook my food using high-heat methods like charring, grilling, or barbecuing.",
        risk: 'LOW',
        category: RISK_CATEGORIES.DIET,
        correctAnswer: 'No',
        explanation: "Some studies suggest high-heat cooking may create chemicals linked to cancer risk."
    }
];

export const AGE_GATE_QUESTIONS = {
    OVER_45: {
        id: 'age-gate-over-45',
        prompt: "I am 45 or older and have *not* had my first colorectal cancer screening.",
        risk: 'HIGH',
        category: RISK_CATEGORIES.MEDICAL,
        correctAnswer: 'No',
        explanation: "Screening is recommended to start at age 45. It's the most effective way to prevent CRC."
    },
    UNDER_45: {
        id: 'age-gate-under-45',
        prompt: "I am under 45, and I have *never* discussed my personal CRC risk with a doctor.",
        risk: 'LOW',
        category: RISK_CATEGORIES.MEDICAL,
        correctAnswer: 'No',
        explanation: "It's never too early to know your risk, especially if you have a family history."
    }
};
