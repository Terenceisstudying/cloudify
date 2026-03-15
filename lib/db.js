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
        constructor(table) {
            this.table = table;
            this.filters = [];
            this._isSingle = false;
            this._returnsCount = false;
            this._isHead = false;
            this._limit = null;
            this._range = null;
            this._order = [];
            this._operation = 'select'; // select, insert, update, delete, upsert
            this._payload = null;
            this._error = null;
        }

        select(cols, opts) {
            if (opts && opts.count) this._returnsCount = true;
            if (opts && opts.head) this._isHead = true;
            return this;
        }
        
        eq(col, val) { this.filters.push({ type: 'eq', col, val }); return this; }
        neq(col, val) { this.filters.push({ type: 'neq', col, val }); return this; }
        gt(col, val) { this.filters.push({ type: 'gt', col, val }); return this; }
        lt(col, val) { this.filters.push({ type: 'lt', col, val }); return this; }
        gte(col, val) { this.filters.push({ type: 'gte', col, val }); return this; }
        lte(col, val) { this.filters.push({ type: 'lte', col, val }); return this; }
        in(col, vals) { this.filters.push({ type: 'in', col, vals }); return this; }
        ilike(col, val) { this.filters.push({ type: 'ilike', col, val }); return this; }

        order(col, opts) { this._order.push({ col, ...opts }); return this; }
        limit(n) { this._limit = n; return this; }
        range(from, to) { this._range = { from, to }; return this; }
        single() { this._isSingle = true; return this; }

        insert(payload) { this._operation = 'insert'; this._payload = payload; return this; }
        update(payload) { this._operation = 'update'; this._payload = payload; return this; }
        upsert(payload, opts) { this._operation = 'upsert'; this._payload = payload; this._upsertOpts = opts; return this; }
        delete() { this._operation = 'delete'; return this; }

        async then(resolve) {
            if (!mockDataStore[this.table]) mockDataStore[this.table] = [];
            let tableData = mockDataStore[this.table];
            let resultData = [];

            if (this._operation === 'insert') {
                const rows = Array.isArray(this._payload) ? this._payload : [this._payload];
                for (const r of rows) {
                    if (r.id && tableData.some(ex => ex.id === r.id)) {
                        return resolve({ data: null, error: { message: 'duplicate key', code: '23505' } });
                    }
                    const newRow = { ...r };
                    if (!newRow.id && !['settings', 'question_assignments', 'password_reset_tokens'].includes(this.table)) {
                        newRow.id = 'mock-' + Math.random().toString(36).substr(2, 9);
                    }
                    if (!newRow.created_at) newRow.created_at = new Date().toISOString();
                    tableData.push(newRow);
                    resultData.push({ ...newRow });
                }
            } else if (this._operation === 'upsert') {
                const rows = Array.isArray(this._payload) ? this._payload : [this._payload];
                const key = this._upsertOpts?.onConflict || 'id';
                for (const r of rows) {
                    const idx = tableData.findIndex(ex => ex[key] === r[key]);
                    if (idx !== -1) {
                        tableData[idx] = { ...tableData[idx], ...r, updated_at: new Date().toISOString() };
                        resultData.push({ ...tableData[idx] });
                    } else {
                        const newRow = { ...r, created_at: new Date().toISOString() };
                        tableData.push(newRow);
                        resultData.push({ ...newRow });
                    }
                }
            } else {
                // select, update, delete
                // 1. Apply filters
                let filteredRowsWithIndices = [];
                tableData.forEach((row, idx) => {
                    let matches = true;
                    for (const f of this.filters) {
                        const rowVal = row[f.col];
                        if (f.type === 'eq' && rowVal != f.val) matches = false;
                        else if (f.type === 'neq' && rowVal == f.val) matches = false;
                        else if (f.type === 'in' && !f.vals.includes(rowVal)) matches = false;
                        else if (f.type === 'gt' && !(rowVal > f.val)) matches = false;
                        else if (f.type === 'lt' && !(rowVal < f.val)) matches = false;
                        else if (f.type === 'gte' && !(rowVal >= f.val)) matches = false;
                        else if (f.type === 'lte' && !(rowVal <= f.val)) matches = false;
                        else if (f.type === 'ilike') {
                            const regex = new RegExp((f.val || '').replace(/%/g, '.*'), 'i');
                            if (!regex.test(rowVal)) matches = false;
                        }
                        if (!matches) break;
                    }
                    if (matches) filteredRowsWithIndices.push({ row, idx });
                });

                if (this._operation === 'update') {
                    filteredRowsWithIndices.forEach(({ row }) => {
                        Object.assign(row, this._payload, { updated_at: new Date().toISOString() });
                    });
                    resultData = filteredRowsWithIndices.map(({ row }) => ({ ...row }));
                } else if (this._operation === 'delete') {
                    const toDeleteIndices = new Set(filteredRowsWithIndices.map(item => item.idx));
                    mockDataStore[this.table] = tableData.filter((_, idx) => !toDeleteIndices.has(idx));
                    resultData = [];
                } else {
                    // select
                    resultData = filteredRowsWithIndices.map(({ row }) => ({ ...row }));
                }
            }

            // Post-processing: sort, limit, range
            if (this._order.length > 0) {
                resultData.sort((a, b) => {
                    for (const { col, ascending } of this._order) {
                        const valA = a[col];
                        const valB = b[col];
                        if (valA < valB) return ascending !== false ? -1 : 1;
                        if (valA > valB) return ascending !== false ? 1 : -1;
                    }
                    return 0;
                });
            }
            if (this._range) resultData = resultData.slice(this._range.from, this._range.to + 1);
            if (this._limit) resultData = resultData.slice(0, this._limit);

            const count = this._returnsCount ? resultData.length : null;
            if (this._isHead) return resolve({ data: null, error: null, count });

            if (this._isSingle) {
                if (resultData.length === 0) resolve({ data: null, error: { message: 'Not found', code: 'PGRST116' }, count });
                else resolve({ data: resultData[0], error: null, count });
            } else {
                resolve({ data: resultData, error: null, count });
            }
        }
    }

    clientInstance = {
        from: (table) => new MockQueryBuilder(table),
        rpc: async () => ({ data: [], error: null }),
        auth: {
            getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }),
            signInWithPassword: async () => ({ 
                data: { user: { id: 'test-user' }, session: { access_token: 'mock-token' } }, 
                error: null 
            })
        },
        _reset: () => {
            Object.keys(mockDataStore).forEach(k => { mockDataStore[k] = []; });
        }
    };
    console.log('🧪 Using ULTIMATE LAZY MOCKED Supabase client');
} else {
    if (!supabaseUrl || !supabaseKey) {
        console.warn('Warning: Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
    }
    clientInstance = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
}

export const supabase = clientInstance;

export async function query(text, params) {
    if (process.env.NODE_ENV === 'test') return { rows: [] };
    const { data, error } = await supabase.rpc('execute_sql', { query_text: text, query_params: params });
    if (error) throw error;
    return { rows: data || [] };
}

export async function fetch(table, options = {}) {
    let q = supabase.from(table).select(options.select || '*');
    if (options.where) for (const [k, v] of Object.entries(options.where)) q = q.eq(k, v);
    if (options.order) q = q.order(options.order.col, { ascending: options.order.ascending !== false });
    if (options.limit) q = q.limit(options.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

export async function insert(table, data) {
    const { data: res, error } = await supabase.from(table).insert(data).select().single();
    if (error) throw error;
    return res;
}

export async function update(table, data, where) {
    let q = supabase.from(table).update(data);
    for (const [k, v] of Object.entries(where)) q = q.eq(k, v);
    const { data: res, error } = await q.select().single();
    if (error) throw error;
    return res;
}

export async function remove(table, where) {
    let q = supabase.from(table).delete();
    for (const [k, v] of Object.entries(where)) q = q.eq(k, v);
    const { error } = await q;
    if (error) throw error;
}

export default { supabase, query, fetch, insert, update, remove };
