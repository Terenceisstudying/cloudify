# SCS Risk Assessment Backend API

Node.js/Express backend for the Colorectal Cancer Risk Assessment Tool.

## Architecture

This backend follows the **MVC (Model-View-Controller)** pattern:

- **Models**: `models/questionModel.js`, `models/assessmentModel.js` - Handle data operations
- **Controllers**: `controllers/riskCalculator.js` - Business logic for risk calculation
- **Routes**: `routes/*.js` - API endpoints (View layer in MVC context)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Server runs on:** `http://localhost:3000`

## API Endpoints

### Questions
- `GET /api/questions` - Get all questions (optional query: `?age=45`)
- `GET /api/questions/:id` - Get specific question

### Assessments
- `POST /api/assessments` - Submit new assessment
- `GET /api/assessments/stats` - Get aggregate statistics

### Admin
- `GET /api/admin/questions` - Get all questions (admin)
- `POST /api/admin/questions` - Create new question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question
- `GET /api/admin/assessments` - Get all assessments

### Health Check
- `GET /api/health` - Server status

## Data Storage

Currently uses JSON files in `data/` directory:
- `data/questions.csv` - Question database
- `data/assessments.csv` - Assessment results (anonymous)

**Note:** For production, consider migrating to a proper database (PostgreSQL, MongoDB, etc.)

## Privacy

- All assessments are stored **anonymously** (no PII)
- Only age ranges, sex, family history, and risk scores are stored
- No names, emails, or phone numbers are saved

