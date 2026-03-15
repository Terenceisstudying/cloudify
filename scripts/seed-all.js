/**
 * Comprehensive Seed Script: Loads all data from data/ folder into Supabase.
 * Provides detailed feedback for each step.
 *
 * Usage: node scripts/seed-all.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseCSVLine } from '../utils/csv.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function loadCSV(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`⚠️ File not found: ${filename}`);
        return [];
    }
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((h, i) => { 
            let val = values[i] ?? '';
            if (val.toLowerCase() === 'true') val = true;
            else if (val.toLowerCase() === 'false') val = false;
            else if (['familyweight', 'ageriskthreshold', 'ageriskweight', 'ethnicityrisk_chinese', 'ethnicityrisk_malay', 'ethnicityrisk_indian', 'ethnicityrisk_caucasian', 'ethnicityrisk_others', 'weight', 'yesvalue', 'novalue', 'minage', 'age', 'risk_score', 'completion_time', 'anomaly_score'].includes(h)) {
                val = val === '' ? null : parseFloat(val);
            }
            row[h] = val;
        });
        return row;
    });
}

function loadJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`⚠️ File not found: ${filename}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

async function seed() {
    const maskedUrl = supabaseUrl.replace(/(https:\/\/)(.*)(\.supabase\.co)/, '$1***$3');
    console.log(`🚀 Starting comprehensive database seed to: ${maskedUrl}...`);

    try {
        // 1. Seed Admins
        const admins = loadJSON('admins.json');
        if (admins) {
            console.log(`👤 Seeding ${admins.length} admins...`);
            await supabase.from('admins').delete().neq('email', '');
            const mappedAdmins = admins.map(a => ({
                id: a.id,
                email: a.email,
                password: a.password,
                role: a.role,
                name: a.name,
                require_password_reset: a.requirePasswordReset || false,
                created_at: a.createdAt,
                updated_at: a.updatedAt
            }));
            const { error } = await supabase.from('admins').insert(mappedAdmins);
            if (error) console.error('❌ Error seeding admins:', error.message);
            else console.log('✅ Admins seeded successfully');
        }

        // 2. Seed Cancer Types
        const cancerTypes = loadCSV('cancer_types.csv');
        if (cancerTypes.length > 0) {
            console.log(`🎗️ Seeding ${cancerTypes.length} cancer types...`);
            await supabase.from('cancer_types').delete().neq('id', '');
            const mappedCT = cancerTypes.map(ct => ({
                id: ct.id,
                name_en: ct.name_en,
                name_zh: ct.name_zh,
                name_ms: ct.name_ms,
                name_ta: ct.name_ta,
                description_en: ct.description_en,
                description_zh: ct.description_zh,
                description_ms: ct.description_ms,
                description_ta: ct.description_ta,
                family_label_en: ct.familylabel_en,
                family_label_zh: ct.familylabel_zh,
                family_label_ms: ct.familylabel_ms,
                family_label_ta: ct.familylabel_ta,
                icon: ct.icon,
                family_weight: ct.familyweight,
                gender_filter: ct.genderfilter,
                age_risk_threshold: ct.ageriskthreshold,
                age_risk_weight: ct.ageriskweight,
                ethnicity_risk_chinese: ct.ethnicityrisk_chinese,
                ethnicity_risk_malay: ct.ethnicityrisk_malay,
                ethnicity_risk_indian: ct.ethnicityrisk_indian,
                ethnicity_risk_caucasian: ct.ethnicityrisk_caucasian,
                ethnicity_risk_others: ct.ethnicityrisk_others,
                visible: ct.visible
            }));
            const { error } = await supabase.from('cancer_types').insert(mappedCT);
            if (error) console.error('❌ Error seeding cancer types:', error.message);
            else console.log('✅ Cancer types seeded successfully');
        }

        // 3. Seed Questions
        const questions = loadCSV('question_bank.csv');
        if (questions.length > 0) {
            console.log(`❓ Seeding ${questions.length} questions...`);
            await supabase.from('questions').delete().neq('id', '');
            const { error } = await supabase.from('questions').insert(questions);
            if (error) console.error('❌ Error seeding questions:', error.message);
            else console.log('✅ Questions seeded successfully');
        }

        // 4. Seed Question Assignments
        const assignments = loadCSV('assignments.csv');
        if (assignments.length > 0) {
            console.log(`🔗 Seeding ${assignments.length} assignments...`);
            await supabase.from('question_assignments').delete().neq('id', 0);
            const mappedAssignments = assignments.map(a => ({
                questionid: a.questionid,
                assessmentid: a.assessmentid,
                targetcancertype: a.targetcancertype,
                weight: a.weight,
                yesvalue: a.yesvalue,
                novalue: a.novalue,
                category: a.category,
                minage: a.minage
            }));
            const { error } = await supabase.from('question_assignments').insert(mappedAssignments);
            if (error) console.error('❌ Error seeding assignments:', error.message);
            else console.log('✅ Assignments seeded successfully');
        }

        // 5. Seed Settings
        console.log('⚙️ Seeding settings...');
        const settings = [
            { key: 'theme', file: 'theme.json' },
            { key: 'pdpa', file: 'pdpa.json' },
            { key: 'translations', file: 'ui_translations.json' },
            { key: 'recommendations', file: 'recommendations.json' }
        ];
        
        for (const s of settings) {
            const data = loadJSON(s.file);
            if (data) {
                const { error } = await supabase.from('settings').upsert({
                    key: s.key,
                    value: data,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
                
                if (error) console.error(`❌ Error seeding setting ${s.key}:`, error.message);
                else console.log(`✅ Setting "${s.key}" seeded successfully`);
            }
        }

        console.log('✨ Seed completed successfully!');
    } catch (err) {
        console.error('💥 Seed failed with unexpected error:', err);
    }
}

seed();
