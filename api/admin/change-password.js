import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';
import bcrypt from 'bcrypt';

/**
 * POST /api/admin/change-password
 * Change current admin's password (authenticated).
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Valid authentication token required' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                error: 'New password must be different from current password'
            });
        }

        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (adminError || !admin) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        const isValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isValid) {
            return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const { error: updateError } = await supabase
            .from('admins')
            .update({
                password: hashedPassword,
                require_password_reset: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
