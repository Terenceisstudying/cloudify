/**
 * Shared email validation for backend routes.
 *
 * Rules:
 *   - must be a string
 *   - max 254 chars (RFC 5321 limit)
 *   - must match a pragmatic pattern: non-empty local, "@", non-empty domain,
 *     ".", and a TLD of at least 2 characters (rejects things like "a@b.c")
 *
 * Frontend has its own copy in public/js/main.js because the browser module
 * graph is separate. Keep the two patterns in sync.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
    return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);
}
