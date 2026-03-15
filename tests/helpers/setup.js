import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';
import db from '../../lib/db.js';
import { loadFixtures, createMockQuery, tables } from './mockPool.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-for-production';

function createMockClient(mockQuery) {
    return {
        query: mockQuery,
        release: () => {}
    };
}

export async function setup() {
    // 1. Load fixtures into mockPool tables (for old pg path)
    loadFixtures();
    
    // 2. Mock the old pool.query and pool.connect
    const mockQuery = createMockQuery();
    pool.query = mockQuery;
    pool.connect = async () => createMockClient(mockQuery);

    // 3. Sync Supabase mock with fixtures
    if (db.supabase && db.supabase._reset) {
        db.supabase._reset();
        
        // Inject mockPool tables into the Supabase mock data store
        for (const [tableName, data] of Object.entries(tables)) {
            const mockBuilder = db.supabase.from(tableName);
            if (data.length > 0) {
                if (tableName === 'settings') {
                    // Use upsert for settings to ensure we don't duplicate keys
                    await mockBuilder.upsert(data, { onConflict: 'key' });
                } else {
                    await mockBuilder.insert(data);
                }
            }
        }
    }
}

export async function teardown() {
    // Reset both mock environments for clean state
    loadFixtures();
    const mockQuery = createMockQuery();
    pool.query = mockQuery;
    pool.connect = async () => createMockClient(mockQuery);
    
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
