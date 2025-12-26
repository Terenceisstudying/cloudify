import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'questions.csv');

/**
 * Question Model (MVC Pattern)
 * Handles all question data operations
 * Uses CSV format for better version control and human readability
 */
export class QuestionModel {
    constructor() {
        this.questions = [];
        this.loadQuestions();
    }

    async loadQuestions() {
        try {
            const data = await fs.readFile(DATA_FILE, 'utf-8');
            this.questions = this.parseCSV(data);
        } catch (error) {
            // If file doesn't exist, initialize with default questions
            this.questions = this.getDefaultQuestions();
            await this.saveQuestions();
        }
    }

    async saveQuestions() {
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        const csvContent = this.questionsToCSV();
        await fs.writeFile(DATA_FILE, csvContent);
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) return [];

        const headers = lines[0].split(',');
        const questions = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= headers.length) {
                const question = {};
                headers.forEach((header, index) => {
                    let value = values[index] || '';
                    // Parse numeric values
                    if (header === 'risk' && value) {
                        // Keep as string for now
                    }
                    // Unescape quotes
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1).replace(/""/g, '"');
                    }
                    question[header] = value;
                });
                questions.push(question);
            }
        }
        return questions;
    }

    questionsToCSV() {
        if (this.questions.length === 0) {
            return 'id,prompt,risk,category,correctAnswer,explanation\n';
        }

        const headers = ['id', 'prompt', 'risk', 'category', 'correctAnswer', 'explanation'];
        const csvLines = [headers.join(',')];

        this.questions.forEach(question => {
            const values = headers.map(header => {
                let value = question[header] || '';
                // Escape commas and quotes in values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        });

        return csvLines.join('\n') + '\n';
    }

    async getAllQuestions(userAge = null) {
        await this.loadQuestions();
        let filtered = [...this.questions];

        // Filter age-gated questions based on user age
        if (userAge !== null) {
            filtered = filtered.filter(q => {
                if (q.id === 'age-gate-over-45') return userAge >= 45;
                if (q.id === 'age-gate-under-45') return userAge < 45;
                return true;
            });
        }

        return filtered;
    }

    async getQuestionById(id) {
        await this.loadQuestions();
        return this.questions.find(q => q.id === id);
    }

    async createQuestion(questionData) {
        await this.loadQuestions();
        const newQuestion = {
            id: questionData.id || `question-${Date.now()}`,
            ...questionData
        };
        this.questions.push(newQuestion);
        await this.saveQuestions();
        return newQuestion;
    }

    async updateQuestion(id, updates) {
        await this.loadQuestions();
        const index = this.questions.findIndex(q => q.id === id);
        if (index === -1) throw new Error('Question not found');
        
        this.questions[index] = { ...this.questions[index], ...updates };
        await this.saveQuestions();
        return this.questions[index];
    }

    async deleteQuestion(id) {
        await this.loadQuestions();
        this.questions = this.questions.filter(q => q.id !== id);
        await this.saveQuestions();
    }

    getDefaultQuestions() {
        return [
            {
                id: 'symptoms',
                prompt: "I've seen blood in my stool or had a big change in bowel habits, but I haven't seen a doctor.",
                risk: 'HIGH',
                category: 'Medical History',
                correctAnswer: 'No',
                explanation: "These are potential warning signs. You must see a doctor to get them checked out."
            },
            {
                id: 'polyps',
                prompt: "A doctor told me I had colon polyps in the past, but I've missed my follow-up appointment.",
                risk: 'HIGH',
                category: 'Medical History',
                correctAnswer: 'No',
                explanation: "Past polyps increase your risk. Regular follow-ups are critical for prevention."
            },
            {
                id: 'ibd',
                prompt: "I have been diagnosed with Inflammatory Bowel Disease (IBD), like Crohn's or colitis.",
                risk: 'HIGH',
                category: 'Medical History',
                correctAnswer: 'No',
                explanation: "IBD significantly increases your risk. Regular screening is essential."
            },
            {
                id: 'screening-missed',
                prompt: "I was given a take-home screening kit (like a FIT kit) but I haven't sent it back.",
                risk: 'HIGH',
                category: 'Medical History',
                correctAnswer: 'No',
                explanation: "The best test is the one that gets done! Screening is the #1 way to catch CRC early."
            },
            {
                id: 'age-gate-over-45',
                prompt: "I am 45 or older and have *not* had my first colorectal cancer screening.",
                risk: 'HIGH',
                category: 'Medical History',
                correctAnswer: 'No',
                explanation: "Screening is recommended to start at age 45. It's the most effective way to prevent CRC."
            },
            {
                id: 'smoking',
                prompt: "I am a current smoker.",
                risk: 'MEDIUM',
                category: 'Lifestyle',
                correctAnswer: 'No',
                explanation: "Smoking increases the risk of many cancers, including colorectal cancer."
            },
            {
                id: 'alcohol',
                prompt: "I drink more than one alcoholic beverage per day on average.",
                risk: 'MEDIUM',
                category: 'Lifestyle',
                correctAnswer: 'No',
                explanation: "Heavy or regular alcohol use is a known risk factor for CRC."
            },
            {
                id: 'processed-meat',
                prompt: "I eat processed meats (like hot dogs, bacon, or ham) most weeks.",
                risk: 'MEDIUM',
                category: 'Diet & Nutrition',
                correctAnswer: 'No',
                explanation: "Processed meats are strongly linked to an increased risk of colorectal cancer."
            },
            {
                id: 'red-meat',
                prompt: "I eat red meat (like beef or lamb) more than 3 times per week.",
                risk: 'MEDIUM',
                category: 'Diet & Nutrition',
                correctAnswer: 'No',
                explanation: "High red meat consumption can increase your risk. Try swapping in fish or chicken."
            },
            {
                id: 'sedentary',
                prompt: "I am mostly sedentary and get less than 30 minutes of intentional exercise most days.",
                risk: 'MEDIUM',
                category: 'Lifestyle',
                correctAnswer: 'No',
                explanation: "A sedentary lifestyle is a key risk factor. Regular activity helps keep your colon healthy."
            },
            {
                id: 'fiber',
                prompt: "I rarely eat high-fiber foods like fruits, vegetables, or whole grains.",
                risk: 'MEDIUM',
                category: 'Diet & Nutrition',
                correctAnswer: 'No',
                explanation: "Fiber is crucial for a healthy colon. It helps move waste through your system."
            },
            {
                id: 'weight',
                prompt: "I am currently overweight.",
                risk: 'MEDIUM',
                category: 'Lifestyle',
                correctAnswer: 'No',
                explanation: "Being overweight or obese increases your risk of developing colorectal cancer."
            },
            {
                id: 'diabetes',
                prompt: "I have been diagnosed with Type 2 diabetes.",
                risk: 'MEDIUM',
                category: 'Medical History',
                correctAnswer: 'No',
                explanation: "Type 2 diabetes has been linked to an increased risk of colorectal cancer."
            },
            {
                id: 'grains',
                prompt: "I usually choose white bread and white rice over whole-grain options.",
                risk: 'LOW',
                category: 'Diet & Nutrition',
                correctAnswer: 'No',
                explanation: "Whole grains contain more fiber, which is important for colon health."
            },
            {
                id: 'cooking',
                prompt: "I often cook my food using high-heat methods like charring, grilling, or barbecuing.",
                risk: 'LOW',
                category: 'Diet & Nutrition',
                correctAnswer: 'No',
                explanation: "Some studies suggest high-heat cooking may create chemicals linked to cancer risk."
            },
            {
                id: 'age-gate-under-45',
                prompt: "I am under 45, and I have *never* discussed my personal CRC risk with a doctor.",
                risk: 'LOW',
                category: 'Medical History',
                correctAnswer: 'No',
                explanation: "It's never too early to know your risk, especially if you have a family history."
            }
        ];
    }
}

