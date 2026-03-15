/**
 * Supabase Database Client
 * 
 * Provides a connection to the Supabase PostgreSQL database.
 * Uses the Supabase JS client for connection pooling and RLS support.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let clientInstance;

if (process.env.NODE_ENV === 'test') {
    // ---- IN-MEMORY MOCK SUPABASE CLIENT FOR TESTS ----
    const mockDataStore = {
        settings: [],
        admins: [],
        cancer_types: [],
        questions: [],
        question_assignments: [],
        assessments: [],
        password_reset_tokens: []
    };

    class MockQueryBuilder {
        constructor(table, builderData) {
            this.table = table;
            this.data = builderData ? [...builderData] : [];
            this._isSingle = false;
            this._returnsCount = false;
            this._isHead = false;
            this._error = null;
        }

        select(cols, opts) {
            if (opts && opts.count) this._returnsCount = true;
            if (opts && opts.head) this._isHead = true;
            return this;
        }
        
        eq(col, val) {
            if (this._error) return this;
            this.data = this.data.filter(r => r[col] == val);
            return this;
        }

        neq(col, val) {
            if (this._error) return this;
            this.data = this.data.filter(r => r[col] != val);
            return this;
        }

        gt(col, val) {
            if (this._error) return this;
            this.data = this.data.filter(r => r[col] > val);
            return this;
        }

        lt(col, val) {
            if (this._error) return this;
            this.data = this.data.filter(r => r[col] < val);
            return this;
        }

        gte(col, val) {
            if (this._error) return this;
            this.data = this.data.filter(r => r[col] >= val);
            return this;
        }

        lte(col, val) {
            if (this._error) return this;
            this.data = this.data.filter(r => r[col] <= val);
            return this;
        }

        ilike(col, val) {
            if (this._error || !val) return this;
            const regex = new RegExp(val.replace(/%/g, '.*'), 'i');
            this.data = this.data.filter(r => regex.test(r[col]));
            return this;
        }

        in(col, vals) {
            if (this._error) return this;
            this.data = this.data.filter(r => vals.includes(r[col]));
            return this;
        }

        order() { return this; }
        
        limit(n) { 
            if (this._error) return this;
            this.data = this.data.slice(0, n); 
            return this; 
        }

        range(from, to) {
            if (this._error) return this;
            this.data = this.data.slice(from, to + 1);
            return this;
        }

        single() { this._isSingle = true; return this; }

        upsert(payload, opts) {
            if (this._error) return this;
            const rows = Array.isArray(payload) ? payload : [payload];
            const key = opts?.onConflict || 'id';
            rows.forEach(r => {
                const idx = mockDataStore[this.table].findIndex(ex => ex[key] === r[key]);
                if (idx !== -1) mockDataStore[this.table][idx] = { ...mockDataStore[this.table][idx], ...r };
                else mockDataStore[this.table].push({...r});
            });
            this.data = rows;
            return this;
        }

        insert(payload) {
            if (this._error) return this;
            const rows = Array.isArray(payload) ? payload : [payload];
            const created = [];
            for (const r of rows) {
                const newRow = {...r};
                
                // Duplicate check
                if (newRow.id && mockDataStore[this.table].some(ex => ex.id === newRow.id)) {
                    this._error = { message: 'duplicate key', code: '23505' };
                    return this;
                }

                if (!newRow.id && this.table !== 'settings' && this.table !== 'question_assignments' && this.table !== 'password_reset_tokens') {
                    newRow.id = 'mock-' + Math.random().toString(36).substr(2, 9);
                }
                if (!newRow.created_at) newRow.created_at = new Date().toISOString();
                mockDataStore[this.table].push(newRow);
                created.push(newRow);
            }
            this.data = created;
            return this;
        }

        update(payload) {
            if (this._error) return this;
            const toUpdate = new Set(this.data);
            mockDataStore[this.table].forEach(r => {
                if (toUpdate.has(r)) {
                    Object.assign(r, payload);
                    r.updated_at = new Date().toISOString();
                }
            });
            this.data = this.data.map(r => ({...r, ...payload}));
            return this;
        }

        delete() {
            if (this._error) return this;
            const toDelete = new Set(this.data);
            mockDataStore[this.table] = mockDataStore[this.table].filter(row => {
                // Important: find actual reference in mockDataStore
                return !toDelete.has(row);
            });
            this.data = [];
            return this;
        }

        async then(resolve) {
            if (this._error) {
                return resolve({ data: null, error: this._error, count: null });
            }

            const count = this._returnsCount ? this.data.length : null;
            const dataResult = this._isHead ? null : this.data;
            
            if (this._isSingle) {
                if (this.data.length === 0) {
                    resolve({ data: null, error: { message: 'Not found', code: 'PGRST116' }, count });
                } else {
                    resolve({ data: this.data[0], error: null, count });
                }
            } else {
                resolve({ data: dataResult, error: null, count });
            }
        }
    }

    clientInstance = {
        from: (table) => {
            if (!mockDataStore[table]) mockDataStore[table] = [];
            // Return a builder with the ENTIRE table data initially
            return new MockQueryBuilder(table, mockDataStore[table]);
        },
        rpc: async () => ({ data: [], error: null }),
        auth: {
            getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }),
            signInWithPassword: async () => ({ 
                data: { user: { id: 'test-user' }, session: { access_token: 'mock-token' } }, 
                error: null 
            })
        },
        _reset: () => {
            Object.keys(mockDataStore).forEach(k => {
                mockDataStore[k] = [];
            });
        }
    };
    console.log('🧪 Using ULTIMATE MOCKED Supabase client');
} else {
    if (!supabaseUrl || !supabaseKey) {
        console.warn('Warning: Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
    }
    clientInstance = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
}

export const supabase = clientInstance;

/**
 * Execute a raw SQL query (Mocked for tests)
 */
export async function query(text, params) {
    if (process.env.NODE_ENV === 'test') return { rows: [] };
    if (!supabase) throw new Error('Supabase client not initialized');
    
    try {
        const { data, error } = await supabase.rpc('execute_sql', {
            query_text: text,
            query_params: params
        });
        if (error) throw error;
        return { rows: data || [] };
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

/**
 * Fetch records from a table
 */
export async function fetch(table, options = {}) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    let q = supabase.from(table).select(options.select || '*');
    if (options.where) {
        for (const [key, value] of Object.entries(options.where)) q = q.eq(key, value);
    }
    if (options.order) {
        q = q.order(options.order.column, { ascending: options.order.ascending !== false });
    }
    if (options.limit) q = q.limit(options.limit);
    
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

/**
 * Insert a record into a table
 */
export async function insert(table, data) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data: result, error } = await supabase.from(table).insert(data).select().single();
    if (error) throw error;
    return result;
}

/**
 * Update a record in a table
 */
export async function update(table, data, where) {
    if (!supabase) throw new Error('Supabase client not initialized');
    let q = supabase.from(table).update(data);
    for (const [key, value] of Object.entries(where)) q = q.eq(key, value);
    const { data: result, error } = await q.select().single();
    if (error) throw error;
    return result;
}

/**
 * Delete a record from a table
 */
export async function remove(table, where) {
    if (!supabase) throw new Error('Supabase client not initialized');
    let q = supabase.from(table).delete();
    for (const [key, value] of Object.entries(where)) q = q.eq(key, value);
    const { error } = await q;
    if (error) throw error;
}

export default {
    supabase,
    query,
    fetch,
    insert,
    update,
    remove
};
