import { DOMElements } from './domElements.js';
import { GameState } from './gameState.js';
import { MascotController } from './mascotController.js';
import { UIController } from './uiController.js';
import { RISK_WEIGHTS } from './constants.js';
// import { QUESTIONS } from './questions.js';
import { getRecommendations } from './recommendations.js';
import { ApiService } from './apiService.js';
import { loadAssessments, getAssessmentById } from './assessmentConfig.js';
import { QuestionLoader } from './questionLoader.js';

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
        this.answers = []; // Track answers for API submission
        this.useBackend = true; // Toggle to use API or fallback to local
        this.selectedAssessment = null;
        this.assessments = [];

        this.initialize();
    }

    async initialize() {
        // Validate DOM
        if (!this.dom.validate()) {
            console.error('Critical DOM elements missing!');
            return;
        }

        // Show loading state while loading assessments
        this._showLandingLoadingState();

        // Load assessments from CSV
        try {
            this.assessments = await loadAssessments();
            console.log(`Loaded ${this.assessments.length} cancer assessment types`);
            
            // Render dynamic assessment cards
            this._renderAssessmentCards();
        } catch (error) {
            console.error('Error loading assessments:', error);
            this._showLandingError();
            return;
        }

        // Setup event listeners
        this._setupLandingListeners();
        this._setupOnboardingListeners();
        this._setupGameListeners();
        this._setupResultsListeners();

        console.log('Risk Assessment App Initialized');
    }

    _showLandingLoadingState() {
        const container = document.querySelector('.assessment-cards');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Loading assessments...</p>';
    }

    _showLandingError() {
        const container = document.querySelector('.assessment-cards');
        if (!container) return;
        
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: #d32f2f; margin-bottom: 1rem;">Failed to load cancer assessments.</p>
                <button onclick="location.reload()" class="button">Reload Page</button>
            </div>
        `;
    }

    /**
     * Dynamically render assessment cards from CSV data
     */
    _renderAssessmentCards() {
        const container = document.querySelector('.assessment-cards');
        if (!container) return;

        container.innerHTML = '';

        if (this.assessments.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No assessments available.</p>';
            return;
        }

        this.assessments.forEach(assessment => {
            const card = document.createElement('div');
            card.className = 'assessment-card';
            card.dataset.assessment = assessment.id;
            
            card.innerHTML = `
                <div class="card-icon">${assessment.icon}</div>
                <h3>${assessment.name}</h3>
                <p>${assessment.description}</p>
                <button class="card-btn" data-assessment="${assessment.id}">Start Assessment</button>
            `;
            
            container.appendChild(card);
        });

        // Re-cache DOM elements after rendering
        this.dom.landing.assessmentCards = document.querySelectorAll('.assessment-card');
        this.dom.landing.cardButtons = document.querySelectorAll('.card-btn');
    }

    // Landing Phase
    _setupLandingListeners() {
        // Use event delegation for dynamically created cards
        const container = document.querySelector('.assessment-cards');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const button = e.target.closest('.card-btn');
            const card = e.target.closest('.assessment-card');
            
            if (button) {
                const assessmentType = button.dataset.assessment;
                this._selectAssessment(assessmentType);
            } else if (card) {
                const assessmentType = card.dataset.assessment;
                this._selectAssessment(assessmentType);
            }
        });
    }

    async _selectAssessment(assessmentType) {
        this.selectedAssessment = assessmentType;
        this._updateOnboardingForAssessment(assessmentType);
        this.dom.switchScreen('onboarding');
    }

    async _updateOnboardingForAssessment(assessmentType) {
        const assessment = await getAssessmentById(assessmentType);
        if (!assessment) {
            console.error('Assessment not found:', assessmentType);
            return;
        }

        if (this.dom.onboarding.assessmentTitle) {
            this.dom.onboarding.assessmentTitle.textContent = assessment.title;
        }
        if (this.dom.onboarding.assessmentSubtitle) {
            this.dom.onboarding.assessmentSubtitle.textContent = assessment.subtitle;
        }
        if (this.dom.onboarding.familyHistoryLabel) {
            this.dom.onboarding.familyHistoryLabel.innerHTML = `4. ${assessment.familyLabel} <span class="required">*</span>`;
        }
    }

    // Onboarding Phase
    _setupOnboardingListeners() {
        // Back to landing button
        this.dom.onboarding.backButton?.addEventListener('click', () => {
            this.dom.switchScreen('landing');
        });

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
        this.dom.onboarding.genderInputs?.forEach(input => {
            input.addEventListener('change', (e) => {
                this.mascot.selectMascot(e.target.value);
                this._checkFormValidity();
            });
        });

        // Ethnicity selection
        this.dom.onboarding.ethnicityInputs?.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.value === 'Others') {
                    this.dom.onboarding.ethnicityOthersContainer?.classList.remove('hidden');
                } else {
                    this.dom.onboarding.ethnicityOthersContainer?.classList.add('hidden');
                }
                this._checkFormValidity();
            });
        });

        this.dom.onboarding.ethnicityOthersInput?.addEventListener('input', () => {
            this._checkFormValidity();
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
        const gender = document.querySelector('input[name="gender"]:checked');
        const familyHistory = document.querySelector('input[name="family-history"]:checked');

        let ethnicityValid = false;
        const selectedEthnicity = document.querySelector('input[name="ethnicity"]:checked');
        if (selectedEthnicity) {
            if (selectedEthnicity.value === 'Others') {
                ethnicityValid = this.dom.onboarding.ethnicityOthersInput?.value.trim() !== '';
            } else {
                ethnicityValid = true;
            }
        }

        const isValid = age && gender && familyHistory && ethnicityValid;

        if (this.dom.onboarding.startButton) {
            this.dom.onboarding.startButton.disabled = !isValid;
            this.dom.onboarding.startButton.setAttribute('aria-disabled', !isValid);
        }
    }

    async _startAssessment() {
        // Collect user data
        const age = parseInt(this.dom.onboarding.ageInput?.value);
        const gender = document.querySelector('input[name="gender"]:checked')?.value;
        const familyHistory = document.querySelector('input[name="family-history"]:checked')?.value;

        const eth = document.querySelector('input[name="ethnicity"]:checked')?.value;
        const ethnicity = (eth === 'Others') ? this.dom.onboarding.ethnicityOthersInput?.value.trim() : eth;

        // Update state with assessment type
        this.state.setUserData(age, gender, familyHistory, ethnicity, this.selectedAssessment);
        this.answers = []; // Reset answers array

        // Show loading state
        this._showLoadingState();

        // Load questions from CSV for selected assessment type
        // Pass user age to filter age-specific questions
        let questions = [];
        try {
            questions = await QuestionLoader.loadQuestions(this.selectedAssessment, age);
            
            if (questions.length === 0) {
                throw new Error(`No questions found for ${this.selectedAssessment}`);
            }
            
            console.log(`Loaded ${questions.length} questions for ${this.selectedAssessment} assessment (age: ${age})`);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert(`Failed to load questions for ${this.selectedAssessment}. Please try again.`);
            this.dom.switchScreen('onboarding');
            return;
        }

        this.state.setQuestions(questions);

        // Add family history risk if applicable
        if (familyHistory === 'Yes') {
            this.state.addRiskScore(RISK_WEIGHTS.HIGH);
            this.state.addCategoryRisk('Family & Genetics', RISK_WEIGHTS.HIGH);
        }

        // Switch to game screen
        this.dom.switchScreen('game');
        this._showNextQuestion();
    }

    _showLoadingState() {
        // Optional: show a loading indicator
        console.log('Loading questions...');
    }

    // _getQuestionsForAssessment(assessmentType) {
    //     // For now, return colorectal questions for all types
    //     // In production, you'd have different question sets for each cancer type
    //     return QUESTIONS;
    // }

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

        this.ui.showQuestion(question.prompt || question.question);
        const progress = this.state.getProgress();
        this.ui.updateProgress(progress.current, progress.total);
        this.ui.hideExplanation();
    }

    _handleAnswer(direction) {
        const question = this.state.getCurrentQuestion();
        if (!question) return;

        const isRisk = (direction === 'left' && question.correctAnswer === 'No') ||
            (direction === 'right' && question.correctAnswer === 'Yes');

        // Track answer for API submission with full details
        this.answers.push({
            questionId: question.id,
            questionText: question.prompt,
            userAnswer: (direction === 'left') ? 'No' : 'Yes', // left = No (correct/safe), right = Yes (risk)
            correctAnswer: question.correctAnswer,
            isCorrect: (direction === 'left' && question.correctAnswer === 'No') ||
                      (direction === 'right' && question.correctAnswer === 'Yes'),
            isRisk: isRisk,
            risk: question.risk,
            category: question.category
        });

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

            const value = this.dom.results.emailPhone?.value.trim();
            const messageEl = this.dom.results.formMessage;
            if (!messageEl) return;

            if (value) {
                messageEl.textContent = `Thank you! Your results would be sent to: ${value}`;
                messageEl.classList.remove('error');
                messageEl.classList.add('success');
            } else {
                messageEl.textContent = 'You did not enter any contact details. You can still review your results on this page.';
                messageEl.classList.remove('success');
                messageEl.classList.add('error');
            }
        });
    }

    async _showResults() {
        this.dom.switchScreen('results');

        // Display results
        this.ui.showResults(this.state);

        // Show risk breakdown
        const categoryRisks = this.state.getCategoryRisks();
        const answerCounts = this.state.getAnswerCounts();
        this.ui.renderRiskBreakdown(categoryRisks, answerCounts);

        // Submit assessment to backend (if enabled)
        if (this.useBackend) {
            try {
                const userData = this.state.getUserData();
                await ApiService.submitAssessment(userData, this.answers);
                console.log('Assessment submitted to backend');
            } catch (error) {
                console.warn('Failed to submit assessment to backend:', error);
                // Continue anyway - results still shown
            }
        }

        // Generate and show recommendations
        const recommendations = getRecommendations(this.state);
        this.ui.renderRecommendations(recommendations);
    }

    _resetApp() {
        this.state.reset();
        this.mascot.hide();
        this.selectedAssessment = null; // Reset to default
        this.dom.switchScreen('landing');
        this.dom.onboarding.form?.reset();
        this.dom.onboarding.ethnicityOthersContainer?.classList.add('hidden');
        if (this.dom.onboarding.ageSlider) this.dom.onboarding.ageSlider.value = 18;
        // Don't call _checkFormValidity() on landing screen
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RiskAssessmentApp();
});
