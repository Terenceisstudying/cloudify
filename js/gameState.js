import { RISK_CATEGORIES } from './constants.js';

/**
 * Game State Management (Single Responsibility)
 * Manages all game state with clear getters/setters
 */
export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.userAge = 0;
        this.userSex = '';
        this.userFamilyHistory = '';
        this.currentQuestionIndex = 0;
        this.riskScore = 0;
        this.questions = [];

        this.riskByCategory = {
            [RISK_CATEGORIES.DIET]: 0,
            [RISK_CATEGORIES.LIFESTYLE]: 0,
            [RISK_CATEGORIES.MEDICAL]: 0,
            [RISK_CATEGORIES.FAMILY]: 0
        };

        this.answersCount = {
            [RISK_CATEGORIES.DIET]: 0,
            [RISK_CATEGORIES.LIFESTYLE]: 0,
            [RISK_CATEGORIES.MEDICAL]: 0,
            [RISK_CATEGORIES.FAMILY]: 0
        };
    }

    // User Data
    setUserData(age, sex, familyHistory) {
        this.userAge = parseInt(age);
        this.userSex = sex;
        this.userFamilyHistory = familyHistory;
    }

    getUserData() {
        return {
            age: this.userAge,
            sex: this.userSex,
            familyHistory: this.userFamilyHistory
        };
    }

    // Questions
    setQuestions(questions) {
        this.questions = [...questions];
    }

    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        return this.currentQuestionIndex < this.questions.length;
    }

    isLastQuestion() {
        return this.currentQuestionIndex >= this.questions.length - 1;
    }

    getProgress() {
        return {
            current: this.currentQuestionIndex + 1,
            total: this.questions.length
        };
    }

    // Risk Score
    addRiskScore(amount) {
        this.riskScore = Math.max(0, Math.min(100, this.riskScore + amount));
        return this.riskScore;
    }

    getRiskScore() {
        return Math.round(this.riskScore);
    }

    // Category Tracking
    addCategoryRisk(category, amount) {
        if (this.riskByCategory.hasOwnProperty(category)) {
            this.riskByCategory[category] += amount;
            this.answersCount[category]++;
        }
    }

    getCategoryRisks() {
        return { ...this.riskByCategory };
    }

    getAnswerCounts() {
        return { ...this.answersCount };
    }

    // Risk Level Computation
    getRiskLevel() {
        const score = this.getRiskScore();
        if (score < 33) return 'LOW';
        if (score < 66) return 'MEDIUM';
        return 'HIGH';
    }

    // State Validation
    isReady() {
        return this.userAge > 0 && this.userSex && this.userFamilyHistory;
    }
}
