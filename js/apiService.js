/**
 * API Service - Handles all backend API communication
 */

const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000/api' 
    : '/api';

export class ApiService {
    /**
     * Fetch all cancer types from backend
     */
    static async getCancerTypes() {
        try {
            const response = await fetch(`${API_BASE_URL}/questions/cancer-types`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch cancer types');
            }
            return result.data;
        } catch (error) {
            console.error('Error fetching cancer types:', error);
            throw error;
        }
    }

    /**
     * Fetch all questions from backend
     */
    static async getQuestions(userAge = null, cancerType = null) {
        try {
            const params = new URLSearchParams();
            if (userAge) params.append('age', userAge);
            if (cancerType) params.append('cancerType', cancerType);
            
            const url = userAge 
                ? `${API_BASE_URL}/questions?age=${userAge}`
                : `${API_BASE_URL}/questions`;
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch questions');
            }
            
            return result.data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            // Fallback to local questions if API fails
            throw error;
        }
    }

    /**
     * Submit assessment to backend
     */
    static async submitAssessment(userData, answers) {
        try {
            const response = await fetch(`${API_BASE_URL}/assessments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userData,
                    answers
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to submit assessment');
            }
            
            return result.data;
        } catch (error) {
            console.error('Error submitting assessment:', error);
            throw error;
        }
    }

    /**
     * Get assessment statistics (for admin/analytics)
     */
    static async getStatistics() {
        try {
            const response = await fetch(`${API_BASE_URL}/assessments/stats`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch statistics');
            }
            
            return result.data;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    static async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Backend not available:', error);
            return { status: 'error', message: 'Backend unavailable' };
        }
    }
}

