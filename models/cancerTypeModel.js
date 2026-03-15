import db from '../lib/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_FILE = path.join(__dirname, '..', 'data', 'assessments-snapshot.json');

function mapRow(ct) {
    if (!ct) return null;
    return {
        id: ct.id,
        icon: ct.icon,
        name_en: ct.name_en,
        name_zh: ct.name_zh,
        name_ms: ct.name_ms,
        name_ta: ct.name_ta,
        description_en: ct.description_en,
        description_zh: ct.description_zh,
        description_ms: ct.description_ms,
        description_ta: ct.description_ta,
        familyLabel_en: ct.familylabel_en,
        familyLabel_zh: ct.familylabel_zh,
        familyLabel_ms: ct.familylabel_ms,
        familyLabel_ta: ct.familylabel_ta,
        familyWeight: ct.familyweight,
        genderFilter: ct.genderfilter,
        ageRiskThreshold: ct.ageriskthreshold,
        ageRiskWeight: ct.ageriskweight,
        ethnicityRisk_chinese: ct.ethnicityrisk_chinese,
        ethnicityRisk_malay: ct.ethnicityrisk_malay,
        ethnicityRisk_indian: ct.ethnicityrisk_indian,
        ethnicityRisk_caucasian: ct.ethnicityrisk_caucasian,
        ethnicityRisk_others: ct.ethnicityrisk_others,
        sortOrder: ct.sort_order,
        visible: ct.visible !== false
    };
}

export class CancerTypeModel {
    async getAllCancerTypes() {
        const { data, error } = await db.supabase
            .from('cancer_types')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('id', { ascending: true });
        
        if (error) throw error;
        return (data || []).map(mapRow);
    }

    async getCancerTypeById(id) {
        const { data, error } = await db.supabase
            .from('cancer_types')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return mapRow(data);
    }

    async createCancerType(cancerTypeData) {
        const dbData = {
            id: cancerTypeData.id,
            icon: cancerTypeData.icon || '',
            name_en: cancerTypeData.name_en || '',
            name_zh: cancerTypeData.name_zh || '',
            name_ms: cancerTypeData.name_ms || '',
            name_ta: cancerTypeData.name_ta || '',
            description_en: cancerTypeData.description_en || '',
            description_zh: cancerTypeData.description_zh || '',
            description_ms: cancerTypeData.description_ms || '',
            description_ta: cancerTypeData.description_ta || '',
            familylabel_en: cancerTypeData.familyLabel_en ?? cancerTypeData.familylabel_en ?? '',
            familylabel_zh: cancerTypeData.familyLabel_zh ?? cancerTypeData.familylabel_zh ?? '',
            familylabel_ms: cancerTypeData.familyLabel_ms ?? cancerTypeData.familylabel_ms ?? '',
            familylabel_ta: cancerTypeData.familyLabel_ta ?? cancerTypeData.familylabel_ta ?? '',
            familyweight: cancerTypeData.familyWeight ?? cancerTypeData.familyweight ?? 10,
            genderfilter: cancerTypeData.genderFilter ?? cancerTypeData.genderfilter ?? 'all',
            ageriskthreshold: cancerTypeData.ageRiskThreshold ?? cancerTypeData.ageriskthreshold ?? 0,
            ageriskweight: cancerTypeData.ageRiskWeight ?? cancerTypeData.ageriskweight ?? 0,
            ethnicityrisk_chinese: cancerTypeData.ethnicityRisk_chinese ?? cancerTypeData.ethnicityrisk_chinese ?? 0,
            ethnicityrisk_malay: cancerTypeData.ethnicityRisk_malay ?? cancerTypeData.ethnicityrisk_malay ?? 0,
            ethnicityrisk_indian: cancerTypeData.ethnicityRisk_indian ?? cancerTypeData.ethnicityrisk_indian ?? 0,
            ethnicityrisk_caucasian: cancerTypeData.ethnicityRisk_caucasian ?? cancerTypeData.ethnicityrisk_caucasian ?? 0,
            ethnicityrisk_others: cancerTypeData.ethnicityRisk_others ?? cancerTypeData.ethnicityrisk_others ?? 0,
            sort_order: cancerTypeData.sortOrder ?? cancerTypeData.sort_order ?? 0,
            visible: cancerTypeData.visible !== undefined ? cancerTypeData.visible : false
        };

        const { data, error } = await db.supabase
            .from('cancer_types')
            .insert(dbData)
            .select()
            .single();
            
        if (error) throw error;
        const result = mapRow(data);
        await this.writeAssessmentsSnapshot();
        return result;
    }

