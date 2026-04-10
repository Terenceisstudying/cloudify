/**
 * Accessibility helper for modal dialogs.
 *
 * Side-effect-only. Callers still toggle visibility the way they already do
 * (class swap, CSS display change, etc.). After showing a modal, call
 * openModalA11y(modalEl, options). Before hiding it, call closeModalA11y(modalEl).
 *
 * What this helper does:
 *   1. Stores the trigger element so focus can be returned to it on close.
 *   2. Marks every ancestor-sibling of the modal as `inert` so the rest of the
 *      page cannot be clicked, focused, or read by screen readers while the
 *      modal is open. Pre-existing `inert` state on those siblings is preserved
 *      (we only revert siblings that WE inerted).
 *   3. Focuses the modal root (needs `tabindex="-1"`), then on the next frame
 *      focuses the `autoFocus` selector target if provided, else the first
 *      non-disabled focusable descendant.
 *   4. Installs a Tab / Shift+Tab keydown handler on the modal root that keeps
 *      focus wrapped inside the modal.
 *   5. A single document-level Escape listener (installed once at module load)
 *      calls `onEscape` if the currently open modal is `dismissible`.
 *
 * Assumptions baked into this helper:
 *   - Modals may nest (e.g. the "Add Existing Question" dialog opens on top of
 *     the Cancer Type editor). A module-level stack tracks the open modals;
 *     the top of the stack is the active one. When a nested modal closes,
 *     the previous modal's Tab trap and background inert are resumed.
 *   - Modal roots have `tabindex="-1"` so they can receive focus before the
 *     `autoFocus` target is resolved.
 */

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'summary',
    'audio[controls]',
    'video[controls]',
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

// Stack of open-modal states. The top of the stack is the currently active
// modal (the one with focus trap, inert background, and Escape handling).
// Nested modals push onto the stack; closing pops.
const stack = [];
function top() { return stack.length > 0 ? stack[stack.length - 1] : null; }

function getFocusableElements(container) {
    const candidates = container.querySelectorAll(FOCUSABLE_SELECTOR);
    const result = [];
    for (const el of candidates) {
        if (el.offsetParent === null) continue; // hidden or display:none
        if (el.closest('fieldset:disabled')) continue;
        result.push(el);
    }
    return result;
}

/**
 * Mark every ancestor-sibling of `modalEl` as `inert`. Returns two collections:
 *   - prevInert: the siblings WE inerted (revert on close)
 *   - prevAlreadyInert: siblings that were already inert when we opened
 *     (do NOT revert on close — they belong to someone else)
 */
function inertBackground(modalEl) {
    const prevInert = [];
    const prevAlreadyInert = new Set();
    let node = modalEl;
    while (node && node.parentElement && node !== document.body) {
        for (const sibling of node.parentElement.children) {
            if (sibling === node) continue;
            if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
            if (sibling.inert) {
                prevAlreadyInert.add(sibling);
            } else {
                sibling.inert = true;
                prevInert.push(sibling);
            }
        }
        node = node.parentElement;
    }
    return { prevInert, prevAlreadyInert };
}

function restoreBackground(prevInert) {
    for (const el of prevInert) {
        el.inert = false;
    }
}

function buildKeydownHandler(modalEl) {
    return function handleKeydown(event) {
        if (event.key !== 'Tab') return;
        const focusables = getFocusableElements(modalEl);
        if (focusables.length === 0) {
            event.preventDefault();
            modalEl.focus();
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey) {
            if (active === first || active === modalEl) {
                event.preventDefault();
                last.focus();
            }
        } else {
            if (active === last) {
                event.preventDefault();
                first.focus();
            }
        }
    };
}

/**
 * Open-time a11y wiring. Call AFTER the modal has been made visible.
 *
 * @param {HTMLElement} modalEl
 * @param {Object} [opts]
 * @param {HTMLElement|null} [opts.triggerEl] - Element to return focus to on close.
 *     Defaults to document.activeElement at the time of this call.
 * @param {boolean} [opts.dismissible=true] - Whether Escape should close the modal.
 * @param {Function} [opts.onEscape] - Called when Escape is pressed (if dismissible).
 * @param {string|HTMLElement|null} [opts.autoFocus] - Selector or element to focus
 *     initially. Defaults to the first focusable descendant.
 */
