import express from 'express';
import { QuestionModel } from '../models/questionModel.js';

const router = express.Router();
const questionModel = new QuestionModel();

/**
 * GET /api/questions/cancer-types
 * Returns all unique cancer types
 * IMPORTANT: This route must come BEFORE the /:id route
 */
router.get('/cancer-types', async (req, res) => {
    try {
        const questions = await questionModel.getAllQuestions();
        const cancerTypes = [...new Set(
            questions
                .map(q => q.cancerType)
                .filter(type => type && type.trim())
        )].sort();
        
        res.json({ success: true, data: cancerTypes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/questions
 * Returns all questions (optionally filtered by age)
 */
router.get('/', async (req, res) => {
    try {
        const { age, cancerType } = req.query;
        let questions = await questionModel.getAllQuestions(age ? parseInt(age) : null);
        
        // Filter by cancer type if provided
        if (cancerType) {
            questions = questions.filter(q => 
                q.cancerType && 
                q.cancerType.toLowerCase() === cancerType.toLowerCase()
            );
        }
        
        res.json({ success: true, data: questions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/questions/:id
 * Returns a specific question by ID
 */
router.get('/:id', async (req, res) => {
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

export { router as questionsRouter };
