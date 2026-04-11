/**
 * Merge script: reconciles a DB snapshot (data/ui_translations.current.json,
 * produced by scripts/dump-translations.js) with data/ui_translations.json.
 *
 * Policy:
 *   - DB values win for any group.key present in both (admin-UI edits take
 *     precedence over file defaults)
 *   - Keys present only in the file are added (so new Fix-era keys reach the
 *     merged result without clobbering existing DB state)
 *   - Keys present only in the DB are preserved (nothing is deleted)
 *
 * Writes the merged result back to data/ui_translations.json and prints a
 * diff report to stdout. Leaves the DB snapshot file untouched.
 *
 * Usage: node scripts/merge-translations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const DB_FILE = path.join(DATA_DIR, 'ui_translations.current.json');
const TARGET_FILE = path.join(DATA_DIR, 'ui_translations.json');

// Robust JSON reader: handles UTF-16 LE, UTF-16 BE, UTF-8 with BOM, and plain
// UTF-8. PowerShell's `>` redirect writes UTF-16 LE with BOM by default, which
// is why a plain utf8 read fails on dump output produced on Windows.
function readJson(p, label) {
    if (!fs.existsSync(p)) {
        console.error(`Missing ${label}: ${p}`);
        process.exit(1);
    }
    const buf = fs.readFileSync(p);
    let content;
    if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
        // UTF-16 LE with BOM
        content = buf.slice(2).toString('utf16le');
    } else if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF) {
        // UTF-16 BE with BOM — swap bytes and decode as LE
        const swapped = Buffer.alloc(buf.length - 2);
        for (let i = 2; i < buf.length; i += 2) {
            swapped[i - 2] = buf[i + 1];
            swapped[i - 1] = buf[i];
        }
        content = swapped.toString('utf16le');
    } else if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
        // UTF-8 with BOM
        content = buf.slice(3).toString('utf8');
    } else {
        // Plain UTF-8 (or ASCII)
        content = buf.toString('utf8');
    }
    // Strip any leading non-JSON preamble (e.g. npm script echo captured by
    // `npm run ... > file.json` on Windows). Safe because JSON always starts
    // with either `{` or `[` — anything before that is noise.
    const firstBrace = content.indexOf('{');
    const firstBracket = content.indexOf('[');
    let jsonStart = -1;
    if (firstBrace >= 0 && firstBracket >= 0) jsonStart = Math.min(firstBrace, firstBracket);
    else if (firstBrace >= 0) jsonStart = firstBrace;
    else if (firstBracket >= 0) jsonStart = firstBracket;
    if (jsonStart > 0) content = content.slice(jsonStart);
    try {
        return JSON.parse(content);
    } catch (err) {
        console.error(`Failed to parse ${label} as JSON: ${err.message}`);
        console.error(`First 60 bytes (hex): ${buf.slice(0, 60).toString('hex')}`);
        console.error(`First 200 decoded chars: ${content.slice(0, 200)}`);
        process.exit(1);
    }
}

function shape(obj, label) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        console.error(`${label} is not a plain object (got ${typeof obj})`);
        process.exit(1);
    }
}

const db = readJson(DB_FILE, 'DB snapshot');
const file = readJson(TARGET_FILE, 'target file');
shape(db, 'DB snapshot');
shape(file, 'target file');

const merged = {};
const addedFromFile = [];  // in file, not in DB — recent fixes' new keys
const dbOnly = [];         // in DB, not in file — admin edits / older seeds
const conflicts = [];      // in both, values differ — DB wins per policy

// Pass 1: copy every group/key from the DB (DB always wins for overlap).
for (const [group, keys] of Object.entries(db)) {
    if (!keys || typeof keys !== 'object') continue;
    merged[group] = {};
    for (const [key, val] of Object.entries(keys)) {
        merged[group][key] = val;
        // Check if this DB key is missing from the file (and thus "DB-only")
        if (!file[group] || !(key in file[group])) {
            dbOnly.push(`${group}.${key}`);
        }
    }
}

// Pass 2: add keys from the file that aren't in the DB.
for (const [group, keys] of Object.entries(file)) {
    if (!keys || typeof keys !== 'object') continue;
    if (!merged[group]) merged[group] = {};
    for (const [key, val] of Object.entries(keys)) {
        const inDb = db[group] && (key in db[group]);
        if (!inDb) {
            merged[group][key] = val;
            addedFromFile.push(`${group}.${key}`);
        } else {
            // Present in both — check for value divergence (DB still wins).
            const dbVal = db[group][key];
            if (JSON.stringify(dbVal) !== JSON.stringify(val)) {
                conflicts.push({
                    key: `${group}.${key}`,
                    db: dbVal,
                    file: val
                });
            }
        }
    }
}

// Write merged result back to the target file.
fs.writeFileSync(TARGET_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf8');

// Report.
console.log('=== Merge report ===');
console.log('');
console.log(`Keys added from file (new fixes' additions): ${addedFromFile.length}`);
addedFromFile.forEach(k => console.log(`  + ${k}`));

console.log('');
console.log(`Keys only in DB (preserved, not in file): ${dbOnly.length}`);
if (dbOnly.length <= 30) {
    dbOnly.forEach(k => console.log(`  = ${k}`));
} else {
    dbOnly.slice(0, 30).forEach(k => console.log(`  = ${k}`));
    console.log(`  ... and ${dbOnly.length - 30} more`);
}

console.log('');
console.log(`Conflicts resolved (DB value retained): ${conflicts.length}`);
conflicts.forEach(c => {
    console.log(`  ~ ${c.key}`);
    console.log(`    DB:   ${JSON.stringify(c.db)}`);
    console.log(`    file: ${JSON.stringify(c.file)}`);
});

console.log('');
console.log(`Merged result written to: ${TARGET_FILE}`);
console.log('Next step: npm run seed:translations   (to push the merged state to the DB)');
