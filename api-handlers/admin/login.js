import { applyCors } from '../../lib/cors.js';
import { supabase } from '../../lib/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * POST /api/admin/login
 * Admin login — returns JWT token.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Fetch admin by email
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .ilike('email', email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
