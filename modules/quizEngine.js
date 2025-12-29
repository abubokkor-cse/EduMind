

import { progressTracker } from './progressTracker.js';


export class QuizEngine {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.answers = [];
    }

    /**
     * Generate quiz questions using AI
     * @param {Function} aiCall - Function to call AI API
     * @param {string} subject - Subject name
     * @param {string} topic - Topic name
     * @param {number} count - Number of questions
     * @param {string} difficulty - Difficulty level (easy, medium, hard)
     */
    async generateQuiz(aiCall, subject, topic, count = 5, difficulty = 'medium') {
        const prompt = `Generate ${count} multiple choice quiz questions about "${topic}" in ${subject}.

Difficulty: ${difficulty}

IMPORTANT: Return ONLY valid JSON array, no other text.

Format:
[
  {
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct": "A",
    "explanation": "Brief explanation of why this is correct"
  }
]

Make questions educational and appropriate for students.`;

        try {
            const response = await aiCall(prompt);

            
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Could not parse quiz JSON');
            }

            const questions = JSON.parse(jsonMatch[0]);

            this.currentQuiz = {
                subject,
                topic,
                difficulty,
                questions,
                startTime: new Date().toISOString()
            };

            this.currentQuestionIndex = 0;
            this.answers = [];

            return this.currentQuiz;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
        }
    }

    
    getCurrentQuestion() {
        if (!this.currentQuiz || this.currentQuestionIndex >= this.currentQuiz.questions.length) {
            return null;
        }

        return {
            index: this.currentQuestionIndex,
            total: this.currentQuiz.questions.length,
            ...this.currentQuiz.questions[this.currentQuestionIndex]
        };
    }

    /**
     * Submit answer for current question
     * @param {string} answer - Selected answer (A, B, C, or D)
     */
    submitAnswer(answer) {
        if (!this.currentQuiz) return null;

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const isCorrect = answer.toUpperCase() === question.correct.toUpperCase();

        this.answers.push({
            questionIndex: this.currentQuestionIndex,
            userAnswer: answer,
            correctAnswer: question.correct,
            isCorrect,
            question: question.question
        });

        
        progressTracker.updateMastery(
            this.currentQuiz.subject,
            this.currentQuiz.topic,
            isCorrect
        );

        const result = {
            isCorrect,
            correctAnswer: question.correct,
            explanation: question.explanation,
            hasNext: this.currentQuestionIndex < this.currentQuiz.questions.length - 1
        };

        this.currentQuestionIndex++;

        return result;
    }

    
    getResults() {
        if (!this.currentQuiz) return null;

        const correct = this.answers.filter(a => a.isCorrect).length;
        const total = this.currentQuiz.questions.length;
        const percentage = (correct / total) * 100;

        // Record quiz in progress tracker
        progressTracker.recordQuiz(
            this.currentQuiz.subject,
            this.currentQuiz.questions.length,
            correct,
            total
        );

        
        let grade, message;
        if (percentage >= 90) {
            grade = 'A+';
            message = 'Excellent! You have mastered this topic!';
        } else if (percentage >= 80) {
            grade = 'A';
            message = 'Great job! You have a strong understanding!';
        } else if (percentage >= 70) {
            grade = 'B';
            message = 'Good work! A bit more practice will help!';
        } else if (percentage >= 60) {
            grade = 'C';
            message = 'Not bad! Keep studying to improve!';
        } else if (percentage >= 50) {
            grade = 'D';
            message = 'You need more practice. Let\'s review the topic!';
        } else {
            grade = 'F';
            message = 'Don\'t worry! Let\'s go through the material again.';
        }

        return {
            subject: this.currentQuiz.subject,
            topic: this.currentQuiz.topic,
            difficulty: this.currentQuiz.difficulty,
            correct,
            total,
            percentage: percentage.toFixed(1),
            grade,
            message,
            answers: this.answers,
            duration: this.calculateDuration()
        };
    }

    
    calculateDuration() {
        if (!this.currentQuiz?.startTime) return '0:00';

        const start = new Date(this.currentQuiz.startTime);
        const end = new Date();
        const seconds = Math.floor((end - start) / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Reset quiz
     */
    resetQuiz() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.answers = [];
    }

    
    async generateReviewQuiz(aiCall, recentTopics, count = 5) {
        if (!recentTopics || recentTopics.length === 0) {
            throw new Error('No topics to review');
        }

        const topicList = recentTopics.map(t => `${t.subject}: ${t.topic}`).join(', ');

        const prompt = `Generate ${count} mixed review questions covering these topics: ${topicList}

IMPORTANT: Return ONLY valid JSON array, no other text.

Format:
[
  {
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct": "A",
    "explanation": "Brief explanation",
    "topic": "Which topic this question is about"
  }
]`;

        try {
            const response = await aiCall(prompt);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Could not parse quiz JSON');
            }

            const questions = JSON.parse(jsonMatch[0]);

            this.currentQuiz = {
                subject: 'Review',
                topic: 'Mixed Topics',
                difficulty: 'mixed',
                questions,
                startTime: new Date().toISOString()
            };

            this.currentQuestionIndex = 0;
            this.answers = [];

            return this.currentQuiz;
        } catch (error) {
            console.error('Error generating review quiz:', error);
            throw error;
        }
    }
}


export const quizEngine = new QuizEngine();
export default quizEngine;
