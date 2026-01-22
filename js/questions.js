import { RISK_CATEGORIES } from './constants.js';

/**
 * @deprecated This file is kept for reference only.
 * Questions are now loaded dynamically from the CSV via QuestionLoader.
 * 
 * New Question Schema (Percentage-Based):
 * - weight: Percentage contribution of this question to total risk (0-100)
 * - yesValue: Percentage of weight added when answering Yes (0-100)
 * - noValue: Percentage of weight added when answering No (0-100)
 */

export const QUESTIONS = [
    // High-Risk Questions (weight ~10% each for Colorectal)
    {
        id: 'symptoms',
        prompt: "I've seen blood in my stool or had a big change in bowel habits, but I haven't seen a doctor.",
        weight: 10.14,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.MEDICAL,
        explanation: "These are potential warning signs. You must see a doctor to get them checked out."
    },
    {
        id: 'polyps',
        prompt: "A doctor told me I had colon polyps in the past, but I've missed my follow-up appointment.",
        weight: 10.14,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.MEDICAL,
        explanation: "Past polyps increase your risk. Regular follow-ups are critical for prevention."
    },
    {
        id: 'ibd',
        prompt: "I have been diagnosed with Inflammatory Bowel Disease (IBD), like Crohn's or colitis.",
        weight: 10.14,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.MEDICAL,
        explanation: "IBD significantly increases your risk. Regular screening is essential."
    },
    {
        id: 'screening-missed',
        prompt: "I was given a take-home screening kit (like a FIT kit) but I haven't sent it back.",
        weight: 10.14,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.MEDICAL,
        explanation: "The best test is the one that gets done! Screening is the #1 way to catch CRC early."
    },

    // Medium-Risk Questions (weight ~5.4% each)
    {
        id: 'smoking',
        prompt: "I am a current smoker.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.LIFESTYLE,
        explanation: "Smoking increases the risk of many cancers, including colorectal cancer."
    },
    {
        id: 'alcohol',
        prompt: "I drink more than one alcoholic beverage per day on average.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.LIFESTYLE,
        explanation: "Heavy or regular alcohol use is a known risk factor for CRC."
    },
    {
        id: 'processed-meat',
        prompt: "I eat processed meats (like hot dogs, bacon, or ham) most weeks.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.DIET,
        explanation: "Processed meats are strongly linked to an increased risk of colorectal cancer."
    },
    {
        id: 'red-meat',
        prompt: "I eat red meat (like beef or lamb) more than 3 times per week.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.DIET,
        explanation: "High red meat consumption can increase your risk. Try swapping in fish or chicken."
    },
    {
        id: 'sedentary',
        prompt: "I am mostly sedentary and get less than 30 minutes of intentional exercise most days.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.LIFESTYLE,
        explanation: "A sedentary lifestyle is a key risk factor. Regular activity helps keep your colon healthy."
    },
    {
        id: 'fiber',
        prompt: "I rarely eat high-fiber foods like fruits, vegetables, or whole grains.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.DIET,
        explanation: "Fiber is crucial for a healthy colon. It helps move waste through your system."
    },
    {
        id: 'weight',
        prompt: "I am currently overweight.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.LIFESTYLE,
        explanation: "Being overweight or obese increases your risk of developing colorectal cancer."
    },
    {
        id: 'diabetes',
        prompt: "I have been diagnosed with Type 2 diabetes.",
        weight: 5.41,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.MEDICAL,
        explanation: "Type 2 diabetes has been linked to an increased risk of colorectal cancer."
    },

    // Low-Risk Questions (weight ~2% each)
    {
        id: 'grains',
        prompt: "I usually choose white bread and white rice over whole-grain options.",
        weight: 2.03,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.DIET,
        explanation: "Whole grains contain more fiber, which is important for colon health."
    },
    {
        id: 'cooking',
        prompt: "I often cook my food using high-heat methods like charring, grilling, or barbecuing.",
        weight: 2.03,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.DIET,
        explanation: "Some studies suggest high-heat cooking may create chemicals linked to cancer risk."
    }
];

export const AGE_GATE_QUESTIONS = {
    OVER_45: {
        id: 'age-gate-over-45',
        prompt: "I am 45 or older and have *not* had my first colorectal cancer screening.",
        weight: 10.14,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.MEDICAL,
        explanation: "Screening is recommended to start at age 45. It's the most effective way to prevent CRC."
    },
    UNDER_45: {
        id: 'age-gate-under-45',
        prompt: "I am under 45, and I have *never* discussed my personal CRC risk with a doctor.",
        weight: 2.03,
        yesValue: 100,
        noValue: 0,
        category: RISK_CATEGORIES.MEDICAL,
        explanation: "It's never too early to know your risk, especially if you have a family history."
    }
};
