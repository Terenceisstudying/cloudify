/**
 * Rate limiting middleware module.
 * Exports tiered limiters for different endpoint categories.
 * All limiters become passthrough in test environment.
 */
import rateLimit from 'express-rate-limit';

function createLimiter(options) {
    if (process.env.NODE_ENV === 'test') {
        return (req, res, next) => next();
    }
    return rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        ...options
    });
}

// Safety net for all routes — 100 requests per minute per IP
export const globalLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later' }
});

// Moderate limit for API routes — 50 requests per minute per IP
export const apiLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 50,
    message: { message: 'Too many API requests, please try again later' }
});

// Strict limit for auth endpoints — 10 requests per 15 minutes per IP
export const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts, please try again later' }
});

// Limit for assessment submissions — 20 requests per minute per IP
// Higher than auth limit because shared booth devices submit from the same IP
export const assessmentSubmitLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: { message: 'Too many submissions, please try again later' }
});
