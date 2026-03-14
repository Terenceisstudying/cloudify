import { applyCors } from '../../lib/cors.js';
import { supabase } from '../../lib/db.js';

/**
 * GET /api/assessments/stats
 * Get aggregate statistics (for analytics — no PII).
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { startDate, endDate } = req.query;
        const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
        const isValidDate = (d) => ISO_DATE_RE.test(d) && !isNaN(new Date(d).getTime());

        if (startDate && !isValidDate(startDate)) {
            return res.status(400).json({ success: false, error: 'Invalid startDate format. Expected YYYY-MM-DD.' });
        }
        if (endDate && !isValidDate(endDate)) {
            return res.status(400).json({ success: false, error: 'Invalid endDate format. Expected YYYY-MM-DD.' });
        }

        let query = supabase.from('assessments').select('*').order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
            query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map row to the same format expected by the frontend
        const assessments = (data || []).map(row => ({
            id: row.id,
            age: row.age,
            gender: row.gender,
            familyHistory: row.family_history,
            assessmentType: row.assessment_type,
            riskScore: row.risk_score,
            riskLevel: row.risk_level,
            categoryRisks: row.category_risks || {},
            questionsAnswers: row.questions_answers || [],
            timestamp: row.created_at
        }));

        // Compute stats
        const totals = {
            count: 0,
            riskScore: 0,
            riskLevels: { LOW: 0, MEDIUM: 0, HIGH: 0 },
        };
        const byCancerTypeMap = {};
        const byAgeMap = {};
        const byGenderMap = {};
        const byFamilyHistoryMap = { true: { count: 0, riskScore: 0, LOW: 0, MEDIUM: 0, HIGH: 0 }, false: { count: 0, riskScore: 0, LOW: 0, MEDIUM: 0, HIGH: 0 } };
        const categoryMap = {};
        const questionMap = {};
        const ageByTypeMap = {};

        function initGroup() {
            return { count: 0, riskScore: 0, LOW: 0, MEDIUM: 0, HIGH: 0 };
        }
        function roundTwo(n) {
            return Math.round(n * 100) / 100;
        }

        for (const a of assessments) {
            const score = parseFloat(a.riskScore) || 0;
            const rawLevel = (a.riskLevel || '').toUpperCase();
            const level = rawLevel in totals.riskLevels ? rawLevel : 'LOW';
            const type = (a.assessmentType || 'unknown').toLowerCase();
            const age = (a.age !== null && a.age !== undefined && a.age !== '') ? parseInt(a.age) : null;
            const gender = a.gender || 'Unknown';
            const fhKey = String(a.familyHistory) === 'true' ? 'true' : 'false';

            totals.count++;
            totals.riskScore += score;
            totals.riskLevels[level]++;

            if (!byCancerTypeMap[type]) byCancerTypeMap[type] = initGroup();
            byCancerTypeMap[type].count++;
            byCancerTypeMap[type].riskScore += score;
            byCancerTypeMap[type][level]++;

            if (age !== null) {
                if (!byAgeMap[age]) byAgeMap[age] = initGroup();
                byAgeMap[age].count++;
                byAgeMap[age].riskScore += score;
                byAgeMap[age][level]++;

                const ageTypeKey = `${age}__${type}`;
                if (!ageByTypeMap[ageTypeKey]) ageByTypeMap[ageTypeKey] = { age, assessmentType: type, ...initGroup() };
                ageByTypeMap[ageTypeKey].count++;
                ageByTypeMap[ageTypeKey].riskScore += score;
                ageByTypeMap[ageTypeKey][level]++;
            }

            if (!byGenderMap[gender]) byGenderMap[gender] = initGroup();
            byGenderMap[gender].count++;
            byGenderMap[gender].riskScore += score;
            byGenderMap[gender][level]++;

            byFamilyHistoryMap[fhKey].count++;
            byFamilyHistoryMap[fhKey].riskScore += score;
            byFamilyHistoryMap[fhKey][level]++;

            if (a.categoryRisks && typeof a.categoryRisks === 'object') {
                for (const [cat, contrib] of Object.entries(a.categoryRisks)) {
                    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
                    categoryMap[cat].total += parseFloat(contrib) || 0;
                    categoryMap[cat].count++;
                }
            }

            if (Array.isArray(a.questionsAnswers)) {
                for (const qa of a.questionsAnswers) {
                    const qid = qa.questionId || qa.questionid;
                    if (!qid) continue;
                    if (!questionMap[qid]) {
                        questionMap[qid] = { questionText: qa.questionText || qa.questiontext || '', category: qa.category || '', totalAnswers: 0, yesCount: 0, totalContribution: 0 };
                    }
                    questionMap[qid].totalAnswers++;
                    if ((qa.userAnswer || qa.useranswer) === 'Yes') questionMap[qid].yesCount++;
                    questionMap[qid].totalContribution += parseFloat(qa.riskContribution || qa.riskcontribution) || 0;
                }
            }
        }

        function toGroupStats(g) {
            return { count: g.count, avgRisk: g.count > 0 ? roundTwo(g.riskScore / g.count) : 0, LOW: g.LOW, MEDIUM: g.MEDIUM, HIGH: g.HIGH };
        }

        const byCancerType = Object.entries(byCancerTypeMap)
            .map(([name, g]) => ({ name, ...toGroupStats(g) }))
            .sort((a, b) => b.count - a.count);

        const topCancerType = byCancerType.length > 0 ? { name: byCancerType[0].name, count: byCancerType[0].count } : null;

        const byAge = Object.entries(byAgeMap)
            .map(([age, g]) => ({ age: parseInt(age), ...toGroupStats(g) }))
            .sort((a, b) => a.age - b.age);

        const byGender = Object.entries(byGenderMap)
            .map(([gender, g]) => ({ gender, ...toGroupStats(g) }));

        const byFamilyHistory = [
            { familyHistory: true, ...toGroupStats(byFamilyHistoryMap['true']) },
            { familyHistory: false, ...toGroupStats(byFamilyHistoryMap['false']) },
        ];

        const categoryRisks = Object.entries(categoryMap)
            .map(([category, s]) => ({ category, avgContribution: s.count > 0 ? roundTwo(s.total / s.count) : 0 }))
            .sort((a, b) => b.avgContribution - a.avgContribution);

        const topQuestions = Object.entries(questionMap)
            .map(([questionId, s]) => ({
                questionId,
                questionText: s.questionText,
                category: s.category,
                yesRate: s.totalAnswers > 0 ? roundTwo((s.yesCount / s.totalAnswers) * 100) : 0,
                avgContribution: s.totalAnswers > 0 ? roundTwo(s.totalContribution / s.totalAnswers) : 0
            }))
            .sort((a, b) => b.yesRate - a.yesRate)
            .slice(0, 10);

        const ageByType = Object.values(ageByTypeMap)
            .map(g => ({
                age: g.age,
                assessmentType: g.assessmentType,
                ...toGroupStats(g)
            }))
            .sort((a, b) => a.age - b.age || a.assessmentType.localeCompare(b.assessmentType));

        const rawRows = assessments.map(a => ({
            age: a.age !== null && a.age !== undefined ? parseInt(a.age) : null,
            gender: a.gender || null,
            familyHistory: a.familyHistory,
            assessmentType: (a.assessmentType || '').toLowerCase(),
            riskScore: parseFloat(a.riskScore) || 0,
            riskLevel: (a.riskLevel || '').toUpperCase(),
            categoryRisks: a.categoryRisks || {},
            questionsAnswers: a.questionsAnswers || [],
        }));

        const stats = {
            total: totals.count,
            riskLevels: totals.riskLevels,
            avgRiskScore: totals.count > 0 ? roundTwo(totals.riskScore / totals.count) : 0,
            topCancerType,
            byCancerType,
            byAge,
            byGender,
            byFamilyHistory,
            categoryRisks,
            topQuestions,
            ageByType,
            rawRows,
        };

        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
