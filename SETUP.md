# Setup Guide - SCS Risk Assessment Tool

## Quick Start

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Start the Backend Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Open the Frontend

Open `index.html` in your browser, or if running the server, visit:
- `http://localhost:3000` (served by Express)

## Architecture

### Backend (Node.js/Express)
- **Server**: `server.js` - Main Express server
- **Routes**: `routes/*.js` - API endpoints
- **Models**: `models/*.js` - Data layer (JSON file storage)
- **Controllers**: `controllers/*.js` - Business logic

### Frontend (Vanilla JS)
- **Main App**: `js/main.js` - Application controller
- **API Service**: `js/apiService.js` - Backend communication
- **Modules**: `js/*.js` - MVC structure

## API Endpoints

- `GET /api/questions` - Get all questions
- `GET /api/questions?age=45` - Get questions filtered by age
- `POST /api/assessments` - Submit assessment
- `GET /api/assessments/stats` - Get statistics
- `GET /api/admin/questions` - Admin: Get all questions
- `POST /api/admin/questions` - Admin: Create question
- `GET /api/health` - Health check

## Development Mode

For auto-reload during development:
```bash
npm run dev
```

## Data Storage

Data is stored in JSON files in `data/`:
- `data/questions.csv` - Question database
- `data/assessments.csv` - Assessment results (anonymous)

**Note**: These files are created automatically on first run.

## Fallback Mode

If the backend is unavailable, the frontend will automatically fall back to using local questions from `js/questions.js`.

