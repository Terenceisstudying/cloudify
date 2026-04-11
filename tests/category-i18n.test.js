/**
 * Unit tests for the risk-category → translation-key mapping.
 * Locks in the H3 fix: hard-coded English category labels on the results
 * screen are resolved through translations at render time.
 * Run: node --test tests/category-i18n.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RISK_CATEGORIES, RISK_CATEGORY_KEYS } from '../public/js/constants.js';

describe('RISK_CATEGORY_KEYS', () => {
    it('has a translation key for every RISK_CATEGORIES value', () => {
        for (const categoryLabel of Object.values(RISK_CATEGORIES)) {
            assert.ok(
                RISK_CATEGORY_KEYS[categoryLabel],
                `Missing translation key for category "${categoryLabel}"`
            );
        }
    });

    it('maps each category to a key under the `results` group (category* prefix)', () => {
        const expected = {
            'Diet & Nutrition': 'categoryDiet',
            'Lifestyle': 'categoryLifestyle',
            'Medical History': 'categoryMedical',
            'Family & Genetics': 'categoryFamily'
        };
        for (const [label, expectedKey] of Object.entries(expected)) {
            assert.strictEqual(
                RISK_CATEGORY_KEYS[label],
                expectedKey,
                `Expected ${label} → ${expectedKey}`
            );
        }
    });

    it('every key follows the category<Name> naming convention', () => {
        for (const key of Object.values(RISK_CATEGORY_KEYS)) {
            assert.match(key, /^category[A-Z][a-zA-Z]+$/, `Key "${key}" should match /^category[A-Z][a-zA-Z]+$/`);
        }
    });

    it('has no orphan keys not referenced by RISK_CATEGORIES', () => {
        const knownLabels = new Set(Object.values(RISK_CATEGORIES));
        for (const mapKey of Object.keys(RISK_CATEGORY_KEYS)) {
            assert.ok(
                knownLabels.has(mapKey),
                `RISK_CATEGORY_KEYS has orphan entry "${mapKey}" not in RISK_CATEGORIES`
            );
        }
    });
});

describe('data/ui_translations.json — category labels seeded', () => {
    it('ships the 4 category keys with all 4 languages', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const file = path.join(__dirname, '..', 'data', 'ui_translations.json');
        const raw = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(raw);

        const langs = ['en', 'zh', 'ms', 'ta'];
        for (const key of Object.values(RISK_CATEGORY_KEYS)) {
            const entry = json.results?.[key];
            assert.ok(entry, `results.${key} missing from data/ui_translations.json`);
            for (const lang of langs) {
                assert.ok(
                    typeof entry[lang] === 'string' && entry[lang].trim().length > 0,
                    `results.${key}.${lang} is empty or missing`
                );
            }
        }
    });
});
