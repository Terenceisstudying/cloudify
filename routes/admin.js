import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QuestionModel } from '../models/questionModel.js';
import { AssessmentModel } from '../models/assessmentModel.js';
import { CancerTypeModel } from '../models/cancerTypeModel.js';

const router = express.Router();
const questionModel = new QuestionModel();
const assessmentModel = new AssessmentModel();
const cancerTypeModel = new CancerTypeModel();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assessmentsCsvPath = path.join(__dirname, '..', 'data', 'assessments.csv');

// ==================== CANCER TYPE ENDPOINTS ====================

/**
 * GET /api/admin/cancer-types
 * Get all cancer types with question counts
 */
router.get('/cancer-types', async (req, res) => {
    try {
        const cancerTypes = await cancerTypeModel.getAllCancerTypes();
        const questions = await questionModel.getAllQuestions();
        
        // Add question count and weight sum for each cancer type
        const cancerTypesWithStats = cancerTypes.map(ct => {
            const typeQuestions = questions.filter(q => 
                q.cancerType && q.cancerType.toLowerCase() === ct.id.toLowerCase()
            );
            const totalWeight = typeQuestions.reduce((sum, q) => {
                return sum + (parseFloat(q.weight) || 0);
            }, 0);
            
            return {
                ...ct,
                questionCount: typeQuestions.length,
                totalWeight: totalWeight.toFixed(2),
                isValid: Math.abs(totalWeight - 100) <= 1
            };
        });
        
        res.json({ success: true, data: cancerTypesWithStats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/admin/cancer-types/:id
 * Get a single cancer type with all its questions
 */
router.get('/cancer-types/:id', async (req, res) => {
    try {
        const cancerType = await cancerTypeModel.getCancerTypeById(req.params.id);
        
        if (!cancerType) {
            return res.status(404).json({ success: false, error: 'Cancer type not found' });
        }
        
        const questions = await questionModel.getQuestionsByCancerType(req.params.id);
        const totalWeight = questions.reduce((sum, q) => sum + (parseFloat(q.weight) || 0), 0);
        
        res.json({ 
            success: true, 
            data: {
                ...cancerType,
                questions,
                questionCount: questions.length,
                totalWeight: totalWeight.toFixed(2),
                isValid: Math.abs(totalWeight - 100) <= 1
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/admin/cancer-types
 * Create a new cancer type
 */
router.post('/cancer-types', async (req, res) => {
    try {
        const { id, ...cancerTypeData } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'Cancer type ID is required' });
        }
        
        // Normalize ID to lowercase
        const normalizedId = id.toLowerCase().trim();
        
        const cancerType = await cancerTypeModel.createCancerType({
            id: normalizedId,
            ...cancerTypeData
        });
        
        res.json({ success: true, data: cancerType });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/admin/cancer-types/:id
 * Update a cancer type and optionally its questions
 */
router.put('/cancer-types/:id', async (req, res) => {
    try {
        const { questions, ...cancerTypeData } = req.body;
        
        // Update cancer type config
        const updatedCancerType = await cancerTypeModel.updateCancerType(req.params.id, cancerTypeData);
        
        let questionsResult = { updated: 0, added: 0, deleted: 0 };
        
        // Update questions if provided
        if (questions && Array.isArray(questions)) {
            const existingQuestions = await questionModel.getQuestionsByCancerType(req.params.id);
            const existingIds = new Set(existingQuestions.map(q => q.id));
            const newIds = new Set(questions.filter(q => q.id).map(q => q.id));
            
            // Find questions to delete (exist in DB but not in new list)
            const toDelete = existingQuestions.filter(q => !newIds.has(q.id));
            for (const q of toDelete) {
                await questionModel.deleteQuestion(q.id);
                questionsResult.deleted++;
            }
            
            // Update existing and create new questions
            for (const q of questions) {
                if (q.id && existingIds.has(q.id)) {
                    // Update existing
                    await questionModel.updateQuestion(q.id, {
                        ...q,
                        cancerType: req.params.id
                    });
                    questionsResult.updated++;
                } else {
                    // Create new
                    await questionModel.createQuestion({
                        ...q,
                        cancerType: req.params.id
                    });
                    questionsResult.added++;
                }
            }
        }
        
        res.json({ 
            success: true, 
            data: updatedCancerType,
            questionsResult
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/admin/cancer-types/:id
 * Delete a cancer type and all its questions
 */
router.delete('/cancer-types/:id', async (req, res) => {
    try {
        // Delete all questions for this cancer type
        await questionModel.deleteQuestionsByCancerType(req.params.id);
        
        // Delete the cancer type itself
        await cancerTypeModel.deleteCancerType(req.params.id);
        
        res.json({ success: true, message: 'Cancer type and all associated questions deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== QUESTION ENDPOINTS ====================

/**
 * GET /api/admin/questions
 * Get all questions (for admin management)
 */
router.get('/questions', async (req, res) => {
    try {
        const questions = await questionModel.getAllQuestions();
        res.json({ success: true, data: questions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/admin/questions/:id
 * Get a specific question by ID
 */
router.get('/questions/:id', async (req, res) => {
    try {
        const question = await questionModel.getQuestionById(req.params.id);

        if (!question) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }

        res.json({ success: true, data: question });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/admin/questions/bulk
 * Create multiple questions with duplicate detection and cancer type merging
 */
router.post('/questions/bulk', async (req, res) => {
    try {
        const { questions } = req.body;
        
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Questions array is required and must not be empty' 
            });
        }

        const result = await questionModel.bulkCreateQuestions(questions);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/admin/questions
 * Create a new question
 */
router.post('/questions', async (req, res) => {
    try {
        const question = await questionModel.createQuestion(req.body);
        res.json({ success: true, data: question });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/admin/questions/:id
 * Update a question
 */
router.put('/questions/:id', async (req, res) => {
    try {
        const question = await questionModel.updateQuestion(req.params.id, req.body);
        res.json({ success: true, data: question });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/admin/questions/:id
 * Delete a question
 */
router.delete('/questions/:id', async (req, res) => {
    try {
        await questionModel.deleteQuestion(req.params.id);
        res.json({ success: true, message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ASSESSMENT ENDPOINTS ====================

/**
 * GET /api/admin/assessments
 * Get all assessments (for analytics)
 */
router.get('/assessments', async (req, res) => {
    try {
        const assessments = await assessmentModel.getAllAssessments();
        res.json({ success: true, data: assessments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/assessments/export', (req, res) => {
    try {
        if (!fs.existsSync(assessmentsCsvPath)) {
            return res.status(404).json({ success: false, error: 'Assessments file not found' });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="assessments.csv"');

        fs.createReadStream(assessmentsCsvPath).pipe(res);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export { router as adminRouter };
