/**
 * Question Loader (Frontend)
 * Loads questions using ApiService
 * Provides client-side caching and filtering
 */

import { ApiService } from './apiService.js';

export class QuestionLoader {
    static cache = {};
    static allQuestionsCache = null;

    /**
     * Get all unique cancer types from the backend
     */
    static async getAllCancerTypes() {
        try {
            // Try to fetch from dedicated endpoint first
            const API_BASE_URL = window.location.origin.includes('localhost') 
                ? 'http://localhost:3000/api' 
                : '/api';
            
            try {
                const response = await fetch(`${API_BASE_URL}/questions/cancer-types`);
                const result = await response.json();
                
                if (result.success && result.data) {
                    return result.data;
                }
            } catch (error) {
                console.warn('Cancer types endpoint not available, extracting from questions');
            }
            
            // Fallback: Load all questions and extract cancer types
            const questions = await this.loadAllQuestions();
            
            // Extract unique cancer types
            const cancerTypes = new Set();
            questions.forEach(q => {
                if (q.cancerType && q.cancerType.trim()) {
                    cancerTypes.add(q.cancerType.trim());
                }
            });
            
            return Array.from(cancerTypes).sort();
        } catch (error) {
            console.error('Error getting cancer types:', error);
            throw error;
        }
    }

    /**
     * Load all questions from the backend using ApiService
     */
    static async loadAllQuestions() {
        if (this.allQuestionsCache) {
            return this.allQuestionsCache;
        }

        try {
            // Use the existing ApiService
            const questions = await ApiService.getQuestions();
            this.allQuestionsCache = questions || [];
            return this.allQuestionsCache;
        } catch (error) {
            console.error('Error loading questions from API:', error);
            throw error;
        }
    }

    /**
     * Load questions for a specific cancer type
     * Filters by cancer type and optionally by user age
     */
    static async loadQuestions(cancerType, userAge = null) {
        // Create cache key
        const cacheKey = `${cancerType}_${userAge || 'all'}`;
        
        // Check cache first
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            // Option 1: Try to fetch filtered questions directly from API
            const API_BASE_URL = window.location.origin.includes('localhost') 
                ? 'http://localhost:3000/api' 
                : '/api';
            
            const params = new URLSearchParams();
            params.append('cancerType', cancerType);
            if (userAge) {
                params.append('age', userAge);
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/questions?${params.toString()}`);
                const result = await response.json();
                
                if (result.success && result.data) {
                    const questions = this.formatQuestions(result.data);
                    this.cache[cacheKey] = questions;
                    return questions;
                }
            } catch (error) {
                console.warn('Filtered API request failed, using client-side filtering');
            }
            
            // Option 2: Fallback to client-side filtering
            const allQuestions = await this.loadAllQuestions();
            
            // Filter by cancer type and age
            const filtered = allQuestions.filter(q => {
                // Check cancer type match (case-insensitive)
                if (!q.cancerType || q.cancerType.toLowerCase() !== cancerType.toLowerCase()) {
                    return false;
                }
                
                // Check age requirement if specified
                if (q.minAge && userAge) {
                    const minAge = parseInt(q.minAge);
                    if (!isNaN(minAge) && userAge < minAge) {
                        return false;
                    }
                }
                
                return true;
            });

            // Format questions for consistency
            const questions = this.formatQuestions(filtered);
            
            // Cache the results
            this.cache[cacheKey] = questions;
            return questions;
        } catch (error) {
            console.error('Error loading questions:', error);
            throw error;
        }
    }

    /**
     * Format questions to ensure consistent structure
     */
    static formatQuestions(questions) {
        return questions.map(q => ({
            id: q.id,
            prompt: q.prompt,
            question: q.prompt,
            correctAnswer: q.correctAnswer,
            risk: q.risk,
            category: q.category,
            explanation: q.explanation,
            minAge: q.minAge ? parseInt(q.minAge) : null
        }));
    }

    /**
     * Clear all caches (useful for testing or refreshing data)
     */
    static clearCache() {
        this.cache = {};
        this.allQuestionsCache = null;
    }

    /**
     * Reload data from server (bypasses cache)
     */
    static async reload() {
        this.clearCache();
        return await this.loadAllQuestions();
    }
}