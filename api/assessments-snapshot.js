import { applyCors } from '../lib/cors.js';
import { CancerTypeModel } from '../models/cancerTypeModel.js';

const model = new CancerTypeModel();

/**
 * GET /api/assessments-snapshot
 * Dynamic replacement for the assessments-snapshot.json file.
 * Returns only visible cancer types for the frontend landing page.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const allData = await model.getAllCancerTypesLocalized('en');
        const data = allData.filter(ct => ct.visible !== false);
        
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Assessments snapshot endpoint error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
