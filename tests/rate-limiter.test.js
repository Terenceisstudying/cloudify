/**
 * Rate limiter middleware tests.
 * Verifies that all limiters are passthrough in test environment.
 * Run: NODE_ENV=test node --test tests/rate-limiter.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    globalLimiter,
    apiLimiter,
    authLimiter,
    assessmentSubmitLimiter
} from '../middleware/rateLimiter.js';

describe('Rate limiter middleware', () => {
    const limiters = [
        { name: 'globalLimiter', fn: globalLimiter },
        { name: 'apiLimiter', fn: apiLimiter },
        { name: 'authLimiter', fn: authLimiter },
        { name: 'assessmentSubmitLimiter', fn: assessmentSubmitLimiter }
    ];

    for (const { name, fn } of limiters) {
        it(`${name} is a function`, () => {
            assert.strictEqual(typeof fn, 'function');
        });

        it(`${name} calls next() in test environment`, (_, done) => {
            const req = {};
            const res = {};
            fn(req, res, () => { done(); });
        });
    }
});
