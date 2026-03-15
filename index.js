/**
 * Root entrypoint for Vercel deployment.
 * This file satisfies Vercel's build requirement for a root entrypoint that
 * explicitly imports 'express' whenever it's listed in package.json.
 * 
 * It also serves the static frontend from the /public directory to resolve
 * the "Cannot GET /" error.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route serves the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin routes serve the admin entry point
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Verification endpoint
app.get('/api/entrypoint-health', (req, res) => {
    res.status(200).json({ 
        status: "SCS API Entrypoint Active",
        timestamp: new Date().toISOString()
    });
});

export default app;
