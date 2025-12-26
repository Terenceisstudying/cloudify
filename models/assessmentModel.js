import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'assessments.csv');

/**
 * Assessment Model (MVC Pattern)
 * Handles all assessment data operations
 * Stores anonymous data only (no PII)
 * Uses CSV format for better human readability and analytics compatibility
 */
export class AssessmentModel {
    constructor() {
        this.assessments = [];
        this.loadAssessments();
    }

    async loadAssessments() {
        try {
            const data = await fs.readFile(DATA_FILE, 'utf-8');
            this.assessments = this.parseCSV(data);
        } catch (error) {
            // If file doesn't exist, create with headers
            this.assessments = [];
            await this.saveAssessments();
        }
    }

    async saveAssessments() {
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        const csvContent = this.assessmentsToCSV();
        await fs.writeFile(DATA_FILE, csvContent);
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) return [];

        const headers = lines[0].split(',');
        const assessments = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const assessment = {};
                headers.forEach((header, index) => {
                    let value = values[index];
                    // Parse JSON strings for complex objects
                    if (header === 'categoryRisks' && value) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            value = {};
                        }
                    }
                    assessment[header] = value;
                });
                assessments.push(assessment);
            }
        }
        return assessments;
    }

    assessmentsToCSV() {
        if (this.assessments.length === 0) {
            return 'id,ageRange,sex,familyHistory,riskScore,riskLevel,categoryRisks,timestamp\n';
        }

        const headers = Object.keys(this.assessments[0]);
        const csvLines = [headers.join(',')];

        this.assessments.forEach(assessment => {
            const values = headers.map(header => {
                let value = assessment[header] || '';
                // Stringify complex objects for CSV storage
                if (header === 'categoryRisks' && typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                // Escape commas and quotes in values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        });

        return csvLines.join('\n') + '\n';
    }

    async createAssessment(assessmentData) {
        await this.loadAssessments();
        const newAssessment = {
            id: `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...assessmentData
        };
        this.assessments.push(newAssessment);
        await this.saveAssessments();
        return newAssessment;
    }

    async getAllAssessments() {
        await this.loadAssessments();
        return this.assessments;
    }

    async getStatistics() {
        await this.loadAssessments();
        
        const total = this.assessments.length;
        const riskLevels = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        const ageRanges = {};
        const avgRiskScore = total > 0 
            ? this.assessments.reduce((sum, a) => sum + (a.riskScore || 0), 0) / total 
            : 0;

        this.assessments.forEach(assessment => {
            // Count risk levels
            if (assessment.riskLevel) {
                riskLevels[assessment.riskLevel] = (riskLevels[assessment.riskLevel] || 0) + 1;
            }

            // Count age ranges
            const ageRange = assessment.ageRange || 'unknown';
            ageRanges[ageRange] = (ageRanges[ageRange] || 0) + 1;
        });

        return {
            total,
            averageRiskScore: Math.round(avgRiskScore * 100) / 100,
            riskLevelDistribution: riskLevels,
            ageRangeDistribution: ageRanges
        };
    }
}

