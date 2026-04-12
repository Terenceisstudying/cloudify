const VALID_LANGS = ['en', 'zh', 'ms', 'ta'];
let activeLang = 'en';
const listeners = [];
const initializedContainers = new WeakSet();

export function getActiveLang() {
    return activeLang;
}

export function onLangChange(callback) {
    listeners.push(callback);
}

function setActiveLang(lang) {
    if (!VALID_LANGS.includes(lang)) return;
    if (activeLang === lang) return;
    activeLang = lang;
    listeners.forEach(cb => cb(lang));
}

export function initLangTabs(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Set initial state
    container.querySelectorAll('.lang-fields-grid').forEach(grid => {
        grid.setAttribute('data-active-lang', activeLang);
    });
    container.querySelectorAll('.lang-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === activeLang);
    });

    // Event delegation: one click listener per container element.
    // WeakSet tracks which containers already have a listener attached,
    // so re-calling initLangTabs (e.g. on modal reopen) won't add duplicates.
    if (initializedContainers.has(container)) return;
    initializedContainers.add(container);

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-tab-btn');
        if (!btn || !container.contains(btn)) return;
        const lang = btn.dataset.lang;
        if (!VALID_LANGS.includes(lang)) return;

        container.querySelectorAll('.lang-tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });
        container.querySelectorAll('.lang-fields-grid').forEach(grid => {
            grid.setAttribute('data-active-lang', lang);
        });
        setActiveLang(lang);
    });
}

export function clearLangChangeListeners() {
    listeners.length = 0;
}

/**
 * Validate that required English fields are non-empty within a container.
 * If any are empty: switches to the EN tab, highlights the fields with a
 * shake animation + red border, shows an inline error message above the
 * first empty field, focuses it, and auto-clears everything on input.
 *
 * @param {string} containerSelector - CSS selector for the lang-tabs container
 * @param {string[]} fieldIds - element IDs of the English inputs to check
 * @param {string} [message] - custom error message (default: "English text is required")
 * @returns {{ valid: boolean, emptyIds: string[] }}
 */
export function validateEnglishFields(containerSelector, fieldIds, message) {
    // Remove any previous inline error in this container
    const container = document.querySelector(containerSelector);
    if (container) {
        container.querySelectorAll('.lang-validation-msg').forEach(el => el.remove());
    }

    const emptyIds = fieldIds.filter(id => {
        const el = document.getElementById(id);
        return !el || !el.value.trim();
    });

    if (emptyIds.length === 0) return { valid: true, emptyIds: [] };

    // Switch to English tab so the user sees the empty fields
    if (container) {
        container.querySelectorAll('.lang-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === 'en');
        });
        container.querySelectorAll('.lang-fields-grid').forEach(grid => {
            grid.setAttribute('data-active-lang', 'en');
        });
    }

    const errorMsg = message || 'English text is required.';

    // Highlight each empty field and add inline error above each one
    for (const id of emptyIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const field = el.closest('.lang-field');
        if (field) {
            field.classList.add('validation-error');
            // Re-trigger animation if already applied
            field.style.animation = 'none';
            field.offsetHeight; // force reflow
            field.style.animation = '';

            // Add inline error message above this field
            const msgEl = document.createElement('div');
            msgEl.className = 'lang-validation-msg';
            msgEl.textContent = errorMsg;
            field.insertBefore(msgEl, field.firstChild);

            // Clear error state + inline message on first input
            el.addEventListener('input', function clearError() {
                field.classList.remove('validation-error');
                const msg = field.querySelector('.lang-validation-msg');
                if (msg) msg.remove();
                el.removeEventListener('input', clearError);
            });
        }
    }

    // Expand any collapsed <details> ancestor and focus the first empty field
    const firstEmpty = document.getElementById(emptyIds[0]);
    if (firstEmpty) {
        const details = firstEmpty.closest('details');
        if (details && !details.open) details.open = true;
        firstEmpty.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstEmpty.focus();
    }

    return { valid: false, emptyIds };
}
