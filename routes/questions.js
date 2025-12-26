import express from 'express';
import { QuestionModel } from '../models/questionModel.js';

const router = express.Router();
const questionModel = new QuestionModel();

/**
 * GET /api/questions
 * Returns all questions (optionally filtered by age)
 */
router.get('/', async (req, res) => {
    try {
        const { age } = req.query;
        const questions = await questionModel.getAllQuestions(age ? parseInt(age) : null);
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

