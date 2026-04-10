/**
 * Integration test for express-rate-limit behavior.
 * Bypasses our NODE_ENV=test short-circuit by constructing a fresh rateLimit
 * instance inline, then verifies the 11th request returns 429.
 * Run: NODE_ENV=test node --test tests/rate-limiter-integration.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

describe('Rate limiter integration (express-rate-limit real behavior)', () => {
    it('blocks the 11th request within the window with 429', async () => {
        // Mirror the config of authLimiter in middleware/rateLimiter.js
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 10,
            standardHeaders: true,
            legacyHeaders: false,
            message: { message: 'Too many attempts, please try again later' }
        });

        const app = express();
        app.get('/probe', limiter, (req, res) => res.json({ ok: true }));

        // Requests 1..10 must succeed
        for (let i = 1; i <= 10; i++) {
            const res = await request(app).get('/probe');
            assert.strictEqual(res.status, 200, `request ${i} should succeed, got ${res.status}`);
        }

        // Request 11 must be blocked
        const blocked = await request(app).get('/probe');
        assert.strictEqual(blocked.status, 429, `11th request should be blocked, got ${blocked.status}`);
        assert.ok(blocked.body.message?.includes('Too many'),
            `429 body should contain limiter message, got ${JSON.stringify(blocked.body)}`);
    });

    it('sets standard rate-limit headers on successful responses', async () => {
        const limiter = rateLimit({
            windowMs: 60 * 1000,
            max: 5,
            standardHeaders: true,
            legacyHeaders: false
        });
        const app = express();
        app.get('/probe', limiter, (req, res) => res.json({ ok: true }));

        const res = await request(app).get('/probe');
        assert.strictEqual(res.status, 200);
        // express-rate-limit exposes RateLimit-* headers when standardHeaders is true
        assert.ok(res.headers['ratelimit-limit'] || res.headers['ratelimit'],
            'standard RateLimit-Limit header should be present');
    });
});
