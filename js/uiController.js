import { RISK_LEVELS } from './constants.js';

/**
 * UI Update Controller (Single Responsibility)
 * Handles all UI updates and visual feedback
 */
export class UIController {
    constructor(elements) {
        this.elements = elements;
    }

    /**
     * Update risk bar visual
     */
    updateRiskBar(score) {
        const level = this._getRiskLevelFromScore(score);

        if (this.elements.game.riskBar) {
            this.elements.game.riskBar.style.width = `${score}%`;
            this.elements.game.riskBar.style.backgroundColor = level.color;
        }

        if (this.elements.game.riskLabel) {
            this.elements.game.riskLabel.textContent = level.label;
            this.elements.game.riskLabel.style.color = level.color;
        }
    }

    /**
     * Update progress counter
     */
    updateProgress(current, total) {
        if (this.elements.game.progressCounter) {
            this.elements.game.progressCounter.textContent = `${current} / ${total}`;
        }
    }

    /**
     * Display current question
     */
    showQuestion(questionText) {
        if (this.elements.game.questionText) {
            this.elements.game.questionText.textContent = questionText;
        }
    }

    /**
     * Show feedback overlay (correct/wrong)
     */
    showFeedback(isCorrect) {
        const overlay = isCorrect
            ? this.elements.game.feedbackCorrect
            : this.elements.game.feedbackWrong;

        if (overlay) {
            overlay.style.opacity = '1';
            setTimeout(() => {
                overlay.style.opacity = '0';
            }, 500);
        }
    }

    /**
     * Show explanation text
     */
    showExplanation(text) {
        if (!this.elements.game.feedbackExplanation) return;

        const p = this.elements.game.feedbackExplanation.querySelector('p');
        if (p) {
            p.textContent = text;
            this.elements.game.feedbackExplanation.style.display = 'block';
        }
    }

    /**
     * Hide explanation
     */
    hideExplanation() {
        if (this.elements.game.feedbackExplanation) {
            this.elements.game.feedbackExplanation.style.display = 'none';
        }
    }

    /**
     * Animate card swipe
     */
    animateCardSwipe(direction, onComplete) {
        const card = this.elements.game.questionCard;
        if (!card) return;

        const className = direction === 'left' ? 'swipe-left' : 'swipe-right';
        card.classList.add(className);

        setTimeout(() => {
            card.classList.remove(className);
            card.style.transform = '';
            if (onComplete) onComplete();
        }, 500);
    }

    /**
     * Update glow overlay
     */
    updateGlow(isRisk) {
        if (!this.elements.game.glowOverlay) return;

        if (isRisk) {
            this.elements.game.glowOverlay.classList.add('pulse-red');
        } else {
            this.elements.game.glowOverlay.classList.remove('pulse-red');
        }
    }

    /**
     * Display results
     */
    showResults(gameState) {
        const riskLevel = gameState.getRiskLevel();
        const score = gameState.getRiskScore();

        // Update risk level heading
        if (this.elements.results.riskLevel) {
            this.elements.results.riskLevel.textContent = `${riskLevel} RISK`;
            this.elements.results.riskLevel.className = `risk-${riskLevel.toLowerCase()}`;
        }

        // Update score visualization
        this._updateScoreGauge(score);

        // Update summary
        this._updateSummary(gameState);
    }

    /**
     * Render risk breakdown by category
     */
    renderRiskBreakdown(categoryRisks, answerCounts) {
        if (!this.elements.results.breakdownContainer) return;

        const categories = Object.keys(categoryRisks);
        const html = categories.map(category => {
            const risk = categoryRisks[category];
            const count = answerCounts[category];
            const badge = this._getCategoryBadge(risk, count);

            return `
                <div class="risk-category">
                    <div class="category-header">
                        <span class="category-name">${category}</span>
                        <span class="badge ${badge.class}">${badge.text}</span>
                    </div>
                    <p class="category-count">${count} factor(s) identified</p>
                </div>
            `;
        }).join('');

        this.elements.results.breakdownContainer.innerHTML = html;
    }

    /**
     * Render recommendations
     */
    renderRecommendations(recommendations) {
        if (!this.elements.results.recommendationsContainer) return;

        const html = recommendations.map((rec, index) => `
            <div class="accordion-item">
                <button class="accordion-header" data-index="${index}">
                    <span>${rec.title}</span>
                    <span class="accordion-icon">+</span>
                </button>
                <div class="accordion-content">
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');

        this.elements.results.recommendationsContainer.innerHTML = html;
        this._attachAccordionListeners();
    }

    // Private methods
    _getRiskLevelFromScore(score) {
        if (score < RISK_LEVELS.MEDIUM.threshold) return RISK_LEVELS.LOW;
        if (score < RISK_LEVELS.HIGH.threshold) return RISK_LEVELS.MEDIUM;
        return RISK_LEVELS.HIGH;
    }

    _updateScoreGauge(score) {
        if (this.elements.results.scoreNumber) {
            this.elements.results.scoreNumber.textContent = score;
        }

        if (this.elements.results.scoreArc) {
            const circumference = 188.5;
            const offset = circumference - (score / 100) * circumference;
            this.elements.results.scoreArc.style.strokeDashoffset = offset;

            const level = this._getRiskLevelFromScore(score);
            this.elements.results.scoreArc.style.stroke = level.color;
        }
    }

    _updateSummary(gameState) {
        // This can be enhanced with more detailed summary logic
        const riskLevel = gameState.getRiskLevel();
        const messages = {
            LOW: 'Great job! Your lifestyle choices show low risk for colorectal cancer.',
            MEDIUM: 'Your results show some areas that could be improved to reduce your risk.',
            HIGH: 'Your results indicate several risk factors. Consider making changes and consulting a doctor.'
        };

        if (this.elements.results.summary) {
            this.elements.results.summary.textContent = messages[riskLevel];
        }
    }

    _getCategoryBadge(risk, count) {
        if (count === 0) return { class: 'badge-low', text: 'No Issues' };
        if (risk < 20) return { class: 'badge-low', text: 'Low Risk' };
        if (risk < 40) return { class: 'badge-medium', text: 'Some Risk' };
        return { class: 'badge-high', text: 'High Risk' };
    }

    _attachAccordionListeners() {
        const headers = document.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('active');
                const content = header.nextElementSibling;
                content?.classList.toggle('active');

                const icon = header.querySelector('.accordion-icon');
                if (icon) {
                    icon.textContent = header.classList.contains('active') ? '−' : '+';
                }
            });
        });
    }
}
