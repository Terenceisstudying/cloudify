/**
 * Translation Service — singleton that fetches, caches, and resolves UI translations.
 */

let cached = null;

export async function fetchTranslations() {
    try {
        const res = await fetch('/api/translations');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        // Safeguard: Only update cache if data is not empty
        if (data && Object.keys(data).length > 0) {
            cached = data;
        } else if (!cached) {
            // If cache is empty and we got nothing, init with empty object
            cached = {};
        }
    } catch (err) {
        console.warn('Failed to fetch translations:', err);
        if (!cached) cached = {};
    }
    return cached;
}

/**
 * Resolve a translated string.
 * Falls back: requested lang -> en -> key name.
 * Supports {placeholder} replacements.
 */
export function t(group, key, lang, replacements = {}) {
    const val = cached?.[group]?.[key]?.[lang]
        || cached?.[group]?.[key]?.en
        || key;
    
    if (typeof val !== 'string') return key;

    return Object.entries(replacements).reduce(
        (s, [k, v]) => s.replaceAll(`{${k}}`, v), val
    );
}

export function getTranslations() {
    return cached;
}

export function clearCache() {
    cached = null;
}
