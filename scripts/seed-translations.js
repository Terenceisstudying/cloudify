/**
 * Seed script: loads ui_translations.json into the database.
 * Replaces ALL existing UI translations in the `settings` table.
 *
 * Usage: node scripts/seed-translations.js
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

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    const client = await pool.connect();
    try {
        // Load translations from JSON file
        const translationsPath = path.join(DATA_DIR, 'ui_translations.json');
        const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
        
        console.log(`Loading translations from ${translationsPath}`);
        console.log(`Found ${Object.keys(translations).length} translation groups`);

        // Save to database using INSERT ... ON CONFLICT DO UPDATE
        await client.query(
            `INSERT INTO settings (key, value, updated_at)
             VALUES ($1, $2::jsonb, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
            ['ui_translations', JSON.stringify(translations)]
        );

        console.log('Translations saved to database successfully.');
        console.log('\nTranslation groups loaded:');
        Object.keys(translations).forEach(group => {
            const keys = Object.keys(translations[group]);
            console.log(`  - ${group}: ${keys.length} keys`);
        });
        
        console.log('\nDone. UI translations seeded successfully.');
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    } finally {
        await client.release();
        await pool.end();
    }
}

seed();