    async updateCancerType(id, updates) {
        const { data, error } = await db.supabase
            .from('cancer_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        const result = mapRow(data);
        await this.writeAssessmentsSnapshot();
        return result;
    }

    async deleteCancerType(id) {
        const { error } = await db.supabase
            .from('cancer_types')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        await this.writeAssessmentsSnapshot();
    }

    async reorderCancerTypes(orderedIds) {
        for (let i = 0; i < orderedIds.length; i++) {
            await db.supabase
                .from('cancer_types')
                .update({ sort_order: i })
                .eq('id', orderedIds[i]);
        }

        const result = await this.getAllCancerTypes();
        await this.writeAssessmentsSnapshot();
        return result;
    }

    async getAssessmentConfig(id) {
        const ct = await this.getCancerTypeById(id);
        if (!ct) return null;

        return {
            familyWeight: parseFloat(ct.familyWeight) || 10,
            ageRiskThreshold: parseInt(ct.ageRiskThreshold) || 0,
            ageRiskWeight: parseFloat(ct.ageRiskWeight) || 0,
            ethnicityRisk: {
                chinese: parseFloat(ct.ethnicityRisk_chinese) || 0,
                malay: parseFloat(ct.ethnicityRisk_malay) || 0,
                indian: parseFloat(ct.ethnicityRisk_indian) || 0,
                caucasian: parseFloat(ct.ethnicityRisk_caucasian) || 0,
                others: parseFloat(ct.ethnicityRisk_others) || 0
            }
        };
    }

    async getCancerTypeLocalized(id, lang = 'en') {
        const ct = await this.getCancerTypeById(id);
        if (!ct) return null;

        return {
            id: ct.id,
            icon: ct.icon,
            name: ct[`name_${lang}`] || ct.name_en,
            description: ct[`description_${lang}`] || ct.description_en,
            familyLabel: ct[`familyLabel_${lang}`] || ct.familyLabel_en,
            familyWeight: parseFloat(ct.familyWeight) || 10,
            genderFilter: ct.genderFilter || 'all',
            ageRiskThreshold: parseInt(ct.ageRiskThreshold) || 0,
            ageRiskWeight: parseFloat(ct.ageRiskWeight) || 0,
            ethnicityRisk: {
                chinese: parseFloat(ct.ethnicityRisk_chinese) || 0,
                malay: parseFloat(ct.ethnicityRisk_malay) || 0,
                indian: parseFloat(ct.ethnicityRisk_indian) || 0,
                caucasian: parseFloat(ct.ethnicityRisk_caucasian) || 0,
                others: parseFloat(ct.ethnicityRisk_others) || 0
            },
            visible: ct.visible
        };
    }

    async getAllCancerTypesLocalized(lang = 'en') {
        const rows = await this.getAllCancerTypes();
        return rows.map(ct => ({
            id: ct.id,
            icon: ct.icon,
            name: ct[`name_${lang}`] || ct.name_en,
            description: ct[`description_${lang}`] || ct.description_en,
            familyLabel: ct[`familyLabel_${lang}`] || ct.familyLabel_en,
            familyWeight: parseFloat(ct.familyWeight) || 10,
            genderFilter: ct.genderFilter || 'all',
            ageRiskThreshold: parseInt(ct.ageRiskThreshold) || 0,
            ageRiskWeight: parseFloat(ct.ageRiskWeight) || 0,
            ethnicityRisk: {
                chinese: parseFloat(ct.ethnicityRisk_chinese) || 0,
                malay: parseFloat(ct.ethnicityRisk_malay) || 0,
                indian: parseFloat(ct.ethnicityRisk_indian) || 0,
                caucasian: parseFloat(ct.ethnicityRisk_caucasian) || 0,
                others: parseFloat(ct.ethnicityRisk_others) || 0
            },
            visible: ct.visible
        }));
    }

    async writeAssessmentsSnapshot() {
        // Skip filesystem write on Vercel
        if (process.env.VERCEL) {
            console.log('Skipping assessments-snapshot.json write on Vercel environment');
            return;
        }

        try {
            const allData = await this.getAllCancerTypesLocalized('en');
            const data = allData.filter(ct => ct.visible !== false);
            await fs.mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true }).catch(() => {});
            await fs.writeFile(SNAPSHOT_FILE, JSON.stringify({ success: true, data }, null, 2));
        } catch (err) {
            console.error('Error writing assessments snapshot:', err);
        }
    }

    async ensureSnapshot() {
        // Skip filesystem check on Vercel
        if (process.env.VERCEL) return;

        try {
            await fs.access(SNAPSHOT_FILE);
        } catch {
            await this.writeAssessmentsSnapshot();
        }
    }
}
