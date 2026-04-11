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

// Loose limit for static asset requests — 500 requests per minute per IP.
// The real bandwidth protection comes from the Cache-Control headers set by
// express.static below (browsers and edge CDNs cache assets for 1 day), which
// reduce origin bytes by 90%+ for legitimate users. This limiter exists as a
// ceiling against cache-busting attackers (e.g. ?v=${Math.random()} query
// strings) who deliberately defeat the cache. Headroom for legitimate use:
// a full cache-disabled quiz run fetches ~85 assets (~45 init + ~30 mascot
// state changes during a 15-question game + overhead), so 500/min gives
// ~5.8× headroom over peak aggressive testing. Booth users with cache
// enabled fetch each asset once and sit near zero.
export const staticAssetLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 500,
    message: { message: 'Too many asset requests, please try again later' }
});
