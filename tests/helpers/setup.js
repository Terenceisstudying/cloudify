import jwt from 'jsonwebtoken';
import db from '../../lib/db.js';
import { loadFixtures, createMockQuery, tables } from './mockPool.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-for-production';

export async function setup() {
    // 1. Load fixtures into mockPool tables
    loadFixtures();
    
    // 2. Sync Supabase mock with fixtures
    if (db.supabase && db.supabase._reset) {
        db.supabase._reset();
        
        // Inject mockPool tables into the Supabase mock data store
        for (const [tableName, data] of Object.entries(tables)) {
            const mockBuilder = db.supabase.from(tableName);
            if (data.length > 0) {
                if (tableName === 'settings') {
                    // Normalize settings keys for the mock API expectations
                    const normalizedSettings = data.map(s => {
                        if (s.key === 'ui_translations') return { ...s, key: 'translations' };
                        return s;
                    });
                    await mockBuilder.upsert(normalizedSettings, { onConflict: 'key' });
                } else {
                    await mockBuilder.insert(data);
                }
            }
        }
    }
}

export async function teardown() {
    // Reset mock environment for clean state
    loadFixtures();
    
    if (db.supabase && db.supabase._reset) {
        db.supabase._reset();
    }
}

export function getSuperAdminToken() {
    return jwt.sign(
        { id: '0b2e5cb5-1d56-447d-88d4-d3647d5c96bd', email: 'admin@scs.com', role: 'super_admin' },
        JWT_SECRET
    );
}

export function getAdminToken() {
    return jwt.sign(
        { id: 'test-regular-admin', email: 'user@scs.com', role: 'admin' },
        JWT_SECRET
    );
}

