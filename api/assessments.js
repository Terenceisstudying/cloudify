import index from '../api-handlers/assessments/index.js';
import sendResults from '../api-handlers/assessments/send-results.js';
import stats from '../api-handlers/assessments/stats.js';

/**
 * /api/assessments
 * Consolidated entrypoint for assessment routes.
 */
export default async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const segments = url.pathname.split('/');
    const resource = segments[3];

    if (!resource || resource === '') return index(req, res);
    if (resource === 'send-results') return sendResults(req, res);
    if (resource === 'stats') return stats(req, res);
    
    return res.status(404).json({ success: false, error: 'Assessment resource not found' });
}
