/**
 * Root entrypoint for Vercel deployment.
 * This file satisfies Vercel's build requirement for a root entrypoint that
 * explicitly imports 'express' whenever it's listed in package.json.
 */
import express from 'express';

const app = express();

// This handler satisfies the "entrypoint" requirement.
// vercel.json rewrites should prioritize /public/index.html for the root path.
app.get('/api/entrypoint-health', (req, res) => {
    res.status(200).json({ 
        status: "SCS API Entrypoint Active",
        timestamp: new Date().toISOString()
    });
});

export default app;
