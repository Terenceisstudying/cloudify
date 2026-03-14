/**
 * CORS Middleware for Serverless Functions
 * 
 * Handles Cross-Origin Resource Sharing headers for API responses.
 */

const ALLOWED_ORIGINS = {
    production: [
        'https://scs-risk-assessment.vercel.app',
    ],
    development: [
        'http://localhost:3000',
        'http://localhost:54321',  // Supabase Studio
        'http://127.0.0.1:3000'
    ]
};

/**
 * Apply CORS headers to response
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export function applyCors(req, res) {
    const origin = req.headers.origin;
    const isAllowed = [
        ...ALLOWED_ORIGINS.production,
        ...ALLOWED_ORIGINS.development
    ].includes(origin);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : '');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');  // 24 hours
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
}

/**
 * CORS middleware wrapper for serverless functions
 * @param {function} handler - The serverless function handler
 * @returns {function} Wrapped handler with CORS
 */
export function withCors(handler) {
    return async function corsHandler(req, res) {
        applyCors(req, res);
        
        // If preflight request, return early
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        return handler(req, res);
    };
}

export default {
    applyCors,
    withCors,
    ALLOWED_ORIGINS
};
