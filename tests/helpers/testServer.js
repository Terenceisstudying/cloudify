import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.join(__dirname, '../../api');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files for frontend tests
app.use(express.static(path.join(__dirname, '../../public')));

// Fallback to serving admin.html
app.get('/admin*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../../public/admin.html'));
});

// A helper to wrap Vercel serverless functions
const wrapVercelFunction = (handler) => async (req, res, next) => {
    try {
        await handler(req, res);
    } catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            next(err);
        }
    }
};

// Map all /api routes dynamically to simulate Vercel
async function loadRoutes(dir, baseRoute) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await loadRoutes(fullPath, `${baseRoute}/${file}`);
        } else if (file.endsWith('.js')) {
            const isIndex = file === 'index.js';
            const routeName = isIndex ? '' : `/${file.replace('.js', '')}`;
            const routePath = `${baseRoute}${routeName}`;
            
            try {
                // Dynamic import the handler
                const module = await import('file://' + fullPath);
                const handler = module.default;
                if (handler) {
                    // 1. Mount the exact route
                    app.all(routePath, wrapVercelFunction(handler));
                    
                    // 2. Mount a parameterized route to handle /api/admin/admins/:id
                    // and other patterns used in the existing test suite.
                    if (!isIndex) {
                        // Capture up to 2 sub-segments (e.g. /:id/assignments or /:id/visibility)
                        app.all(`${routePath}/:p1/:p2?`, async (req, res, next) => {
                            const { p1, p2 } = req.params;
                            
                            // Transform path params to query params to match the serverless function expectations
                            if (p1 === 'export') {
                                req.query.action = 'export';
                            } else if (p2 === 'assignments') {
                                req.query.id = p1;
                                req.query.sub = 'assignments';
                            } else if (p2 === 'visibility') {
                                req.query.id = p1;
                                req.query.action = 'visibility';
                            } else if (p1 && !p2) {
                                // Default case: /api/resource/:id
                                if (!req.query.id) req.query.id = p1;
                            }
                            
                            await wrapVercelFunction(handler)(req, res, next);
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load route', fullPath, err);
            }
        }
    }
}

// Ensure routes are loaded before tests run (we await this synchronously using top-level await)
await loadRoutes(apiDir, '/api');

// Mock public assessments snapshot since it relies on static files
app.get('/api/assessments-snapshot', async (req, res) => {
    try {
        const snapshotPath = path.join(__dirname, '../../data', 'assessments-snapshot.json');
        if (!fs.existsSync(snapshotPath)) {
             return res.status(404).json({ success: false, error: 'Snapshot not found' });
        }
        const raw = await fs.promises.readFile(snapshotPath, 'utf8');
        res.json(JSON.parse(raw));
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export { app };
