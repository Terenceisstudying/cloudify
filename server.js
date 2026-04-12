import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import dotenv from 'dotenv';
import { globalLimiter, apiLimiter, authLimiter, staticAssetLimiter } from './middleware/rateLimiter.js';
import { authenticateToken } from './middleware/auth.js';
import { questionsRouter } from './routes/questions.js';
import { assessmentsRouter } from './routes/assessments.js';
import { adminRouter, normalizeTheme } from './routes/admin/index.js';
import { createPublicAuthRouter } from './routes/admin/auth.js';
import { AdminModel } from './models/adminModel.js';

import { SettingsModel } from './models/settingsModel.js';
import emailService from './services/emailService.js';
import { validateEnv } from './utils/validateEnv.js';

// Load environment variables
dotenv.config();
validateEnv();

// Require JWT_SECRET in non-test environments
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
    console.error('FATAL: JWT_SECRET environment variable is required. Set it in your .env file.');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            mediaSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        }
    }
}));
const PORT = process.env.PORT || 3000;
const adminModel = new AdminModel();
const settingsModel = new SettingsModel();

// Middleware
app.use(compression());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Static files from public/ only (not the project root).
//
// Order matters: this runs BEFORE the globalLimiter/apiLimiter chain so that
// serving static bytes short-circuits out of the middleware stack without
// being counted against the dynamic-route limits (that was the Fix #13
// reordering — counting mascot PNGs against the 100-req/min globalLimiter
// caused 429 cascades during cache-disabled dev testing).
//
// Two layers of bandwidth protection on top of the reorder:
//
// 1. Cache headers (Cache-Control: public, max-age=86400 via maxAge + etag).
//    Browsers and edge CDNs cache each asset for 1 day, so legitimate users
//    only pay the byte cost once per day per asset per browser. For a booth
//    app this is effectively "once ever" — shared device, shared cache.
//    A flooder hitting the same asset URLs repeatedly is served from the
//    edge cache and never touches our Node process or Render's bandwidth.
//    Admins who upload new assets via the admin panel will see their changes
//    within 1 day for existing visitors, or immediately on hard-reload.
//
// 2. staticAssetLimiter (500 req/min per IP). Defence-in-depth against
//    cache-busting adversaries who deliberately defeat layer 1 (e.g. with
//    ?v=${Math.random()} query strings). A full cache-disabled quiz run
//    fetches ~85 assets, so 500/min gives ~5.8× headroom over peak
//    aggressive testing. Booth users with cache enabled are nowhere near.
//    See middleware/rateLimiter.js for rationale.
app.use(staticAssetLimiter);
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Rate limiting — applied only to dynamic routes below this point
app.use(globalLimiter);
app.use('/api', apiLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/admin/forgot-password', authLimiter);
app.use('/api/admin/reset-password', authLimiter);

// Public theme (user-facing app)
app.get('/api/theme', async (req, res) => {
    try {
        const theme = await settingsModel.getTheme();
        res.set('Cache-Control', 'public, max-age=300');
        res.json(normalizeTheme(theme));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public PDPA config (user-facing app)
app.get('/api/pdpa', async (req, res) => {
    try {
        const pdpa = await settingsModel.getPdpa();
        res.set('Cache-Control', 'public, max-age=3600');
        res.json(pdpa);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public translations (user-facing app)
app.get('/api/translations', async (req, res) => {
    try {
        const translations = await settingsModel.getTranslations();
        res.set('Cache-Control', 'public, max-age=3600');
        res.json(translations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Routes
app.use('/api/questions', questionsRouter);
app.use('/api/assessments', assessmentsRouter);

// Admin auth (public — login, forgot-password, reset-password)
app.use('/api/admin', createPublicAuthRouter({ adminModel, emailService }));

// Admin panel (protected — requires JWT)
app.use('/api/admin', authenticateToken, adminRouter);

// Serve admin.html for /admin and /admin/... paths
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server (skip when imported for testing)
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, async() => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`API available at http://localhost:${PORT}/api`);

        // Wait for database connection before querying
        try {
            const { waitForConnection } = await import('./config/db.js');
            await waitForConnection();
        } catch (err) {
            console.warn('Warning: Database connection failed:', err.message);
            console.warn('Server will continue without database — some features may be unavailable');
        }

        // Verify email service
        await emailService.verifyConnection();
    });
}

export { app };