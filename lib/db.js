/**
 * Supabase Database Client
 * 
 * Provides a connection to the Supabase PostgreSQL database.
 * Uses the Supabase JS client for connection pooling and RLS support.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Warning: Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * Execute a raw SQL query
 * @param {string} text - SQL query text
 * @param {any[]} params - Query parameters
 * @returns {Promise<{rows: any[]}>} Query results
 */
export async function query(text, params) {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    try {
        // For complex queries, use RPC or direct SQL via Supabase
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
 * @param {string} table - Table name
 * @param {object} options - Query options (select, where, order, limit)
 * @returns {Promise<any[]>} Query results
 */
export async function fetch(table, options = {}) {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    let query = supabase.from(table).select(options.select || '*');
    
    if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
            query = query.eq(key, value);
        }
    }
    
    if (options.order) {
        query = query.order(options.order.column, { 
            ascending: options.order.ascending !== false 
        });
    }
    
    if (options.limit) {
        query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
}

/**
 * Insert a record into a table
 * @param {string} table - Table name
 * @param {object} data - Record data
 * @returns {Promise<any>} Inserted record
 */
export async function insert(table, data) {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
    
    if (error) throw error;
    return result;
}

/**
 * Update a record in a table
 * @param {string} table - Table name
 * @param {object} data - Updated data
 * @param {object} where - Where clause
 * @returns {Promise<any>} Updated record
 */
export async function update(table, data, where) {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    let query = supabase.from(table).update(data);
    
    for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
    }
    
    const { data: result, error } = await query.select().single();
    
    if (error) throw error;
    return result;
}

/**
 * Delete a record from a table
 * @param {string} table - Table name
 * @param {object} where - Where clause
 * @returns {Promise<void>}
 */
export async function remove(table, where) {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    let query = supabase.from(table).delete();
    
    for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
    }
    
    const { error } = await query;
    
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
