import { applyCors } from '../../lib/cors.js';
import { supabase } from '../../lib/db.js';
import emailService from '../../services/emailService.js';
import crypto from 'crypto';

/**
 * POST /api/admin/forgot-password
 * Request a password reset link.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        try {
            // Check if admin exists
            const { data: admin, error: adminError } = await supabase
                .from('admins')
                .select('id')
                .ilike('email', email)
                .single();

            if (adminError || !admin) {
                // Return success to avoid email enumeration
                return res.status(200).json({
                    message: 'If an account exists with this email, a password reset link has been sent.'
                });
            }

            // Create reset token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

            const { error: insertError } = await supabase
                .from('password_reset_tokens')
                .insert({
                    email: email.toLowerCase(),
                    token,
                    expires_at: expiresAt
                });

            if (insertError) throw insertError;

            // Send email
            try {
                await emailService.sendPasswordResetEmail(email, token);
                console.log(`✓ Password reset email sent to ${email}`);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }

            return res.status(200).json({
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        } catch (error) {
            console.error('Forgot password inner error:', error);
            // Always return success message for security
            return res.status(200).json({
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(200).json({
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
    }
}
