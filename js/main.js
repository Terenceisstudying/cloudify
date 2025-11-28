import { DOMElements } from './domElements.js';
import { GameState } from './gameState.js';
import { MascotController } from './mascotController.js';
import { UIController } from './uiController.js';
import { RISK_WEIGHTS } from './constants.js';
import { QUESTIONS } from './questions.js';
import { getRecommendations } from './recommendations.js';

/**
 * Main Application Controller
 * Orchestrates all modules and handles application flow
 */
class RiskAssessmentApp {
    constructor() {
        this.dom = new DOMElements();
        this.state = new GameState();
        this.mascot = new MascotController(this.dom.mascot);
        this.ui = new UIController(this.dom);

        this.initialize();
    }

    initialize() {
        // Validate DOM
        if (!this.dom.validate()) {
            console.error('Critical DOM elements missing!');
            return;
        }

        // Setup event listeners
        this._setupOnboardingListeners();
        this._setupGameListeners();
        this._setupResultsListeners();

        console.log('Risk Assessment App Initialized');
    }

    // Onboarding Phase
    _setupOnboardingListeners() {
        // Age input/slider sync
        this.dom.onboarding.ageInput?.addEventListener('input', (e) => {
            if (this.dom.onboarding.ageSlider) {
                this.dom.onboarding.ageSlider.value = e.target.value;
            }
            this._checkFormValidity();
        });

        this.dom.onboarding.ageSlider?.addEventListener('input', (e) => {
            if (this.dom.onboarding.ageInput) {
                this.dom.onboarding.ageInput.value = e.target.value;
            }
            this._checkFormValidity();
        });

        // Gender selection
        this.dom.onboarding.sexInputs?.forEach(input => {
            input.addEventListener('change', (e) => {
                this.mascot.selectMascot(e.target.value);
                this._checkFormValidity();
            });
        });

        // Family history
        this.dom.onboarding.familyHistoryInputs?.forEach(input => {
            input.addEventListener('change', () => {
                this._checkFormValidity();
            });
        });

        // Form submission
        this.dom.onboarding.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this._startAssessment();
        });
    }

    _checkFormValidity() {
        const age = this.dom.onboarding.ageInput?.value;
        const sex = document.querySelector('input[name="sex"]:checked');
        const familyHistory = document.querySelector('input[name="family-history"]:checked');

        const isValid = age && sex && familyHistory;

        if (this.dom.onboarding.startButton) {
            this.dom.onboarding.startButton.disabled = !isValid;
        }
    }

    _startAssessment() {
        // Collect user data
        const age = this.dom.onboarding.ageInput?.value;
        const sex = document.querySelector('input[name="sex"]:checked')?.value;
        const familyHistory = document.querySelector('input[name="family-history"]:checked')?.value;

        // Update state
        this.state.setUserData(age, sex, familyHistory);
        this.state.setQuestions(QUESTIONS);

        // Add family history risk if applicable
        if (familyHistory === 'Yes') {
            this.state.addRiskScore(RISK_WEIGHTS.HIGH);
            this.state.addCategoryRisk('Family & Genetics', RISK_WEIGHTS.HIGH);
        }

        // Switch to game screen
        this.dom.switchScreen('game');
        this._showNextQuestion();
    }

    // Game Phase
    _setupGameListeners() {
        let startX = 0;
        let isDragging = false;

        this.dom.game.questionCard?.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isDragging = true;
            this.dom.game.questionCard.classList.add('dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !this.dom.game.questionCard) return;

            const deltaX = e.clientX - startX;
            this.dom.game.questionCard.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`;
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;

            this.dom.game.questionCard?.classList.remove('dragging');

            const deltaX = e.clientX - startX;

            if (Math.abs(deltaX) > 100) {
                const direction = deltaX > 0 ? 'right' : 'left';
                this._handleAnswer(direction);
            } else if (this.dom.game.questionCard) {
                this.dom.game.questionCard.style.transform = '';
            }
        });

        // Touch support
        this.dom.game.questionCard?.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        this.dom.game.questionCard?.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaX = e.touches[0].clientX - startX;
            this.dom.game.questionCard.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`;
        });

        this.dom.game.questionCard?.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const deltaX = e.changedTouches[0].clientX - startX;

            if (Math.abs(deltaX) > 100) {
                const direction = deltaX > 0 ? 'right' : 'left';
                this._handleAnswer(direction);
            } else if (this.dom.game.questionCard) {
                this.dom.game.questionCard.style.transform = '';
            }
        });
    }

    _showNextQuestion() {
        const question = this.state.getCurrentQuestion();
        if (!question) {
            this._showResults();
            return;
        }

        this.ui.showQuestion(question.question);
        const progress = this.state.getProgress();
        this.ui.updateProgress(progress.current, progress.total);
        this.ui.hideExplanation();
    }

    _handleAnswer(direction) {
        const question = this.state.getCurrentQuestion();
        if (!question) return;

        const isRisk = (direction === 'left' && question.correctAnswer === 'No') ||
            (direction === 'right' && question.correctAnswer === 'Yes');

        // Update UI feedback
        this.ui.showFeedback(direction === 'left');
        this.ui.showExplanation(question.explanation);

        // Update scores
        if (isRisk) {
            const riskIncrease = RISK_WEIGHTS[question.risk] || 0;
            this.state.addRiskScore(riskIncrease);
            this.state.addCategoryRisk(question.category, riskIncrease);
            this.ui.updateGlow(true);
        }

        // Update risk bar
        this.ui.updateRiskBar(this.state.getRiskScore());

        // Mascot jump
        this.mascot.startAnimation('Jump');

        // Animate and move to next
        this.ui.animateCardSwipe(direction, () => {
            if (this.state.nextQuestion()) {
                this._showNextQuestion();
            } else {
                setTimeout(() => this._showResults(), 500);
            }
        });
    }

    // Results Phase
    _setupResultsListeners() {
        this.dom.results.playAgainBtn?.addEventListener('click', () => {
            this._resetApp();
        });

        this.dom.results.resultsForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you! Results would be sent to: ' + this.dom.results.emailPhone?.value);
        });
    }

    _showResults() {
        this.dom.switchScreen('results');

        // Display results
        this.ui.showResults(this.state);

        // Show risk breakdown
        const categoryRisks = this.state.getCategoryRisks();
        const answerCounts = this.state.getAnswerCounts();
        this.ui.renderRiskBreakdown(categoryRisks, answerCounts);

        // Generate and show recommendations
        const recommendations = getRecommendations(this.state);
        this.ui.renderRecommendations(recommendations);
    }

    _resetApp() {
        this.state.reset();
        this.mascot.hide();
        this.dom.switchScreen('onboarding');
        this.dom.onboarding.form?.reset();
        this._checkFormValidity();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RiskAssessmentApp();
});
