/**
 * Dump script: pulls the live UI translations from the database and writes
 * them directly to a JSON file. Pairs with seed-translations.js. Use this to
 * snapshot the current DB state before reconciling it with
 * data/ui_translations.json.
 *
 * Usage:
 *   node scripts/dump-translations.js
 *     → writes to data/ui_translations.current.json (default)
 *
 *   node scripts/dump-translations.js path/to/output.json
 *     → writes to the given path
 *
 * IMPORTANT: this script writes directly to a file via fs.writeFileSync with
 * UTF-8 encoding. Do NOT pipe the output through the shell (e.g.
 * `npm run dump:translations > file.json`) on Windows — PowerShell's `>` will
 * re-encode through the active codepage and mangle non-ASCII characters
 * (Tamil, Chinese, etc.) into mojibake. Writing directly avoids that entirely.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DEFAULT_OUTPUT = path.join(DATA_DIR, 'ui_translations.current.json');

const outputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_OUTPUT;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function dump() {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT value FROM settings WHERE key = $1 LIMIT 1`,
            ['ui_translations']
        );

        if (result.rows.length === 0) {
            console.error('No ui_translations row found in the settings table.');
            console.error('The DB may never have been seeded. Try: npm run seed:translations');
            process.exit(1);
        }

        const value = result.rows[0].value;
        if (value == null) {
            console.error('ui_translations row exists but its value is NULL.');
            process.exit(1);
        }

        // pg auto-parses JSONB to a JS object with proper Unicode strings.
        // fs.writeFileSync with 'utf8' writes pure UTF-8 bytes to disk,
        // bypassing any shell-level encoding translation.
        const content = JSON.stringify(value, null, 2) + '\n';
        fs.writeFileSync(outputPath, content, 'utf8');

        const groupCount = Object.keys(value).length;
        const keyCount = Object.values(value).reduce(
            (sum, group) => sum + Object.keys(group || {}).length,
            0
        );
        console.log(`Dumped ${groupCount} groups / ${keyCount} keys to ${outputPath}`);
    } catch (err) {
        console.error('Dump failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

dump();
