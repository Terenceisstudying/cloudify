// DOM Element References (Single Responsibility)
export class DOMElements {
    constructor() {
        // Screens
        this.screens = {
            onboarding: document.getElementById('screen-onboarding'),
            game: document.getElementById('screen-game'),
            results: document.getElementById('screen-results')
        };

        // Onboarding elements
        this.onboarding = {
            form: document.getElementById('onboarding-form'),
            ageInput: document.getElementById('age-input'),
            ageSlider: document.getElementById('age-slider'),
            sexInputs: document.querySelectorAll('input[name="sex"]'),
            familyHistoryInputs: document.querySelectorAll('input[name="family-history"]'),
            startButton: document.getElementById('start-game-btn')
        };

        // Game elements
        this.game = {
            riskBar: document.getElementById('risk-factor-progress'),
            riskLabel: document.getElementById('risk-factor-label'),
            questionCard: document.getElementById('question-card'),
            questionText: document.getElementById('question-text'),
            cardContainer: document.getElementById('card-container'),
            feedbackCorrect: document.getElementById('feedback-correct'),
            feedbackWrong: document.getElementById('feedback-wrong'),
            feedbackExplanation: document.getElementById('feedback-explanation'),
            progressCounter: document.getElementById('progress-counter'),
            glowOverlay: document.getElementById('glow-overlay')
        };

        // Results elements
        this.results = {
            riskLevel: document.getElementById('results-risk-level'),
            summary: document.getElementById('results-summary'),
            scoreNumber: document.getElementById('score-number'),
            scoreArc: document.getElementById('score-arc'),
            scoreComparison: document.getElementById('score-comparison'),
            breakdownContainer: document.getElementById('breakdown-categories'),
            recommendationsContainer: document.getElementById('recommendations-container'),
            resultsForm: document.getElementById('results-form'),
            emailPhone: document.getElementById('email-phone'),
            playAgainBtn: document.getElementById('play-again-btn')
        };

        // Mascot elements
        this.mascot = {
            flashOverlay: document.getElementById('mascot-flash-overlay'),
            flashImg: document.getElementById('mascot-flash-img'),
            liveContainer: document.getElementById('live-mascot-container'),
            img: document.getElementById('mascot-img')
        };
    }

    /**
     * Switch between screens
     */
    switchScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen?.classList.remove('active'));
        this.screens[screenName]?.classList.add('active');
    }

    /**
     * Validate that all required elements exist
     */
    validate() {
        const missing = [];

        // Check critical elements
        if (!this.screens.onboarding) missing.push('screen-onboarding');
        if (!this.screens.game) missing.push('screen-game');
        if (!this.screens.results) missing.push('screen-results');

        if (missing.length > 0) {
            console.warn('Missing DOM elements:', missing);
        }

        return missing.length === 0;
    }
}
