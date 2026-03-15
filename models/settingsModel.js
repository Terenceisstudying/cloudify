import db from '../lib/db.js';

export class SettingsModel {
    async get(key) {
        try {
            const { data, error } = await db.supabase
                .from('settings')
                .select('value')
                .eq('key', key)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data?.value || null;
        } catch (error) {
            console.error(`Error getting setting ${key}:`, error);
            throw error;
        }
    }

    async set(key, value) {
        try {
            const { error } = await db.supabase
                .from('settings')
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`Error setting setting ${key}:`, error);
            throw error;
        }
    }
}
