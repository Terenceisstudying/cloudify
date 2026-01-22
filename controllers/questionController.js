import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questionsPath = path.join(__dirname, '../data/questions.csv');
// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
// Function to read questions from CSV
const readQuestionsFromCSV = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(questionsPath)) {
            return reject(new Error('Questions file not found'));
        }
        fs.createReadStream(questionsPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};
// Get all questions
export const getQuestions = async (req, res) => {
    try {
        const questions = await readQuestionsFromCSV();
        res.json({ success: true, data: questions });
    } catch (error) {
        console.error('Error in getQuestions:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error reading questions data' 
        });
    }
};
// Get question by ID
export const getQuestionById = async (req, res) => {
    try {
        const questions = await readQuestionsFromCSV();
        const question = questions[req.params.id];
        
        if (!question) {
            return res.status(404).json({ 
                success: false, 
                error: 'Question not found' 
            });
        }
        
        res.json({ success: true, data: question });
    } catch (error) {
        console.error('Error in getQuestionById:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error reading question data' 
        });
    }
};
// Add a new question
export const addQuestion = async (req, res) => {
    try {
        const newQuestion = req.body;
        const questions = await readQuestionsFromCSV();
        
        // Add the new question
        questions.push(newQuestion);
        
        // Convert questions back to CSV format
        const header = Object.keys(questions[0]).join(',') + '\n';
        const csvContent = questions.map(q => 
            Object.values(q).map(field => 
                typeof field === 'string' && field.includes(',') ? `"${field}"` : field
            ).join(',')
        ).join('\n');
        
        // Write back to file
        fs.writeFileSync(questionsPath, header + csvContent);
        
        res.status(201).json({ 
            success: true, 
            message: 'Question added successfully' 
        });
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error adding question' 
        });
    }
};