export function openModalA11y(modalEl, opts = {}) {
    if (!modalEl) return;

    // Idempotent: if this exact modal is already the active one, no-op.
    if (top() && top().modalEl === modalEl) return;

    // If another modal is currently active, suspend its Tab trap and background
    // inert (but keep its state on the stack). The new modal takes over until
    // it closes, at which point the previous modal is resumed.
    if (top()) {
        const prev = top();
        modalEl !== prev.modalEl && prev.modalEl.removeEventListener('keydown', prev.keydownHandler);
        restoreBackground(prev.prevInert);
    }

    const triggerEl = opts.triggerEl !== undefined
        ? opts.triggerEl
        : document.activeElement;
    const dismissible = opts.dismissible !== false;
    const onEscape = opts.onEscape || null;
    const autoFocus = opts.autoFocus || null;

    const { prevInert, prevAlreadyInert } = inertBackground(modalEl);
    const keydownHandler = buildKeydownHandler(modalEl);
    modalEl.addEventListener('keydown', keydownHandler);

    stack.push({
        modalEl,
        triggerEl,
        prevInert,
        prevAlreadyInert,
        dismissible,
        onEscape,
        keydownHandler,
        autoFocus
    });

    // Focus the modal root first (requires tabindex="-1" on the modal element),
    // then on the next frame move focus to the autoFocus target or first
    // focusable descendant. The two-step dance helps screen readers announce
    // the dialog before focus enters it.
    try { modalEl.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
    requestAnimationFrame(() => {
        // Guard: the modal may have been closed before the frame fires.
        if (!top() || top().modalEl !== modalEl) return;

        let target = null;
        if (autoFocus) {
            target = typeof autoFocus === 'string'
                ? modalEl.querySelector(autoFocus)
                : autoFocus;
        }
        if (!target) {
            const focusables = getFocusableElements(modalEl);
            target = focusables[0] || null;
        }
        if (target && typeof target.focus === 'function') {
            try { target.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
        }
    });
}

/**
 * Close-time a11y wiring. Call BEFORE the modal is hidden.
 * Idempotent: calling twice or on a modal that isn't on top of the stack is a no-op.
 * If there is a modal below this one on the stack, resume its focus trap and
 * background inert.
 */
export function closeModalA11y(modalEl) {
    if (!top() || top().modalEl !== modalEl) return;

    const frame = stack.pop();
    modalEl.removeEventListener('keydown', frame.keydownHandler);
    restoreBackground(frame.prevInert);

    // If a modal is still on the stack below this one, resume it: re-install
    // its Tab trap and re-inert its background so the previous modal is
    // once again the active dialog.
    const resumed = top();
    if (resumed) {
        resumed.modalEl.addEventListener('keydown', resumed.keydownHandler);
        // Re-inert the background of the resumed modal. Capture the new
        // inert state in place of the old (the DOM tree may have changed
        // since the resumed modal was first opened).
        const fresh = inertBackground(resumed.modalEl);
        resumed.prevInert = fresh.prevInert;
        resumed.prevAlreadyInert = fresh.prevAlreadyInert;
    }

    // Return focus to the closed modal's trigger.
    const { triggerEl } = frame;
    if (triggerEl && triggerEl.isConnected && typeof triggerEl.focus === 'function') {
        try { triggerEl.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
    } else {
        // Graceful fallback when the trigger was removed from the DOM
        // (e.g. a list row was re-rendered after a save).
        try { document.body.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
    }
}

// Single document-level Escape listener. Installed once at module load so we
// do not accumulate listeners on repeated open/close cycles.
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const active = top();
    if (!active || !active.dismissible) return;
    if (typeof active.onEscape === 'function') {
        event.preventDefault();
        active.onEscape();
    }
});
