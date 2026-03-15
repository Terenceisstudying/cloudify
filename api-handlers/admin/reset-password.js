import { applyCors } from '../../lib/cors.js';
import { supabase } from '../../lib/db.js';
import bcrypt from 'bcrypt';

/**
 * POST /api/admin/reset-password
 * Reset password using a valid token.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Verify token
        const { data: tokenRecord, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (tokenError || !tokenRecord) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update admin
        const { error: updateError } = await supabase
            .from('admins')
            .update({ 
                password: hashedPassword, 
                require_password_reset: false, 
                updated_at: new Date().toISOString() 
            })
            .ilike('email', tokenRecord.email);

        if (updateError) throw updateError;

        // Delete used token
        await supabase
            .from('password_reset_tokens')
            .delete()
            .eq('token', token);

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(400).json({ message: error.message });
    }
}
