import { MASCOT_CONFIG, ANIMATION_DURATIONS } from './constants.js';

/**
 * Mascot Animation Controller (Single Responsibility)
 * Handles all mascot-related animations and state
 */
export class MascotController {
    constructor(elements) {
        this.elements = elements;
        this.currentType = null;  // 'Male' or 'Female'
        this.animationInterval = null;
        this.currentFrame = 1;
        this.currentState = 'Idle';
    }

    /**
     * Set the mascot type and show flash effect
     */
    selectMascot(gender) {
        this.currentType = gender;
        this._showFlashEffect(gender);
        this._showLiveMascot();
        this._preloadImages(gender);
        this.startAnimation('Idle');
    }

    /**
     * Start a mascot animation state
     */
    startAnimation(state) {
        if (!this.currentType) return;

        this._clearAnimation();
        this.currentState = state;
        this.currentFrame = 1;

        const config = MASCOT_CONFIG[this.currentType.toUpperCase()];
        const maxFrames = config.frames[state.toUpperCase()] || config.frames.IDLE;
        const frameDelay = 1000 / ANIMATION_DURATIONS.MASCOT_FPS;

        this.animationInterval = setInterval(() => {
            this._updateFrame(state, maxFrames);
        }, frameDelay);
    }

    /**
     * Stop all animations
     */
    stop() {
        this._clearAnimation();
    }

    /**
     * Hide the live mascot
     */
    hide() {
        this.elements.liveContainer?.classList.add('hidden');
    }

    /**
     * Show the live mascot
     */
    show() {
        this.elements.liveContainer?.classList.remove('hidden');
    }

    // Private methods
    _showFlashEffect(gender) {
        if (!this.elements.flashImg || !this.elements.flashOverlay) return;

        const folder = MASCOT_CONFIG[gender.toUpperCase()].folder;
        this.elements.flashImg.src = `${folder}/png/Jump (1).png`;
        this.elements.flashOverlay.classList.add('active');

        setTimeout(() => {
            this.elements.flashOverlay.classList.remove('active');
        }, ANIMATION_DURATIONS.FLASH);
    }

    _showLiveMascot() {
        this.elements.liveContainer?.classList.remove('hidden');
    }

    _preloadImages(gender) {
        const folder = MASCOT_CONFIG[gender.toUpperCase()].folder;
        const maxFrames = MASCOT_CONFIG[gender.toUpperCase()].frames.IDLE;

        for (let i = 1; i <= maxFrames; i++) {
            const img = new Image();
            img.src = `${folder}/png/Idle (${i}).png`;
        }
    }

    _updateFrame(state, maxFrames) {
        if (!this.elements.img) return;

        const folder = MASCOT_CONFIG[this.currentType.toUpperCase()].folder;
        this.elements.img.src = `${folder}/png/${state} (${this.currentFrame}).png`;

        this.currentFrame++;

        if (this.currentFrame > maxFrames) {
            if (state === 'Jump') {
                // Return to idle after jump
                this.startAnimation('Idle');
            } else {
                this.currentFrame = 1; // Loop animation
            }
        }
    }

    _clearAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }
}
