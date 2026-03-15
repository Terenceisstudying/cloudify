import byAssessment from '../api-handlers/questions/by-assessment.js';
import cancerTypes from '../api-handlers/questions/cancer-types.js';

/**
 * /api/questions
 * Consolidated entrypoint for question routes.
 */
export default async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const segments = url.pathname.split('/').filter(Boolean);
    // Handle both /api/questions/cancer-types and direct calls
    const resource = segments[segments.length - 1];

    if (resource === 'by-assessment') return byAssessment(req, res);
    if (resource === 'cancer-types') return cancerTypes(req, res);
    
    return res.status(404).json({ success: false, error: `Question resource not found: ${resource}` });
}
