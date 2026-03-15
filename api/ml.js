import predict from '../api-handlers/ml/predict.js';

/**
 * /api/ml
 * Consolidated entrypoint for ML routes.
 */
export default async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const segments = url.pathname.split('/');
    const resource = segments[3];

    if (resource === 'predict') return predict(req, res);
    
    return res.status(404).json({ success: false, error: 'ML resource not found' });
}
