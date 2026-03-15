import byAssessment from '../api-handlers/questions/by-assessment.js';
import cancerTypes from '../api-handlers/questions/cancer-types.js';

/**
 * /api/questions
 * Consolidated entrypoint for question routes.
 */
export default async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (path.includes('cancer-types')) return cancerTypes(req, res);
    if (path.includes('by-assessment')) return byAssessment(req, res);
    
    return res.status(404).json({ success: false, error: `Question resource not found: ${path}` });
}
