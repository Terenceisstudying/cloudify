import db from '../lib/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

function stripPassword(admin) {
    if (!admin) return admin;
    const { password, ...rest } = admin;
    return rest;
}

function mapRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        email: row.email,
        password: row.password,
        role: row.role,
        name: row.name,
        requirePasswordReset: row.require_password_reset,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export class AdminModel {
    async getAllAdmins() {
        const { data, error } = await db.supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data || []).map(r => stripPassword(mapRow(r)));
    }

    async getAdminById(id) {
        const { data, error } = await db.supabase
            .from('admins')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return mapRow(data);
    }

    async getAdminByEmail(email) {
        const { data, error } = await db.supabase
            .from('admins')
            .select('*')
            .ilike('email', email)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return mapRow(data);
    }

    async verifyPassword(email, password) {
        const admin = await this.getAdminByEmail(email);
        if (!admin) return null;

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) return null;

        return stripPassword(admin);
    }

    async createAdmin(adminData) {
        const { email, role, name } = adminData;
        let { password } = adminData;
        let tempPassword = null;

        if (!['admin', 'super_admin'].includes(role)) {
            throw new Error('Invalid role. Must be "admin" or "super_admin"');
        }

        const existingAdmin = await this.getAdminByEmail(email);
        if (existingAdmin) {
            throw new Error('Admin with this email already exists');
        }

        if (!password) {
            tempPassword = '123456';
            password = tempPassword;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        const dbData = {
            id,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            name,
            require_password_reset: !!tempPassword
        };

        const { data, error } = await db.supabase
            .from('admins')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        const admin = stripPassword(mapRow(data));
        if (tempPassword) {
            return { ...admin, tempPassword };
        }
        return admin;
    }

    async updateAdmin(id, updates) {
        const current = await this.getAdminById(id);
        if (!current) {
            throw new Error('Admin not found');
        }

        // Prevent demoting the last super admin
        if (updates.role && updates.role !== current.role && current.role === 'super_admin') {
            const { count, error } = await db.supabase
                .from('admins')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'super_admin');
            
            if (!error && count <= 1) {
                throw new Error('Cannot demote the last super admin');
            }
        }

        const dbUpdates = {};
        if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase();
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.requirePasswordReset !== undefined) dbUpdates.require_password_reset = updates.requirePasswordReset;
        if (updates.password !== undefined) {
            dbUpdates.password = await bcrypt.hash(updates.password, 10);
        }

        if (Object.keys(dbUpdates).length === 0) {
            return stripPassword(current);
        }

        const { data, error } = await db.supabase
            .from('admins')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return stripPassword(mapRow(data));
    }

    async deleteAdmin(id) {
        const admin = await this.getAdminById(id);
        if (!admin) {
            throw new Error('Admin not found');
        }

        // Prevent deleting the last super admin
        if (admin.role === 'super_admin') {
            const { count, error } = await db.supabase
                .from('admins')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'super_admin');
            
            if (!error && count <= 1) {
                throw new Error('Cannot delete the last super admin');
            }
        }

        const { error: delError } = await db.supabase
            .from('admins')
            .delete()
            .eq('id', id);
        
        if (delError) throw delError;
        return true;
    }

    async changePassword(adminId, currentPassword, newPassword) {
        const admin = await this.getAdminById(adminId);
        if (!admin) {
            throw new Error('Admin not found');
        }

        const isValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        await this.updateAdmin(adminId, {
            password: newPassword,
            requirePasswordReset: false
        });

        return true;
    }

    async createResetToken(email) {
        const admin = await this.getAdminByEmail(email);
        if (!admin) {
            throw new Error('Admin not found');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const { error } = await db.supabase
            .from('password_reset_tokens')
            .insert({ email: email.toLowerCase(), token, expires_at: expiresAt });

        if (error) throw error;
        return token;
    }

    async verifyResetToken(token) {
        const { data, error } = await db.supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }

    async resetPassword(token, newPassword) {
        const tokenRecord = await this.verifyResetToken(token);
        if (!tokenRecord) {
            throw new Error('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await db.supabase
            .from('admins')
            .update({ password: hashedPassword, require_password_reset: false })
            .ilike('email', tokenRecord.email);

        if (updateError) throw updateError;

        await db.supabase
            .from('password_reset_tokens')
            .delete()
            .eq('token', token);

        return true;
    }
}
