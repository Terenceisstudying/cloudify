import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';

/**
 * GET  /api/admin/me           — Get current admin profile
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    const authHeader = req.headers.authorization;
    const user = verifyToken(req);
    if (!user) {
        const status = (authHeader && authHeader.startsWith('Bearer ')) ? 403 : 401;
        return res.status(status).json({ error: 'UNAUTHORIZED', message: 'Valid authentication token required' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !admin) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        const { password, ...adminWithoutPassword } = admin;
        return res.status(200).json({ success: true, data: adminWithoutPassword });
    } catch (error) {
        console.error('Me endpoint error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
