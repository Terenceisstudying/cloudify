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

    /**
     * Properly escape a value for CSV according to RFC 4180
     * @param {any} value - The value to escape
     * @returns {string} - The properly escaped CSV field
     */
    escapeCSVField(value) {
        // Convert to string if not already
        let str = String(value);

        // Escape quotes by doubling them
        str = str.replace(/"/g, '""');

        // Always quote fields containing commas, quotes, or newlines
        // Also quote JSON objects/arrays for safety
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str}"`;
        }

        return str;
    }

    /**
     * Parse a CSV line into fields, handling quoted values properly
     * @param {string} line - The CSV line to parse
     * @returns {string[]} - Array of parsed field values
     */
    parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote (double quote)
                    current += '"';
                    i += 2; // Skip both quotes
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                fields.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        // Add the last field
        fields.push(current);

        return fields;
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

        const headers = this.parseCSVLine(lines[0]);
        const assessments = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const assessment = {};
                headers.forEach((header, index) => {
                    let value = values[index];
                    // Parse JSON strings for complex objects
                    if ((header === 'categoryRisks' || header === 'questionsAnswers') && value) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            value = header === 'categoryRisks' ? {} : [];
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
            return 'id,age,gender,familyHistory,riskScore,riskLevel,categoryRisks,questionsAnswers,timestamp\n';
        }

        const headers = Object.keys(this.assessments[0]);
        const csvLines = [headers.join(',')];

        this.assessments.forEach(assessment => {
            const values = headers.map(header => {
                let value = assessment[header] || '';

                // Stringify complex objects for CSV storage
                if ((header === 'categoryRisks' || header === 'questionsAnswers') && typeof value === 'object') {
                    value = JSON.stringify(value);
                }

                // Apply proper CSV escaping
                return this.escapeCSVField(value);
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
        const ages = {};
        const avgRiskScore = total > 0
            ? this.assessments.reduce((sum, a) => sum + (a.riskScore || 0), 0) / total
            : 0;

        this.assessments.forEach(assessment => {
            // Count risk levels
            if (assessment.riskLevel) {
                riskLevels[assessment.riskLevel] = (riskLevels[assessment.riskLevel] || 0) + 1;
            }

            // Count ages
            const age = assessment.age || 'unknown';
            ages[age] = (ages[age] || 0) + 1;
        });

        return {
            total,
            averageRiskScore: Math.round(avgRiskScore * 100) / 100,
            riskLevelDistribution: riskLevels,
            ageDistribution: ages
        };
    }
}

