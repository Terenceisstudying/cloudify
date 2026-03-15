import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { supabase } from '../../lib/db.js';
import bcrypt from 'bcrypt';

function mapAdminRow(row) {
    if (!row) return null;
    const { password, ...adminWithoutPassword } = row;
    return {
        id: adminWithoutPassword.id,
        email: adminWithoutPassword.email,
        role: adminWithoutPassword.role,
        name: adminWithoutPassword.name,
        requirePasswordReset: adminWithoutPassword.require_password_reset,
        createdAt: adminWithoutPassword.created_at,
        updatedAt: adminWithoutPassword.updated_at
    };
}

/**
 * /api/admin/admins
 * Multi-method handler for admin user management.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Valid authentication token required' });
    }

    try {
        const { id, action } = req.query;

        // GET ?action=export — super admin only
        if (req.method === 'GET' && action === 'export') {
            if (user.role !== 'super_admin') {
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Super admin access required' });
            }
            const { data: rawAdmins, error } = await supabase
                .from('admins')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            
            const admins = rawAdmins.map(mapAdminRow);
            const date = new Date().toISOString().slice(0, 10);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="admin-users-backup-${date}.json"`);
            return res.status(200).send(JSON.stringify({ exportedAt: new Date().toISOString(), admins }, null, 2));
        }

        // GET — list all (super admin only)
        if (req.method === 'GET') {
            if (user.role !== 'super_admin') {
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Super admin access required' });
            }
            const { data: rawAdmins, error } = await supabase
                .from('admins')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            
            const admins = rawAdmins.map(mapAdminRow);
            return res.status(200).json({ success: true, data: admins });
        }

        // POST — create admin (super admin only)
        if (req.method === 'POST') {
            if (user.role !== 'super_admin') {
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Super admin access required' });
            }
            const { email, name, role } = req.body;
            if (!email || !name) {
                return res.status(400).json({ success: false, error: 'Email, and name are required' });
            }
            if (role && !['admin', 'super_admin'].includes(role)) {
                return res.status(400).json({ success: false, error: 'Invalid role. Must be "admin" or "super_admin"' });
            }
            
            const { data: existing } = await supabase.from('admins').select('id').ilike('email', email).single();
            if (existing) {
                return res.status(400).json({ success: false, error: 'Admin with this email already exists' });
            }

            const tempPassword = '123456';
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            
            const { data: admin, error } = await supabase.from('admins').insert({
                email: email.toLowerCase(),
                name,
                role: role || 'admin',
                password: hashedPassword,
                require_password_reset: true
            }).select().single();
            
            if (error) throw error;
            
            return res.status(200).json({ success: true, data: mapAdminRow(admin), tempPassword });
        }

        // PUT ?id=xxx — update admin (super admin or self)
        if (req.method === 'PUT' && id) {
            if (id !== user.id && user.role !== 'super_admin') {
                return res.status(403).json({ success: false, error: 'You can only update your own profile' });
            }
            const { name, email, role } = req.body;
            
            const { data: current, error: currentError } = await supabase.from('admins').select('*').eq('id', id).single();
            if (currentError || !current) return res.status(404).json({ success: false, error: 'Admin not found' });

            const updates = {};
            if (name !== undefined) updates.name = name;
            
            if (email !== undefined && email.toLowerCase() !== current.email.toLowerCase()) {
                const { data: existing } = await supabase.from('admins').select('id').ilike('email', email).neq('id', id).limit(1).single();
                if (existing) return res.status(400).json({ success: false, error: 'Email already in use' });
                updates.email = email.toLowerCase();
            }
            
            if (role !== undefined && user.role === 'super_admin' && role !== current.role) {
                if (!['admin', 'super_admin'].includes(role)) {
                    return res.status(400).json({ success: false, error: 'Invalid role. Must be "admin" or "super_admin"' });
                }
                if (current.role === 'super_admin') {
                    const { count, error: countErr } = await supabase.from('admins').select('*', { count: 'exact', head: true }).eq('role', 'super_admin');
                    if (!countErr && count <= 1) return res.status(400).json({ success: false, error: 'Cannot demote the last super admin' });
                }
                updates.role = role;
            }
            
            if (Object.keys(updates).length > 0) {
                updates.updated_at = new Date().toISOString();
                const { data: updatedAdmin, error: updateError } = await supabase.from('admins').update(updates).eq('id', id).select().single();
                if (updateError) throw updateError;
                return res.status(200).json({ success: true, data: mapAdminRow(updatedAdmin) });
            }
            
            return res.status(200).json({ success: true, data: mapAdminRow(current) });
        }

        // DELETE ?id=xxx — delete admin (super admin only)
        if (req.method === 'DELETE' && id) {
            if (user.role !== 'super_admin') {
                return res.status(403).json({ error: 'FORBIDDEN', message: 'Super admin access required' });
            }
            if (id === user.id) {
                return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
            }
            
            const { data: targetAdmin } = await supabase.from('admins').select('role').eq('id', id).single();
            if (!targetAdmin) return res.status(404).json({ success: false, error: 'Admin not found' });
            
            if (targetAdmin.role === 'super_admin') {
                const { count, error: countErr } = await supabase.from('admins').select('*', { count: 'exact', head: true }).eq('role', 'super_admin');
                if (!countErr && count <= 1) return res.status(400).json({ success: false, error: 'Cannot delete the last super admin' });
            }
            
            const { error: delError } = await supabase.from('admins').delete().eq('id', id);
            if (delError) throw delError;
            
            return res.status(200).json({ success: true, message: 'Admin deleted successfully' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Admins endpoint error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
