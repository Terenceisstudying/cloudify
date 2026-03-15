/**
 * Root entrypoint for Vercel deployment.
 * Explicitly imports 'express' to satisfy Vercel's build requirement.
 * Proxies API requests to their respective dispatcher functions correctly.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import dispatcher functions and handlers
import adminDispatcher from './api/admin.js';
import questionsDispatcher from './api/questions.js';
import assessmentsDispatcher from './api/assessments.js';
import healthHandler from './api/health.js';
import mlDispatcher from './api/ml.js';
import pdpaHandler from './api/pdpa.js';
import themeHandler from './api/theme.js';
import translationsHandler from './api/translations.js';
import recommendationsHandler from './api/recommendations.js';
import snapshotHandler from './api/assessments-snapshot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Use express.json() to parse incoming JSON payloads
app.use(express.json());

// Proxy API requests with proper async/await support
const wrap = (handler) => async (req, res) => {
    try {
        // We MUST await the handler to ensure the response is fully generated
        // before Express proceeds.
        await handler(req, res);
    } catch (err) {
        console.error(`Error in handler for ${req.path}:`, err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

// Route specific API paths
app.all('/api/admin*', wrap(adminDispatcher));
app.all('/api/questions*', wrap(questionsDispatcher));
app.all('/api/assessments-snapshot', wrap(snapshotHandler));
app.all('/api/assessments*', wrap(assessmentsDispatcher));
app.all('/api/health', wrap(healthHandler));
app.all('/api/ml*', wrap(mlDispatcher));
app.all('/api/pdpa', wrap(pdpaHandler));
app.all('/api/theme', wrap(themeHandler));
app.all('/api/translations', wrap(translationsHandler));
app.all('/api/recommendations', wrap(recommendationsHandler));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Admin routes serve the admin entry point
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Root route serves the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all for any other requests (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
