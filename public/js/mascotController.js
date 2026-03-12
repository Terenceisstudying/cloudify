/**
 * Mascot Controller
 * Handles mascot state and gender-based image switching.
 */
export class MascotController {
    constructor(elements) {
        this.elements = elements;
        this.genderIndex = 1; // Default to 1 (Male)
        this.theme = null;
        this.animationTimeout = null; // Store timeout reference

        // Preload standard mascot images to ensure they appear instantly when needed
        this.preloadImages();
    }

    /**
     * Force the browser to cache mascot images immediately.
     */
    preloadImages() {
        const states = ['Idle', 'Good', 'Shocked'];
        const indices = [1, 2];
        states.forEach(state => {
            indices.forEach(idx => {
                const img = new Image();
                img.src = `assets/mascots/${state} (${idx}).png`;
            });
        });
    }

    /**
     * Set theme data from the API.
     * @param {Object} theme 
     */
    setTheme(theme) {
        const hasAny = theme && (
            (theme.mascotMale || theme.mascotFemale || theme.mascotMaleGood || theme.mascotFemaleGood ||
             theme.mascotMaleShocked || theme.mascotFemaleShocked)
        );
        this.theme = hasAny ? theme : null;
    }

    /**
     * Sets the mascot gender based on user selection.
     * @param {string} gender 
     */
    setGender(gender) {
        this.genderIndex = (gender && gender.toLowerCase() === 'female') ? 2 : 1;
        this.updateState('Idle');
        this.show();
    }

    /**
     * Resolves the correct image URL based on current theme or local assets.
     */
    getImageUrlForState(state) {
        if (this.theme) {
            const isFemale = this.genderIndex === 2;
            let url = '';
            if (state === 'Idle') url = isFemale ? this.theme.mascotFemale : this.theme.mascotMale;
            else if (state === 'Good') url = isFemale ? this.theme.mascotFemaleGood : this.theme.mascotMaleGood;
            else if (state === 'Shocked') url = isFemale ? this.theme.mascotFemaleShocked : this.theme.mascotMaleShocked;
            
            if (url && typeof url === 'string' && url.trim()) return url.trim();
        }
        // Fallback to local asset structure
        return `assets/mascots/${state} (${this.genderIndex}).png`;
    }

    /**
     * Updates the DOM element with the new mascot image.
     */
    updateState(state) {
        if (!this.elements.img) return;
        const newSrc = this.getImageUrlForState(state);
        if (this.elements.img.getAttribute('src') !== newSrc) {
            this.elements.img.src = newSrc;
        }
    }

    /**
     * Triggers a mascot reaction (Good/Shocked) for a set duration.
     * Duration is set to 3000ms to ensure visibility during explanations.
     */
    startAnimation(state, duration = 3000) {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }

        this.updateState(state);

        this.animationTimeout = setTimeout(() => {
            this.updateState('Idle');
            this.animationTimeout = null;
        }, duration);
    }

    show() {
        this.elements.liveContainer?.classList.remove('hidden');
    }

    hide() {
        this.elements.liveContainer?.classList.add('hidden');
    }
}
