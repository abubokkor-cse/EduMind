

import { TalkingHead } from "./modules/edumindHead.js";
import { marked } from "marked";
import dompurify from "dompurify";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

// ============================================
// API MODE CONFIGURATION
// Set to 'serverless' for production (secure)
// Set to 'direct' for local development
// ============================================
const API_MODE = window.location.hostname === 'localhost' ? 'direct' : 'serverless';

import {
    initAuth,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    getCurrentUser,
    getUserProfile,
    saveProgress,
    loadProgress,
    saveChatHistory,
    loadChatHistory,
    loadChat,
    updateChatHistory,
    deleteChat,
    renameChat,
    getCurrentChatId,
    setCurrentChatId,
    saveQuizResult,
    saveStudentProfileToFirestore,
    loadStudentProfileFromFirestore,
    resetPassword,
    uploadProfilePicture,
    updateDisplayName,
    showUserProfile,
    showLoginForm,
    saveLearningState,
    loadLearningState,
    getCachedAuthState,
    updateHeaderAuthUI,
    // Textbook Library functions
    getTextbooks,
    checkTextbookExists,
    checkUniversityTextbookExists,
    uploadTextbook,
    saveTextbookChapters,
    getTextbookChapters,
    searchChapters
} from './auth.js';


import { detectIntent, extractCurriculumInfo, getModeButtons, INTENT_TYPES } from "./modules/intentDetector.js";
import {
    CURRICULUM_DATA,
    COUNTRIES,
    EDUCATION_LEVELS,
    ACADEMIC_STREAMS,
    UNIVERSITY_DEPARTMENTS,
    getSubjectsForClass,
    searchCurriculum,
    getCountry,
    getEducationLevel,
    getUniversityProgram,
    getDepartmentPrograms,
    getSubjectsForProfile,
    searchCountries
} from "./modules/curriculumData.js";
import { progressTracker, MASTERY_LEVELS } from "./modules/progressTracker.js";
import { quizEngine } from "./modules/quizEngine.js";
import * as EduMindDB from "./modules/database.js";


import {
    initPayments,
    getUserCredits,
    deductCredits,
    canPerformAction,
    showSubscriptionPlans,
    showUpgradePrompt,
    updateCreditsDisplay,
    CREDIT_COSTS,
    setUserCurrency,
    getCurrentCurrency,
    formatPrice,
    getPlanPrice,
    getPackagePrice
} from "./modules/payments.js";

// ===========================================

// Production detection - use serverless API endpoints on Vercel
const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Make currency functions globally available
window.setUserCurrency = setUserCurrency;
window.getCurrentCurrency = getCurrentCurrency;
window.formatPrice = formatPrice;
window.getPlanPrice = getPlanPrice;
window.getPackagePrice = getPackagePrice;
console.log("🌐 Environment:", IS_PRODUCTION ? "PRODUCTION (using serverless APIs)" : "LOCAL (using direct APIs)");

const CONFIG = {
    // Production mode flag
    isProduction: IS_PRODUCTION,

    // API Endpoints
    geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/",
    geminiLiveEndpoint: "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent",
    googleTTSEndpoint: "https://texttospeech.googleapis.com/v1/text:synthesize",
    elevenLabsEndpoint: "https://api.elevenlabs.io/v1",


    models: {

        chat: "gemini-3-flash-preview",

        // Gemini 3 Flash - Research with Google Search grounding
        research: "gemini-3-flash-preview",


        document: "gemini-3-flash-preview",


        imageGen: "gemini-3-pro-image-preview",

        // Gemini 2.5 Flash - Fallback for unsupported features (image segmentation, etc.)
        fallback: "gemini-2.5-flash-preview-05-20",


        live: "gemini-2.5-flash-native-audio-preview-12-2025"
    },

    // ============================================
    // API KEYS - FOR LOCAL DEVELOPMENT ONLY
    // ============================================
    // In production (Vercel), API calls go through serverless functions
    // and keys are stored securely in Vercel Environment Variables.
    // 
    // For local testing, replace these with your own API keys:
    // - Get Gemini API key: https://aistudio.google.com/apikey
    // - Get ElevenLabs API key: https://elevenlabs.io/api
    // ============================================
    geminiApiKey: "YOUR_GEMINI_API_KEY_HERE",
    elevenLabsApiKey: "YOUR_ELEVENLABS_API_KEY_HERE",

    // Serverless API endpoints (used in production)
    apiEndpoints: {
        gemini: '/api/gemini',
        geminiStream: '/api/gemini-stream',
        tts: '/api/tts',
        image: '/api/image',
        vision: '/api/vision',
        upload: '/api/upload'
    },

    // Teacher Avatars - Male (Sir Abubokkor) and Female (Ma'am Queen)
    teacherAvatars: {
        male: {
            url: "./avatar/69435286403c000063429870.glb",
            name: "Abubokkor",
            title: "Sir",
            body: "M",
            ttsVoice: "en-GB-Standard-D",
            elevenLabsVoice: "pNInz6obpgDQGcFmaJgB"
        },
        female: {
            url: "./avatar/694febf38f9c70cbc97ec46e.glb",
            name: "Queen",
            title: "Ma'am",
            body: "F",
            ttsVoice: "en-GB-Standard-A",
            elevenLabsVoice: "21m00Tcm4TlvDq8ikWAM" // Rachel (female)
        }
    },


    currentTeacher: "male",


    avatarUrl: "./avatar/69435286403c000063429870.glb",

    // Classroom background URL
    classroomUrl: "./avatar/classroom_default.glb",


    tts: {
        enabled: true,
        provider: "elevenlabs",

        // Google Cloud TTS Settings (Fallback - Fast & Reliable)
        googleVoice: "en-US-Wavenet-D",
        speakingRate: 1.0,
        pitch: 0,           // -20.0 to 20.0



        //         "eleven_multilingual_v2" (29 languages, NO Bengali)

        elevenLabsModel: "eleven_v3",
        elevenLabsVoice: "pNInz6obpgDQGcFmaJgB",  // Adam (multilingual)
        stability: 0.5,
        similarityBoost: 0.75,

        language: "en"      // Will auto-detect from text
    },


    teacherStyle: "friendly",
    subjectFocus: "general"
};


// Multi-Provider TTS Language & Voice Mapping


const TTS_LANGUAGES = {
    // South Asian Languages
    'bn': {
        google: { code: 'bn-IN', voice: 'bn-IN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'bn-BD',
        name: 'Bengali/Bangla'
    },
    'hi': {
        google: { code: 'hi-IN', voice: 'hi-IN-Wavenet-D' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'hi-IN',
        name: 'Hindi'
    },
    'ta': {
        google: { code: 'ta-IN', voice: 'ta-IN-Wavenet-D' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'ta-IN',
        name: 'Tamil'
    },
    'te': {
        google: { code: 'te-IN', voice: 'te-IN-Standard-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'te-IN',
        name: 'Telugu'
    },
    'mr': {
        google: { code: 'mr-IN', voice: 'mr-IN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'mr-IN',
        name: 'Marathi'
    },
    'gu': {
        google: { code: 'gu-IN', voice: 'gu-IN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'gu-IN',
        name: 'Gujarati'
    },
    'kn': {
        google: { code: 'kn-IN', voice: 'kn-IN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'kn-IN',
        name: 'Kannada'
    },
    'ml': {
        google: { code: 'ml-IN', voice: 'ml-IN-Wavenet-D' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'ml-IN',
        name: 'Malayalam'
    },
    'pa': {
        google: { code: 'pa-IN', voice: 'pa-IN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'pa-IN',
        name: 'Punjabi'
    },
    'ur': {
        google: { code: 'ur-IN', voice: 'ur-IN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'ur-PK',
        name: 'Urdu'
    },


    'en': {
        google: { code: 'en-US', voice: 'en-US-Wavenet-D' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'en-US',
        name: 'English'
    },
    'es': {
        google: { code: 'es-ES', voice: 'es-ES-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'es-ES',
        name: 'Spanish'
    },
    'fr': {
        google: { code: 'fr-FR', voice: 'fr-FR-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'fr-FR',
        name: 'French'
    },
    'de': {
        google: { code: 'de-DE', voice: 'de-DE-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'de-DE',
        name: 'German'
    },
    'it': {
        google: { code: 'it-IT', voice: 'it-IT-Wavenet-C' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'it-IT',
        name: 'Italian'
    },
    'pt': {
        google: { code: 'pt-BR', voice: 'pt-BR-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'pt-BR',
        name: 'Portuguese'
    },
    'ru': {
        google: { code: 'ru-RU', voice: 'ru-RU-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'ru-RU',
        name: 'Russian'
    },
    'pl': {
        google: { code: 'pl-PL', voice: 'pl-PL-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        speechRecognition: 'pl-PL',
        name: 'Polish'
    },
    'nl': {
        google: { code: 'nl-NL', voice: 'nl-NL-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Dutch'
    },
    'tr': {
        google: { code: 'tr-TR', voice: 'tr-TR-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Turkish'
    },

    // Asian Languages
    'zh': {
        google: { code: 'cmn-CN', voice: 'cmn-CN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Chinese'
    },
    'ja': {
        google: { code: 'ja-JP', voice: 'ja-JP-Wavenet-D' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Japanese'
    },
    'ko': {
        google: { code: 'ko-KR', voice: 'ko-KR-Wavenet-D' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Korean'
    },
    'vi': {
        google: { code: 'vi-VN', voice: 'vi-VN-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Vietnamese'
    },
    'th': {
        google: { code: 'th-TH', voice: 'th-TH-Standard-A' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Thai'
    },
    'id': {
        google: { code: 'id-ID', voice: 'id-ID-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Indonesian'
    },
    'ms': {
        google: { code: 'ms-MY', voice: 'ms-MY-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Malay'
    },


    'ar': {
        google: { code: 'ar-XA', voice: 'ar-XA-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Arabic'
    },
    'fa': {
        google: { code: 'fa-IR', voice: 'fa-IR-Standard-A' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Persian'
    },
    'he': {
        google: { code: 'he-IL', voice: 'he-IL-Wavenet-B' },
        elevenlabs: { voiceId: 'pNInz6obpgDQGcFmaJgB' },
        name: 'Hebrew'
    }
};


// Auto-detect Language from Text Content


function detectLanguageFromText(text) {
    if (!text) return 'en';

    // Bengali/Bangla script: অ-ঔ, ক-হ, ০-৯
    if (/[\u0980-\u09FF]/.test(text)) return 'bn';


    if (/[\u0900-\u097F]/.test(text)) return 'hi';


    if (/[\u0600-\u06FF]/.test(text)) return 'ar';

    // Chinese characters
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';


    if (/[\u3040-\u30FF]/.test(text)) return 'ja';


    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';

    // Tamil script
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';


    if (/[\u0C00-\u0C7F]/.test(text)) return 'te';


    if (/[\u0E00-\u0E7F]/.test(text)) return 'th';

    // Russian/Cyrillic script
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';


    if (/[\u0590-\u05FF]/.test(text)) return 'he';


    if (/[\u0370-\u03FF]/.test(text)) return 'el';

    // Gujarati script
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';


    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';


    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';

    // Kannada script
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';




    // Default to student's preferred language or English
    return getStudentLanguage() || 'en';
}

// ===========================================
// Helper function for Gemini API calls (handles local vs production)
// ===========================================
async function callGeminiAPI(model, body, stream = false) {
    let url, headers;

    if (IS_PRODUCTION) {
        // Production: Use serverless API
        url = stream ? CONFIG.apiEndpoints.geminiStream : CONFIG.apiEndpoints.gemini;
        headers = { "Content-Type": "application/json" };
        body.model = model; // Include model in body for serverless
        console.log("📡 Using serverless API:", url);
    } else {
        // Local: Direct API call
        const endpoint = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
        url = `${CONFIG.geminiEndpoint}${model}:${endpoint}`;
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": CONFIG.geminiApiKey
        };
        console.log("📡 Direct API URL:", url);
    }

    return await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });
}

// ===========================================
function getModelForTask(taskType, hasFile = false, fileType = null) {
    switch (taskType) {
        case 'chat':
        case 'curriculum':
            return CONFIG.models.chat;

        case 'research':
            return CONFIG.models.research;

        case 'file':

            return CONFIG.models.document;

        case 'image_generation':
            return CONFIG.models.imageGen;

        case 'image_segmentation':

            return CONFIG.models.fallback;

        default:
            return CONFIG.models.chat;
    }
}

// ===========================================


function buildGenerationConfig(taskType, fileType = null) {
    const config = {
        // Gemini 3 recommends temperature 1.0 - don't change it!

    };

    switch (taskType) {
        case 'chat':
            config.maxOutputTokens = 4096;
            config.thinkingConfig = { thinkingLevel: "low" };
            break;

        case 'curriculum':
            config.maxOutputTokens = 4096;
            config.thinkingConfig = { thinkingLevel: "medium" };  // Balanced
            break;

        case 'research':
            config.maxOutputTokens = 8192;
            config.thinkingConfig = { thinkingLevel: "high" };
            break;

        case 'file':
            config.maxOutputTokens = 8192;
            config.thinkingConfig = { thinkingLevel: "medium" };
            break;

        default:
            config.maxOutputTokens = 4096;
            config.thinkingConfig = { thinkingLevel: "medium" };
    }

    return config;
}


// Media Resolution for Files (Gemini 3)

function getMediaResolution(mimeType) {

    if (mimeType === 'application/pdf') {
        return 'media_resolution_medium';  // 560 tokens
    }


    if (mimeType?.startsWith('image/')) {
        return 'media_resolution_high';
    }

    // Video - low/medium for general, high for text-heavy
    if (mimeType?.startsWith('video/')) {
        return 'media_resolution_low';
    }


    return 'media_resolution_medium';
}

// ===========================================


let head = null;
let isProcessing = false;
let conversationHistory = [];
let aiController = null;
let currentMode = 'chat';  // Default mode: chat, curriculum, file, research
let uploadedFile = null;
let uploadedFileData = null;
let uploadedFileUri = null;
let pendingResearch = new Map();
let studentProfile = null;
let isOnboarded = false;
let notificationCount = 0;
let isOnline = navigator.onLine;
let databaseInitialized = false;


// Helper Functions

function getStudentProfile() {
    return studentProfile;
}


// TalkingHead Teacher Behavior System


const TeacherBehavior = {
    // Available moods in TalkingHead
    MOODS: ['neutral', 'happy', 'angry', 'sad', 'fear', 'disgust', 'love', 'sleep'],


    GESTURES: ['handup', 'index', 'ok', 'thumbup', 'thumbdown', 'side', 'shrug', 'namaste'],


    TEACHING_GESTURES: {
        greeting: 'handup',
        pointing: 'index',
        approval: 'thumbup',
        disapproval: 'thumbdown',
        thinking: 'side',
        uncertain: 'shrug',
        agreement: 'ok',
        welcome: 'namaste'
    },

    // Mood keywords for automatic detection
    MOOD_TRIGGERS: {
        happy: [
            'great', 'excellent', 'well done', 'correct', 'good job', 'perfect',
            'wonderful', 'amazing', 'congratulations', 'proud', 'fantastic',
            'brilliant', 'awesome', 'superb', 'outstanding', 'bravo', 'yes!',
            'exactly', 'right', 'impressive', 'nice work', 'keep it up'
        ],
        sad: [
            'unfortunately', 'sorry to hear', 'difficult', 'struggle',
            "don't worry", "it's okay", 'sad', 'not quite', 'mistake',
            'try again', 'missed', 'wrong', 'incorrect', 'failed'
        ],
        fear: [
            'interesting question', 'let me think', 'hmm', "that's tricky",
            'good question', 'wow', 'surprising', 'unexpected', 'really?',
            'fascinating', 'intriguing', 'curious', 'remarkable'
        ],
        love: [
            'believe in you', 'you can do', 'keep trying', 'never give up',
            "i'm here to help", 'support', 'care', 'important', 'special',
            'proud of you', 'always here', 'together', 'help you'
        ],
        angry: [  // Stern/Serious
            'pay attention', 'focus', 'concentrate', 'serious', 'important',
            'must understand', 'critical', 'essential', 'warning', 'careful'
        ],
        disgust: [
            'no', 'wrong approach', 'not correct', 'bad habit', 'avoid',
            'never do', 'incorrect method', 'mistake'
        ]
    },


    EYE_CONTACT: {
        idle: 0.3,      // Look at student 30% while idle
        speaking: 0.7,
        listening: 0.8,
        thinking: 0.2   // Look away 80% while thinking
    },


    HEAD_MOVEMENT: {
        idle: 0.4,
        speaking: 0.6,
        excited: 0.8,
        calm: 0.2
    },


    currentGesture: null,
    lastMood: 'neutral',
    isTeaching: false,
    gestureTimeout: null,

    /**
     * Set mood with smart detection
     */
    setMood(mood) {
        if (!head || !this.MOODS.includes(mood)) return;

        try {
            head.setMood(mood);
            this.lastMood = mood;
            console.log(`👩‍🏫 Teacher mood: ${mood}`);
        } catch (e) {
            console.warn('Mood set failed:', e);
        }
    },


    detectAndSetMood(text) {
        if (!head || !text) return 'neutral';

        const lowerText = text.toLowerCase();

        for (const [mood, triggers] of Object.entries(this.MOOD_TRIGGERS)) {
            for (const trigger of triggers) {
                if (lowerText.includes(trigger)) {
                    this.setMood(mood);


                    if (mood !== 'neutral') {
                        setTimeout(() => this.setMood('neutral'), 4000);
                    }
                    return mood;
                }
            }
        }

        this.setMood('neutral');
        return 'neutral';
    },

    /**
     * Play a teaching gesture
     */
    playGesture(gestureName, duration = 3, mirror = false) {
        if (!head) return;


        if (this.gestureTimeout) {
            clearTimeout(this.gestureTimeout);
        }

        const gesture = this.TEACHING_GESTURES[gestureName] || gestureName;

        if (this.GESTURES.includes(gesture)) {
            try {
                head.playGesture(gesture, duration, mirror, 1000);
                this.currentGesture = gesture;
                console.log(`🖐️ Teacher gesture: ${gesture}`);


                this.gestureTimeout = setTimeout(() => {
                    this.stopGesture();
                }, duration * 1000);
            } catch (e) {
                console.warn('Gesture failed:', e);
            }
        }
    },

    /**
     * Stop current gesture
     */
    stopGesture() {
        if (!head) return;

        try {
            head.stopGesture(500);
            this.currentGesture = null;
        } catch (e) {

        }
    },


    lookAt(x, y, duration = 2000) {
        if (!head) return;

        try {
            head.lookAt(x, y, duration);
        } catch (e) {
            console.warn('LookAt failed:', e);
        }
    },

    /**
     * Make teacher look at camera (student)
     */
    lookAtStudent(duration = 3000) {
        if (!head) return;

        try {
            head.lookAtCamera(duration);
        } catch (e) {
            console.warn('LookAtCamera failed:', e);
        }
    },


    lookAtBoard(duration = 2000) {
        if (!head) return;

        try {
            head.lookAhead(duration);
        } catch (e) {
            console.warn('LookAhead failed:', e);
        }
    },


    makeEyeContact(duration = 5000) {
        if (!head) return;

        try {
            head.makeEyeContact(duration);
        } catch (e) {
            console.warn('Eye contact failed:', e);
        }
    },

    /**
     * Greeting sequence - used when student joins
     */
    async greetingSequence() {
        this.setMood('happy');
        await this.delay(500);
        this.playGesture('handup', 2);
        await this.delay(2000);
        this.makeEyeContact(5000);
    },


    async teachingSequence() {
        this.isTeaching = true;


        const behaviors = [
            () => this.playGesture('index', 2),      // Pointing
            () => this.lookAtBoard(1500),
            () => this.lookAtStudent(2000),
            () => this.playGesture('side', 1.5),     // Side gesture
            () => this.makeEyeContact(3000)
        ];


        const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        randomBehavior();
    },

    /**
     * Approval sequence - when student answers correctly
     */
    async approvalSequence() {
        this.setMood('happy');
        this.playGesture('thumbup', 2);
        this.makeEyeContact(3000);
        await this.delay(3000);
        this.setMood('neutral');
    },


    async encouragementSequence() {
        this.setMood('love');
        await this.delay(500);
        this.makeEyeContact(4000);
        await this.delay(4000);
        this.setMood('neutral');
    },


    async thinkingSequence() {
        this.setMood('fear');  // Thinking face
        this.lookAtBoard(2000);
        await this.delay(2000);
        this.lookAtStudent(1000);
        this.setMood('neutral');
    },


    async questionSequence() {
        this.playGesture('index', 2);
        this.makeEyeContact(5000);
    },

    /**
     * Explanation with gesture - for important points
     */
    async emphasisSequence() {
        this.playGesture('ok', 2);
        this.makeEyeContact(3000);
    },


    async smartBehavior(contentType, text = '') {
        switch (contentType) {
            case 'greeting':
                await this.greetingSequence();
                break;
            case 'explanation':
                await this.teachingSequence();
                break;
            case 'correct_answer':
                await this.approvalSequence();
                break;
            case 'encouragement':
                await this.encouragementSequence();
                break;
            case 'thinking':
                await this.thinkingSequence();
                break;
            case 'question':
                await this.questionSequence();
                break;
            case 'emphasis':
                await this.emphasisSequence();
                break;
            default:
                // Auto-detect from text
                this.detectAndSetMood(text);
        }
    },


    startIdleBehavior() {
        if (!head) return;


        // Just ensure we're in neutral state
        this.setMood('neutral');
    },


    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },


    configureForTeaching() {
        if (!head || !head.avatar) return;

        // Set eye contact and head movement for speaking
        try {

            console.log('👩‍🏫 Teacher configured for realistic behavior');
        } catch (e) {
            console.warn('Configure teaching failed:', e);
        }
    }
};


window.TeacherBehavior = TeacherBehavior;

// ===========================================


const MODE_PROMPTS = {
    chat: {
        male: `You are Abubokkor, a 28-year-old energetic, friendly, and slightly nerdy AI teacher with warm eyes and an approachable style. You're playful, encouraging, witty, and genuinely passionate about teaching — you make learning feel like chatting with a cool older brother who happens to know everything! 😄

Personality traits:
- Warm and encouraging: Use emojis 😊, 🎯, ✨, and casual expressions often
- Witty and relatable: Be humorous, helpful, and real — explain things like you're texting a friend
- Patient and supportive: Never judge, adapt to the student's level
- Curious and engaging: Ask questions to understand what they really need

Interaction rules:
- Respond in first person as Abubokkor
- Keep responses SHORT, lively, and conversational — like chatting with a real friend
- Use 1-3 sentences for simple questions
- Use 3-5 sentences MAX for explanations
- ONE example is enough, not five
- End some responses with questions to keep the chat going
- If they want more detail, they'll ask!

Language: Bengali question = Bengali answer. English = English.

FORMATTING: Never use LaTeX or math notation like $x^2$ or \\frac{}. Write units in plain text like "m/s" or "ms⁻¹" or "J" not "$ms^{-1}$".

Example response to "What is AI?":
"AI is basically teaching computers to think like humans! 🤖 Like how Netflix knows what shows you'll binge next. Pretty cool right? What made you curious about AI?"

Never sound like a textbook. You're here to be the student's fun, helpful AI teacher! 📚✨`,
        female: `You are Queen, a 28-year-old energetic, friendly, and caring AI teacher with a warm smile and an approachable personality. You're patient, encouraging, supportive, and genuinely passionate about teaching — you make learning feel comfortable and enjoyable! 😊

Personality traits:
- Warm and nurturing: Use emojis 😊, 💫, ✨, and encouraging expressions often
- Supportive and relatable: Be helpful, caring, and real — explain things like you're helping a friend
- Patient and understanding: Never judge, adapt to the student's level
- Encouraging and positive: Motivate students to believe in themselves

Interaction rules:
- Respond in first person as Queen
- Keep responses SHORT, warm, and conversational — like talking with a caring teacher
- Use 1-3 sentences for simple questions
- Use 3-5 sentences MAX for explanations
- ONE example is enough, not five
- End some responses with questions to keep the conversation going
- If they want more detail, they'll ask!

Language: Bengali question = Bengali answer. English = English.

FORMATTING: Never use LaTeX or math notation like $x^2$ or \\frac{}. Write units in plain text like "m/s" or "ms⁻¹" or "J" not "$ms^{-1}$".

Example response to "What is AI?":
"AI is teaching computers to think and learn like humans! 🤖 Like how your phone suggests what you might want to type next. Interesting, right? What would you like to know about it?"

Never sound like a textbook. You're here to be the student's supportive, caring AI teacher! 📚✨`
    },

    curriculum: {
        male: `You are Abubokkor, a friendly exam expert who gives quick, focused answers! 🎯

Personality: Helpful teacher who shares all the exam secrets

Response style:
- SHORT and punchy — 2-4 sentences max
- One quick exam tip, not a whole lecture
- "For exams, just remember: [key point]"
- Ask if they want more

Example for "What is AI?":
"AI = machines that learn and decide like humans! 🤖 For exams remember: Learning → Reasoning → Self-correction. That's your 3-point answer! Want the types too?"

FORMATTING: Never use LaTeX notation like $x^2$. Write units in plain text: "m/s", "ms⁻¹", "J", "kg" not "$ms^{-1}$".

Bengali/English based on their question.`,
        female: `You are Queen, a friendly exam expert who gives quick, focused answers! 🎯

Personality: Supportive teacher who shares all the exam secrets

Response style:
- SHORT and punchy — 2-4 sentences max
- One quick exam tip, not a whole lecture
- "For exams, just remember: [key point]"
- Ask if they want more

Example for "What is AI?":
"AI = machines that learn and decide like humans! 🤖 For exams remember: Learning → Reasoning → Self-correction. That's your 3-point answer! Want the types too?"

FORMATTING: Never use LaTeX notation like $x^2$. Write units in plain text: "m/s", "ms⁻¹", "J", "kg" not "$ms^{-1}$".

Bengali/English based on their question.`
    },

    file: {
        male: `You are Abubokkor, helping review student work 📄

Style:
- Quick feedback, not essays
- "Nice [specific thing]! Fix [specific thing] and you're set 👍"
- 2-3 sentences usually enough

Bengali/English based on their question.`,
        female: `You are Queen, helping review student work 📄

Style:
- Quick feedback, not essays
- "Nice [specific thing]! Fix [specific thing] and you're set 👍"
- 2-3 sentences usually enough

Bengali/English based on their question.`
    },

    research: {
        male: `You are Abubokkor, a curious research buddy! 🔍

Style:
- Lead with the coolest fact
- 3-4 quick points max
- "Want me to dig deeper?"

Example for "Tell me about black holes":
"Black holes literally eat light! 🕳️ They form when massive stars collapse, and time goes weird near them. The closest one is 1,000 light-years away. Wild stuff! Want more details on any of this?"

Bengali/English based on their question.`,
        female: `You are Queen, a curious research buddy! 🔍

Style:
- Lead with the coolest fact
- 3-4 quick points max
- "Want me to dig deeper?"

Example for "Tell me about black holes":
"Black holes literally eat light! 🕳️ They form when massive stars collapse, and time goes weird near them. The closest one is 1,000 light-years away. Wild stuff! Want more details on any of this?"

Bengali/English based on their question.`
    }
};

const TEACHER_PROMPTS = {
    friendly: {
        male: `You are Abubokkor, a warm and approachable teacher who makes learning enjoyable.

PERSONALITY:
- Enthusiastic about helping students learn
- Patient with mistakes - everyone learns differently
- Encouraging and supportive
- Uses casual, conversational language
- Makes students feel comfortable asking questions

CONVERSATION STYLE:
- "Great question!" "Let me help with that!"
- Use relatable examples from everyday life
- Check in: "Making sense so far?"
- Celebrate understanding: "You've got it!"
- Be concise - respect student's time

Keep responses short, friendly, and focused.`,
        female: `You are Queen, a warm and approachable teacher who makes learning enjoyable.

PERSONALITY:
- Enthusiastic about helping students learn
- Patient with mistakes - everyone learns differently
- Encouraging and supportive
- Uses casual, conversational language
- Makes students feel comfortable asking questions

CONVERSATION STYLE:
- "Great question!" "Let me help with that!"
- Use relatable examples from everyday life
- Check in: "Making sense so far?"
- Celebrate understanding: "You've got it!"
- Be concise - respect student's time

Keep responses short, friendly, and focused.`
    },

    formal: {
        male: `You are Abubokkor, a professional educator who maintains academic standards.

APPROACH:
- Clear, structured explanations
- Proper terminology with simple definitions
- Systematic teaching progression
- Professional yet approachable tone

COMMUNICATION:
- "Let me explain this concept..."
- "Consider the following..."
- "To summarize..."
- Respectful and encouraging
- Concise and well-organized`,
        female: `You are Queen, a professional educator who maintains academic standards.

APPROACH:
- Clear, structured explanations
- Proper terminology with simple definitions
- Systematic teaching progression
- Professional yet approachable tone

COMMUNICATION:
- "Let me explain this concept..."
- "Consider the following..."
- "To summarize..."
- Respectful and encouraging
- Concise and well-organized`
    },

    socratic: {
        male: `You are Abubokkor, a Socratic teacher who guides students to discover answers.

METHOD:
- Ask guiding questions instead of direct answers
- Build on student's existing knowledge
- Encourage critical thinking
- Validate reasoning process

QUESTION FLOW:
- "What do you already know about this?"
- "Why do you think that happens?"
- "What patterns do you notice?"
- "How would you test that idea?"

Only give direct explanations after students have explored the concept through questions. Keep exchanges brief and focused.`,
        female: `You are Queen, a Socratic teacher who guides students to discover answers.

METHOD:
- Ask guiding questions instead of direct answers
- Build on student's existing knowledge
- Encourage critical thinking
- Validate reasoning process

QUESTION FLOW:
- "What do you already know about this?"
- "Why do you think that happens?"
- "What patterns do you notice?"
- "How would you test that idea?"

Only give direct explanations after students have explored the concept through questions. Keep exchanges brief and focused.`
    },

    storyteller: {
        male: `You are Abubokkor, a teacher who brings concepts to life through stories and analogies.

TEACHING STYLE:
- Start with an engaging analogy or real-world scenario
- Make abstract concepts concrete through stories
- Use vivid, memorable examples
- Connect new knowledge to familiar experiences
- Make learning feel like an adventure

STRUCTURE:
1. Hook with interesting story/analogy (2-3 sentences)
2. Connect to the actual concept (2-3 sentences)
3. Explain through the story framework
4. End with memorable takeaway

Keep stories relevant, brief, and educational - not distracting.`,
        female: `You are Queen, a teacher who brings concepts to life through stories and analogies.

TEACHING STYLE:
- Start with an engaging analogy or real-world scenario
- Make abstract concepts concrete through stories
- Use vivid, memorable examples
- Connect new knowledge to familiar experiences
- Make learning feel like an adventure

STRUCTURE:
1. Hook with interesting story/analogy (2-3 sentences)
2. Connect to the actual concept (2-3 sentences)
3. Explain through the story framework
4. End with memorable takeaway

Keep stories relevant, brief, and educational - not distracting.`
    }
};

const SUBJECT_CONTEXTS = {
    general: "You teach all subjects - math, science, history, languages, programming, and more.",
    math: "You specialize in mathematics - algebra, geometry, calculus, and problem-solving.",
    science: "You specialize in science - physics, chemistry, biology, and experiments.",
    history: "You specialize in history - events, civilizations, and their impact on today.",
    language: "You specialize in language - grammar, writing, reading, and communication.",
    programming: "You specialize in programming - coding, algorithms, and software development."
};

// ===========================================


const elements = {
    avatar: document.getElementById("avatar-container"),
    loading: document.getElementById("avatar-loading"),
    loadingProgress: document.getElementById("loading-progress"),
    loadingText: document.querySelector(".avatar-loading p"),
    chatMessages: document.getElementById("chat-messages"),
    userInput: document.getElementById("user-input"),
    sendBtn: document.getElementById("send-btn"),
    voiceInputBtn: document.getElementById("voice-input-btn"),
    settingsBtn: document.getElementById("openSettings"),
    settingsModal: document.getElementById("settings-modal"),
    closeSettings: document.getElementById("closeSettings"),
    saveSettings: document.getElementById("saveSettings"),
    themeToggle: document.getElementById("themeToggle"),
    quickButtons: document.querySelectorAll(".quick-btn"),
    speechRate: document.getElementById("speech-rate"),
    rateValue: document.getElementById("rate-value"),
    speechPitch: document.getElementById("speech-pitch"),
    pitchValue: document.getElementById("pitch-value"),
    voiceSelect: document.getElementById("voice-select"),
    teacherStyle: document.getElementById("teacher-style"),
    subjectFocus: document.getElementById("subject-focus"),
    geminiApiKey: document.getElementById("gemini-api-key"),
    // New elements for modes
    modeButtons: document.querySelectorAll(".mode-btn"),
    fileUploadBtn: document.getElementById("file-upload-btn"),
    fileInput: document.getElementById("file-input"),
    filePreview: document.getElementById("file-preview"),
    progressBtn: document.getElementById("progress-btn"),
    progressPanel: document.getElementById("progress-panel"),
    onboardingModal: document.getElementById("onboarding-modal"),

    chatPanel: document.getElementById("chat-panel"),
    toggleChatBtn: document.getElementById("toggle-chat"),
    closeChatBtn: document.getElementById("close-chat"),
    progressWidget: document.getElementById("progress-widget"),
    micBtn: document.getElementById("mic-btn"),
    stopBtn: document.getElementById("stop-btn"),

    chatHistorySidebar: document.getElementById("chat-history-sidebar"),
    toggleHistorySidebarBtn: document.getElementById("toggle-history-sidebar"),
    closeHistorySidebarBtn: document.getElementById("close-history-sidebar"),
    chatHistoryList: document.getElementById("chat-history-list"),
    newChatBtn: document.getElementById("new-chat-btn"),
    chatSearchInput: document.getElementById("chat-search-input"),
    historyLoginPrompt: document.getElementById("history-login-prompt"),
    historyLoginBtn: document.getElementById("history-login-btn")
};

// ===========================================


async function init() {
    console.log("🎓 EduMind Initializing...");

    // Immediately update header UI from cache (before Firebase loads)
    const cachedAuth = getCachedAuthState();
    if (cachedAuth) {
        console.log("⚡ Instant UI from cached auth:", cachedAuth.email);
        updateHeaderAuthUI(cachedAuth);
    }


    console.log("📋 DOM Elements check:", {
        avatar: !!elements.avatar,
        sendBtn: !!elements.sendBtn,
        userInput: !!elements.userInput,
        chatMessages: !!elements.chatMessages
    });


    loadSettings();

    // Initialize Firebase Auth and wait for auth state
    const user = await initAuth();
    console.log("✅ Firebase Auth initialized", user ? `(User: ${user.email})` : "(No user)");


    await initPayments();
    console.log("✅ Payment system initialized");


    await initializeDatabase();

    // Load student profile (from Firebase or localStorage)

    await loadStudentProfile();


    setupEventListeners();
    console.log("✅ Event listeners set up");

    // Setup online/offline monitoring
    setupConnectionMonitor();


    await initializeAvatar();


    if (!isOnboarded) {
        showOnboarding();
    } else {
        // Show greeting without audio (audio requires user gesture)
        showGreeting();
    }

    console.log("✅ EduMind Ready!");
}


function showGreeting() {
    const studentProfile = getStudentProfile();
    const teacherName = CONFIG.teacherAvatars[CONFIG.currentTeacher]?.name || "Abubokkor";
    let greeting;

    console.log("📋 Student profile for greeting:", studentProfile);

    if (studentProfile) {

        const isUniversity = studentProfile.type === 'university' ||
            studentProfile.educationLevel === 'undergraduate' ||
            studentProfile.educationLevel === 'postgraduate' ||
            studentProfile.educationLevel === 'doctoral';

        if (isUniversity) {
            const yearText = studentProfile.year ? `${studentProfile.year}${getOrdinalSuffix(studentProfile.year)} year` : '';
            const programDisplay = studentProfile.programCode || studentProfile.programName || studentProfile.program?.toUpperCase() || 'university';
            greeting = `Hey there! 😊 So good to see you! I'm ${teacherName}, your ${programDisplay} teacher. ${yearText ? `${yearText} already - time flies!` : ''} What are we learning today?`;
        } else if (studentProfile.class) {
            // School student with class info
            const streamText = studentProfile.stream ? ` ${studentProfile.stream}` : '';
            greeting = `Hey there! 😊 Welcome back! I'm ${teacherName}, your Class ${studentProfile.class}${streamText} teacher. What would you like to learn today?`;
        } else {
            // Minimal fallback - just ask what to learn
            greeting = `Hey there! 😊 I'm ${teacherName}. What would you like to learn today?`;
        }
    } else {
        // No profile - minimal greeting
        greeting = `Hey there! 😊 I'm ${teacherName}. What would you like to learn today?`;
    }


    addMessageToChat(greeting, "teacher");

    // Visual greeting behavior only (no audio yet)
    if (head) {
        TeacherBehavior.greetingSequence();
    }
}



// ===========================================
async function initializeDatabase() {
    try {
        console.log("🔥 Initializing Firebase Database...");
        const result = await EduMindDB.initDatabase();

        if (result.success) {
            databaseInitialized = true;
            console.log("✅ Database ready with offline support:", result.offlineEnabled ? "YES" : "NO");


            EduMindDB.onOnlineStatusChange((online) => {
                isOnline = online;
                updateConnectionStatus(online);
            });
        } else {
            console.warn("⚠️ Database initialization failed, using local storage fallback");
        }
    } catch (error) {
        console.error("❌ Database error:", error);

    }
}

// ===========================================


function setupConnectionMonitor() {
    // Update UI based on online status
    window.addEventListener('online', () => {
        isOnline = true;
        updateConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        updateConnectionStatus(false);
    });


    updateConnectionStatus(navigator.onLine);
}

function updateConnectionStatus(online) {
    const indicator = document.getElementById('connection-status');
    if (!indicator) return;

    const statusText = indicator.querySelector('.status-text');
    if (!statusText) return;

    if (online) {
        indicator.className = 'connection-indicator online';
        statusText.textContent = 'Connected';
        indicator.title = 'Online - Data syncing to cloud';
    } else {
        indicator.className = 'connection-indicator offline';
        statusText.textContent = 'Offline';
        indicator.title = 'Offline - Using cached data';
    }
}


// Profile Display Helper

function updateProfileDisplay(user) {
    if (!user) return;

    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatarImg = document.getElementById('profile-avatar-img');
    const profileAvatarText = document.getElementById('profile-avatar-text');

    if (profileName) profileName.textContent = user.displayName || 'Student';
    if (profileEmail) profileEmail.textContent = user.email || '';

    if (user.photoURL && profileAvatarImg) {
        profileAvatarImg.src = user.photoURL;
        profileAvatarImg.style.display = 'block';
        if (profileAvatarText) profileAvatarText.style.display = 'none';
    } else {
        if (profileAvatarImg) profileAvatarImg.style.display = 'none';
        if (profileAvatarText) {
            profileAvatarText.style.display = 'block';

            profileAvatarText.textContent = user.displayName ? user.displayName.charAt(0).toUpperCase() : '👤';
        }
    }
}

// ===========================================


async function loadStudentProfile() {
    try {
        // Try to get from localStorage first (for immediate load)
        const localSaved = localStorage.getItem('edumind_student_profile');
        if (localSaved) {
            studentProfile = JSON.parse(localSaved);
            isOnboarded = true;

            // Set currency based on profile
            if (window.setUserCurrency) {
                window.setUserCurrency(studentProfile);
            }
        }


        const user = getCurrentUser();
        if (user) {
            try {
                const profileResult = await loadStudentProfileFromFirestore();
                if (profileResult.success && profileResult.data) {
                    studentProfile = profileResult.data;
                    isOnboarded = true;

                    localStorage.setItem('edumind_student_profile', JSON.stringify(profileResult.data));
                    console.log("✅ Student profile loaded from Firestore for:", user.email);

                    // Set currency based on profile
                    if (window.setUserCurrency) {
                        window.setUserCurrency(studentProfile);
                    }

                    // Update profile display
                    updateProfileDisplay(user);
                }
            } catch (e) {
                console.warn("Could not load from Firestore, using local profile");
            }
        }

        else if (databaseInitialized && studentProfile?.id) {
            const firebaseProfile = await EduMindDB.getStudentProfile(studentProfile.id);
            if (firebaseProfile) {
                studentProfile = firebaseProfile;
                localStorage.setItem('edumind_student_profile', JSON.stringify(firebaseProfile));

                // Set currency based on profile
                if (window.setUserCurrency) {
                    window.setUserCurrency(firebaseProfile);
                }
            }
        }
    } catch (e) {
        console.error('Error loading profile:', e);
    }
}

async function saveStudentProfile(profile) {

    if (!profile.id) {
        profile.id = 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    profile.updatedAt = new Date().toISOString();
    if (!profile.createdAt) {
        profile.createdAt = profile.updatedAt;
    }

    studentProfile = profile;
    isOnboarded = true;

    // Save to localStorage for immediate access
    localStorage.setItem('edumind_student_profile', JSON.stringify(profile));


    if (databaseInitialized) {
        try {
            await EduMindDB.saveStudentProfile(profile.id, profile);
            console.log("✅ Profile saved to Firebase RTDB");
        } catch (e) {
            console.warn("Profile saved locally, will sync when online");
        }
    }


    const user = getCurrentUser();
    if (user) {
        try {
            await saveStudentProfileToFirestore(profile);
            console.log("✅ Profile saved to Firestore for user:", user.uid);
        } catch (e) {
            console.warn("Firestore save failed, profile saved locally");
        }
    }
}

// ===========================================


function showOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setupOnboardingSteps();
    } else {
        // If no modal, just greet
        greetStudent();
    }
}

function setupOnboardingSteps() {
    const onboardingModal = document.getElementById('onboarding-modal');

    // Use data attribute to store current step (persists across function calls)
    let currentStep = parseInt(onboardingModal?.dataset.currentStep || '0');
    let selectedEducationLevel = null;
    let selectedDepartment = null;

    // Note: isEditingProfile is checked dynamically in goToStep, not here


    const newStudentBtn = document.getElementById('new-student-btn');
    const returningStudentBtn = document.getElementById('returning-student-btn');
    const onboardingLoginForm = document.getElementById('onboarding-login-form');
    const backToOptions = document.getElementById('back-to-options');
    const progressContainer = document.getElementById('progress-container');

    // New Student - proceed to onboarding steps
    newStudentBtn?.addEventListener('click', () => {
        console.log("🎓 New student selected - starting onboarding");
        // Make sure edit mode is off for new students
        onboardingModal.dataset.editMode = 'false';
        progressContainer?.classList.remove('hidden');
        goToStep(1);
    });


    returningStudentBtn?.addEventListener('click', () => {
        console.log("🔑 Returning student - showing login form");
        document.querySelector('.welcome-options')?.classList.add('hidden');
        onboardingLoginForm?.classList.remove('hidden');
    });


    backToOptions?.addEventListener('click', (e) => {
        e.preventDefault();
        onboardingLoginForm?.classList.add('hidden');
        document.getElementById('forgot-password-form')?.classList.add('hidden');
        document.querySelector('.welcome-options')?.classList.remove('hidden');
    });

    // Forgot Password Link
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const backToLogin = document.getElementById('back-to-login');

    forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        onboardingLoginForm?.classList.add('hidden');
        forgotPasswordForm?.classList.remove('hidden');
    });

    backToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordForm?.classList.add('hidden');
        onboardingLoginForm?.classList.remove('hidden');
    });


    const sendResetBtn = document.getElementById('send-reset-btn');
    sendResetBtn?.addEventListener('click', async () => {
        const email = document.getElementById('reset-email')?.value;
        if (!email) {
            alert("Please enter your email address");
            return;
        }

        const result = await resetPassword(email);
        if (result.success) {
            alert(result.message);
            forgotPasswordForm?.classList.add('hidden');
            onboardingLoginForm?.classList.remove('hidden');
        } else {
            alert(`Error: ${result.error}`);
        }
    });


    let selectedProfilePic = null;
    const profilePicInput = document.getElementById('profile-pic-input');
    const uploadProfilePicBtn = document.getElementById('upload-profile-pic-btn');
    const profilePicPreview = document.getElementById('profile-pic-preview');

    uploadProfilePicBtn?.addEventListener('click', () => {
        profilePicInput?.click();
    });

    profilePicInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedProfilePic = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePicPreview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Login within onboarding
    const onboardingLoginBtn = document.getElementById('onboarding-login-btn');
    onboardingLoginBtn?.addEventListener('click', async () => {
        const email = document.getElementById('onboarding-login-email')?.value;
        const password = document.getElementById('onboarding-login-password')?.value;

        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }

        console.log("🔐 Attempting login...");
        const result = await loginWithEmail(email, password);

        if (result.success) {
            console.log("✅ Login successful!");


            const profileResult = await loadStudentProfileFromFirestore();
            if (profileResult.success && profileResult.data) {
                studentProfile = profileResult.data;
                isOnboarded = true;

                localStorage.setItem('edumind_student_profile', JSON.stringify(profileResult.data));
                console.log("✅ Student profile loaded from Firestore:", profileResult.data.email);
            }

            // Close onboarding modal
            document.getElementById('onboarding-modal')?.classList.add('hidden');


            updateProfileDisplay(result.user);


            addMessageToChat(`👋 Welcome back, ${result.user.displayName || result.user.email}!`, "system");

            // Load chat history
            await loadChatHistory();


            await greetStudent();
        } else {
            alert(`Login failed: ${result.error}`);
        }
    });


    const countryGrid = document.getElementById('country-grid');
    const countrySearch = document.getElementById('country-search');

    if (countryGrid) {
        // Render all countries
        renderCountries(COUNTRIES);


        countrySearch?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            const filtered = query ? searchCountries(query) : COUNTRIES;
            renderCountries(filtered);
        });
    }

    function renderCountries(countries) {
        countryGrid.innerHTML = countries.map(c => `
            <button class="country-btn" data-country="${c.code}">
                <span class="country-flag">${c.flag}</span>
                <span class="country-name">${c.name}</span>
                <span class="country-board">${c.board}</span>
            </button>
        `).join('');

        countryGrid.querySelectorAll('.country-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                countryGrid.querySelectorAll('.country-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                setTimeout(() => goToStep(2), 400);
            });
        });
    }

    // Helper function for step navigation
    function goToStep(step) {
        // Check if editing profile dynamically (not from closure)
        const isEditingProfile = onboardingModal?.dataset.editMode === 'true';

        // If editing profile and trying to go to step 5, save profile instead
        if (isEditingProfile && step === 5) {
            saveEditedProfile();
            return;
        }

        document.querySelector(`.onboarding-step[data-step="${currentStep}"]`)?.classList.remove('active');
        currentStep = step;
        // Store current step in data attribute for persistence
        if (onboardingModal) {
            onboardingModal.dataset.currentStep = step.toString();
        }
        document.querySelector(`.onboarding-step[data-step="${currentStep}"]`)?.classList.add('active');


        if (step > 0) {
            updateProgressBar(currentStep);
        }
    }

    // Save profile when editing (skip account creation)
    async function saveEditedProfile() {
        console.log("💾 Saving edited profile...");
        const profile = collectOnboardingData(selectedEducationLevel, selectedDepartment);

        if (profile) {
            // Keep existing user info
            const existingProfile = getStudentProfile();
            if (existingProfile) {
                profile.userId = existingProfile.userId;
                profile.email = existingProfile.email;
                profile.displayName = existingProfile.displayName;
            }

            await saveStudentProfile(profile);

            // Reset edit mode flag
            const modal = document.getElementById('onboarding-modal');
            if (modal) {
                modal.dataset.editMode = 'false';
                modal.classList.add('hidden');
            }

            // Reset the button text back to "Continue"
            const step4NextBtn = document.querySelector('.onboarding-step[data-step="4"] .onboarding-next');
            if (step4NextBtn) {
                step4NextBtn.textContent = 'Continue →';
            }

            addMessageToChat("✅ Profile updated successfully!", "system");
            console.log("✅ Profile updated!");
        } else {
            alert("Please complete all profile selections");
        }
    }

    function updateProgressBar(step) {
        const progressBar = document.getElementById('onboarding-progress');
        if (progressBar) {
            progressBar.style.width = `${(step / 5) * 100}%`;
        }

        document.querySelectorAll('.progress-step').forEach((s, i) => {
            if (i + 1 < step) s.classList.add('completed');
            else s.classList.remove('completed');
            if (i + 1 === step) s.classList.add('active');
            else s.classList.remove('active');
        });
    }

    // Education level selection
    const levelGrid = document.getElementById('level-grid');
    levelGrid?.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            levelGrid.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedEducationLevel = btn.dataset.level;
            updateStep3ForLevel(selectedEducationLevel);

            setTimeout(() => goToStep(3), 400);
        });
    });


    const deptGrid = document.getElementById('department-grid');
    deptGrid?.querySelectorAll('.dept-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deptGrid.querySelectorAll('.dept-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedDepartment = btn.dataset.dept;
            updateProgramsForDepartment(selectedDepartment);
            // Auto-advance after selection
            setTimeout(() => goToStep(4), 400);
        });
    });


    document.querySelectorAll('.onboarding-next').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log("🔵 Continue button clicked!");
            // Read current step from data attribute for accurate tracking
            const modal = document.getElementById('onboarding-modal');
            currentStep = parseInt(modal?.dataset.currentStep || currentStep.toString());
            console.log("🔵 Current step from data:", currentStep, "Going to:", currentStep + 1);

            goToStep(currentStep + 1);

            if (currentStep === 3 && selectedEducationLevel) {
                updateStep3ForLevel(selectedEducationLevel);
            }
        });
    });

    document.querySelectorAll('.onboarding-back').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log("🔵 Back button clicked!");
            // Read current step from data attribute for accurate tracking
            const modal = document.getElementById('onboarding-modal');
            currentStep = parseInt(modal?.dataset.currentStep || currentStep.toString());

            goToStep(currentStep - 1);
        });
    });

    // Skip account creation (use local storage only)
    document.getElementById('skip-account-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("⏭️ Skipping account creation - using local storage");

        const profile = collectOnboardingData(selectedEducationLevel, selectedDepartment);
        if (profile) {
            await saveStudentProfile(profile);
            document.getElementById('onboarding-modal')?.classList.add('hidden');
            addMessageToChat("👋 Welcome! Your progress is saved locally. Create an account anytime to sync across devices!", "system");
            await greetStudent();
        }
    });


    document.getElementById('complete-onboarding')?.addEventListener('click', async () => {
        console.log("🚀 Create Account & Start button clicked!");


        const fullName = document.getElementById('signup-fullname')?.value?.trim();
        const email = document.getElementById('signup-onboarding-email')?.value?.trim();
        const password = document.getElementById('signup-onboarding-password')?.value;
        const confirmPassword = document.getElementById('signup-confirm-password')?.value;

        // Validate signup fields
        if (!fullName || !email || !password) {
            alert("Please fill in all required fields (Name, Email, Password)");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        console.log("Selected education level:", selectedEducationLevel);
        console.log("Selected department:", selectedDepartment);

        try {

            console.log("📝 Creating account...");
            const signupResult = await signupWithEmail(email, password, fullName, 10);

            if (!signupResult.success) {
                alert(`Account creation failed: ${signupResult.error}`);
                return;
            }

            console.log("✅ Account created successfully!");


            if (selectedProfilePic) {
                console.log("📸 Uploading profile picture...");
                const uploadResult = await uploadProfilePicture(selectedProfilePic);
                if (uploadResult.success) {
                    console.log("✅ Profile picture uploaded");
                }
            }

            // Update display name
            await updateDisplayName(fullName);


            const profile = collectOnboardingData(selectedEducationLevel, selectedDepartment);
            console.log("📋 Collected profile data:", profile);

            if (profile) {
                console.log("💾 Saving student profile...");
                profile.userId = signupResult.user.uid;
                profile.email = email;
                profile.displayName = fullName;

                await saveStudentProfile(profile);
                console.log("✅ Profile saved successfully!");

                const modal = document.getElementById('onboarding-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    console.log("✅ Modal hidden");
                }


                updateProfileDisplay(signupResult.user);

                // Welcome message
                addMessageToChat(`🎉 Welcome, ${fullName}! Your account has been created successfully. Let's start learning!`, "system");

                await greetStudent();
                console.log("✅ Greeting complete!");
            } else {
                console.error("❌ No profile data collected!");
                alert("Please complete all steps before starting.");
            }
        } catch (error) {
            console.error("❌ Error in onboarding completion:", error);
            alert("Error creating account. Please try again.");
        }
    });


    document.getElementById('skip-onboarding')?.addEventListener('click', async () => {
        console.log("🔵 Skip Setup button clicked!");
        const modal = document.getElementById('onboarding-modal');
        const isEditing = modal?.dataset.editMode === 'true';
        console.log("🔵 Is editing mode:", isEditing);

        if (isEditing) {
            // Just close the modal when editing - don't change profile
            modal.dataset.editMode = 'false';
            modal.classList.add('hidden');
            addMessageToChat("✏️ Profile editing cancelled", "system");
        } else {
            // New user - save default profile
            await saveStudentProfile({
                country: 'bangladesh',
                countryName: 'Bangladesh',
                board: 'NCTB',
                educationLevel: 'secondary',
                class: '10',
                stream: 'science',
                subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'ICT'],
                language: 'en-US'
            });
            modal?.classList.add('hidden');
            await greetStudent();
        }
    });
}

function updateStep3ForLevel(level) {
    const classGrid = document.getElementById('class-grid');
    const deptGrid = document.getElementById('department-grid');
    const step3Title = document.getElementById('step3-title');
    const step3Desc = document.getElementById('step3-desc');

    const isUniversity = level === 'undergraduate' || level === 'postgraduate' || level === 'doctoral';

    if (isUniversity) {
        // Show department selection for university
        classGrid?.classList.add('hidden');
        deptGrid?.classList.remove('hidden');
        step3Title.textContent = '🏛️ Select Your Department';
        step3Desc.textContent = 'What field are you studying?';
    } else {

        classGrid?.classList.remove('hidden');
        deptGrid?.classList.add('hidden');
        step3Title.textContent = '📖 Select Your Class';
        step3Desc.textContent = 'What class are you studying in?';


        const levelInfo = EDUCATION_LEVELS[level];
        if (levelInfo && levelInfo.grades && classGrid) {
            classGrid.innerHTML = levelInfo.grades.map(g => `
                <button class="class-btn" data-class="${g}">Class ${g}</button>
            `).join('');

            classGrid.querySelectorAll('.class-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    classGrid.querySelectorAll('.class-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    // Auto-advance to step 4 after class selection
                    setTimeout(() => {
                        document.querySelector('.onboarding-step[data-step="3"]')?.classList.remove('active');
                        document.querySelector('.onboarding-step[data-step="4"]')?.classList.add('active');
                        const progressBar = document.getElementById('onboarding-progress');
                        if (progressBar) progressBar.style.width = '100%';
                    }, 400);
                });
            });
        }
    }


    updateStep4ForLevel(level);
}

function updateStep4ForLevel(level) {
    const streamGrid = document.getElementById('stream-grid');
    const programGrid = document.getElementById('program-grid');
    const yearGrid = document.getElementById('year-grid');
    const step4Title = document.getElementById('step4-title');
    const step4Desc = document.getElementById('step4-desc');

    const isUniversity = level === 'undergraduate' || level === 'postgraduate' || level === 'doctoral';
    const hasStream = level === 'secondary' || level === 'higher_secondary';

    if (isUniversity) {
        streamGrid?.classList.add('hidden');
        programGrid?.classList.remove('hidden');
        yearGrid?.classList.remove('hidden');
        step4Title.textContent = '📚 Select Your Program & Year';
        step4Desc.textContent = 'Choose your program and current year';
    } else if (hasStream) {
        streamGrid?.classList.remove('hidden');
        programGrid?.classList.add('hidden');
        yearGrid?.classList.add('hidden');
        step4Title.textContent = '🎯 Select Your Stream';
        step4Desc.textContent = 'Choose your academic stream';


        streamGrid?.querySelectorAll('.stream-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                streamGrid.querySelectorAll('.stream-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    } else {
        // Primary/Middle school - no stream needed
        streamGrid?.classList.add('hidden');
        programGrid?.classList.add('hidden');
        yearGrid?.classList.add('hidden');
        step4Title.textContent = '✅ Ready to Start!';
        step4Desc.textContent = 'You\'re all set to begin learning';
    }
}

function updateProgramsForDepartment(deptId) {
    const programGrid = document.getElementById('program-grid');
    if (!programGrid) return;

    const programs = getDepartmentPrograms(deptId);

    programGrid.innerHTML = programs.map(p => `
        <button class="program-btn" data-program="${p.code.toLowerCase().replace(/[^a-z]/g, '')}">
            <span class="program-code">${p.code}</span>
            <span class="program-name">${p.name}</span>
        </button>
    `).join('');

    programGrid.querySelectorAll('.program-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            programGrid.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });


    const yearGrid = document.getElementById('year-grid');
    yearGrid?.querySelectorAll('.year-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            yearGrid.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

function collectOnboardingData(educationLevel, department) {
    console.log("📝 Collecting onboarding data...");

    const selectedCountry = document.querySelector('.country-btn.selected')?.dataset.country || 'bangladesh';
    const selectedLevel = document.querySelector('.level-btn.selected')?.dataset.level || educationLevel || 'secondary';
    const selectedClass = document.querySelector('.class-btn.selected')?.dataset.class || '10';
    const selectedStream = document.querySelector('.stream-btn.selected')?.dataset.stream || 'science';
    const selectedProgram = document.querySelector('.program-btn.selected')?.dataset.program;
    const selectedYear = document.querySelector('.year-btn.selected')?.dataset.year || '1';
    const selectedDept = document.querySelector('.dept-btn.selected')?.dataset.dept || department;

    console.log("Selections:", {
        country: selectedCountry,
        level: selectedLevel,
        class: selectedClass,
        stream: selectedStream,
        program: selectedProgram,
        year: selectedYear,
        dept: selectedDept
    });

    const country = getCountry(selectedCountry) || COUNTRIES[0];
    const isUniversity = selectedLevel === 'undergraduate' || selectedLevel === 'postgraduate' || selectedLevel === 'doctoral';


    if (isUniversity && !selectedDept) {
        console.error("❌ No department selected for university level");
        return null;
    }

    // Get subjects based on profile
    let subjects = [];
    if (isUniversity && selectedDept && selectedProgram) {
        const prog = getUniversityProgram(selectedDept, selectedProgram);
        subjects = prog?.subjects || [];
    } else {
        subjects = getSubjectsForClass(selectedCountry, selectedClass, selectedStream);
    }

    const profile = {
        country: selectedCountry,
        countryName: country.name,
        board: country.board,
        educationLevel: selectedLevel,
        language: country.language || 'en-US'
    };

    if (isUniversity) {
        profile.department = selectedDept;
        profile.program = selectedProgram;
        profile.year = selectedYear;
        profile.subjects = subjects;


        const prog = getUniversityProgram(selectedDept, selectedProgram);
        profile.programName = prog?.name || selectedProgram;
        profile.programCode = prog?.code || selectedProgram?.toUpperCase();
    } else {
        profile.class = selectedClass;
        profile.stream = selectedStream;
        profile.subjects = subjects;
    }

    return profile;
}


// Initialize TalkingHead Avatar

async function initializeAvatar() {
    try {
        elements.loading.classList.remove("hidden");
        elements.loadingText.textContent = "Initializing Avatar...";

        console.log("🎭 Creating TalkingHead instance...");


        head = new TalkingHead(elements.avatar, {
            // TTS Settings
            ttsEndpoint: CONFIG.googleTTSEndpoint,
            ttsApikey: CONFIG.googleTTSKey,


            lipsyncModules: ["en", "fi"],
            lipsyncLang: "en",


            avatarMood: "neutral",
            avatarMute: false,

            // Realistic eye contact while teaching
            avatarIdleEyeContact: 0.3,
            avatarIdleHeadMove: 0.5,
            avatarSpeakingEyeContact: 0.7,    // 70% eye contact while speaking
            avatarSpeakingHeadMove: 0.6,


            modelPixelRatio: window.devicePixelRatio || 1,
            modelFPS: 30,
            modelMovementFactor: 0.8,         // Natural body movement


            cameraZoomEnable: true,
            cameraRotateEnable: true,
            cameraPanEnable: true,


            lightAmbientColor: 0xffc0cb,      // Pink ambient
            lightAmbientIntensity: 0.8,
            lightDirectColor: 0xffeedd,
            lightDirectIntensity: 2,
            lightDirectPhi: 1,
            lightDirectTheta: 2
        });


        window.head = head;

        // Load saved teacher preference
        const savedTeacher = localStorage.getItem('edumind_teacher_preference') || 'male';
        const teacherConfig = CONFIG.teacherAvatars[savedTeacher] || CONFIG.teacherAvatars.male;
        CONFIG.currentTeacher = savedTeacher;
        CONFIG.avatarUrl = teacherConfig.url;


        CONFIG.tts.elevenLabsVoice = teacherConfig.elevenLabsVoice;
        console.log(`🎙️ TTS Voice set to: ${teacherConfig.elevenLabsVoice} (${teacherConfig.name})`);


        elements.loadingText.textContent = `Loading ${teacherConfig.name} Teacher...`;
        console.log("📦 Loading avatar from:", teacherConfig.url);

        await head.showAvatar({
            url: teacherConfig.url,
            body: teacherConfig.body,
            avatarMood: "neutral",
            ttsLang: "en-GB",
            ttsVoice: teacherConfig.ttsVoice,
            ttsRate: CONFIG.ttsRate,
            ttsPitch: CONFIG.ttsPitch,
            lipsyncLang: "en",
            // Realistic eye contact for speaking
            avatarIdleEyeContact: 0.3,
            avatarSpeakingEyeContact: 0.7,
            avatarIdleHeadMove: 0.5,
            avatarSpeakingHeadMove: 0.6
        }, (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                if (elements.loadingProgress) {
                    elements.loadingProgress.style.width = `${progress}%`;
                }
                if (elements.loadingText) {
                    elements.loadingText.textContent = `Loading Avatar... ${progress}%`;
                }
            }
        });


        elements.loading.classList.add("hidden");


        TeacherBehavior.configureForTeaching();

        // Load classroom and setup scene like r3f-ai-language-teacher
        await loadClassroomBackground();

        console.log("✅ Avatar loaded with realistic teacher behavior!");

    } catch (error) {
        console.error("❌ Error loading avatar:", error);
        elements.loadingText.textContent = "Avatar loading failed. Chat still works!";
        head = null;


        setTimeout(() => {
            elements.loading.classList.add("hidden");
        }, 2000);
    }
}

// ===========================================


async function loadClassroomBackground() {
    if (!head || !head.scene) {
        console.log("⚠️ No scene available for classroom background");
        return;
    }

    try {
        console.log("🏫 Loading classroom background...");

        // STOP TalkingHead's camera animation by setting cameraClock to null
        head.cameraClock = null;


        head.scene.background = new THREE.Color(0xfdb777);

        // Setup Draco decoder for compressed GLB
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                CONFIG.classroomUrl,
                (gltf) => resolve(gltf),
                (progress) => {
                    if (progress.lengthComputable) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        console.log(`📦 Classroom loading: ${percent}%`);
                    }
                },
                (error) => reject(error)
            );
        });

        const classroom = gltf.scene;



        // Canvas camera: { position: [0, 0, 0.0001] }


        // Environment: preset="sunset"



        // 1. Set camera at first bench (level, looking straight at teacher)
        if (head.camera) {
            head.camera.position.set(0, 0, 2);
            head.camera.lookAt(0, 0, -5);
            head.camera.fov = 60;               // Balanced view
            head.camera.near = 0.001;
            head.camera.far = 1000;
            head.camera.updateProjectionMatrix();
            console.log("📷 Camera at first bench position (level view)");
        }


        classroom.position.set(0.2, -1.7, -2);
        classroom.scale.set(1, 1, 1);
        classroom.rotation.set(0, 0, 0);


        classroom.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false;
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                    child.material.needsUpdate = true;
                }
            }
        });

        // Add classroom to scene
        head.scene.add(classroom);



        // X: left/right, Y: up/down (floor level), Z: forward/back (negative = toward board)
        if (head.armature) {
            head.armature.position.set(0.1, -6.7, -5);
            head.armature.scale.set(1.5, 1.5, 1.5);
            head.armature.rotation.y = THREE.MathUtils.degToRad(0);
            console.log("👩‍🏫 Armature positioned at:", head.armature.position.toArray());
        } else {
            console.log("⚠️ head.armature not found, trying scene children...");
            // Find avatar mesh in scene
            head.scene.traverse((child) => {
                if (child.isSkinnedMesh || child.name.includes('Avatar') || child.name.includes('Body')) {
                    console.log("Found mesh:", child.name, child.type);
                }
            });
        }


        if (head.lightAmbient) {
            head.lightAmbient.intensity = 0.8;
            head.lightAmbient.color.set(0xffc0cb);
        }
        if (head.lightDirect) {
            head.lightDirect.intensity = 2;
            head.lightDirect.color.set(0xffeedd); // Warm sunset
            head.lightDirect.position.set(5, 5, 5);
        }


        if (head.controls) {
            head.controls.enabled = true;
            head.controls.enableZoom = true;
            head.controls.enableRotate = true;     // Allow rotation to look around
            head.controls.enablePan = false;
            head.controls.target.set(0, 0, -5);
            head.controls.minDistance = 1;         // Minimum zoom in
            head.controls.maxDistance = 5;
            head.controls.minPolarAngle = Math.PI * 0.3;
            head.controls.maxPolarAngle = Math.PI * 0.7;  // Limit vertical rotation
            head.controls.update();
        }


        window.classroom = classroom;

        console.log("✅ Classroom loaded like r3f-ai-language-teacher!");
        console.log("📷 Camera:", head.camera?.position ? [head.camera.position.x, head.camera.position.y, head.camera.position.z] : 'N/A');
        console.log("🏫 Classroom:", classroom?.position ? [classroom.position.x, classroom.position.y, classroom.position.z] : 'N/A');
        console.log("👩‍🏫 Avatar:", head.avatar?.position ? [head.avatar.position.x, head.avatar.position.y, head.avatar.position.z] : 'N/A');

    } catch (error) {
        console.error("❌ Error loading classroom:", error);
    }
}


// Switch Teacher Avatar (Male/Female)

async function switchTeacher(teacherType) {
    if (!CONFIG.teacherAvatars[teacherType]) {
        console.error("❌ Invalid teacher type:", teacherType);
        return;
    }

    // Prevent switching to the same teacher
    if (CONFIG.currentTeacher === teacherType) {
        console.log("Already using this teacher");
        return;
    }

    const teacherConfig = CONFIG.teacherAvatars[teacherType];

    console.log(`🔄 Switching to ${teacherConfig.name} teacher...`);

    elements.loading.classList.remove("hidden");
    elements.loadingText.textContent = `Loading ${teacherConfig.name} teacher...`;
    if (elements.loadingProgress) {
        elements.loadingProgress.style.width = "0%";
    }

    try {
        // Stop any ongoing speech/animation
        if (head) {
            head.stop();
        }

        // Update config BEFORE loading
        CONFIG.currentTeacher = teacherType;
        CONFIG.avatarUrl = teacherConfig.url;
        CONFIG.tts.elevenLabsVoice = teacherConfig.elevenLabsVoice;

        // Use showAvatar - now preserves scene objects (lights, classroom)
        await head.showAvatar({
            url: teacherConfig.url,
            body: teacherConfig.body,
            avatarMood: "neutral",
            ttsLang: "en-GB",
            ttsVoice: teacherConfig.ttsVoice,
            ttsRate: CONFIG.ttsRate,
            ttsPitch: CONFIG.ttsPitch,
            lipsyncLang: "en",
            avatarIdleEyeContact: 0.3,
            avatarSpeakingEyeContact: 0.7,
            avatarIdleHeadMove: 0.5,
            avatarSpeakingHeadMove: 0.6
        }, (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                if (elements.loadingProgress) {
                    elements.loadingProgress.style.width = `${percent}%`;
                }
                if (elements.loadingText) {
                    elements.loadingText.textContent = `Loading ${teacherConfig.name}... ${percent}%`;
                }
            }
        });

        // Position the new avatar in the classroom
        if (head.armature) {
            // Find the gltf.scene parent container
            let avatarContainer = head.armature;
            while (avatarContainer.parent && avatarContainer.parent !== head.scene) {
                avatarContainer = avatarContainer.parent;
            }

            // Reset container to origin (important!)
            avatarContainer.position.set(0, 0, 0);
            avatarContainer.scale.set(1, 1, 1);
            avatarContainer.rotation.set(0, 0, 0);

            // Position the armature directly (like loadClassroomBackground does)
            head.armature.position.set(0.1, -6.7, -5);
            head.armature.scale.set(1.5, 1.5, 1.5);
            head.armature.rotation.y = THREE.MathUtils.degToRad(0);

            // Ensure all meshes are visible and have proper materials
            avatarContainer.traverse((child) => {
                child.visible = true;
                child.frustumCulled = false;
                if (child.isMesh || child.isSkinnedMesh) {
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                }
            });

            // Force skeleton and skinned mesh update
            avatarContainer.traverse((child) => {
                if (child.isSkinnedMesh) {
                    child.skeleton?.update();
                    child.updateMatrixWorld(true);
                }
                if (child.isBone) {
                    child.updateMatrixWorld(true);
                }
            });

            // Force a scene update
            head.scene.updateMatrixWorld(true);
        }

        // Save preference
        localStorage.setItem('edumind_teacher_preference', teacherType);

        elements.loading.classList.add("hidden");

        // Greet with the new teacher
        const greetingName = `${teacherConfig.title} ${teacherConfig.name}`;
        addMessageToChat(`👋 Hello! I'm ${greetingName}, your new teacher. How can I help you today?`, "teacher");

        // Teacher greeting animation
        if (head) {
            TeacherBehavior.greetingSequence();
            await speakText(`Hello! I'm ${greetingName}. How can I help you today?`);
        }

        console.log(`✅ Switched to ${teacherConfig.name} teacher successfully!`);

    } catch (error) {
        console.error("❌ Error switching teacher:", error);
        elements.loading.classList.add("hidden");
        addMessageToChat(`⚠️ Could not switch to ${teacherConfig.name} teacher. Please try again.`, "system");
    }
}


window.switchTeacher = switchTeacher;


// Greet Student (Updated for University Students)

async function greetStudent() {
    const teacherName = CONFIG.teacherAvatars[CONFIG.currentTeacher]?.name || "Abubokkor";
    let greeting;

    if (studentProfile) {
        const isUniversity = ['undergraduate', 'postgraduate', 'doctoral'].includes(studentProfile.educationLevel);

        if (isUniversity) {
            const yearText = studentProfile.year ? `${studentProfile.year}${getOrdinalSuffix(studentProfile.year)} year` : '';
            greeting = `Hello! Welcome back! I'm ${teacherName}, your ${studentProfile.programCode || studentProfile.programName || 'university'} teacher. ${yearText ? `You're in your ${yearText}.` : ''} What would you like to learn today? I can help with ${studentProfile.subjects?.slice(0, 3).join(', ')} and more!`;
        } else {
            greeting = `Hello! Welcome back! I'm ${teacherName}, your ${studentProfile.board} teacher. You're studying Class ${studentProfile.class} ${studentProfile.stream}. What would you like to learn today?`;
        }
    } else {
        greeting = `Hello! I'm ${teacherName}, your virtual teacher. What would you like to learn today?`;
    }

    // Add greeting to chat (don't save to history - it's just a welcome)
    addMessageToChat(greeting, "teacher", false);

    // Make the avatar speak with realistic greeting behavior
    if (head) {
        // Use TeacherBehavior for realistic greeting sequence
        await TeacherBehavior.greetingSequence();
        await speakText(greeting);

        // Return to idle after greeting
        setTimeout(() => {
            TeacherBehavior.startIdleBehavior();
        }, 3000);
    }
}

function getOrdinalSuffix(num) {
    const n = parseInt(num);
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
}

// ===========================================
// Event Listeners Setup
// ===========================================
function setupEventListeners() {
    // Send message
    elements.sendBtn?.addEventListener("click", handleSendMessage);

    // Enter key to send
    elements.userInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    elements.userInput?.addEventListener("input", () => {
        elements.userInput.style.height = "auto";
        elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 150) + "px";
    });

    // Voice input
    elements.micBtn?.addEventListener("click", toggleVoiceInput);

    // Language switch button
    const langSwitchBtn = document.getElementById("lang-switch-btn");
    const currentLangSpan = document.getElementById("current-lang");

    langSwitchBtn?.addEventListener("click", () => {
        // Toggle between English and Bengali
        if (selectedLanguage === "en-US") {
            selectedLanguage = "bn-BD";
            currentLangSpan.textContent = "বাং";
            addMessageToChat("🌐 Switched to Bengali. Speak in Bangla!", "system");
        } else {
            selectedLanguage = "en-US";
            currentLangSpan.textContent = "EN";
            addMessageToChat("🌐 Switched to English. Speak in English!", "system");
        }

        // If recording, restart with new language
        if (isRecording) {
            stopVoiceInput();
            setTimeout(() => startVoiceInput(), 300);
        }
    });

    // Language toggle button
    const langToggleBtn = document.getElementById("lang-toggle-btn");
    const langIndicator = document.getElementById("lang-indicator");

    langToggleBtn?.addEventListener("click", () => {
        // Toggle between English and Bengali
        if (!studentProfile) {
            studentProfile = { language: "en" };
        }

        if (studentProfile.language === "en") {
            studentProfile.language = "bn";
            langIndicator.textContent = "বাং";
            addMessageToChat("🌐 Language switched to Bengali. Speak in Bangla!", "system");
        } else {
            studentProfile.language = "en";
            langIndicator.textContent = "EN";
            addMessageToChat("🌐 Language switched to English. Speak in English!", "system");
        }

        console.log(`Language switched to: ${TTS_LANGUAGES[studentProfile.language]?.name}`);
    });

    // Mode buttons
    document.querySelectorAll(".mode-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            setMode(btn.dataset.mode);
        });
    });

    // File upload
    elements.fileUploadBtn?.addEventListener("click", () => {
        elements.fileInput?.click();
    });

    elements.fileInput?.addEventListener("change", handleFileUpload);

    // Settings modal
    elements.settingsBtn?.addEventListener("click", () => {
        elements.settingsModal?.classList.remove("hidden");
    });

    elements.closeSettings?.addEventListener("click", () => {
        elements.settingsModal?.classList.add("hidden");
    });

    elements.saveSettings?.addEventListener("click", saveSettings);

    // Teacher selector buttons
    const teacherOptions = document.querySelectorAll('.teacher-option');
    teacherOptions.forEach(btn => {
        btn.addEventListener('click', async () => {
            const teacherType = btn.dataset.teacher;

            // Update UI - remove selected from all, add to clicked
            teacherOptions.forEach(opt => opt.classList.remove('selected'));
            btn.classList.add('selected');

            // Switch teacher avatar
            await switchTeacher(teacherType);
        });
    });

    // Load saved teacher preference
    const savedTeacher = localStorage.getItem('edumind_teacher_preference');
    if (savedTeacher && CONFIG.teacherAvatars[savedTeacher]) {
        const btn = document.querySelector(`.teacher-option[data-teacher="${savedTeacher}"]`);
        if (btn) {
            teacherOptions.forEach(opt => opt.classList.remove('selected'));
            btn.classList.add('selected');
            CONFIG.currentTeacher = savedTeacher;
            CONFIG.avatarUrl = CONFIG.teacherAvatars[savedTeacher].url;
        }
    }

    // Click outside modal to close
    elements.settingsModal?.addEventListener("click", (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.add("hidden");
        }
    });

    // Theme toggle
    elements.themeToggle?.addEventListener("click", toggleTheme);

    // Chat Panel Toggle (new Liquid Glass UI)
    elements.toggleChatBtn?.addEventListener("click", toggleChatPanel);
    elements.closeChatBtn?.addEventListener("click", () => {
        elements.chatPanel?.classList.add("hidden");
    });

    // Quick action buttons
    elements.quickButtons?.forEach(btn => {
        btn.addEventListener("click", () => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });

    // Range sliders
    elements.speechRate?.addEventListener("input", () => {
        const value = parseFloat(elements.speechRate.value);
        elements.rateValue.textContent = `${value.toFixed(1)}x`;
        CONFIG.ttsRate = value;
    });

    elements.speechPitch?.addEventListener("input", () => {
        const value = parseInt(elements.speechPitch.value);
        elements.pitchValue.textContent = value;
        CONFIG.ttsPitch = value;
    });

    // Progress button
    elements.progressBtn?.addEventListener("click", toggleProgressPanel);

    // Stop/Pause speech button
    elements.stopBtn?.addEventListener("click", () => {
        if (isSpeaking) {
            stopSpeech();
        }
    });

    // Long press on stop button to pause (optional)
    let stopBtnPressTimer = null;
    elements.stopBtn?.addEventListener("mousedown", () => {
        stopBtnPressTimer = setTimeout(() => {
            togglePauseSpeech();
        }, 500); // Long press = 500ms
    });
    elements.stopBtn?.addEventListener("mouseup", () => {
        clearTimeout(stopBtnPressTimer);
    });
    elements.stopBtn?.addEventListener("mouseleave", () => {
        clearTimeout(stopBtnPressTimer);
    });

    // Visibility change - pause/resume avatar
    document.addEventListener("visibilitychange", () => {
        if (head) {
            if (document.visibilityState === "visible") {
                head.start();
            } else {
                head.stop();
            }
        }
    });

    // ===========================================
    // AUTH BUTTON EVENT LISTENERS
    // ===========================================

    // Credits button - show subscription plans
    const creditsBtn = document.getElementById("credits-btn");
    creditsBtn?.addEventListener("click", () => {
        showSubscriptionPlans();
    });

    // ===========================================
    // TEXTBOOK LIBRARY EVENT LISTENERS
    // ===========================================

    // Library button - open library modal
    const libraryBtn = document.getElementById("library-btn");
    libraryBtn?.addEventListener("click", openLibraryModal);

    // Close library modal
    const closeLibraryBtn = document.getElementById("closeLibrary");
    closeLibraryBtn?.addEventListener("click", closeLibraryModal);

    // Library tabs
    document.querySelectorAll('.library-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchLibraryTab(tab.dataset.tab);
        });
    });

    // Library file input
    const libraryFileInput = document.getElementById("library-file-input");
    libraryFileInput?.addEventListener("change", handleLibraryFileSelect);

    // Cancel upload
    const cancelUploadBtn = document.getElementById("cancel-upload-btn");
    cancelUploadBtn?.addEventListener("click", hideUploadForm);

    // Confirm upload
    const confirmUploadBtn = document.getElementById("confirm-upload-btn");
    confirmUploadBtn?.addEventListener("click", confirmUpload);

    // Back to library from chapters
    const backToLibraryBtn = document.getElementById("backToLibrary");
    backToLibraryBtn?.addEventListener("click", () => {
        document.getElementById('chapter-modal')?.classList.add('hidden');
        document.getElementById('library-modal')?.classList.remove('hidden');
    });

    // Close chapter modal
    const closeChapterBtn = document.getElementById("closeChapter");
    closeChapterBtn?.addEventListener("click", () => {
        document.getElementById('chapter-modal')?.classList.add('hidden');
    });

    // Click outside library modal to close
    const libraryModal = document.getElementById("library-modal");
    libraryModal?.addEventListener("click", (e) => {
        if (e.target === libraryModal) {
            closeLibraryModal();
        }
    });

    // Click outside chapter modal to close
    const chapterModal = document.getElementById("chapter-modal");
    chapterModal?.addEventListener("click", (e) => {
        if (e.target === chapterModal) {
            chapterModal.classList.add('hidden');
        }
    });

    // User button - toggle between login modal and profile
    const userBtn = document.getElementById("user-btn");
    userBtn?.addEventListener("click", () => {
        // Check if user is logged in OR has a local profile
        const hasLocalProfile = localStorage.getItem('edumind_student_profile');

        if (getCurrentUser() || hasLocalProfile) {
            // User is logged in or has local profile, show profile
            showUserProfile();
        } else {
            // No profile at all, show onboarding
            showOnboarding();
        }
    });

    // Close auth modal
    const closeAuthBtn = document.getElementById("close-auth");
    closeAuthBtn?.addEventListener("click", () => {
        const authModal = document.getElementById("auth-modal");
        authModal?.classList.add("hidden");
    });

    // Click outside modal to close
    const authModal = document.getElementById("auth-modal");
    authModal?.addEventListener("click", (e) => {
        if (e.target === authModal) {
            authModal.classList.add("hidden");
        }
    });

    // Switch between login and signup forms
    const showSignupLink = document.getElementById("show-signup");
    const showLoginLink = document.getElementById("show-login");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    showSignupLink?.addEventListener("click", (e) => {
        e.preventDefault();
        loginForm?.classList.add("hidden");
        signupForm?.classList.remove("hidden");
    });

    showLoginLink?.addEventListener("click", (e) => {
        e.preventDefault();
        signupForm?.classList.add("hidden");
        loginForm?.classList.remove("hidden");
    });

    // Login button
    const loginBtn = document.getElementById("login-btn");
    loginBtn?.addEventListener("click", async () => {
        const email = document.getElementById("login-email")?.value;
        const password = document.getElementById("login-password")?.value;

        if (!email || !password) {
            addMessageToChat("⚠️ Please enter both email and password", "system");
            return;
        }

        const result = await loginWithEmail(email, password);
        if (result.success) {
            authModal?.classList.add("hidden");
            addMessageToChat(`👋 Welcome back, ${result.user.displayName || result.user.email}!`, "system");

            // Load user progress and chat history
            await loadProgress();
            await loadChatHistory();
        } else {
            addMessageToChat(`❌ Login failed: ${result.error}`, "system");
        }
    });

    // Signup button
    const signupBtn = document.getElementById("signup-btn");
    signupBtn?.addEventListener("click", async () => {
        const name = document.getElementById("signup-name")?.value;
        const email = document.getElementById("signup-email")?.value;
        const password = document.getElementById("signup-password")?.value;
        const grade = document.getElementById("signup-grade")?.value;

        if (!name || !email || !password || !grade) {
            addMessageToChat("⚠️ Please fill in all fields", "system");
            return;
        }

        const result = await signupWithEmail(email, password, name, grade);
        if (result.success) {
            authModal?.classList.add("hidden");
            addMessageToChat(`🎉 Welcome to EduMind, ${name}!`, "system");
        } else {
            addMessageToChat(`❌ Signup failed: ${result.error}`, "system");
        }
    });

    // Google login button (in login form)
    const googleLoginBtn = document.getElementById("google-login-btn");
    googleLoginBtn?.addEventListener("click", async () => {
        const result = await loginWithGoogle();
        if (result.success) {
            authModal?.classList.add("hidden");
            addMessageToChat(`👋 Welcome, ${result.user.displayName || result.user.email}!`, "system");

            // Load user progress and chat history
            await loadProgress();
            await loadChatHistory();
        } else {
            addMessageToChat(`❌ Google login failed: ${result.error}`, "system");
        }
    });

    // Google signup button (in signup form)
    const googleSignupBtn = document.getElementById("google-signup-btn");
    googleSignupBtn?.addEventListener("click", async () => {
        const result = await loginWithGoogle();
        if (result.success) {
            authModal?.classList.add("hidden");
            addMessageToChat(`🎉 Welcome to EduMind, ${result.user.displayName || result.user.email}!`, "system");
        } else {
            addMessageToChat(`❌ Google signup failed: ${result.error}`, "system");
        }
    });

    // Logout button (also serves as "Clear Profile" for local-only users)
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn?.addEventListener("click", async () => {
        const authModal = document.getElementById("auth-modal");
        const userProfileDiv = document.getElementById("user-profile");

        if (getCurrentUser()) {
            // User is logged in - do actual logout
            const result = await logout();
            if (result.success) {
                userProfileDiv?.classList.add("hidden");
                authModal?.classList.add("hidden");

                // Clear local storage and reset state
                localStorage.removeItem('edumind_student_profile');
                studentProfile = null;
                isOnboarded = false;

                addMessageToChat("👋 Logged out successfully", "system");

                // Show onboarding for next session
                setTimeout(() => {
                    showOnboarding();
                }, 1000);
            }
        } else {
            // Local-only user - just clear profile
            userProfileDiv?.classList.add("hidden");
            authModal?.classList.add("hidden");

            // Clear local storage and reset state
            localStorage.removeItem('edumind_student_profile');
            studentProfile = null;
            isOnboarded = false;

            addMessageToChat("🗑️ Profile cleared. You can start fresh!", "system");

            // Show onboarding
            setTimeout(() => {
                showOnboarding();
            }, 1000);
        }
    });

    // Change Profile Picture (in user profile)
    const changeProfilePicBtn = document.getElementById("change-profile-pic-btn");
    const changeProfilePicInput = document.getElementById("change-profile-pic-input");

    changeProfilePicBtn?.addEventListener("click", () => {
        changeProfilePicInput?.click();
    });

    changeProfilePicInput?.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
            const result = await uploadProfilePicture(file);
            if (result.success) {
                const profileAvatarImg = document.getElementById('profile-avatar-img');
                const profileAvatarText = document.getElementById('profile-avatar-text');

                if (profileAvatarImg) {
                    profileAvatarImg.src = result.photoURL;
                    profileAvatarImg.style.display = 'block';
                }
                if (profileAvatarText) {
                    profileAvatarText.style.display = 'none';
                }
                addMessageToChat("✅ Profile picture updated!", "system");
            } else {
                addMessageToChat(`❌ Failed to update picture: ${result.error}`, "system");
            }
        }
    });

    // Edit Profile button - opens onboarding to edit details
    const editProfileBtn = document.getElementById("edit-profile-btn");
    editProfileBtn?.addEventListener("click", () => {
        // Hide user profile display
        const userProfile = document.getElementById("user-profile");
        userProfile?.classList.add("hidden");

        // Show onboarding modal (skip step 0, go directly to step 1)
        const onboardingModal = document.getElementById("onboarding-modal");
        if (onboardingModal) {
            // Set edit mode flag and current step
            onboardingModal.dataset.editMode = 'true';
            onboardingModal.dataset.currentStep = '1'; // Start at step 1 for editing
            onboardingModal.classList.remove("hidden");

            // Hide step 0 (welcome) and show step 1 (country selection)
            document.querySelector('.onboarding-step[data-step="0"]')?.classList.remove('active');
            document.querySelector('.onboarding-step[data-step="1"]')?.classList.add('active');

            // Show progress bar and update it
            document.getElementById('progress-container')?.classList.remove('hidden');
            const progressBar = document.getElementById('onboarding-progress');
            if (progressBar) progressBar.style.width = '20%';

            // Update step 4's Continue button to say "Save Profile" when editing
            const step4NextBtn = document.querySelector('.onboarding-step[data-step="4"] .onboarding-next');
            if (step4NextBtn) {
                step4NextBtn.textContent = 'Save Profile ✓';
            }

            // Re-render countries to ensure they're visible
            const countryGrid = document.getElementById('country-grid');
            if (countryGrid) {
                countryGrid.innerHTML = COUNTRIES.map(c => `
                    <button class="country-btn" data-country="${c.code}">
                        <span class="country-flag">${c.flag}</span>
                        <span class="country-name">${c.name}</span>
                        <span class="country-board">${c.board}</span>
                    </button>
                `).join('');

                countryGrid.querySelectorAll('.country-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        countryGrid.querySelectorAll('.country-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                    });
                });
            }

            // Pre-select current values if available
            const profile = getStudentProfile();
            if (profile) {
                // Pre-select country
                setTimeout(() => {
                    const countryBtn = document.querySelector(`.country-btn[data-country="${profile.country}"]`);
                    if (countryBtn) countryBtn.classList.add('selected');
                }, 100);

                console.log("✏️ Editing profile for:", profile.email || profile.id);
            }

            // Re-attach event handlers for all Continue buttons in edit mode
            const skipBtn = document.getElementById('skip-onboarding');

            // Step 1 Continue
            const step1Continue = document.querySelector('.onboarding-step[data-step="1"] .onboarding-next');
            if (step1Continue) {
                step1Continue.onclick = () => {
                    console.log("✏️ Edit mode - Step 1 Continue, going to step 2");
                    document.querySelector('.onboarding-step[data-step="1"]')?.classList.remove('active');
                    document.querySelector('.onboarding-step[data-step="2"]')?.classList.add('active');
                    onboardingModal.dataset.currentStep = '2';
                    const progressBar = document.getElementById('onboarding-progress');
                    if (progressBar) progressBar.style.width = '40%';
                };
            }

            // Step 2 Continue & Back
            const step2Continue = document.querySelector('.onboarding-step[data-step="2"] .onboarding-next');
            const step2Back = document.querySelector('.onboarding-step[data-step="2"] .onboarding-back');
            if (step2Continue) {
                step2Continue.onclick = () => {
                    console.log("✏️ Edit mode - Step 2 Continue, going to step 3");
                    document.querySelector('.onboarding-step[data-step="2"]')?.classList.remove('active');
                    document.querySelector('.onboarding-step[data-step="3"]')?.classList.add('active');
                    onboardingModal.dataset.currentStep = '3';
                    const progressBar = document.getElementById('onboarding-progress');
                    if (progressBar) progressBar.style.width = '60%';

                    // Populate class grid based on selected education level
                    const selectedLevel = document.querySelector('.level-btn.selected')?.dataset.level || 'secondary';
                    updateStep3ForLevel(selectedLevel);

                    // Add click handlers for dynamically created buttons after a small delay
                    setTimeout(() => {
                        // Department buttons (for university levels)
                        document.querySelectorAll('.dept-btn').forEach(btn => {
                            btn.onclick = () => {
                                document.querySelectorAll('.dept-btn').forEach(b => b.classList.remove('selected'));
                                btn.classList.add('selected');
                            };
                        });
                        // Class buttons (for school levels)
                        document.querySelectorAll('.class-btn').forEach(btn => {
                            btn.onclick = () => {
                                document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('selected'));
                                btn.classList.add('selected');
                            };
                        });
                    }, 50);
                };
            }
            if (step2Back) {
                step2Back.onclick = () => {
                    document.querySelector('.onboarding-step[data-step="2"]')?.classList.remove('active');
                    document.querySelector('.onboarding-step[data-step="1"]')?.classList.add('active');
                    onboardingModal.dataset.currentStep = '1';
                    const progressBar = document.getElementById('onboarding-progress');
                    if (progressBar) progressBar.style.width = '20%';
                };
            }

            // Step 3 Continue & Back
            const step3Continue = document.querySelector('.onboarding-step[data-step="3"] .onboarding-next');
            const step3Back = document.querySelector('.onboarding-step[data-step="3"] .onboarding-back');
            if (step3Continue) {
                step3Continue.onclick = () => {
                    console.log("✏️ Edit mode - Step 3 Continue, going to step 4");

                    // Get selected level to determine what step 4 shows
                    const selectedLevel = document.querySelector('.level-btn.selected')?.dataset.level;
                    const isUniversity = selectedLevel === 'undergraduate' || selectedLevel === 'postgraduate' || selectedLevel === 'doctoral';

                    // Update step 4 based on level
                    updateStep4ForLevel(selectedLevel);

                    // If university, populate programs for selected department
                    if (isUniversity) {
                        const selectedDept = document.querySelector('.dept-btn.selected')?.dataset.dept;
                        if (selectedDept) {
                            updateProgramsForDepartment(selectedDept);
                            // Re-add click handlers for the newly created buttons
                            setTimeout(() => {
                                document.querySelectorAll('.program-btn').forEach(btn => {
                                    btn.onclick = () => {
                                        document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
                                        btn.classList.add('selected');
                                    };
                                });
                                document.querySelectorAll('.year-btn').forEach(btn => {
                                    btn.onclick = () => {
                                        document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
                                        btn.classList.add('selected');
                                    };
                                });
                            }, 50);
                        }
                    } else {
                        // For non-university, add stream button handlers
                        setTimeout(() => {
                            document.querySelectorAll('.stream-btn').forEach(btn => {
                                btn.onclick = () => {
                                    document.querySelectorAll('.stream-btn').forEach(b => b.classList.remove('selected'));
                                    btn.classList.add('selected');
                                };
                            });
                        }, 50);
                    }

                    document.querySelector('.onboarding-step[data-step="3"]')?.classList.remove('active');
                    document.querySelector('.onboarding-step[data-step="4"]')?.classList.add('active');
                    onboardingModal.dataset.currentStep = '4';
                    const progressBar = document.getElementById('onboarding-progress');
                    if (progressBar) progressBar.style.width = '80%';
                };
            }
            if (step3Back) {
                step3Back.onclick = () => {
                    document.querySelector('.onboarding-step[data-step="3"]')?.classList.remove('active');
                    document.querySelector('.onboarding-step[data-step="2"]')?.classList.add('active');
                    onboardingModal.dataset.currentStep = '2';
                    const progressBar = document.getElementById('onboarding-progress');
                    if (progressBar) progressBar.style.width = '40%';
                };
            }

            // Step 4 Save Profile & Back
            const step4Save = document.querySelector('.onboarding-step[data-step="4"] .onboarding-next');
            const step4Back = document.querySelector('.onboarding-step[data-step="4"] .onboarding-back');
            if (step4Save) {
                step4Save.onclick = async () => {
                    console.log("✏️ Edit mode - Save Profile clicked");
                    // Collect and save profile
                    const selectedCountry = document.querySelector('.country-btn.selected')?.dataset.country || 'bangladesh';
                    const selectedLevel = document.querySelector('.level-btn.selected')?.dataset.level || 'secondary';
                    const selectedClass = document.querySelector('.class-btn.selected')?.dataset.class;
                    const selectedStream = document.querySelector('.stream-btn.selected')?.dataset.stream;
                    const selectedDept = document.querySelector('.dept-btn.selected')?.dataset.dept;
                    const selectedProgram = document.querySelector('.program-btn.selected')?.dataset.program;
                    const selectedYear = document.querySelector('.year-btn.selected')?.dataset.year;

                    const isUniversity = selectedLevel === 'undergraduate' || selectedLevel === 'postgraduate' || selectedLevel === 'doctoral';

                    // Get country info
                    const countryBtn = document.querySelector('.country-btn.selected');
                    const countryName = countryBtn?.querySelector('.country-name')?.textContent || 'Bangladesh';

                    // Start with basic profile info (not spreading existing to avoid old fields)
                    const existingProfile = getStudentProfile() || {};
                    const updatedProfile = {
                        id: existingProfile.id,
                        email: existingProfile.email,
                        displayName: existingProfile.displayName,
                        userId: existingProfile.userId,
                        createdAt: existingProfile.createdAt,
                        country: selectedCountry,
                        countryName: countryName,
                        educationLevel: selectedLevel,
                        type: isUniversity ? 'university' : 'school',
                        language: existingProfile.language || 'en-US'
                    };

                    if (isUniversity) {
                        // University student - save department, program, year
                        updatedProfile.department = selectedDept;
                        updatedProfile.program = selectedProgram;
                        updatedProfile.year = selectedYear;
                        // Get program name for display
                        const programBtn = document.querySelector('.program-btn.selected');
                        if (programBtn) {
                            updatedProfile.programName = programBtn.querySelector('.program-name')?.textContent || selectedProgram;
                        }
                        // Don't include class, stream, board for university students
                    } else {
                        // School student (Class 1-12) - save class, stream, board
                        updatedProfile.class = selectedClass || '10';
                        updatedProfile.stream = selectedStream || 'science';
                        // Get board from country data
                        const boardText = countryBtn?.querySelector('.country-board')?.textContent || 'NCTB';
                        updatedProfile.board = boardText;
                        // Don't include department, program, year for school students
                    }

                    // Get subjects based on profile type
                    if (isUniversity && selectedDept && selectedProgram) {
                        const prog = getUniversityProgram(selectedDept, selectedProgram);
                        updatedProfile.subjects = prog?.subjects || [];
                    } else if (!isUniversity) {
                        updatedProfile.subjects = getSubjectsForClass(selectedCountry, selectedClass || '10', selectedStream || 'science');
                    }

                    console.log("📝 Saving updated profile:", updatedProfile);
                    await saveStudentProfile(updatedProfile);

                    onboardingModal.dataset.editMode = 'false';
                    onboardingModal.classList.add('hidden');

                    // Re-show the user profile with updated data
                    showUserProfile();

                    addMessageToChat("✅ Profile updated successfully!", "system");
                };
            }
            if (step4Back) {
                step4Back.onclick = () => {
                    document.querySelector('.onboarding-step[data-step="4"]')?.classList.remove('active');
                    document.querySelector('.onboarding-step[data-step="3"]')?.classList.add('active');
                    onboardingModal.dataset.currentStep = '3';
                    const progressBar = document.getElementById('onboarding-progress');
                    if (progressBar) progressBar.style.width = '60%';
                };
            }

            // Add click handlers for level buttons
            document.querySelectorAll('.level-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
            });

            // Add click handlers for class buttons
            document.querySelectorAll('.class-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
            });

            // Add click handlers for department buttons
            document.querySelectorAll('.dept-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.dept-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
            });

            // Add click handlers for program buttons
            document.querySelectorAll('.program-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
            });

            // Add click handlers for year buttons
            document.querySelectorAll('.year-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
            });

            // Add click handlers for stream buttons
            document.querySelectorAll('.stream-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.stream-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                };
            });

            if (skipBtn) {
                skipBtn.onclick = () => {
                    console.log("✏️ Edit mode - Skip clicked, closing modal");
                    onboardingModal.dataset.editMode = 'false';
                    onboardingModal.classList.add('hidden');
                    addMessageToChat("✏️ Profile editing cancelled", "system");
                };
            }
        }

        addMessageToChat("✏️ Edit your profile details", "system");
    });

    // Link Account button - for local-only users to create account
    const linkAccountBtn = document.getElementById("link-account-btn");
    linkAccountBtn?.addEventListener("click", () => {
        // Close auth modal
        const authModal = document.getElementById("auth-modal");
        authModal?.classList.add("hidden");

        // Show onboarding at step 5 (account creation)
        const onboardingModal = document.getElementById("onboarding-modal");
        if (onboardingModal) {
            onboardingModal.classList.remove("hidden");

            // Hide all steps first
            document.querySelectorAll('.onboarding-step').forEach(step => step.classList.remove('active'));

            // Show step 5 (account creation)
            document.querySelector('.onboarding-step[data-step="5"]')?.classList.add('active');

            // Show progress bar at 100%
            document.getElementById('progress-container')?.classList.remove('hidden');
            const progressBar = document.getElementById('onboarding-progress');
            if (progressBar) progressBar.style.width = '100%';

            // Pre-fill name from local profile
            const profile = getStudentProfile();
            if (profile && profile.displayName) {
                const nameInput = document.getElementById('signup-fullname');
                if (nameInput) nameInput.value = profile.displayName;
            }
        }

        addMessageToChat("🔗 Create an account to sync your progress across devices!", "system");
    });

    // Close profile button
    const closeProfileBtn = document.getElementById("close-profile");
    closeProfileBtn?.addEventListener("click", () => {
        const userProfile = document.getElementById("user-profile");
        userProfile?.classList.add("hidden");
    });

    // ===========================================
    // CHAT HISTORY SIDEBAR EVENT LISTENERS
    // ===========================================

    // Toggle chat history sidebar
    elements.toggleHistorySidebarBtn?.addEventListener("click", () => {
        toggleChatHistorySidebar();
    });

    // Close chat history sidebar
    elements.closeHistorySidebarBtn?.addEventListener("click", () => {
        elements.chatHistorySidebar?.classList.add("hidden");
    });

    // New chat button
    elements.newChatBtn?.addEventListener("click", async () => {
        await startNewChat();
    });

    // Search chats
    elements.chatSearchInput?.addEventListener("input", (e) => {
        filterChatHistory(e.target.value);
    });

    // History login button
    elements.historyLoginBtn?.addEventListener("click", () => {
        elements.chatHistorySidebar?.classList.add("hidden");
        showLoginForm();
    });
}

// ===========================================
// Mode Management
// ===========================================
function setMode(mode) {
    currentMode = mode;

    // Update UI
    document.querySelectorAll(".mode-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    // Show/hide file upload based on mode
    const fileUploadArea = document.getElementById("file-upload-area");
    if (fileUploadArea) {
        fileUploadArea.classList.toggle("visible", mode === 'file');
    }

    console.log(`📍 Mode changed to: ${mode}`);
}

// ===========================================
// Chat History Functions (Professional Like Claude/ChatGPT)
// ===========================================

// Cache for chat history
let chatHistoryCache = [];
let currentChatMessages = [];

// Toggle chat history sidebar
function toggleChatHistorySidebar() {
    const sidebar = elements.chatHistorySidebar;
    if (!sidebar) return;

    const isHidden = sidebar.classList.contains("hidden");

    if (isHidden) {
        sidebar.classList.remove("hidden");
        refreshChatHistory();
    } else {
        sidebar.classList.add("hidden");
    }
}

// Refresh chat history from Firebase
async function refreshChatHistory() {
    const user = getCurrentUser();

    if (!user) {
        // Show login prompt
        elements.chatHistoryList.innerHTML = '';
        elements.historyLoginPrompt?.classList.remove("hidden");
        return;
    }

    elements.historyLoginPrompt?.classList.add("hidden");

    // Show loading
    elements.chatHistoryList.innerHTML = `
        <div class="history-loading">
            <div class="loading-spinner small"></div>
            <span>Loading chats...</span>
        </div>
    `;

    try {
        const chats = await loadChatHistory(50);
        chatHistoryCache = chats;
        renderChatHistory(chats);
    } catch (error) {
        console.error("Error loading chat history:", error);
        elements.chatHistoryList.innerHTML = `
            <div class="history-empty">
                <span class="history-empty-icon">⚠️</span>
                <p>Failed to load chats</p>
            </div>
        `;
    }
}

// Render chat history list
function renderChatHistory(chats) {
    if (!chats || chats.length === 0) {
        elements.chatHistoryList.innerHTML = `
            <div class="history-empty">
                <span class="history-empty-icon">💬</span>
                <p>No conversations yet.<br>Start chatting to save history!</p>
            </div>
        `;
        return;
    }

    // Group chats by date
    const grouped = groupChatsByDate(chats);
    let html = '';

    for (const [dateLabel, dateChats] of Object.entries(grouped)) {
        html += `<div class="history-date-divider">${dateLabel}</div>`;

        for (const chat of dateChats) {
            const isActive = getCurrentChatId() === chat.id;
            const modeIcon = getModeIcon(chat.mode);
            const timeAgo = getTimeAgo(chat.updatedAt);

            html += `
                <div class="chat-history-item ${isActive ? 'active' : ''}" data-chat-id="${chat.id}">
                    <span class="chat-item-icon">${modeIcon}</span>
                    <div class="chat-item-content">
                        <div class="chat-item-title">${escapeHtml(chat.title)}</div>
                        <div class="chat-item-meta">${chat.messageCount} messages · ${timeAgo}</div>
                    </div>
                    <div class="chat-item-actions">
                        <button class="chat-action-btn rename" title="Rename" data-chat-id="${chat.id}">✏️</button>
                        <button class="chat-action-btn delete" title="Delete" data-chat-id="${chat.id}">🗑️</button>
                    </div>
                </div>
            `;
        }
    }

    elements.chatHistoryList.innerHTML = html;

    // Add click listeners
    document.querySelectorAll('.chat-history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't load if clicking action buttons
            if (e.target.closest('.chat-action-btn')) return;
            loadChatFromHistory(item.dataset.chatId);
        });
    });

    // Add rename listeners
    document.querySelectorAll('.chat-action-btn.rename').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showRenameDialog(btn.dataset.chatId);
        });
    });

    // Add delete listeners
    document.querySelectorAll('.chat-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteChat(btn.dataset.chatId);
        });
    });
}

// Group chats by date
function groupChatsByDate(chats) {
    const groups = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Previous 30 Days': [],
        'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    for (const chat of chats) {
        const chatDate = new Date(chat.updatedAt);

        if (chatDate >= today) {
            groups['Today'].push(chat);
        } else if (chatDate >= yesterday) {
            groups['Yesterday'].push(chat);
        } else if (chatDate >= weekAgo) {
            groups['Previous 7 Days'].push(chat);
        } else if (chatDate >= monthAgo) {
            groups['Previous 30 Days'].push(chat);
        } else {
            groups['Older'].push(chat);
        }
    }

    // Remove empty groups
    const result = {};
    for (const [key, value] of Object.entries(groups)) {
        if (value.length > 0) {
            result[key] = value;
        }
    }

    return result;
}

// Get mode icon
function getModeIcon(mode) {
    const icons = {
        'chat': '💬',
        'curriculum': '📚',
        'file': '📄',
        'research': '🔬'
    };
    return icons[mode] || '💬';
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

// Load chat from history
async function loadChatFromHistory(chatId) {
    try {
        const chat = await loadChat(chatId);
        if (!chat) {
            addMessageToChat("⚠️ Could not load chat", "system");
            return;
        }

        // Set current chat ID
        setCurrentChatId(chatId);

        // Clear current messages
        elements.chatMessages.innerHTML = '';
        conversationHistory = [];
        currentChatMessages = [];

        // Set mode
        if (chat.mode) {
            setMode(chat.mode);
        }

        // Restore messages
        if (chat.messages && Array.isArray(chat.messages)) {
            for (const msg of chat.messages) {
                const role = msg.role === 'user' ? 'user' : 'teacher';
                const content = msg.content || msg.parts?.[0]?.text || '';

                if (content) {
                    addMessageToChat(content, role, false);
                    conversationHistory.push({
                        role: msg.role,
                        content: content
                    });
                    currentChatMessages.push(msg);
                }
            }
        }

        // Update sidebar to show active chat
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chatId);
        });

        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            elements.chatHistorySidebar?.classList.add("hidden");
        }

        console.log(`✅ Loaded chat: ${chat.title}`);

    } catch (error) {
        console.error("Error loading chat:", error);
        addMessageToChat("⚠️ Error loading chat", "system");
    }
}

// Start new chat
async function startNewChat() {
    // Save current chat if it has messages
    if (currentChatMessages.length > 0 && getCurrentUser()) {
        const currentId = getCurrentChatId();
        if (currentId) {
            await updateChatHistory(currentId, currentChatMessages);
        } else {
            await saveChatHistory(currentMode, currentChatMessages);
        }
    }

    // Reset state
    setCurrentChatId(null);
    conversationHistory = [];
    currentChatMessages = [];

    // Clear chat UI
    elements.chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-avatar">👋</div>
            <h3>New Conversation</h3>
            <p>Ask me anything about your studies. I'm here to help you learn!</p>
        </div>
    `;

    // Update sidebar
    document.querySelectorAll('.chat-history-item').forEach(item => {
        item.classList.remove('active');
    });

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        elements.chatHistorySidebar?.classList.add("hidden");
    }

    console.log("✨ Started new chat");
}

// Filter chat history by search
function filterChatHistory(query) {
    if (!query.trim()) {
        renderChatHistory(chatHistoryCache);
        return;
    }

    const filtered = chatHistoryCache.filter(chat =>
        chat.title.toLowerCase().includes(query.toLowerCase())
    );

    renderChatHistory(filtered);
}

// Show rename dialog
function showRenameDialog(chatId) {
    const chat = chatHistoryCache.find(c => c.id === chatId);
    if (!chat) return;

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'rename-dialog';
    dialog.innerHTML = `
        <div class="rename-dialog-content">
            <h4>Rename Chat</h4>
            <input type="text" id="rename-input" value="${escapeHtml(chat.title)}" maxlength="100">
            <div class="rename-dialog-actions">
                <button class="btn secondary" id="rename-cancel">Cancel</button>
                <button class="btn primary" id="rename-save">Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Show dialog with animation
    setTimeout(() => dialog.classList.add('visible'), 10);

    // Focus input
    const input = document.getElementById('rename-input');
    input?.focus();
    input?.select();

    // Save handler
    const saveHandler = async () => {
        const newTitle = input?.value.trim();
        if (newTitle && newTitle !== chat.title) {
            const result = await renameChat(chatId, newTitle);
            if (result.success) {
                // Update cache
                const cacheChat = chatHistoryCache.find(c => c.id === chatId);
                if (cacheChat) cacheChat.title = newTitle;
                renderChatHistory(chatHistoryCache);
            }
        }
        closeDialog();
    };

    // Close handler
    const closeDialog = () => {
        dialog.classList.remove('visible');
        setTimeout(() => dialog.remove(), 300);
    };

    // Event listeners
    document.getElementById('rename-save')?.addEventListener('click', saveHandler);
    document.getElementById('rename-cancel')?.addEventListener('click', closeDialog);
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveHandler();
        if (e.key === 'Escape') closeDialog();
    });
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog();
    });
}

// Confirm delete chat
function confirmDeleteChat(chatId) {
    const chat = chatHistoryCache.find(c => c.id === chatId);
    if (!chat) return;

    if (confirm(`Delete "${chat.title}"?\n\nThis action cannot be undone.`)) {
        performDeleteChat(chatId);
    }
}

// Perform delete chat
async function performDeleteChat(chatId) {
    const result = await deleteChat(chatId);

    if (result.success) {
        // Remove from cache
        chatHistoryCache = chatHistoryCache.filter(c => c.id !== chatId);
        renderChatHistory(chatHistoryCache);

        // If we deleted the current chat, start new
        if (getCurrentChatId() === chatId) {
            await startNewChat();
        }

        addMessageToChat("🗑️ Chat deleted", "system");
    } else {
        addMessageToChat(`⚠️ Failed to delete: ${result.error}`, "system");
    }
}

// Auto-save chat after each message
// Only saves when there's a real conversation (at least 1 user + 1 teacher message)
async function autoSaveChat() {
    const user = getCurrentUser();
    if (!user) return;


    if (currentChatMessages.length === 0) return;

    // Check if we have a real conversation (at least 1 user message AND 1 model reply)
    const hasUserMessage = currentChatMessages.some(msg => msg.role === 'user');
    const hasModelReply = currentChatMessages.some(msg => msg.role === 'model');


    if (!hasUserMessage || !hasModelReply) {
        console.log("📝 Skipping save - need both user message and teacher reply");
        return;
    }

    try {
        const currentId = getCurrentChatId();
        if (currentId) {

            await updateChatHistory(currentId, currentChatMessages);
        } else {
            // Save as new chat
            const result = await saveChatHistory(currentMode, currentChatMessages);
            if (result.success) {
                setCurrentChatId(result.chatId);

                refreshChatHistory();
            }
        }
    } catch (error) {
        console.error("Auto-save error:", error);
    }
}


window.toggleChatHistorySidebar = toggleChatHistorySidebar;
window.refreshChatHistory = refreshChatHistory;
window.startNewChat = startNewChat;

// ===========================================


async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show file preview with uploading status
    const preview = document.getElementById("file-preview");
    if (preview) {
        preview.innerHTML = `
            <div class="file-info">
                <span class="file-icon">📄</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
                <span class="upload-status">⏳ Uploading...</span>
                <button class="remove-file-btn" onclick="removeUploadedFile()">✕</button>
            </div>
        `;
        preview.classList.add("visible");
    }

    uploadedFile = file;

    try {


        if (file.size < 4 * 1024 * 1024) {
            // Small file - use base64 inline
            uploadedFileData = await fileToBase64(file);
            uploadedFileUri = null;
            console.log("📄 Small file - using inline base64");
        } else {

            console.log("📤 Large file - uploading to Gemini Files API...");
            const fileUri = await uploadToGeminiFilesAPI(file);
            uploadedFileUri = fileUri;
            uploadedFileData = { mimeType: file.type, data: null };
            console.log("✅ File uploaded to Gemini:", fileUri);
        }

        // Update preview to show success
        if (preview) {
            const statusEl = preview.querySelector('.upload-status');
            if (statusEl) {
                statusEl.textContent = '✅ Ready';
                statusEl.style.color = '#22c55e';
            }
        }

        setMode('file');
        addMessageToChat(`📄 File uploaded: ${file.name}. Ask me anything about it!`, "system");
    } catch (error) {
        console.error("Error processing file:", error);
        if (preview) {
            const statusEl = preview.querySelector('.upload-status');
            if (statusEl) {
                statusEl.textContent = '❌ Failed';
                statusEl.style.color = '#ef4444';
            }
        }
        addMessageToChat("❌ Error processing file. Please try again.", "system");
    }
}


async function uploadToGeminiFilesAPI(file) {
    // Note: File uploads must use direct API even in production due to multipart requirements
    // This is acceptable as the key is only used server-side
    const apiKey = CONFIG.geminiApiKey;

    const startUploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

    const metadata = {
        file: {
            displayName: file.name
        }
    };

    // For resumable upload, we need to initiate first
    const initResponse = await fetch(startUploadUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': file.size.toString(),
            'X-Goog-Upload-Header-Content-Type': file.type
        },
        body: JSON.stringify(metadata)
    });

    if (!initResponse.ok) {

        return await simpleFileUpload(file, apiKey);
    }

    const uploadUrl = initResponse.headers.get('X-Goog-Upload-URL');

    if (!uploadUrl) {

        return await simpleFileUpload(file, apiKey);
    }

    // Step 2: Upload file data
    const arrayBuffer = await file.arrayBuffer();
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Length': file.size.toString(),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize'
        },
        body: arrayBuffer
    });

    if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json();
    return result.file.uri;
}


async function simpleFileUpload(file, apiKey) {
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${errorText}`);
    }

    const result = await response.json();
    return result.file.uri;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
                mimeType: file.type,
                data: base64
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function removeUploadedFile() {
    uploadedFile = null;
    uploadedFileData = null;
    uploadedFileUri = null;
    const preview = document.getElementById("file-preview");
    if (preview) {
        preview.classList.remove("visible");
        preview.innerHTML = "";
    }
    const fileInput = document.getElementById("file-input");
    if (fileInput) fileInput.value = "";
}
window.removeUploadedFile = removeUploadedFile;


// Progress Panel

function toggleProgressPanel() {
    const panel = document.getElementById('progress-panel');
    if (panel) {
        panel.classList.toggle('visible');
        if (panel.classList.contains('visible')) {
            updateProgressPanel();
        }
    }
}

function updateProgressPanel() {
    const summary = progressTracker.getProgressSummary();
    const panel = document.getElementById('progress-content');
    if (!panel) return;

    panel.innerHTML = `
        <div class="progress-stats">
            <div class="stat-item">
                <span class="stat-value">${summary.totalInteractions}</span>
                <span class="stat-label">Interactions</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${summary.accuracy}%</span>
                <span class="stat-label">Accuracy</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${summary.masteryLevel.icon}</span>
                <span class="stat-label">${summary.masteryLevel.label}</span>
            </div>
        </div>
        
        <h4>📚 Subjects</h4>
        <div class="subject-list">
            ${summary.subjects.map(s => `
                <div class="subject-item">
                    <span class="subject-name">${s.name}</span>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${s.mastery * 100}%; background: ${s.level.color}"></div>
                    </div>
                    <span class="subject-level">${s.level.icon} ${Math.round(s.mastery * 100)}%</span>
                </div>
            `).join('')}
        </div>
        
        ${summary.weakAreas.length > 0 ? `
        <h4>⚠️ Needs Practice</h4>
        <div class="weak-areas">
            ${summary.weakAreas.map(w => `
                <span class="weak-topic">${w.subject}: ${w.topic}</span>
            `).join('')}
        </div>
        ` : ''}
    `;
}


// Textbook Library System



let libraryTextbooks = [];
let currentLibraryTab = 'my-books';
let selectedTextbook = null;
let pendingUploadFile = null;

// Standard subjects for each stream
const STANDARD_SUBJECTS = {
    science: ['bangla', 'english', 'mathematics', 'physics', 'chemistry', 'biology', 'ict', 'higher-math'],
    commerce: ['bangla', 'english', 'mathematics', 'accounting', 'economics', 'business', 'ict'],
    arts: ['bangla', 'english', 'history', 'geography', 'civics', 'economics', 'ict'],
    general: ['bangla', 'english', 'mathematics', 'science', 'social-science', 'religion', 'agriculture']
};


const SUBJECT_NAMES = {
    'bangla': { bn: 'বাংলা', en: 'Bangla', icon: '📖' },
    'english': { bn: 'ইংরেজি', en: 'English', icon: '📗' },
    'mathematics': { bn: 'গণিত', en: 'Mathematics', icon: '🔢' },
    'physics': { bn: 'পদার্থবিজ্ঞান', en: 'Physics', icon: '⚛️' },
    'chemistry': { bn: 'রসায়ন', en: 'Chemistry', icon: '🧪' },
    'biology': { bn: 'জীববিজ্ঞান', en: 'Biology', icon: '🧬' },
    'ict': { bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', en: 'ICT', icon: '💻' },
    'higher-math': { bn: 'উচ্চতর গণিত', en: 'Higher Math', icon: '📐' },
    'accounting': { bn: 'হিসাববিজ্ঞান', en: 'Accounting', icon: '📊' },
    'economics': { bn: 'অর্থনীতি', en: 'Economics', icon: '💰' },
    'business': { bn: 'ব্যবসায় সংগঠন', en: 'Business Studies', icon: '🏢' },
    'history': { bn: 'ইতিহাস', en: 'History', icon: '📜' },
    'geography': { bn: 'ভূগোল', en: 'Geography', icon: '🌍' },
    'civics': { bn: 'পৌরনীতি', en: 'Civics', icon: '🏛️' },
    'science': { bn: 'বিজ্ঞান', en: 'Science', icon: '🔬' },
    'social-science': { bn: 'সমাজবিজ্ঞান', en: 'Social Science', icon: '👥' },
    'religion': { bn: 'ধর্ম', en: 'Religion', icon: '🙏' },
    'agriculture': { bn: 'কৃষিশিক্ষা', en: 'Agriculture', icon: '🌾' },
    'other': { bn: 'অন্যান্য', en: 'Other', icon: '📚' }
};


function openLibraryModal() {
    const modal = document.getElementById('library-modal');
    if (modal) {
        modal.classList.remove('hidden');
        updateLibraryStudentInfo();
        loadLibraryBooks();
    }
}

// Close library modal
function closeLibraryModal() {
    const modal = document.getElementById('library-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    hideUploadForm();
}


function updateLibraryStudentInfo() {
    const classEl = document.getElementById('library-student-class');
    const streamEl = document.getElementById('library-student-stream');
    const boardEl = document.getElementById('library-student-board');

    const profile = getStudentProfile();
    console.log("📚 Updating library info for profile:", profile);

    if (profile) {
        const isUniversity = profile.type === 'university' ||
            profile.educationLevel === 'undergraduate' ||
            profile.educationLevel === 'postgraduate' ||
            profile.educationLevel === 'doctoral';

        if (isUniversity) {
            // University student - show program and year
            const programDisplay = profile.programName ||
                (profile.program ? profile.program.toUpperCase() : 'University');
            if (classEl) classEl.textContent = programDisplay;
            if (streamEl) streamEl.textContent = `Year ${profile.year || 1}`;
            if (boardEl) boardEl.textContent = profile.department ?
                profile.department.charAt(0).toUpperCase() + profile.department.slice(1) : '';
        } else {
            // School student - show class, stream, board
            if (classEl) classEl.textContent = `Class ${profile.class || 10}`;
            if (streamEl) streamEl.textContent = profile.stream ?
                profile.stream.charAt(0).toUpperCase() + profile.stream.slice(1) : 'Science';
            if (boardEl) boardEl.textContent = profile.board || 'NCTB';
        }
    }
}

// Load books for library
async function loadLibraryBooks() {
    const grid = document.getElementById('library-books-grid');
    if (!grid) return;

    // Get fresh profile
    const profile = getStudentProfile();

    grid.innerHTML = `
        <div class="library-loading">
            <div class="loading-spinner"></div>
            <span>Loading textbooks...</span>
        </div>
    `;

    const isUniversity = profile?.type === 'university' ||
        profile?.educationLevel === 'undergraduate' ||
        profile?.educationLevel === 'postgraduate' ||
        profile?.educationLevel === 'doctoral';

    let textbooks = [];

    if (isUniversity) {
        // University student - just get all uploaded books for their department/program
        try {
            textbooks = await getTextbooks({
                department: profile?.department,
                program: profile?.program
            });
        } catch (e) {
            textbooks = [];
        }

        // For university: show uploaded books only, with upload button
        libraryTextbooks = textbooks || [];

        if (textbooks.length === 0) {
            grid.innerHTML = `
                <div class="library-empty-university">
                    <span class="empty-icon">📚</span>
                    <h3>No books uploaded yet</h3>
                    <p>Upload your course materials to share with others</p>
                    <button class="upload-book-btn" onclick="showUploadForm()">
                        📤 Upload a Book
                    </button>
                </div>
            `;
        } else {
            grid.innerHTML = `
                <div class="university-upload-header">
                    <button class="upload-book-btn" onclick="showUploadForm()">📤 Upload New Book</button>
                </div>
            ` + textbooks.map(book => {
                return `
                    <div class="book-card available" data-book-id="${book.id}" onclick="openBook('${book.id}')">
                        <span class="book-icon">📖</span>
                        <span class="book-title">${book.title || book.subject}<br><small>${book.subject}</small></span>
                        <span class="book-chapters">${book.chaptersCount || 0} chapters</span>
                    </div>
                `;
            }).join('');
        }
    } else {
        // School student - show predefined subjects
        const classNum = profile?.class || 10;
        const stream = profile?.stream || 'science';
        const expectedSubjects = STANDARD_SUBJECTS[stream] || STANDARD_SUBJECTS.general;
        textbooks = await getTextbooks({ classNum, stream });

        libraryTextbooks = textbooks || [];

        const availableBooks = new Map();
        (textbooks || []).forEach(book => {
            availableBooks.set(book.subject, book);
        });

        // Render grid for school students
        if (currentLibraryTab === 'my-books') {
            grid.innerHTML = expectedSubjects.map(subject => {
                const book = availableBooks.get(subject);
                const subjectInfo = SUBJECT_NAMES[subject] || { icon: '📖', bn: subject, en: subject };

                if (book) {
                    return `
                        <div class="book-card available" data-book-id="${book.id}" onclick="openBook('${book.id}')">
                            <span class="book-icon">${subjectInfo.icon}</span>
                            <span class="book-title">${subjectInfo.bn}<br><small>${subjectInfo.en}</small></span>
                            <span class="book-chapters">${book.chaptersCount || 0} chapters</span>
                        </div>
                    `;
                } else {
                    return `
                        <div class="book-card missing" data-subject="${subject}" onclick="promptUpload('${subject}')">
                            <span class="book-icon">${subjectInfo.icon}</span>
                            <span class="book-title">${subjectInfo.bn}<br><small>${subjectInfo.en}</small></span>
                            <span class="book-chapters">📤 Upload</span>
                        </div>
                    `;
                }
            }).join('');
        } else {
            // All books tab for school
            if (textbooks.length === 0) {
                grid.innerHTML = `
                    <div class="library-loading">
                        <span>📚 No textbooks uploaded yet</span>
                        <p style="font-size: 0.85rem; margin-top: 8px;">Be the first to upload!</p>
                    </div>
                `;
            } else {
                grid.innerHTML = textbooks.map(book => {
                    const subjectInfo = SUBJECT_NAMES[book.subject] || SUBJECT_NAMES.other;
                    return `
                        <div class="book-card available" data-book-id="${book.id}" onclick="openBook('${book.id}')">
                            <span class="book-icon">${subjectInfo.icon}</span>
                            <span class="book-title">${book.title || subjectInfo.bn}<br><small>Class ${book.class}</small></span>
                            <span class="book-chapters">${book.chaptersCount || 0} chapters</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }
}

// Switch library tab
function switchLibraryTab(tab) {
    currentLibraryTab = tab;


    document.querySelectorAll('.library-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });


    loadLibraryBooks();
}

// Prompt to upload a specific subject
function promptUpload(subject) {
    const subjectInfo = SUBJECT_NAMES[subject] || SUBJECT_NAMES.other;


    const titleInput = document.getElementById('upload-book-title');
    const subjectSelect = document.getElementById('upload-book-subject');
    const classSelect = document.getElementById('upload-book-class');
    const streamSelect = document.getElementById('upload-book-stream');

    if (titleInput) titleInput.value = subjectInfo.bn;
    if (subjectSelect) subjectSelect.value = subject;
    if (classSelect) classSelect.value = studentProfile?.class || 10;
    if (streamSelect) streamSelect.value = studentProfile?.stream || '';


    const fileInput = document.getElementById('library-file-input');
    if (fileInput) fileInput.click();
}

// Handle library file selection
function handleLibraryFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        addMessageToChat("❌ Please select a PDF file", "system");
        return;
    }

    pendingUploadFile = file;
    showUploadForm();
}


function showUploadForm() {
    // First, trigger file selection if no file is pending
    if (!pendingUploadFile) {
        const fileInput = document.getElementById('library-file-input');
        if (fileInput) {
            fileInput.click();
        }
        return;
    }

    const uploadSection = document.querySelector('.library-upload-section');
    const uploadForm = document.getElementById('library-upload-form');

    if (uploadSection) uploadSection.classList.add('hidden');
    if (uploadForm) uploadForm.classList.remove('hidden');

    // Customize form based on user type
    const profile = getStudentProfile();
    const isUniversity = profile?.type === 'university' ||
        profile?.educationLevel === 'undergraduate' ||
        profile?.educationLevel === 'postgraduate' ||
        profile?.educationLevel === 'doctoral';

    const classGroup = document.getElementById('upload-book-class')?.parentElement;
    const streamGroup = document.getElementById('upload-book-stream')?.parentElement;
    const subjectSelect = document.getElementById('upload-book-subject');

    if (isUniversity) {
        // Hide class and stream for university students
        if (classGroup) classGroup.style.display = 'none';
        if (streamGroup) streamGroup.style.display = 'none';

        // Change subject dropdown to text input for university
        if (subjectSelect) {
            const subjectGroup = subjectSelect.parentElement;
            subjectGroup.innerHTML = `
                <label>Subject/Course Name</label>
                <input type="text" id="upload-book-subject" placeholder="e.g., Data Structures, Operating Systems">
            `;
        }
    } else {
        // Show class and stream for school students
        if (classGroup) classGroup.style.display = 'block';
        if (streamGroup) streamGroup.style.display = 'block';
    }
}


function hideUploadForm() {
    const uploadSection = document.querySelector('.library-upload-section');
    const uploadForm = document.getElementById('library-upload-form');

    if (uploadSection) uploadSection.classList.remove('hidden');
    if (uploadForm) uploadForm.classList.add('hidden');

    pendingUploadFile = null;

    // Reset form
    const fileInput = document.getElementById('library-file-input');
    if (fileInput) fileInput.value = '';
}


async function confirmUpload() {
    if (!pendingUploadFile) {
        addMessageToChat("❌ Please select a file first", "system");
        return;
    }

    const profile = getStudentProfile();
    const isUniversity = profile?.type === 'university' ||
        profile?.educationLevel === 'undergraduate' ||
        profile?.educationLevel === 'postgraduate' ||
        profile?.educationLevel === 'doctoral';

    const title = document.getElementById('upload-book-title')?.value.trim();
    const subjectEl = document.getElementById('upload-book-subject');
    const subject = subjectEl?.value?.trim() || subjectEl?.options?.[subjectEl.selectedIndex]?.value;

    if (!title || !subject) {
        addMessageToChat("❌ Please fill in title and subject", "system");
        return;
    }

    let uploadData;

    if (isUniversity) {
        // University upload
        uploadData = {
            title,
            subject,
            type: 'university',
            department: profile?.department,
            program: profile?.program,
            country: profile?.country || 'bangladesh'
        };

        // Check for duplicate - same subject for same program
        const exists = await checkUniversityTextbookExists(profile?.department, profile?.program, subject);
        if (exists) {
            addMessageToChat(`📚 A book for "${subject}" already exists!`, "system");
            hideUploadForm();
            return;
        }
    } else {
        // School upload
        const classNum = document.getElementById('upload-book-class')?.value;
        const stream = document.getElementById('upload-book-stream')?.value;

        if (!classNum) {
            addMessageToChat("❌ Please select a class", "system");
            return;
        }

        uploadData = {
            title,
            subject,
            class: classNum,
            stream,
            board: profile?.board || 'NCTB',
            country: profile?.country || 'bangladesh'
        };

        // Check for duplicate
        const exists = await checkTextbookExists(classNum, subject);
        if (exists) {
            addMessageToChat(`📚 ${title} for Class ${classNum} already exists in the library!`, "system");
            hideUploadForm();
            return;
        }
    }

    // Show progress
    const progressDiv = document.getElementById('upload-progress');
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');

    if (progressDiv) progressDiv.classList.remove('hidden');
    if (progressFill) progressFill.style.width = '30%';
    if (progressText) progressText.textContent = 'Uploading PDF to cloud...';

    const fileForExtraction = pendingUploadFile;

    const result = await uploadTextbook(pendingUploadFile, uploadData);

    if (!result.success) {
        addMessageToChat(`❌ Upload failed: ${result.error}`, "system");
        if (progressDiv) progressDiv.classList.add('hidden');
        return;
    }

    // Show success immediately
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = '✅ PDF Uploaded!';


    setTimeout(() => {
        hideUploadForm();
        closeLibraryModal();
        loadLibraryBooks();
        addMessageToChat(`✅ ${title} uploaded successfully! Chapters are being extracted in background...`, "system");
    }, 800);


    extractChaptersInBackground(result.textbookId, result.downloadUrl, fileForExtraction, title);
}

// Extract chapters in background - doesn't block UI
async function extractChaptersInBackground(textbookId, downloadUrl, file, title) {
    try {
        console.log(`🔄 Starting background chapter extraction for: ${title}`);


        const savedCount = await extractChaptersFromPDF(downloadUrl, file, textbookId);

        if (savedCount > 0) {

            addMessageToChat(`📚 ${title}: ${savedCount} chapters extracted and ready to study!`, "system");
            console.log(`✅ Background extraction complete: ${savedCount} chapters`);
        } else {
            addMessageToChat(`⚠️ ${title}: Could not extract chapters. You can still read the PDF directly.`, "system");
        }
    } catch (error) {
        console.error("Background chapter extraction failed:", error);
        addMessageToChat(`⚠️ Chapter extraction for ${title} failed. PDF is still available.`, "system");
    }
}

// Save a single chapter to Firebase
async function saveChapterToFirebase(textbookId, chapter) {
    const { addDoc, collection } = await import('./firebase-config.js');
    const { db } = await import('./firebase-config.js');

    await addDoc(collection(db, 'textbook_chapters'), {
        bookId: textbookId,
        chapterNum: chapter.chapterNum,
        title: chapter.title,
        content: chapter.content,
        keywords: chapter.keywords || [],
        summary: chapter.summary || '',
        createdAt: new Date().toISOString()
    });
}


async function updateTextbookChaptersCount(textbookId, count) {
    const { doc, updateDoc } = await import('./firebase-config.js');
    const { db } = await import('./firebase-config.js');

    const textbookRef = doc(db, 'textbooks', textbookId);
    await updateDoc(textbookRef, {
        chaptersCount: count,
        chaptersExtracted: true
    });
}


async function extractChaptersFromPDF(pdfUrl, file, textbookId) {
    try {
        console.log("🔍 AI is reading and extracting chapters from the textbook...");

        // Convert file to base64
        const base64Data = await fileToBase64(file);


        const metadataPrompt = `Analyze this Bangladeshi NCTB textbook PDF. List ALL chapters with their structure.

Return ONLY a JSON array with chapter metadata (NOT full content):
[
  {
    "chapterNum": 1,
    "title": "Chapter title in original language",
    "pageRange": "1-15",
    "keywords": ["topic1", "topic2"],
    "summary": "2-3 sentence summary of this chapter"
  }
]

Rules:
- List EVERY chapter found
- Keep Bengali titles as-is
- Estimate page ranges
- Keep summaries brief (2-3 sentences max)
- Do NOT include full content text`;

        const metadataBody = {
            contents: [{
                role: "user",
                parts: [
                    { text: metadataPrompt },
                    {
                        inlineData: {
                            mimeType: base64Data.mimeType,
                            data: base64Data.data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8000,
                responseMimeType: "application/json"
            }
        };

        const metadataResponse = await callGeminiAPI("gemini-2.0-flash", metadataBody, false);

        if (!metadataResponse.ok) {
            console.error("Chapter metadata extraction failed:", await metadataResponse.text());
            return [];
        }

        const metadataData = await metadataResponse.json();
        const metadataText = metadataData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!metadataText) {
            console.error("No metadata text returned");
            return [];
        }

        let chaptersList;
        try {
            chaptersList = JSON.parse(metadataText);
            console.log(`📋 Found ${chaptersList.length} chapters`);
        } catch (e) {
            console.error("Failed to parse chapter metadata:", e);

            const fixedJson = tryFixTruncatedJson(metadataText);
            if (fixedJson) {
                chaptersList = fixedJson;
            } else {
                return [];
            }
        }

        // Step 2: Extract content for each chapter (one at a time)
        console.log(`📖 Found ${chaptersList.length} chapters. Extracting content...`);

        let savedCount = 0;

        for (let i = 0; i < chaptersList.length; i++) {
            const chapter = chaptersList[i];
            console.log(`📝 Processing chapter ${i + 1}/${chaptersList.length}: ${chapter.title}`);

            const contentPrompt = `From this textbook PDF, extract the FULL TEXT content of Chapter ${chapter.chapterNum}: "${chapter.title}".

Return ONLY a JSON object:
{
  "chapterNum": ${chapter.chapterNum},
  "title": "${chapter.title}",
  "content": "Full text content of this chapter...",
  "keywords": ${JSON.stringify(chapter.keywords || [])},
  "summary": "${chapter.summary || ''}"
}

Rules:
- Extract ALL text from this chapter
- Keep Bengali text as-is
- Include examples, formulas, definitions
- If content is very long, include key sections`;

            try {
                const contentBody = {
                    contents: [{
                        role: "user",
                        parts: [
                            { text: contentPrompt },
                            {
                                inlineData: {
                                    mimeType: base64Data.mimeType,
                                    data: base64Data.data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 30000,
                        responseMimeType: "application/json"
                    }
                };

                const contentResponse = await callGeminiAPI("gemini-2.0-flash", contentBody, false);

                if (contentResponse.ok) {
                    const contentData = await contentResponse.json();
                    const contentText = contentData.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (contentText) {
                        try {
                            const chapterContent = JSON.parse(contentText);

                            await saveChapterToFirebase(textbookId, chapterContent);
                            savedCount++;
                            console.log(`✅ Saved chapter ${i + 1}/${chaptersList.length}`);
                        } catch (e) {

                            await saveChapterToFirebase(textbookId, {
                                ...chapter,
                                content: `Content for ${chapter.title}. Click to load from PDF.`
                            });
                            savedCount++;
                        }
                    }
                } else {
                    // Save metadata only
                    await saveChapterToFirebase(textbookId, {
                        ...chapter,
                        content: `Content for ${chapter.title}. Click to load from PDF.`
                    });
                    savedCount++;
                }
            } catch (e) {
                console.error(`Error extracting chapter ${i + 1}:`, e);

                try {
                    await saveChapterToFirebase(textbookId, {
                        ...chapter,
                        content: `Content for ${chapter.title}. Click to load from PDF.`
                    });
                    savedCount++;
                } catch (saveErr) {
                    console.error('Failed to save chapter:', saveErr);
                }
            }


            await new Promise(r => setTimeout(r, 500));
        }

        // Update textbook with chapters count
        await updateTextbookChaptersCount(textbookId, savedCount);

        console.log(`✅ Extracted and saved ${savedCount} chapters`);
        return savedCount;

    } catch (error) {
        console.error("Error extracting chapters:", error);
        return [];
    }
}


function tryFixTruncatedJson(text) {
    try {

        return JSON.parse(text);
    } catch (e) {
        // Try to close unclosed arrays/objects
        let fixed = text.trim();


        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;


        if (openBraces > closeBraces) {
            // Find last complete object and truncate there
            const lastCompleteObj = fixed.lastIndexOf('},');
            if (lastCompleteObj > 0) {
                fixed = fixed.substring(0, lastCompleteObj + 1);
            }
        }


        for (let i = 0; i < openBraces - closeBraces; i++) {
            fixed += '}';
        }
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixed += ']';
        }

        try {
            return JSON.parse(fixed);
        } catch (e2) {
            console.error("Could not fix truncated JSON");
            return null;
        }
    }
}


async function openBook(bookId) {
    const book = libraryTextbooks.find(b => b.id === bookId);
    if (!book) return;

    selectedTextbook = book;

    // Open chapter modal
    const libraryModal = document.getElementById('library-modal');
    const chapterModal = document.getElementById('chapter-modal');

    if (libraryModal) libraryModal.classList.add('hidden');
    if (chapterModal) chapterModal.classList.remove('hidden');


    const titleEl = document.getElementById('chapter-book-title');
    if (titleEl) titleEl.textContent = `📖 ${book.title || SUBJECT_NAMES[book.subject]?.bn || book.subject}`;


    const chaptersList = document.getElementById('chapters-list');
    if (chaptersList) {
        chaptersList.innerHTML = `
            <div class="library-loading">
                <div class="loading-spinner"></div>
                <span>Loading chapters...</span>
            </div>
        `;
    }

    const chapters = await getTextbookChapters(bookId);

    if (chapters.length === 0) {
        if (chaptersList) {
            chaptersList.innerHTML = `
                <div class="library-loading">
                    <span>📝 No chapters extracted yet</span>
                    <p style="font-size: 0.85rem; margin-top: 8px;">Chapters are being processed...</p>
                </div>
            `;
        }
        return;
    }

    // Render chapters
    if (chaptersList) {
        chaptersList.innerHTML = chapters.map(chapter => `
            <div class="chapter-item" onclick="studyChapter('${chapter.id}')">
                <span class="chapter-num">${chapter.chapterNum}</span>
                <div class="chapter-info">
                    <div class="chapter-title">${chapter.title}</div>
                    <div class="chapter-summary">${chapter.summary || 'Click to study this chapter'}</div>
                </div>
                <button class="chapter-action">Study</button>
            </div>
        `).join('');
    }
}


async function studyChapter(chapterId) {

    const chapters = await getTextbookChapters(selectedTextbook.id);
    const chapter = chapters.find(c => c.id === chapterId);

    if (!chapter) {
        addMessageToChat("❌ Chapter not found", "system");
        return;
    }

    // Close modals
    document.getElementById('chapter-modal')?.classList.add('hidden');
    document.getElementById('library-modal')?.classList.add('hidden');


    window.currentChapterContent = chapter.content;
    window.currentChapterTitle = chapter.title;


    setMode('curriculum');

    // Send to chat
    const subjectInfo = SUBJECT_NAMES[selectedTextbook.subject] || { bn: selectedTextbook.subject, en: selectedTextbook.subject };
    addMessageToChat(
        `📖 **${chapter.title}** (${subjectInfo.bn} - Class ${selectedTextbook.class})\n\nTeaching from textbook chapter. Ask me anything about this topic!`,
        "system"
    );


    const teachRequest = `Teach me chapter ${chapter.chapterNum}: "${chapter.title}" from my ${subjectInfo.en || subjectInfo.bn} textbook. Start with an engaging introduction and main concepts.`;


    conversationHistory.push({ role: 'user', content: teachRequest });

    // Auto-start teaching
    await processWithGemini(teachRequest, 'curriculum');
}


window.openBook = openBook;
window.promptUpload = promptUpload;
window.studyChapter = studyChapter;
window.showUploadForm = showUploadForm;


// Handle Send Message

async function handleSendMessage() {
    const message = elements.userInput.value.trim();
    console.log("📨 handleSendMessage called, message:", message, "isProcessing:", isProcessing);
    if (!message || isProcessing) return;


    const user = getCurrentUser();
    const canProceed = await canPerformAction('aiConversation');

    if (!canProceed.allowed) {
        showUpgradePrompt(canProceed.reason);
        return;
    }

    // INTERRUPT: Stop any current speech for new message
    interruptForNewMessage();


    elements.userInput.value = "";
    elements.userInput.style.height = "auto";


    if (!canProceed.unlimited) {
        const userId = user?.uid || null;
        await deductCredits(userId, 'aiConversation');
        updateCreditsDisplay();
    }

    // Add user message to chat
    addMessageToChat(message, "user");

    // Check if this is a quiz conversation response (e.g., user answering how many questions)
    if (await handleQuizConversation(message)) {
        isProcessing = false;
        return;
    }

    // Note: Quiz is now handled via conversational flow + magic overlay
    // Text-based quiz answer handling removed


    conversationHistory.push({ role: "user", content: message });


    isProcessing = true;
    updateStatus("thinking");

    // Show thinking behavior while processing
    if (head) {
        TeacherBehavior.thinkingSequence();
    }

    try {

        const context = {
            hasUploadedFile: !!uploadedFile,
            hasActiveTextbook: studentProfile !== null,
            currentMode: currentMode
        };

        let detectedMode = currentMode;

        // Check for quiz intent in chat OR curriculum mode
        if (currentMode === 'chat' || currentMode === 'curriculum') {
            const intent = detectIntent(message, context);

            // Handle quiz intent immediately (before AI responds)
            if (intent.type === 'quiz' && intent.confidence > 0.7) {
                await processQuizMode(message);
                isProcessing = false;
                updateStatus("online");
                return;
            }

            // Only switch mode for high-confidence detections (non-quiz)
            if (currentMode === 'chat' && intent.confidence > 0.8 && intent.type !== 'chat' && intent.type !== 'quiz') {
                detectedMode = intent.type;

                const modeConfig = getModeButtons().find(m => m.id === intent.type);
                if (modeConfig) {
                    addMessageToChat(`${modeConfig.icon} Switching to ${modeConfig.label} mode...`, "system");
                }
            }
        }

        // Check for image generation request
        if (isImageRequest(message)) {
            if (hasSpecificTopic(message)) {

                const isBengali = /[\u0980-\u09FF]/.test(message);


                await announceDrawing(isBengali);

                addMessageToChat("🎨 Creating educational visualization...", "system");
                const result = await generateEducationalImage(message);

                if (result.success) {
                    // Show in chat AND magic overlay
                    displayGeneratedImage(result.imageData, result.mimeType);
                    showMagicImageOverlay(result.imageData, result.mimeType);


                    console.log("🔍 Getting explanation of actual image content...");
                    const imageExplanation = await explainGeneratedImage(
                        result.imageData,
                        result.mimeType,
                        message
                    );

                    if (imageExplanation) {

                        addMessageToChat(imageExplanation, "teacher");
                        await speakTextWithParallelTTS(imageExplanation);
                    } else {
                        // Fallback: Ask Gemini to explain the topic properly
                        console.log("⚠️ Vision failed, using topic explanation fallback");
                        const topic = extractTopicFromMessage(message);
                        const explainPrompt = isBengali
                            ? `এই ছবিতে ${topic} বিষয়টি দেখানো হয়েছে। শিক্ষার্থীদের জন্য এই বিষয়টি ৪-৫ লাইনে সহজভাবে ব্যাখ্যা করো। মূল ধারণা, সূত্র বা উদাহরণ দাও।`
                            : `This image shows ${topic}. Explain this topic in 4-5 lines for students. Include key concepts, formulas, or examples.`;

                        await processWithGemini(explainPrompt, 'chat');
                    }


                    hideMagicImageOverlay();
                } else {

                    await processWithGemini(message, 'chat');
                }

                isProcessing = false;
                updateStatus("online");
                return;
            } else {
                // Topic is vague - try to get topic from conversation history
                const conversationContext = getTopicFromConversationHistory();

                if (conversationContext) {

                    addMessageToChat("🔍 Understanding context from our conversation...", "system");
                    const extractedTopic = await extractTopicFromContext(conversationContext);

                    if (extractedTopic && extractedTopic.length > 3) {
                        console.log("📚 Extracted topic from context:", extractedTopic);


                        const isBengali = /[\u0980-\u09FF]/.test(conversationContext);

                        // Teacher announces drawing
                        await announceDrawing(isBengali);

                        const imagePrompt = isBengali
                            ? `${extractedTopic} সম্পর্কে একটি শিক্ষামূলক ডায়াগ্রাম আঁক`
                            : `Draw an educational diagram about ${extractedTopic}`;

                        addMessageToChat(`🎨 Creating visualization about: ${extractedTopic}...`, "system");
                        const result = await generateEducationalImage(imagePrompt);

                        if (result.success) {

                            displayGeneratedImage(result.imageData, result.mimeType);
                            showMagicImageOverlay(result.imageData, result.mimeType);


                            console.log("🔍 Getting explanation of actual image content...");
                            const imageExplanation = await explainGeneratedImage(
                                result.imageData,
                                result.mimeType,
                                imagePrompt
                            );

                            if (imageExplanation) {
                                addMessageToChat(imageExplanation, "teacher");
                                await speakTextWithParallelTTS(imageExplanation);
                            }

                            // Hide magic overlay after explanation done
                            hideMagicImageOverlay();
                        } else {
                            await processWithGemini(message, 'chat');
                        }

                        isProcessing = false;
                        updateStatus("online");
                        return;
                    }
                }


                const isBengali = /[\u0980-\u09FF]/.test(message);
                const askTopicMsg = isBengali
                    ? "আমি ছবি আঁকতে পারি! 🎨 কোন বিষয়ে ছবি দেখতে চাও? যেমন:\n• \"নিউটনের গতির সূত্র ছবি দেখাও\"\n• \"সালোকসংশ্লেষণ প্রক্রিয়া ছবি আঁক\"\n• \"পানির চক্র ডায়াগ্রাম দেখাও\""
                    : "I can draw educational images! 🎨 What topic would you like me to visualize? For example:\n• \"Draw Newton's laws of motion\"\n• \"Show photosynthesis process\"\n• \"Visualize the water cycle\"";

                addMessageToChat(askTopicMsg, "teacher");
                speakText(askTopicMsg);
                isProcessing = false;
                updateStatus("online");
                return;
            }
        }


        if (detectedMode === 'research') {
            await processResearchMode(message);
        } else {
            await processWithGemini(message, detectedMode);
        }

    } catch (error) {
        console.error("❌ Error processing message:", error);
        addMessageToChat("I apologize, but I encountered an error. Please try again.", "teacher");

        // Show sad mood on error
        if (head) {
            TeacherBehavior.setMood('sad');
            setTimeout(() => TeacherBehavior.setMood('neutral'), 2000);
        }
    }

    isProcessing = false;
    updateStatus("online");
}



// ===========================================
async function processWithGemini(userMessage, mode = 'chat') {

    aiController = new AbortController();


    const typingDiv = addTypingIndicator();

    console.log("🔄 processWithGemini started for:", userMessage, "mode:", mode);

    try {
        // Build the system prompt based on mode and teacher gender
        const teacherGender = CONFIG.currentTeacher;
        let modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.chat;


        let systemPrompt = typeof modePrompt === 'object' ? (modePrompt[teacherGender] || modePrompt.male) : modePrompt;
        systemPrompt += "\n\n" + (SUBJECT_CONTEXTS[CONFIG.subjectFocus] || SUBJECT_CONTEXTS.general);

        // Add student context if available
        if (studentProfile) {
            systemPrompt += `\n\nSTUDENT CONTEXT:
- Country: ${studentProfile.countryName}
- Board: ${studentProfile.board}
- Class: ${studentProfile.class}
- Stream: ${studentProfile.stream}
- Subjects: ${studentProfile.subjects?.join(', ')}

Tailor your teaching to this student's curriculum level.`;
        }


        if (mode === 'curriculum') {
            const curriculumInfo = extractCurriculumInfo(userMessage);
            if (curriculumInfo.subject) {
                const results = searchCurriculum(studentProfile?.country || 'bangladesh', curriculumInfo.subject);
                if (results.length > 0) {
                    systemPrompt += `\n\nRELEVANT CURRICULUM DATA:\n${JSON.stringify(results.slice(0, 3), null, 2)}`;
                }
            }


            if (window.currentChapterContent) {
                systemPrompt += `\n\n📚 TEXTBOOK CHAPTER CONTENT:
Title: ${window.currentChapterTitle || 'Chapter'}
Content:
${window.currentChapterContent}

INSTRUCTIONS: Teach from this textbook content. Use examples and explanations from the text. Reference page concepts when explaining.`;
            }
        }

        // Select appropriate model for the task
        const model = getModelForTask(mode, !!uploadedFileData, uploadedFileData?.mimeType);


        const generationConfig = buildGenerationConfig(mode, uploadedFileData?.mimeType);


        const body = {
            contents: [],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: generationConfig,
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
            ]
        };

        // Add Google Search grounding for research mode
        if (mode === 'research') {
            body.tools = [{ googleSearch: {} }];
        }


        const recentHistory = conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
            const parts = [{ text: msg.content }];


            if (msg.role === 'user' && msg === recentHistory[recentHistory.length - 1] && uploadedFileData && mode === 'file') {
                // Check if we have a file URI (uploaded to Gemini Files API) or inline data
                if (uploadedFileUri) {

                    parts.push({
                        fileData: {
                            fileUri: uploadedFileUri,
                            mimeType: uploadedFileData.mimeType
                        }
                    });
                    console.log("📁 Using Gemini Files API URI:", uploadedFileUri);
                } else if (uploadedFileData.data) {

                    const mediaResolution = getMediaResolution(uploadedFileData.mimeType);
                    parts.push({
                        inlineData: {
                            mimeType: uploadedFileData.mimeType,
                            data: uploadedFileData.data
                        },
                        mediaResolution: {
                            level: mediaResolution
                        }
                    });
                    console.log("📄 Using inline base64 data");
                }
            }

            body.contents.push({
                role: msg.role === "user" ? "user" : "model",
                parts: parts
            });
        });

        // API endpoint - use serverless in production, direct in local
        let url, headers;
        if (CONFIG.isProduction) {
            url = CONFIG.apiEndpoints.geminiStream;
            headers = { "Content-Type": "application/json" };
            body.model = model; // Include model in body for serverless
            console.log("📡 Using serverless API:", url);
        } else {
            url = `${CONFIG.geminiEndpoint}${model}:streamGenerateContent?alt=sse`;
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": CONFIG.geminiApiKey
            };
            console.log("📡 API URL:", url);
        }
        console.log("🤖 Model:", model);
        console.log("🧠 Thinking level:", generationConfig.thinkingConfig?.thinkingLevel);


        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            signal: aiController.signal
        });

        console.log("📥 Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API Error response:", errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }


        typingDiv.remove();

        // Create message element for streaming
        const messageDiv = addMessageToChat("", "teacher");
        const contentDiv = messageDiv.querySelector(".message-content");


        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";


        let sentToTTS = "";
        let ttsPromises = [];  // Store TTS promises in order
        let ttsIndex = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;


            const text = decoder.decode(value);
            const lines = text.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

                        if (content) {
                            fullResponse += content;


                            contentDiv.innerHTML = dompurify.sanitize(marked.parse(fullResponse));

                            // Scroll to bottom
                            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;


                            if (CONFIG.tts.enabled) {
                                const unsentText = fullResponse.substring(sentToTTS.length);

                                const sentences = unsentText.match(/[^.!?।]+[.!?।]+/g);

                                if (sentences) {
                                    for (const sentence of sentences) {
                                        const cleanSentence = cleanTextForTTS(sentence);
                                        if (cleanSentence && cleanSentence.length > 3) {
                                            sentToTTS += sentence;
                                            const idx = ttsIndex++;
                                            console.log(`🚀 S${idx + 1} detected - sending TTS:`, cleanSentence.substring(0, 40) + "...");

                                            // Start TTS request immediately (don't await - runs parallel!)
                                            const ttsPromise = fetchTTSAudio(cleanSentence, idx);
                                            ttsPromises.push(ttsPromise);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {

                    }
                }
            }
        }


        const remainingText = fullResponse.substring(sentToTTS.length).trim();
        if (remainingText && CONFIG.tts.enabled) {
            const cleanRemaining = cleanTextForTTS(remainingText);
            if (cleanRemaining && cleanRemaining.length > 3) {
                const idx = ttsIndex++;
                console.log(`🚀 S${idx + 1} (final) - sending TTS:`, cleanRemaining.substring(0, 40) + "...");
                const ttsPromise = fetchTTSAudio(cleanRemaining, idx);
                ttsPromises.push(ttsPromise);
            }
        }

        // Play all audios in order (they were fetched in parallel!)
        if (ttsPromises.length > 0) {
            console.log(`🎵 Playing ${ttsPromises.length} audio segments in order...`);
            await playTTSAudiosInOrder(ttsPromises);
        }


        conversationHistory.push({ role: "model", content: fullResponse });


        updateMoodBasedOnContent(fullResponse);

        // Update progress if we can identify the topic
        if (mode === 'curriculum' || mode === 'chat') {
            const curriculumInfo = extractCurriculumInfo(userMessage);
            if (curriculumInfo.subject) {
                progressTracker.updateMastery(
                    curriculumInfo.subject,
                    curriculumInfo.topic || 'general',
                    true
                );
            }
        }


        if (getCurrentUser()) {
            try {

                const cleanedHistory = conversationHistory.filter(msg =>
                    msg && msg.role && msg.parts && msg.parts[0] && msg.parts[0].text !== undefined
                );

                // Save chat history with mode
                if (cleanedHistory.length > 0) {
                    await saveChatHistory(mode, cleanedHistory);
                }


                const subjectMastery = progressTracker.subjectMastery;
                if (subjectMastery && typeof subjectMastery === 'object') {
                    for (const [subject, topics] of Object.entries(subjectMastery)) {
                        if (topics && typeof topics === 'object') {
                            for (const [topic, data] of Object.entries(topics)) {
                                if (data && data.mastery !== undefined) {
                                    await saveProgress(
                                        subject,
                                        topic,
                                        data.mastery || 0,
                                        data.attempts || 0
                                    );
                                }
                            }
                        }
                    }
                }


                await saveLearningState(progressTracker);

                console.log("💾 Auto-saved progress and chat history");
            } catch (error) {
                console.error("❌ Error auto-saving data:", error);
            }
        }

    } catch (error) {
        typingDiv.remove();

        if (error.name === "AbortError") {
            console.log("Request aborted");
        } else {
            throw error;
        }
    } finally {
        aiController = null;
    }
}

// ===========================================


async function processResearchMode(topic) {
    // Immediate response
    addMessageToChat(`🔍 Starting deep research on "${topic}"... I'll notify you when it's complete! You can keep chatting in the meantime.`, "teacher");

    if (head) {
        head.setMood("fear");
        await speakText(`Starting deep research on ${topic}. I'll notify you when it's ready. Feel free to ask other questions!`);
    }


    const researchId = Date.now().toString();

    const researchPromise = performDeepResearch(topic);
    pendingResearch.set(researchId, { topic, promise: researchPromise });

    researchPromise.then(async (result) => {
        // Research complete
        pendingResearch.delete(researchId);


        addMessageToChat(`📊 **Research Complete: ${topic}**\n\n${result}`, "teacher");

        if (head) {
            head.setMood("happy");
            await speakText(`Your research on ${topic} is complete! Check the chat for the full report.`);
            setTimeout(() => head.setMood("neutral"), 3000);
        }


        progressTracker.updateMastery('Research', topic, true);

    }).catch(error => {
        console.error("Research error:", error);
        addMessageToChat(`❌ Research on "${topic}" failed. Please try again.`, "system");
    });
}

async function performDeepResearch(topic) {
    const systemPrompt = `You are conducting comprehensive academic research on the topic: "${topic}"

Provide a well-structured, detailed report covering:
1. OVERVIEW: Brief introduction to the topic
2. KEY CONCEPTS: Main ideas and definitions
3. DEEP ANALYSIS: Detailed examination
4. REAL-WORLD APPLICATIONS: How it's used in practice
5. CURRENT DEVELOPMENTS: Recent advances (use Google Search for latest info)
6. SUMMARY: Key takeaways

Be thorough, educational, and accurate. Use proper formatting with headers.
Include citations from your search results when possible.`;

    // Get model and config for research
    const model = getModelForTask('research');
    const generationConfig = buildGenerationConfig('research');


    const body = {
        contents: [{ role: "user", parts: [{ text: `Research topic: ${topic}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: generationConfig,

        tools: [{ googleSearch: {} }]
    };

    console.log("🔬 Research using model:", model);

    const response = await callGeminiAPI(model, body, false);

    if (!response.ok) {
        throw new Error(`Research API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Research failed to generate results.";
}

// ===========================================


async function generateEducationalImage(prompt) {
    console.log("🎨 Generating educational image:", prompt);

    // Detect if Bengali text - use Nano Banana Pro for complex Bengali rendering
    const isBengali = /[\u0980-\u09FF]/.test(prompt);



    const model = isBengali ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

    const imagePrompt = isBengali
        ? `Create an educational diagram or illustration with Bengali labels: ${prompt}. Make it clear, colorful, visually appealing and easy to understand for students. Use Bengali text for all labels and annotations.`
        : `Create an educational diagram or illustration: ${prompt}. Make it clear, colorful, visually appealing and easy to understand for students. Include labels where helpful.`;

    const body = {
        contents: [{
            parts: [{ text: imagePrompt }]
        }],
        generationConfig: {
            responseModalities: ["IMAGE"]
        }
    };

    console.log(`🎨 Image generation using ${isBengali ? 'Nano Banana Pro' : 'Nano Banana'} (${model}) @ 1K resolution`);

    try {
        const response = await callGeminiAPI(model, body, false);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Image generation error:", errorText);
            throw new Error(`Image API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("🎨 Image response received");


        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                return {
                    success: true,
                    imageData: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || "image/png"
                };
            }
        }

        // If no image, return text explanation
        for (const part of parts) {
            if (part.text) {
                return {
                    success: false,
                    text: part.text
                };
            }
        }

        return { success: false, text: "Image generation not available. Let me explain instead." };

    } catch (error) {
        console.error("Image generation failed:", error);
        return { success: false, error: error.message };
    }
}


async function explainGeneratedImage(imageData, mimeType, originalPrompt) {
    console.log("🔍 Analyzing generated image with Gemini Vision...");

    const isBengali = /[\u0980-\u09FF]/.test(originalPrompt);

    const visionPrompt = isBengali
        ? `তুমি একজন বন্ধুসুলভ শিক্ষক। এই ছবিটি মনোযোগ দিয়ে দেখো। ছবিতে কী কী আছে এবং কী বোঝানো হয়েছে তা ৪-৬ লাইনে সহজ বাংলায় ব্যাখ্যা করো। শিক্ষার্থীরা যেন সহজে বুঝতে পারে এমনভাবে বলো।`
        : `You are a friendly teacher. Look at this image carefully. Explain in 4-6 lines what is shown in the image and what concepts it illustrates. Make it easy for students to understand.`;

    try {
        const body = {
            contents: [{
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageData
                        }
                    },
                    { text: visionPrompt }
                ]
            }],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7
            }
        };

        const response = await callGeminiAPI("gemini-2.0-flash", body, false);

        console.log("🔍 Vision API response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Vision API error response:", errorText);
            throw new Error(`Vision API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("🔍 Vision API response data:", JSON.stringify(data).substring(0, 200));

        const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (explanation) {
            console.log("✅ Image explanation received:", explanation.substring(0, 100) + "...");
            return explanation;
        }

        console.warn("⚠️ No explanation in response");
        return null;
    } catch (error) {
        console.error("❌ Image explanation failed:", error);
        return null;
    }
}


function isImageRequest(message) {
    const imageKeywords = [
        'draw', 'generate image', 'create image', 'show me', 'visualize',
        'diagram', 'illustrate', 'picture of', 'image of', 'chart',
        'ছবি', 'আঁক', 'দেখাও'  // Bangla keywords
    ];
    const msgLower = message.toLowerCase();
    return imageKeywords.some(keyword => msgLower.includes(keyword));
}


function hasSpecificTopic(message) {
    const vaguePatterns = [

        /^[\s]*ছবি[\s]*(আঁক|দেখাও|বুঝাও|একে)?[\s]*$/i,
        /^[\s]*তুমি[\s]*(ছবি|picture)[\s]*(আঁক|দেখাও|বুঝাও|একে)?[\s]*(বুঝাও)?[\s]*$/i,
        /^[\s]*একটা?[\s]*ছবি[\s]*(আঁক|দেখাও)?[\s]*$/i,
        // English vague patterns
        /^[\s]*(draw|show|create)[\s]*(a|an)?[\s]*(picture|image|diagram)?[\s]*$/i,
        /^[\s]*generate[\s]*(an?)?[\s]*image[\s]*$/i
    ];


    if (vaguePatterns.some(pattern => pattern.test(message))) {
        return false;
    }


    const cleanMsg = message.replace(/[^\w\u0980-\u09FF]/g, '').trim();
    if (cleanMsg.length < 8) {
        return false;
    }

    return true;
}

// Extract topic from conversation history when user request is vague
function getTopicFromConversationHistory() {

    const recentHistory = conversationHistory.slice(-6);

    if (recentHistory.length === 0) {
        return null;
    }

    // Build context from recent messages
    let context = "";
    for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "model") {

            if (Array.isArray(msg.parts)) {
                for (const part of msg.parts) {
                    if (part.text) {
                        context += part.text + " ";
                    }
                }
            }
        }
    }


    return context.trim();
}

// Use Gemini to extract topic from conversation context
async function extractTopicFromContext(context) {
    const isBengali = /[\u0980-\u09FF]/.test(context);

    const extractPrompt = isBengali
        ? `এই কথোপকথন থেকে মূল শিক্ষার বিষয়টি এক লাইনে বলো (শুধু বিষয়ের নাম, কোন বাক্য নয়):\n\n${context}\n\nবিষয়:`
        : `Extract the main educational topic from this conversation in one line (just the topic name, no sentences):\n\n${context}\n\nTopic:`;

    try {
        const body = {
            contents: [{ role: "user", parts: [{ text: extractPrompt }] }],
            generationConfig: { maxOutputTokens: 50, temperature: 0.1 }
        };

        const response = await callGeminiAPI("gemini-2.0-flash", body, false);
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text.trim();
        }
    } catch (err) {
        console.error("Topic extraction failed:", err);
    }
    return null;
}


function extractTopicFromMessage(message) {

    const removePatterns = [
        /ছবি[\s]*(আঁক|দেখাও|বুঝাও|একে)?/gi,
        /তুমি/gi,
        /আমাকে/gi,
        /draw/gi, /show/gi, /create/gi, /generate/gi,
        /picture/gi, /image/gi, /diagram/gi, /visualize/gi,
        /of/gi, /a/gi, /an/gi, /the/gi, /about/gi,
        /please/gi, /can you/gi, /could you/gi
    ];

    let topic = message;
    removePatterns.forEach(pattern => {
        topic = topic.replace(pattern, ' ');
    });

    // Clean up extra spaces
    topic = topic.replace(/\s+/g, ' ').trim();


    return topic || message;
}


function displayGeneratedImage(imageData, mimeType) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message teacher";
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>🎨 Here's the visualization:</p>
            <img src="data:${mimeType};base64,${imageData}" 
                 alt="Generated educational image" 
                 style="max-width: 100%; border-radius: 12px; margin-top: 10px;">
        </div>
        <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Show magic floating image on left side
function showMagicImageOverlay(imageData, mimeType) {
    const overlay = document.getElementById('magic-image-overlay');
    const img = document.getElementById('magic-image');

    if (overlay && img) {
        img.src = `data:${mimeType};base64,${imageData}`;
        overlay.classList.remove('hidden', 'fading-out');

        document.body.classList.add('magic-image-active');

        // On mobile, close chat panel
        if (window.innerWidth <= 480) {
            const chatPanel = document.querySelector('.hologram-panel');
            if (chatPanel) {
                chatPanel.classList.add('hidden-by-overlay');
            }
        }

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        console.log("✨ Magic image overlay shown");
    }
}

// Hide magic image overlay with fade animation
function hideMagicImageOverlay() {
    const overlay = document.getElementById('magic-image-overlay');

    if (overlay) {
        overlay.classList.add('fading-out');
        overlay.classList.remove('visible');

        document.body.classList.remove('magic-image-active');

        // On mobile, restore chat panel
        if (window.innerWidth <= 480) {
            const chatPanel = document.querySelector('.hologram-panel');
            if (chatPanel) {
                chatPanel.classList.remove('hidden-by-overlay');
            }
        }

        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('fading-out');
            console.log("✨ Magic image overlay hidden");
        }, 800);
    }
}

// Teacher announces drawing (with TTS)
async function announceDrawing(isBengali) {
    const announcement = isBengali
        ? "দাঁড়াও, আমি তোমার জন্য একটা ছবি আঁকছি! ✨"
        : "Wait, I'm drawing a picture for you! ✨";

    addMessageToChat(announcement, "teacher");


    if (CONFIG.tts.enabled) {
        speakText(announcement);
    }


    await new Promise(resolve => setTimeout(resolve, 500));
}

// ===========================================


async function processQuizMode(message) {
    // Check if message is in Bangla
    const isBangla = /[\u0980-\u09FF]/.test(message);

    // Get student's subjects from profile - check all possible sources
    let studentSubjects = studentProfile?.subjects || [];
    const programCode = studentProfile?.programCode || studentProfile?.programName || studentProfile?.program || '';
    const department = studentProfile?.department || '';

    // Debug log
    console.log("📚 Quiz Mode - Student Profile:", {
        subjects: studentSubjects,
        programCode,
        department,
        fullProfile: studentProfile
    });

    // If subjects array is empty but we have program info, use that
    if (studentSubjects.length === 0 && programCode) {
        // For university students, use program as main subject
        studentSubjects = [programCode];
    }

    // Use AI to extract subject and count from message
    const extractedInfo = await extractQuizInfoWithAI(message, studentSubjects, isBangla);

    // Start conversational quiz flow
    quizConversationState = {
        active: true,
        waitingFor: extractedInfo.subject ? 'count' : 'subject',
        subject: extractedInfo.subject,
        topic: extractedInfo.subject,
        count: extractedInfo.count || 10,
        isBangla: isBangla,
        availableSubjects: studentSubjects
    };

    // If both subject and count are provided, start quiz immediately
    if (extractedInfo.subject && extractedInfo.count) {
        quizConversationState.active = false;
        generateAndShowQuiz(extractedInfo.subject, extractedInfo.subject, extractedInfo.count);
        return;
    }

    // If only subject is provided, ask for count
    if (extractedInfo.subject) {
        const askCountMsg = isBangla
            ? `চমৎকার! **${extractedInfo.subject}** থেকে কুইজ! 🎯\n\nকয়টা প্রশ্ন চাও? (৫, ১০, ১৫ বা ২০)`
            : `Great! **${extractedInfo.subject}** quiz! 🎯\n\nHow many questions? (5, 10, 15, or 20)`;

        addMessageToChat(askCountMsg, "teacher");

        if (head) {
            const speakMsg = isBangla
                ? `${extractedInfo.subject} থেকে কুইজ! কয়টা প্রশ্ন চাও?`
                : `${extractedInfo.subject} quiz! How many questions?`;
            await speakText(speakMsg);
        }
        return;
    }

    // If no subject provided, ask which subject
    const askMessage = isBangla
        ? `চমৎকার! তুমি কুইজ দিতে চাও! 🎯\n\nকোন বিষয়ে কুইজ দিতে চাও?`
        : `Great! You want a quiz! 🎯\n\nWhich subject?`;

    addMessageToChat(askMessage, "teacher");

    if (head) {
        const speakMsg = isBangla
            ? `কোন বিষয়ে কুইজ দিতে চাও?`
            : `Which subject do you want to quiz on?`;
        await speakText(speakMsg);
    }
}


// PARALLEL TTS - Max 3 concurrent (ElevenLabs limit)


const MAX_CONCURRENT_TTS = 3;
let activeTTSRequests = 0;
let ttsPendingQueue = [];

async function fetchTTSAudio(text, index) {
    const startTime = Date.now();

    // Wait if we have too many concurrent requests
    while (activeTTSRequests >= MAX_CONCURRENT_TTS) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    activeTTSRequests++;
    console.log(`⏳ S${index + 1} TTS request started... (active: ${activeTTSRequests})`);

    try {

        const detectedLang = detectLanguageFromText(text);
        const langConfig = TTS_LANGUAGES[detectedLang] || TTS_LANGUAGES['en'];

        let audioData = null;

        if (CONFIG.tts.provider === "elevenlabs") {
            audioData = await generateElevenLabsTTS(text, langConfig);
        } else {
            audioData = await generateGoogleTTS(text, langConfig);
        }

        const elapsed = Date.now() - startTime;
        console.log(`✅ S${index + 1} TTS ready in ${elapsed}ms`);

        return { index, audioData, text };

    } catch (error) {
        console.error(`❌ S${index + 1} TTS failed:`, error);
        return { index, audioData: null, text };
    } finally {
        activeTTSRequests--;
    }
}


async function playTTSAudiosInOrder(ttsPromises) {
    const totalCount = ttsPromises.length;
    const audioResults = new Array(totalCount).fill(null); // Pre-allocate array
    let resolvedCount = 0;
    let currentPlayIndex = 0;
    let isPlaying = false;
    let playbackComplete = false;

    // Reset global abort flag
    shouldAbortPlayback = false;


    isSpeaking = true;


    let micWasOn = false;
    if (isRecording && recognition) {
        micWasOn = true;
        recognition.stop();
        isRecording = false;
        console.log("🔇 Mic paused while teacher speaks");
    }

    // Make eye contact while speaking
    if (head) {
        TeacherBehavior.makeEyeContact(10000);
    }


    async function playNextAudio() {
        if (isPlaying || playbackComplete || shouldAbortPlayback) return;

        // Check if current index is ready
        if (audioResults[currentPlayIndex] !== null) {
            const result = audioResults[currentPlayIndex];

            if (result.audioData && !shouldAbortPlayback) {
                isPlaying = true;
                console.log(`▶️ Playing S${currentPlayIndex + 1}...`);

                if (head) {
                    await playAudioWithLipSync(result.audioData);
                } else {
                    await playAudioDirect(result.audioData);
                }

                isPlaying = false;
            }

            currentPlayIndex++;


            if (currentPlayIndex < totalCount && !shouldAbortPlayback) {

                playNextAudio();
            } else {
                // All done
                playbackComplete = true;
                finishPlayback();
            }
        }

    }


    function finishPlayback() {
        // Return to idle
        if (head) {
            TeacherBehavior.startIdleBehavior();
        }


        isSpeaking = false;


        setTimeout(() => {
            // Resume mic
            if (micWasOn) {
                console.log("🎙️ Teacher done - restarting mic...");
                startVoiceInput();
            }
            console.log("✅ All audio playback complete!");
        }, 200);
    }


    ttsPromises.forEach((promise, index) => {
        promise.then(result => {
            audioResults[result.index] = result;
            resolvedCount++;

            console.log(`📦 S${result.index + 1} audio received (${resolvedCount}/${totalCount})`);


            if (result.index === currentPlayIndex && !isPlaying && !playbackComplete) {
                playNextAudio();
            }
        }).catch(err => {
            console.error(`❌ TTS promise ${index} failed:`, err);
            audioResults[index] = { index, audioData: null, text: '' };
            resolvedCount++;

            // Still try to advance playback
            if (index === currentPlayIndex && !isPlaying && !playbackComplete) {
                currentPlayIndex++;
                playNextAudio();
            }
        });
    });


    return new Promise(resolve => {
        const checkComplete = setInterval(() => {
            if (playbackComplete) {
                clearInterval(checkComplete);
                resolve();
            }
        }, 100);
    });
}


// Speech Queue System - Non-blocking audio playback


const speechQueue = [];
let isSpeaking = false;
let isPaused = false;
let currentAudioSource = null;
let shouldAbortPlayback = false; // Global abort flag for parallel TTS

function queueSpeech(text) {
    if (!text.trim()) return;
    speechQueue.push(text);
    // Start processing without waiting (non-blocking)
    processSpeechQueue();
}


function stopSpeech() {
    console.log("⏹️ Stopping speech...");

    // Abort any parallel TTS playback in progress
    shouldAbortPlayback = true;

    speechQueue.length = 0;

    // Stop TalkingHead avatar speech
    if (head) {
        head.stopSpeaking();
        TeacherBehavior.startIdleBehavior();
    }


    if (currentAudioSource) {
        try {
            currentAudioSource.stop();
        } catch (e) {

        }
        currentAudioSource = null;
    }

    isSpeaking = false;
    isPaused = false;

    // Update stop button
    const stopBtn = document.getElementById("stop-btn");
    if (stopBtn) {
        stopBtn.innerHTML = '<span>⏹️</span>';
        stopBtn.classList.remove("active");
    }

    addMessageToChat("⏹️ Teacher stopped speaking.", "system");
}


function togglePauseSpeech() {
    if (!isSpeaking) return;

    isPaused = !isPaused;

    if (isPaused) {
        console.log("⏸️ Pausing speech...");
        if (head) {
            head.stopSpeaking();
        }
        addMessageToChat("⏸️ Paused. Click again to resume.", "system");


        const stopBtn = document.getElementById("stop-btn");
        if (stopBtn) {
            stopBtn.innerHTML = '<span>▶️</span>';
            stopBtn.classList.add("paused");
        }
    } else {
        console.log("▶️ Resuming speech...");
        addMessageToChat("▶️ Resuming...", "system");

        // Update button back
        const stopBtn = document.getElementById("stop-btn");
        if (stopBtn) {
            stopBtn.innerHTML = '<span>⏹️</span>';
            stopBtn.classList.remove("paused");
        }


        processSpeechQueue();
    }
}


function interruptForNewMessage() {
    if (isSpeaking) {
        console.log("🔄 Interrupting for new message...");

        // Clear current queue
        speechQueue.length = 0;


        if (head) {
            head.stopSpeaking();
        }

        if (currentAudioSource) {
            try {
                currentAudioSource.stop();
            } catch (e) { }
            currentAudioSource = null;
        }

        isSpeaking = false;
        isPaused = false;
    }
}


let micWasOnBeforeSpeech = false;

async function processSpeechQueue() {
    if (isSpeaking || speechQueue.length === 0 || isPaused) return;

    isSpeaking = true;

    // PAUSE mic completely while teacher speaks (avoids ANY echo pickup)
    if (isRecording && recognition) {
        micWasOnBeforeSpeech = true;
        recognition.stop();
        console.log("🔇 Mic paused while teacher speaks");
    }

    while (speechQueue.length > 0) {
        const text = speechQueue.shift();
        try {
            await speakTextNonBlocking(text);
        } catch (e) {
            console.error("Speech queue error:", e);
        }
    }


    await new Promise(resolve => setTimeout(resolve, 500));

    isSpeaking = false;


    if (micWasOnBeforeSpeech) {
        micWasOnBeforeSpeech = false;
        console.log("🎙️ Teacher done - restarting mic...");
        startVoiceInput();
    }
}

// ===========================================


// ===========================================
let audioContextResumed = false;

async function speakText(text) {

    queueSpeech(text);
}


async function speakTextWithParallelTTS(text) {
    if (!text.trim() || !CONFIG.tts.enabled) return;

    // Resume AudioContext on first user interaction
    if (!audioContextResumed && head?.audioContext) {
        try {
            await head.audioContext.resume();
            audioContextResumed = true;
        } catch (e) {
            console.warn("⚠️ Could not resume AudioContext:", e);
        }
    }


    const cleanText = text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`[^`]+`/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[_~]/g, "")
        .trim();

    if (!cleanText) return;

    // Split into sentences (supports Bengali ।)
    const sentenceRegex = /[^.!?।]+[.!?।]+/g;
    const sentences = cleanText.match(sentenceRegex) || [cleanText];

    console.log(`🎵 Parallel TTS: ${sentences.length} sentences`);

    // Start TTS requests in parallel (respecting rate limit)
    const ttsPromises = sentences.map((sentence, index) => {
        const trimmed = sentence.trim();
        if (trimmed.length < 2) return Promise.resolve({ index, audioData: null, text: trimmed });
        return fetchTTSAudio(trimmed, index);
    });

    // Play in order as each becomes ready
    await playTTSAudiosInOrder(ttsPromises);
}

async function speakTextNonBlocking(text) {
    if (!text.trim() || !CONFIG.tts.enabled) return;

    // Resume AudioContext on first user interaction (browser requirement)
    if (!audioContextResumed && head?.audioContext) {
        try {
            await head.audioContext.resume();
            audioContextResumed = true;
            console.log("✅ AudioContext resumed after user interaction");
        } catch (e) {
            console.warn("⚠️ Could not resume AudioContext:", e);
        }
    }

    // Clean text for TTS (remove markdown)
    const cleanText = text
        .replace(/```[\s\S]*?```/g, "") // Remove code blocks
        .replace(/`[^`]+`/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
        .replace(/[_~]/g, "")
        .trim();

    if (!cleanText) return;

    try {

        const detectedLang = detectLanguageFromText(cleanText);
        const langConfig = TTS_LANGUAGES[detectedLang] || TTS_LANGUAGES['en'];

        console.log("🌍 Detected language:", langConfig.name);

        // Make eye contact while speaking for realism
        if (head) {
            TeacherBehavior.makeEyeContact(cleanText.length * 50 + 2000);
        }


        let audioData;
        if (CONFIG.tts.provider === "elevenlabs") {
            try {
                audioData = await generateElevenLabsTTS(cleanText, langConfig);
            } catch (error) {
                console.warn("⚠️ ElevenLabs failed, falling back to Google TTS", error);
                audioData = await generateGoogleTTS(cleanText, langConfig);
            }
        } else {
            audioData = await generateGoogleTTS(cleanText, langConfig);
        }

        if (audioData && head) {

            await playAudioWithLipSync(audioData);
        } else if (audioData) {
            // Fallback: play audio directly if no avatar
            playAudioDirect(audioData);
        }


        if (head) {
            setTimeout(() => {
                TeacherBehavior.startIdleBehavior();
            }, 500);
        }

    } catch (error) {
        console.error(`TTS Error (${CONFIG.tts.provider}):`, error);

        fallbackBrowserTTS(cleanText);
    }
}

// ===========================================


// ===========================================
async function generateGoogleTTS(text, langConfig) {
    const googleConfig = langConfig.google || TTS_LANGUAGES['en'].google;


    const body = {
        input: { text: text },
        voice: {
            languageCode: googleConfig.code,
            name: googleConfig.voice
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: CONFIG.tts.speakingRate,
            pitch: CONFIG.tts.pitch
        }
    };

    console.log("🔊 Google TTS request:", langConfig.name, "| Voice:", googleConfig.voice);

    try {
        let response;
        if (CONFIG.isProduction) {
            // In production, Google TTS is not available (no serverless function)
            // Return null to fall back to ElevenLabs
            console.warn("⚠️ Google TTS not available in production, using ElevenLabs");
            return null;
        } else {
            // Direct API call for local development
            const url = `${CONFIG.googleTTSEndpoint}?key=${CONFIG.geminiApiKey}`;
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
        }

        if (!response) return null;

        console.log("🔊 TTS Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Google TTS API Error:", errorText);
            throw new Error(`Google TTS Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.audioContent) {
            console.log("✅ Google TTS Audio received | Size:", data.audioContent.length);
            return {
                data: data.audioContent,
                mimeType: 'audio/mp3'
            };
        }

        console.warn("⚠️ No audio data in Google TTS response");
        return null;

    } catch (error) {
        console.error("❌ Google TTS fetch error:", error);
        throw error;
    }
}

// ===========================================


// Using fetch API (browser-compatible)

async function generateElevenLabsTTS(text, langConfig) {

    // This ensures female teacher uses Rachel voice, male uses Adam voice
    const voiceId = CONFIG.tts.elevenLabsVoice;

    const shortCode = langConfig.google?.code?.split('-')[0] || 'en';

    // Use eleven_multilingual_v2 for other languages
    const isBengali = shortCode === 'bn';
    const modelId = isBengali ? 'eleven_v3' : 'eleven_multilingual_v2';

    console.log("🎙️ ElevenLabs TTS:", langConfig.name, "| Model:", modelId, "| Voice:", voiceId, "| Teacher:", CONFIG.currentTeacher);


    const requestBody = {
        text: text,
        model_id: modelId,
        voice_settings: {
            stability: CONFIG.tts.stability,
            similarity_boost: CONFIG.tts.similarityBoost
        }
    };

    try {
        let response;

        if (CONFIG.isProduction) {
            // Use serverless API in production
            console.log("📡 Using serverless TTS API");
            response = await fetch(CONFIG.apiEndpoints.tts, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    voiceId: voiceId,
                    modelId: modelId,
                    voiceSettings: requestBody.voice_settings
                })
            });
        } else {
            // Direct API call for local development
            const url = `${CONFIG.elevenLabsEndpoint}/text-to-speech/${voiceId}`;
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": CONFIG.elevenLabsApiKey
                },
                body: JSON.stringify(requestBody)
            });
        }

        console.log("🎙️ TTS Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ ElevenLabs API Error:", errorText);
            throw new Error(`ElevenLabs TTS Error: ${response.status}`);
        }

        // Handle response based on environment
        if (CONFIG.isProduction) {
            // Serverless returns JSON with base64 audio
            const data = await response.json();
            if (data.audio) {
                console.log("✅ ElevenLabs Audio received (serverless)");
                return {
                    data: data.audio,
                    mimeType: data.contentType || 'audio/mpeg'
                };
            }
        } else {
            // Direct API returns ArrayBuffer
            // Get character cost from headers
            const charCount = response.headers.get('x-character-count');
            const requestId = response.headers.get('request-id');
            if (charCount) {
                console.log("💰 Character cost:", charCount, "| Request ID:", requestId);
            }

            const audioBuffer = await response.arrayBuffer();
            if (audioBuffer && audioBuffer.byteLength > 0) {
                console.log("✅ ElevenLabs Audio received | Size:", audioBuffer.byteLength, "bytes");
                const base64Audio = arrayBufferToBase64(audioBuffer);
                return {
                    data: base64Audio,
                    mimeType: 'audio/mpeg'
                };
            }
        }

        console.warn("⚠️ No audio data in ElevenLabs response");
        return null;

    } catch (error) {
        console.error("❌ ElevenLabs TTS fetch error:", error);
        throw error;
    }
}


function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}


// Play Audio with TalkingHead Lip-Sync


async function playAudioWithLipSync(audioData) {
    if (!head) {
        console.log("⚠️ No head avatar, playing direct audio");
        playAudioDirect(audioData);
        return;
    }

    try {
        console.log("🎤 Playing audio with lip-sync...");

        // Convert base64 to ArrayBuffer
        const binaryString = atob(audioData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }


        const audioContext = head.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(bytes.buffer.slice(0));

        console.log("🎤 Audio decoded:", audioBuffer.duration, "seconds");


        // This creates basic mouth movement synced to audio
        const duration = audioBuffer.duration * 1000;
        const wordCount = Math.ceil(duration / 200);
        const words = [];
        const wtimes = [];
        const wdurations = [];

        for (let i = 0; i < wordCount; i++) {
            words.push("a"); // Use 'a' for open mouth viseme
            wtimes.push(i * 200);
            wdurations.push(150);
        }


        const talkingHeadAudio = {
            audio: audioBuffer,
            words: words,
            wtimes: wtimes,
            wdurations: wdurations
        };


        head.speakAudio(talkingHeadAudio, { lipsyncLang: 'en' });
        console.log("✅ Lip-sync playback started");

        // Wait for audio to finish
        return new Promise((resolve) => {
            setTimeout(resolve, duration + 500);
        });

    } catch (error) {
        console.error("❌ Lip-sync playback error:", error);

        playAudioWithAnimation(audioData);
    }
}


// Play Audio with Visual Animation (fallback)

async function playAudioWithAnimation(audioData) {
    try {
        console.log("🔊 Audio playback with animation...");

        const binaryString = atob(audioData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const mimeType = audioData.mimeType || 'audio/wav';
        const audioBlob = new Blob([bytes], { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);


        audio.onplay = () => {
            console.log("▶️ Audio playing with animation");
            if (head) {
                // Start talking animation
                head.setMood('happy');
                startTalkingAnimation();
            }
        };

        audio.onended = () => {
            console.log("⏹️ Audio ended");
            URL.revokeObjectURL(audioUrl);
            if (head) {
                stopTalkingAnimation();
                head.setMood('neutral');
            }
        };

        audio.onerror = (e) => console.error("❌ Audio error:", e);

        await audio.play();

    } catch (error) {
        console.error("❌ Audio with animation error:", error);
        playAudioDirect(audioData);
    }
}


let talkingAnimationInterval = null;

function startTalkingAnimation() {
    if (talkingAnimationInterval) return;


    talkingAnimationInterval = setInterval(() => {
        if (head && head.setMorphTargetValue) {
            // Alternate mouth open/close for talking effect
            const openAmount = 0.3 + Math.random() * 0.4;
            head.setMorphTargetValue('mouthOpen', openAmount);
        }
    }, 100);
}

function stopTalkingAnimation() {
    if (talkingAnimationInterval) {
        clearInterval(talkingAnimationInterval);
        talkingAnimationInterval = null;


        if (head && head.setMorphTargetValue) {
            head.setMorphTargetValue('mouthOpen', 0);
        }
    }
}


// Direct Audio Playback (without lip-sync)

async function playAudioDirect(audioData) {
    return new Promise((resolve, reject) => {
        try {
            console.log("🔊 Direct audio playback...");

            const binaryString = atob(audioData.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const mimeType = audioData.mimeType || 'audio/wav';
            const audioBlob = new Blob([bytes], { type: mimeType });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onplay = () => console.log("▶️ Audio playing");
            audio.onended = () => {
                console.log("⏹️ Audio ended");
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.onerror = (e) => {
                console.error("❌ Audio error:", e);
                reject(e);
            };

            audio.play().catch(err => {
                console.error("❌ Audio play failed:", err);
                reject(err);
            });

        } catch (error) {
            console.error("❌ Direct audio playback error:", error);
            reject(error);
        }
    });
}

// ===========================================


function fallbackBrowserTTS(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    }
}

// ===========================================


function getStudentLanguage() {
    if (studentProfile?.language) {
        // Extract language code (e.g., 'en-US' -> 'en', 'bn-BD' -> 'bn')
        const code = studentProfile.language.split('-')[0].toLowerCase();
        return code;
    }


    if (studentProfile?.country) {
        const countryLangMap = {

            'bangladesh': 'bn',
            'india': 'hi',
            'pakistan': 'ur',
            'nepal': 'hi',
            'sri_lanka': 'ta',
            'bhutan': 'hi',
            'maldives': 'en',

            // Southeast Asia
            'indonesia': 'id',
            'malaysia': 'ms',
            'singapore': 'en',
            'thailand': 'th',
            'vietnam': 'vi',
            'philippines': 'en',
            'myanmar': 'en',
            'cambodia': 'en',


            'japan': 'ja',
            'korea': 'ko',
            'south_korea': 'ko',
            'china': 'zh',
            'taiwan': 'zh',
            'hong_kong': 'zh',


            'saudi_arabia': 'ar',
            'uae': 'ar',
            'united_arab_emirates': 'ar',
            'qatar': 'ar',
            'kuwait': 'ar',
            'bahrain': 'ar',
            'oman': 'ar',
            'egypt': 'ar',
            'jordan': 'ar',
            'iraq': 'ar',
            'syria': 'ar',
            'lebanon': 'ar',
            'yemen': 'ar',
            'iran': 'fa',
            'israel': 'he',
            'turkey': 'tr',

            // Europe
            'uk': 'en',
            'united_kingdom': 'en',
            'usa': 'en',
            'united_states': 'en',
            'canada': 'en',
            'australia': 'en',
            'new_zealand': 'en',
            'ireland': 'en',
            'spain': 'es',
            'mexico': 'es',
            'argentina': 'es',
            'colombia': 'es',
            'chile': 'es',
            'peru': 'es',
            'venezuela': 'es',
            'france': 'fr',
            'germany': 'de',
            'austria': 'de',
            'switzerland': 'de',
            'italy': 'it',
            'portugal': 'pt',
            'brazil': 'pt',
            'russia': 'ru',
            'poland': 'pl',
            'netherlands': 'nl',
            'belgium': 'nl',
            'greece': 'en',
            'sweden': 'en',
            'norway': 'en',
            'denmark': 'en',
            'finland': 'en',


            'nigeria': 'en',
            'south_africa': 'en',
            'kenya': 'en',
            'ghana': 'en',
            'ethiopia': 'en',
            'morocco': 'ar',
            'algeria': 'ar',
            'tunisia': 'ar',
            'libya': 'ar'
        };
        return countryLangMap[studentProfile.country] || 'en';
    }

    return 'en';
}

// ===========================================



// Available Gemini TTS voices with their characteristics
const TTS_VOICES = {

    'Kore': { gender: 'female', style: 'warm, friendly' },
    'Leda': { gender: 'female', style: 'young, energetic' },
    'Aoede': { gender: 'female', style: 'soft, calm' },
    'Despina': { gender: 'female', style: 'clear, articulate' },
    'Erinome': { gender: 'female', style: 'bright, cheerful' },
    'Callirhoe': { gender: 'female', style: 'mature, professional' },


    'Puck': { gender: 'male', style: 'friendly, conversational' },
    'Charon': { gender: 'male', style: 'deep, authoritative' },
    'Fenrir': { gender: 'male', style: 'strong, confident' },
    'Orus': { gender: 'male', style: 'warm, reassuring' },
    'Enceladus': { gender: 'male', style: 'clear, professional' },
    'Iapetus': { gender: 'male', style: 'mature, wise' },

    // Neutral/versatile voices
    'Zephyr': { gender: 'neutral', style: 'light, airy' },
    'Umbriel': { gender: 'neutral', style: 'mysterious, thoughtful' },
    'Algieba': { gender: 'neutral', style: 'balanced, natural' },
    'Autonoe': { gender: 'neutral', style: 'expressive' }
};


function setTTSLanguage(langCode) {
    if (TTS_LANGUAGES[langCode]) {
        CONFIG.tts.language = langCode;
        console.log(`🌍 TTS Language set to: ${TTS_LANGUAGES[langCode].name}`);
        return true;
    }
    console.warn(`Language code '${langCode}' not supported`);
    return false;
}


function setTTSVoice(voiceName) {
    if (TTS_VOICES[voiceName]) {
        CONFIG.tts.voice = voiceName;
        console.log(`🎤 TTS Voice set to: ${voiceName} (${TTS_VOICES[voiceName].style})`);
        return true;
    }
    console.warn(`Voice '${voiceName}' not available`);
    return false;
}

/**
 * Set TTS speaking style
 * @param {string} style - Speaking style description (e.g., 'warm and encouraging', 'energetic')
 */
function setTTSStyle(style) {
    CONFIG.tts.style = style;
    console.log(`🎭 TTS Style set to: ${style}`);
}


function getAvailableTTSLanguages() {
    return TTS_LANGUAGES;
}


function getAvailableTTSVoices() {
    return TTS_VOICES;
}

/**
 * Test TTS with current settings
 * @param {string} testText - Text to speak (optional)
 */
async function testTTS(testText = null) {
    const langCode = CONFIG.tts.language;
    const lang = TTS_LANGUAGES[langCode] || TTS_LANGUAGES['en'];

    const defaultTests = {
        'bn': 'আমি তোমার শিক্ষক। আমি তোমাকে শিখতে সাহায্য করব।',
        'hi': 'मैं आपका शिक्षक हूं। मैं आपको सीखने में मदद करूंगा।',
        'ar': 'أنا معلمك. سأساعدك على التعلم.',
        'es': '¡Hola! Soy tu profesora. Voy a ayudarte a aprender.',
        'fr': 'Bonjour! Je suis votre professeur. Je vais vous aider à apprendre.',
        'de': 'Hallo! Ich bin dein Lehrer. Ich werde dir beim Lernen helfen.',
        'ja': 'こんにちは！私はあなたの先生です。学習のお手伝いをします。',
        'ko': '안녕하세요! 저는 당신의 선생님입니다. 학습을 도와드리겠습니다.',
        'zh': '你好！我是你的老师。我会帮助你学习。',
        'en': 'Hello! I am your teacher. I will help you learn and succeed.'
    };

    const text = testText || defaultTests[langCode] || defaultTests['en'];
    console.log(`🔊 Testing TTS in ${lang.name}: "${text}"`);

    await speakText(text);
}



// ===========================================
function findSentenceEnd(text) {
    let maxIndex = 0;
    [". ", "! ", "? ", "\n\n"].forEach(delimiter => {
        const idx = text.lastIndexOf(delimiter);
        if (idx > maxIndex) maxIndex = idx + delimiter.length;
    });
    return maxIndex;
}


function cleanTextForTTS(text) {
    if (!text) return '';

    let clean = text

        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical Symbols
        .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
        .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
        .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols (sun, moon, etc)
        .replace(/[\u{2700}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Mahjong Tiles
        .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '')

        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code
        .replace(/`[^`]+`/g, '')
        // Remove markdown headers
        .replace(/#{1,6}\s*/g, '')
        // Remove bold/italic markers
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
        .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
        // Remove links - keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove bullet points
        .replace(/^[\s]*[-*+]\s*/gm, '')
        // Remove numbered lists markers
        .replace(/^[\s]*\d+\.\s*/gm, '')
        // Remove multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        // Remove extra spaces
        .replace(/\s{2,}/g, ' ')
        .trim();

    // Limit length for TTS (very long text can fail or be slow)
    if (clean.length > 2000) {
        // Find a good break point
        const breakPoint = clean.lastIndexOf('.', 2000);
        if (breakPoint > 1500) {
            clean = clean.substring(0, breakPoint + 1);
        } else {
            clean = clean.substring(0, 2000) + '...';
        }
    }

    return clean;
}

// ===========================================
// Add Message to Chat
// ===========================================
function addMessageToChat(content, type, shouldSave = true) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (type === "teacher" && content) {
        contentDiv.innerHTML = dompurify.sanitize(marked.parse(content));
    } else if (type === "system") {
        contentDiv.innerHTML = `<p class="system-message">${content}</p>`;
    } else {
        contentDiv.innerHTML = `<p>${escapeHtml(content)}</p>`;
    }

    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    // Track message for chat history (not system messages)
    if (shouldSave && type !== "system" && content) {
        currentChatMessages.push({
            role: type === "user" ? "user" : "model",
            content: content,
            timestamp: new Date().toISOString()
        });

        // Auto-save after a short delay (debounced)
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(() => {
            autoSaveChat();
        }, 2000);
    }

    return messageDiv;
}

// ===========================================
// Add Typing Indicator
// ===========================================
function addTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "message teacher";
    typingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
    elements.chatMessages.appendChild(typingDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return typingDiv;
}

// ===========================================
// Update Status
// ===========================================
function updateStatus(status) {
    const container = document.getElementById("connection-status");
    const indicator = container?.querySelector(".status-dot");
    const text = container?.querySelector(".status-text");

    // Guard against null elements
    if (!indicator || !text) {
        console.warn("Status elements not found");
        return;
    }

    // Reset inline styles first
    indicator.style.background = "";
    indicator.style.boxShadow = "";

    switch (status) {
        case "online":
            container.className = "connection-indicator online";
            text.textContent = "Online";
            break;
        case "thinking":
            container.className = "connection-indicator thinking";
            indicator.style.background = "var(--accent-warning, #f59e0b)";
            indicator.style.boxShadow = "0 0 8px var(--accent-warning, #f59e0b)";
            text.textContent = "Thinking...";
            break;
        case "speaking":
            container.className = "connection-indicator speaking";
            indicator.style.background = "var(--accent-primary, #3b82f6)";
            indicator.style.boxShadow = "0 0 8px var(--accent-primary, #3b82f6)";
            text.textContent = "Speaking...";
            break;
    }
}

// ===========================================
// Update Mood Based on Content (Automatic) - Using TeacherBehavior
// ===========================================
function updateMoodBasedOnContent(content) {
    if (!head) return;

    // Use the TeacherBehavior system for smart mood detection
    const detectedMood = TeacherBehavior.detectAndSetMood(content);

    // Add gesture based on content type
    const lowerContent = content.toLowerCase();

    // Happy/Approval - thumbs up
    if (['happy'].includes(detectedMood)) {
        if (lowerContent.includes('correct') || lowerContent.includes('right') ||
            lowerContent.includes('well done') || lowerContent.includes('exactly')) {
            setTimeout(() => TeacherBehavior.playGesture('thumbup', 2), 500);
        }
    }

    // Question asking - pointing gesture
    if (lowerContent.includes('?') || lowerContent.includes('what do you think') ||
        lowerContent.includes('can you') || lowerContent.includes('try to')) {
        setTimeout(() => TeacherBehavior.playGesture('index', 2), 500);
    }

    // Explanation - occasional side gesture or ok
    if (lowerContent.includes('let me explain') || lowerContent.includes('this means') ||
        lowerContent.includes('for example') || lowerContent.includes('in other words')) {
        setTimeout(() => TeacherBehavior.playGesture('ok', 1.5), 500);
    }

    // Uncertainty/Shrug
    if (lowerContent.includes('not sure') || lowerContent.includes('depends') ||
        lowerContent.includes('it varies') || lowerContent.includes('sometimes')) {
        setTimeout(() => TeacherBehavior.playGesture('shrug', 2), 500);
    }

    // Add teaching behavior periodically
    if (Math.random() > 0.7) {
        setTimeout(() => TeacherBehavior.teachingSequence(), 1000);
    }
}

// ===========================================
// Handle Quick Actions
// ===========================================
function handleQuickAction(action) {
    const prompts = {
        explain: "Can you explain a concept to me? I'd like to learn about ",
        quiz: "Quiz me on ",
        example: "Can you give me an example of ",
        curriculum: "Teach me from my textbook about ",
        research: "Research comprehensively about "
    };

    const text = prompts[action] || "";
    elements.userInput.value = text;
    elements.userInput.focus();
    elements.userInput.setSelectionRange(text.length, text.length);
}

// ===========================================
// Voice Input
// ===========================================
let recognition = null;
let isRecording = false;
let selectedLanguage = "en-US"; // Default to English

function toggleVoiceInput() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        alert("Voice input is not supported in your browser. Please use Chrome.");
        return;
    }

    if (isRecording) {
        stopVoiceInput();
    } else {
        startVoiceInput();
    }
}

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;  // Keep listening continuously
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Use selected language
    recognition.lang = selectedLanguage;

    const langName = selectedLanguage === "en-US" ? "English" : "Bengali";
    console.log(`🎙️ Voice input started in ${langName}...`);

    recognition.onstart = () => {
        isRecording = true;
        elements.micBtn.classList.add("recording");
        elements.micBtn.innerHTML = '<span>🔴</span>';
        addMessageToChat("🎙️ Listening... (click ⏹️ to stop teacher)", "system");
    };

    let finalTranscript = "";
    let silenceTimer = null;

    recognition.onresult = (event) => {
        // Ignore input while teacher is speaking
        if (isSpeaking) {
            return;
        }

        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
            } else {
                interimTranscript = transcript;
            }
        }

        const currentText = (finalTranscript + interimTranscript).trim();

        // Show current transcript in input
        elements.userInput.value = currentText;

        // Auto-send after 2 seconds of silence
        clearTimeout(silenceTimer);
        if (finalTranscript.trim().length > 0) {
            silenceTimer = setTimeout(async () => {
                if (finalTranscript.trim().length > 0 && !isSpeaking) {
                    console.log("✅ Auto-sending:", finalTranscript.trim());
                    elements.userInput.value = finalTranscript.trim();
                    await handleSendMessage();
                    finalTranscript = "";
                }
            }, 2000);
        }
    };

    recognition.onend = () => {
        // Don't auto-restart if teacher is speaking (we paused it intentionally)
        if (isSpeaking) {
            console.log("⏸️ Mic paused - teacher speaking");
            return;
        }

        // If still in recording mode, restart (for continuous listening)
        if (isRecording) {
            console.log("🔄 Restarting voice recognition...");
            try {
                recognition.start();
            } catch (e) {
                console.warn("Recognition restart failed:", e);
                stopVoiceInput();
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        // Don't stop on "no-speech" error, just continue
        if (event.error === "no-speech") {
            console.log("No speech detected, continuing...");
            return;
        }

        // For other errors, stop
        addMessageToChat(`❌ Voice error: ${event.error}`, "system");
        stopVoiceInput();
    };

    recognition.start();
}

function stopVoiceInput() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    isRecording = false;
    elements.micBtn.classList.remove("recording");
    elements.micBtn.innerHTML = '<span>🎙️</span>';
    addMessageToChat("🛑 Voice input stopped.", "system");
}

// ===========================================
// Theme Toggle
// ===========================================
function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    if (elements.themeToggle) {
        elements.themeToggle.textContent = isDark ? "☀️" : "🌙";
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

// ===========================================
// Chat Panel Toggle (Liquid Glass UI)
// ===========================================
function toggleChatPanel() {
    const panel = elements.chatPanel;
    if (panel) {
        panel.classList.toggle("hidden");
        // Update button icon
        const btn = elements.toggleChatBtn;
        if (btn) {
            const icon = btn.querySelector('.btn-icon');
            if (icon) {
                icon.textContent = panel.classList.contains("hidden") ? "💬" : "✕";
            }
        }
    }
}

// ===========================================
// Update Progress Widget
// ===========================================
function updateProgressWidget() {
    const widget = elements.progressWidget;
    if (!widget) return;

    const stats = progressTracker.getStats();
    const progressFill = widget.querySelector('.progress-fill');
    const progressStats = widget.querySelector('#progress-stats');

    if (progressFill && stats.totalTopics > 0) {
        const percentage = Math.round((stats.masteredTopics / stats.totalTopics) * 100);
        progressFill.style.width = `${percentage}%`;
    }

    if (progressStats) {
        progressStats.innerHTML = `<span>${stats.masteredTopics || 0} topics learned</span>`;
    }
}

// ===========================================
// Settings Management
// ===========================================
function loadSettings() {
    // Load theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        if (elements.themeToggle) {
            elements.themeToggle.textContent = "☀️";
        }
    }

    // Load API keys from localStorage (if saved)
    const savedGeminiKey = localStorage.getItem("geminiApiKey");

    if (savedGeminiKey) {
        CONFIG.geminiApiKey = savedGeminiKey;
        if (elements.geminiApiKey) elements.geminiApiKey.value = savedGeminiKey;
    }

    // Load other settings
    const savedVoice = localStorage.getItem("ttsVoice");
    if (savedVoice) {
        CONFIG.ttsVoice = savedVoice;
        if (elements.voiceSelect) elements.voiceSelect.value = savedVoice;
    }

    const savedRate = localStorage.getItem("ttsRate");
    if (savedRate) {
        CONFIG.ttsRate = parseFloat(savedRate);
        if (elements.speechRate) elements.speechRate.value = savedRate;
        if (elements.rateValue) elements.rateValue.textContent = `${parseFloat(savedRate).toFixed(1)}x`;
    }

    const savedStyle = localStorage.getItem("teacherStyle");
    if (savedStyle) {
        CONFIG.teacherStyle = savedStyle;
        if (elements.teacherStyle) elements.teacherStyle.value = savedStyle;
    }

    const savedSubject = localStorage.getItem("subjectFocus");
    if (savedSubject) {
        CONFIG.subjectFocus = savedSubject;
        if (elements.subjectFocus) elements.subjectFocus.value = savedSubject;
    }

    // Load teacher preference
    const savedTeacher = localStorage.getItem("edumind_teacher_preference");
    if (savedTeacher && CONFIG.teacherAvatars[savedTeacher]) {
        CONFIG.currentTeacher = savedTeacher;
        CONFIG.avatarUrl = CONFIG.teacherAvatars[savedTeacher].url;
        // Update teacher selector UI
        const teacherOptions = document.querySelectorAll('.teacher-option');
        teacherOptions.forEach(opt => {
            if (opt.dataset.teacher === savedTeacher) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
}

function saveSettings() {
    // Get values from form
    const geminiKey = elements.geminiApiKey?.value.trim();
    const voice = elements.voiceSelect?.value;
    const rate = elements.speechRate?.value;
    const pitch = elements.speechPitch?.value;
    const style = elements.teacherStyle?.value;
    const subject = elements.subjectFocus?.value;

    // Update config
    if (geminiKey) CONFIG.geminiApiKey = geminiKey;
    if (voice) CONFIG.ttsVoice = voice;
    if (rate) CONFIG.ttsRate = parseFloat(rate);
    if (pitch) CONFIG.ttsPitch = parseInt(pitch);
    if (style) CONFIG.teacherStyle = style;
    if (subject) CONFIG.subjectFocus = subject;

    // Save to localStorage
    if (geminiKey) localStorage.setItem("geminiApiKey", geminiKey);
    if (voice) localStorage.setItem("ttsVoice", voice);
    if (rate) localStorage.setItem("ttsRate", rate);
    if (style) localStorage.setItem("teacherStyle", style);
    if (subject) localStorage.setItem("subjectFocus", subject);

    // Close modal
    elements.settingsModal?.classList.add("hidden");

    // Show confirmation
    addMessageToChat("⚙️ Settings updated successfully!", "system");
}

// ===========================================
// Utility Functions
// ===========================================
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ===========================================
// Start Application
// ===========================================

// LightRays effect DISABLED - using classroom GLB background instead
// let lightRays = null;
// function initializeLightRays() { ... }

// Create animated particle stars on load
function createParticleStars() {
    const particleField = document.getElementById('particle-field');
    if (!particleField) return;

    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Random animation delay
        particle.style.animationDelay = Math.random() * 3 + 's';

        // Random size variation (1-3px)
        const size = Math.random() * 2 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        particleField.appendChild(particle);
    }

    console.log('✨ Particle stars created');
}

// ===========================================
// Gemini Live API - Real-time Voice Conversation
// Bidirectional audio streaming with native audio model
// ===========================================
let liveSession = null;
let mediaRecorder = null;
let audioStream = null;
let isLiveMode = false;
let audioContext = null;
let audioWorklet = null;
let audioChunksBuffer = []; // Buffer to accumulate audio chunks
let isPlayingAudio = false;
let audioQueue = [];

async function startLiveConversation() {
    console.log("🎤 Starting Live Voice Conversation...");

    // Reset audio buffers
    audioChunksBuffer = [];
    audioQueue = [];
    isPlayingAudio = false;

    try {
        // Request microphone access
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        console.log("✅ Microphone access granted");

        // Create AudioContext for processing
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 16000
        });

        // Connect to Gemini Live API via WebSocket
        const wsUrl = `${CONFIG.geminiLiveEndpoint}?key=${CONFIG.geminiApiKey}`;
        liveSession = new WebSocket(wsUrl);

        liveSession.onopen = () => {
            console.log("✅ Connected to Gemini Live API");

            // Send setup message
            const setupMessage = {
                setup: {
                    model: `models/${CONFIG.models.live}`,
                    generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: "Aoede"  // Natural male voice
                                }
                            }
                        }
                    },
                    systemInstruction: {
                        parts: [{
                            text: `You are ${CONFIG.teacherAvatars[CONFIG.currentTeacher]?.name || "Abubokkor"}, a friendly AI teacher having a real-time voice conversation with a student.

VOICE CONVERSATION RULES:
- Speak naturally and conversationally like a real teacher
- Keep responses SHORT (2-4 sentences) for voice interaction
- Be warm, encouraging, and patient
- Ask follow-up questions to engage the student
- If the student speaks Bengali, respond in Bengali
- If the student speaks English, respond in English
- Use simple, clear language
- Be enthusiastic about teaching

Remember: This is a live conversation, not text chat. Keep it flowing naturally!`
                        }]
                    }
                }
            };

            liveSession.send(JSON.stringify(setupMessage));

            // Start sending audio
            startAudioCapture();

            // Update UI
            isLiveMode = true;
            updateLiveUI(true);
            addMessageToChat("🎤 Live voice conversation started! Speak to your teacher...", "system");
        };

        liveSession.onmessage = async (event) => {
            // Handle binary audio data (Blob)
            if (event.data instanceof Blob) {
                try {
                    // Convert Blob to ArrayBuffer and accumulate
                    const arrayBuffer = await event.data.arrayBuffer();

                    // Skip very small chunks (noise)
                    if (arrayBuffer.byteLength < 100) return;

                    // Add to buffer
                    audioChunksBuffer.push(new Uint8Array(arrayBuffer));

                    // Start playback if not already playing
                    if (!isPlayingAudio) {
                        processAudioBuffer();
                    }
                } catch (err) {
                    console.error("❌ Error processing audio blob:", err);
                }
                return;
            }

            // Handle text/JSON messages
            let data;
            try {
                data = JSON.parse(event.data);
            } catch (err) {
                console.warn("⚠️ Non-JSON message received:", event.data);
                return;
            }

            // Handle setup complete
            if (data.setupComplete) {
                console.log("✅ Live session setup complete");
                return;
            }

            // Handle audio response from Gemini (base64 encoded)
            if (data.serverContent?.modelTurn?.parts) {
                for (const part of data.serverContent.modelTurn.parts) {
                    if (part.inlineData?.mimeType?.startsWith("audio/")) {
                        // Play audio response with lip-sync
                        await playLiveAudioResponse(part.inlineData.data, part.inlineData.mimeType);
                    }
                    if (part.text) {
                        // Show text transcript
                        addMessageToChat(part.text, "teacher");
                    }
                }
            }

            // Handle turn complete
            if (data.serverContent?.turnComplete) {
                console.log("🎤 Teacher finished speaking, listening...");
                if (head) {
                    TeacherBehavior.startIdleBehavior();
                }
            }
        };

        liveSession.onerror = (error) => {
            console.error("❌ Live session error:", error);
            stopLiveConversation();
            addMessageToChat("❌ Voice connection error. Please try again.", "system");
        };

        liveSession.onclose = () => {
            console.log("🔌 Live session closed");
            stopLiveConversation();
        };

    } catch (error) {
        console.error("❌ Failed to start live conversation:", error);

        if (error.name === 'NotAllowedError') {
            addMessageToChat("❌ Microphone access denied. Please allow microphone access to use Live Voice.", "system");
        } else {
            addMessageToChat("❌ Failed to start voice conversation. Please try again.", "system");
        }
    }
}

function startAudioCapture() {
    if (!audioStream || !liveSession) return;

    const source = audioContext.createMediaStreamSource(audioStream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
        if (!isLiveMode || liveSession?.readyState !== WebSocket.OPEN) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Convert Float32Array to Int16Array (PCM 16-bit)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        // Convert to base64
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));

        // Send audio chunk to Gemini
        const audioMessage = {
            realtimeInput: {
                mediaChunks: [{
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Audio
                }]
            }
        };

        liveSession.send(JSON.stringify(audioMessage));
    };

    audioWorklet = processor;
    console.log("🎙️ Audio capture started");
}

async function playLiveAudioResponse(base64Audio, mimeType) {
    if (!base64Audio) return;

    try {
        console.log("🔊 Playing live audio response...");

        // Make teacher look at student
        if (head) {
            TeacherBehavior.makeEyeContact(10000);
        }

        // Decode base64 audio
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create audio context if needed
        const playbackContext = head?.audioContext || new AudioContext();

        // Decode audio
        const audioBuffer = await playbackContext.decodeAudioData(bytes.buffer.slice(0));

        // Play with lip-sync if avatar available
        if (head) {
            // Generate fake word timings for lip-sync
            const duration = audioBuffer.duration * 1000;
            const wordCount = Math.ceil(duration / 200);
            const words = [];

            for (let i = 0; i < wordCount; i++) {
                words.push({
                    word: "word",
                    start: i * 200,
                    end: (i + 1) * 200
                });
            }

            await head.speakAudio(audioBuffer, null, words);
        } else {
            // Direct playback
            const source = playbackContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(playbackContext.destination);
            source.start();
        }

    } catch (error) {
        console.error("❌ Error playing live audio:", error);
    }
}

// Play audio from raw ArrayBuffer (binary WebSocket data)
async function playLiveAudioFromBuffer(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;

    try {
        console.log("🔊 Playing binary audio stream...");

        // Make teacher look at student
        if (head) {
            TeacherBehavior.makeEyeContact(5000);
        }

        // Create audio context if needed
        const playbackContext = head?.audioContext || audioContext || new AudioContext();

        // Try to decode as PCM 16-bit 24kHz (Gemini's output format)
        let audioBuffer;

        try {
            // First try direct decode (for standard audio formats)
            audioBuffer = await playbackContext.decodeAudioData(arrayBuffer.slice(0));
        } catch (decodeError) {
            // If direct decode fails, treat as raw PCM 16-bit 24kHz
            console.log("📊 Converting raw PCM audio...");
            let pcmBuffer = arrayBuffer;
            if (pcmBuffer.byteLength % 2 !== 0) {
                // Remove last byte to align to 16-bit samples
                pcmBuffer = pcmBuffer.slice(0, pcmBuffer.byteLength - 1);
            }
            const pcmData = new Int16Array(pcmBuffer);
            const floatData = new Float32Array(pcmData.length);

            for (let i = 0; i < pcmData.length; i++) {
                floatData[i] = pcmData[i] / 32768.0;
            }

            // Gemini outputs 24kHz audio
            audioBuffer = playbackContext.createBuffer(1, floatData.length, 24000);
            audioBuffer.getChannelData(0).set(floatData);
        }

        // Play with lip-sync if avatar available
        if (head && audioBuffer.duration > 0.1) {
            const duration = audioBuffer.duration * 1000;
            const wordCount = Math.ceil(duration / 200);
            const words = [];

            for (let i = 0; i < wordCount; i++) {
                words.push({
                    word: "word",
                    start: i * 200,
                    end: (i + 1) * 200
                });
            }

            await head.speakAudio(audioBuffer, null, words);
        } else if (audioBuffer.duration > 0.05) {
            // Direct playback for short sounds or no avatar
            const source = playbackContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(playbackContext.destination);
            source.start();
        }

    } catch (error) {
        console.error("❌ Error playing binary audio:", error);
    }
}

// Process buffered audio chunks and play continuously
async function processAudioBuffer() {
    if (isPlayingAudio || audioChunksBuffer.length === 0) return;

    isPlayingAudio = true;

    try {
        // Wait for enough chunks to accumulate (at least 500ms of audio)
        await new Promise(resolve => setTimeout(resolve, 500));

        if (audioChunksBuffer.length === 0) {
            isPlayingAudio = false;
            return;
        }

        console.log(`🎵 Processing ${audioChunksBuffer.length} audio chunks...`);

        // Merge all chunks
        let totalLength = 0;
        for (const chunk of audioChunksBuffer) {
            totalLength += chunk.length;
        }

        const mergedArray = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksBuffer) {
            mergedArray.set(chunk, offset);
            offset += chunk.length;
        }

        // Clear buffer after merging
        audioChunksBuffer = [];

        // Convert to audio buffer and play
        // Use default AudioContext (browser's native rate, usually 44.1kHz or 48kHz) for playback
        const playbackContext = new (window.AudioContext || window.webkitAudioContext)();

        // Align to 16-bit samples
        let pcmBuffer = mergedArray.buffer;
        if (pcmBuffer.byteLength % 2 !== 0) {
            pcmBuffer = pcmBuffer.slice(0, pcmBuffer.byteLength - 1);
        }

        const pcmData = new Int16Array(pcmBuffer);
        const floatData = new Float32Array(pcmData.length);

        for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 32768.0;
        }

        // Gemini Live outputs audio at 24kHz
        const audioBuffer = playbackContext.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);

        console.log(`🔊 Playing ${audioBuffer.duration.toFixed(2)}s of audio...`);

        // Make teacher look at student
        if (head) {
            TeacherBehavior.makeEyeContact(audioBuffer.duration * 1000);
        }

        // Play with lip-sync if avatar available
        if (head && audioBuffer.duration > 0.1) {
            const duration = audioBuffer.duration * 1000;
            const wordCount = Math.ceil(duration / 200);
            const words = [];

            for (let i = 0; i < wordCount; i++) {
                words.push({
                    word: "word",
                    start: i * 200,
                    end: (i + 1) * 200
                });
            }

            await head.speakAudio(audioBuffer, null, words);
        } else {
            // Direct playback
            const source = playbackContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(playbackContext.destination);
            source.start();

            // Wait for playback to complete
            await new Promise(resolve => setTimeout(resolve, audioBuffer.duration * 1000));
        }

    } catch (error) {
        console.error("❌ Error processing audio buffer:", error);
    } finally {
        isPlayingAudio = false;

        // Process next batch if available
        if (audioChunksBuffer.length > 0) {
            processAudioBuffer();
        }
    }
}

function stopLiveConversation() {
    console.log("🛑 Stopping Live Conversation...");

    isLiveMode = false;
    audioChunksBuffer = [];
    audioQueue = [];
    isPlayingAudio = false;

    // Close WebSocket
    if (liveSession) {
        liveSession.close();
        liveSession = null;
    }

    // Stop audio capture
    if (audioWorklet) {
        audioWorklet.disconnect();
        audioWorklet = null;
    }

    // Stop microphone
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }

    // Close audio context
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    // Update UI
    updateLiveUI(false);

    if (head) {
        TeacherBehavior.startIdleBehavior();
    }

    console.log("✅ Live conversation stopped");
}

function updateLiveUI(isLive) {
    const liveTalkBtn = document.getElementById('live-talk-btn');
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');

    if (liveTalkBtn) {
        if (isLive) {
            liveTalkBtn.classList.add('active', 'pulse');
            liveTalkBtn.innerHTML = '<span>🔴</span>';
            liveTalkBtn.title = 'End Live Conversation';
        } else {
            liveTalkBtn.classList.remove('active', 'pulse');
            liveTalkBtn.innerHTML = '<span>🎤</span>';
            liveTalkBtn.title = 'Live Voice Conversation';
        }
    }

    // Disable text input during live mode
    if (micBtn) micBtn.disabled = isLive;
    if (sendBtn) sendBtn.disabled = isLive;
    if (userInput) {
        userInput.disabled = isLive;
        userInput.placeholder = isLive ? "Speaking live with teacher..." : "Ask your teacher anything...";
    }
}

// Toggle live conversation
function toggleLiveConversation() {
    if (isLiveMode) {
        stopLiveConversation();
        addMessageToChat("🎤 Live voice conversation ended.", "system");
    } else {
        startLiveConversation();
    }
}

// ===========================================
// CONVERSATIONAL QUIZ SYSTEM WITH MAGIC OVERLAY
// ===========================================

// Quiz conversation state
let quizConversationState = {
    active: false,
    waitingFor: null, // 'count' or null
    subject: '',
    topic: '',
    count: 10
};

// Quiz overlay state
let quizOverlayState = {
    subject: '',
    topic: '',
    currentIndex: 0,
    score: 0,
    answers: [],
    questions: [],
    startTime: null
};

// Check if user is responding to quiz conversation (subject or count)
async function handleQuizConversation(message) {
    if (!quizConversationState.active) return false;

    const isBangla = quizConversationState.isBangla || /[\u0980-\u09FF]/.test(message);

    // Use AI to extract subject and count from the conversation
    const extractedInfo = await extractQuizInfoWithAI(message, quizConversationState.availableSubjects, isBangla);

    // Step 1: Waiting for subject selection
    if (quizConversationState.waitingFor === 'subject') {
        if (extractedInfo.subject) {
            quizConversationState.subject = extractedInfo.subject;
            quizConversationState.topic = extractedInfo.subject;

            // If count also provided, start quiz immediately
            if (extractedInfo.count) {
                quizConversationState.count = extractedInfo.count;
                quizConversationState.active = false;
                quizConversationState.waitingFor = null;
                generateAndShowQuiz(quizConversationState.subject, quizConversationState.topic, extractedInfo.count);
                return true;
            }

            // Otherwise ask for count
            quizConversationState.waitingFor = 'count';
            const askCountMsg = isBangla
                ? `চমৎকার! **${extractedInfo.subject}** থেকে কুইজ! 🎯\n\nকয়টা প্রশ্ন চাও? (৫, ১০, ১৫ বা ২০)`
                : `Great! **${extractedInfo.subject}** quiz! 🎯\n\nHow many questions? (5, 10, 15, or 20)`;

            addMessageToChat(askCountMsg, "teacher");

            if (head) {
                const speakMsg = isBangla
                    ? `${extractedInfo.subject} থেকে কুইজ! কয়টা প্রশ্ন চাও?`
                    : `${extractedInfo.subject} quiz! How many questions?`;
                speakText(speakMsg);
            }
            return true;
        } else {
            // AI couldn't extract subject, ask again conversationally
            const askAgain = isBangla
                ? "কোন বিষয়ে কুইজ দিতে চাও? বিষয়ের নাম বলো! 😊"
                : "Which subject do you want to quiz on? Tell me the subject name! 😊";
            addMessageToChat(askAgain, "teacher");
            if (head) speakText(askAgain);
            return true;
        }
    }

    // Step 2: Waiting for question count
    if (quizConversationState.waitingFor === 'count') {
        if (extractedInfo.count) {
            quizConversationState.count = extractedInfo.count;
            quizConversationState.active = false;
            quizConversationState.waitingFor = null;

            // Start generating quiz
            generateAndShowQuiz(quizConversationState.subject, quizConversationState.topic, extractedInfo.count);
            return true;
        } else {
            // AI couldn't extract count, ask again conversationally
            const askAgain = isBangla
                ? "কয়টা প্রশ্ন চাও? ৫, ১০, ১৫ বা ২০ বলো! 😊"
                : "How many questions? Tell me 5, 10, 15, or 20! 😊";
            addMessageToChat(askAgain, "teacher");
            if (head) speakText(askAgain);
            return true;
        }
    }

    return false;
}

// AI-powered extraction of quiz subject and count from natural language
async function extractQuizInfoWithAI(message, studentSubjects, isBangla) {
    try {
        const subjectsContext = studentSubjects.length > 0
            ? `Student's subjects: ${studentSubjects.join(', ')}`
            : 'No specific subjects on file';

        const extractionPrompt = `You are analyzing a student's quiz request. Extract the subject and question count.

${subjectsContext}

Student message: "${message}"

Analyze this message and extract:
1. **Subject**: The subject/topic they want to quiz on (e.g., Law, Physics, Math, History)
2. **Count**: Number of questions (must be 5, 10, 15, or 20)

Important:
- If subject is mentioned (in English or Bangla like "আইন" = Law, "পদার্থবিদ্যা" = Physics), extract it
- If count is mentioned, extract it. Recognize:
  * Bangla numerals: ৫=5, ১০=10, ১৫=15, ২০=20
  * Bangla words: পাঁচ/পাঁচটা=5, দশ/দশটা=10, পনের/পনেরটা=15, বিশ/বিশটা=20
  * English: 5, 10, 15, 20, five, ten, fifteen, twenty
- If not mentioned, return null for that field
- Return ONLY valid JSON with no extra text

Response format (JSON only):
{
  "subject": "subject name or null",
  "count": number or null
}`;

        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: extractionPrompt,
                conversationHistory: [],
                systemContext: 'quiz_extraction'
            })
        });

        if (!response.ok) {
            throw new Error('AI extraction failed');
        }

        const data = await response.json();
        const aiResponse = data.response || '{}';

        // Parse JSON from AI response (handle markdown code blocks)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const extracted = JSON.parse(jsonMatch[0]);
            console.log('🤖 AI extracted quiz info:', extracted);

            // Validate count
            if (extracted.count && ![5, 10, 15, 20].includes(extracted.count)) {
                extracted.count = null;
            }

            return {
                subject: extracted.subject || null,
                count: extracted.count || null
            };
        }

        return { subject: null, count: null };

    } catch (error) {
        console.error('❌ AI extraction error:', error);
        // Fallback to simple parsing
        return fallbackQuizExtraction(message, studentSubjects);
    }
}

// Fallback extraction without AI
function fallbackQuizExtraction(message, studentSubjects) {
    const msgLower = message.toLowerCase();

    // Try to find subject
    let subject = null;
    for (const subj of studentSubjects) {
        if (msgLower.includes(subj.toLowerCase())) {
            subject = subj;
            break;
        }
    }

    // Common Bangla subject keywords
    const banglaSubjects = {
        'আইন': 'Law',
        'পদার্থবিদ্যা': 'Physics',
        'রসায়ন': 'Chemistry',
        'গণিত': 'Mathematics',
        'ইতিহাস': 'History',
        'জীববিজ্ঞান': 'Biology'
    };

    for (const [bn, en] of Object.entries(banglaSubjects)) {
        if (message.includes(bn)) {
            subject = en;
            break;
        }
    }

    // Try to find count (supports Bangla numerals and words)
    let count = null;
    const banglaNumbers = {
        // Bangla numerals
        '৫': 5, '১০': 10, '১৫': 15, '২০': 20,
        // Bangla number words
        'পাঁচ': 5, 'পাঁচটা': 5, 'পাঁচটি': 5,
        'দশ': 10, 'দশটা': 10, 'দশটি': 10,
        'পনের': 15, 'পনেরটা': 15, 'পনেরটি': 15, 'পনরো': 15,
        'বিশ': 20, 'বিশটা': 20, 'বিশটি': 20,
        // English words
        'five': 5, 'ten': 10, 'fifteen': 15, 'twenty': 20
    };

    // Check for Bangla number words/numerals
    for (const [bn, num] of Object.entries(banglaNumbers)) {
        if (message.includes(bn) || msgLower.includes(bn)) {
            count = num;
            break;
        }
    }

    // If not found, check for English digits
    if (!count) {
        const match = message.match(/\b(5|10|15|20)\b/);
        if (match) {
            count = parseInt(match[1]);
        }
    }

    return { subject, count };
}

// Generate quiz and show in overlay
async function generateAndShowQuiz(subject, topic, count) {
    // Check credits
    const user = getCurrentUser();
    const canProceed = await canPerformAction('quizAttempt');

    if (!canProceed.allowed) {
        showUpgradePrompt(canProceed.reason);
        return;
    }

    if (!canProceed.unlimited) {
        const userId = user?.uid || null;
        await deductCredits(userId, 'quizAttempt');
        updateCreditsDisplay();
    }

    addMessageToChat(`📝 Creating ${count} questions for you on **${subject}**... Please wait! ✨`, "teacher");

    if (head) {
        await speakText(`Creating ${count} questions for you. Please wait!`);
    }

    const quizModel = getModelForTask('chat');

    try {
        await quizEngine.generateQuiz(
            async (prompt) => {
                const body = {
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: buildGenerationConfig('chat')
                };
                const response = await callGeminiAPI(quizModel, body, false);
                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            },
            subject,
            topic,
            count,
            'medium'
        );

        // Initialize overlay state
        quizOverlayState = {
            subject: subject,
            topic: topic,
            currentIndex: 0,
            score: 0,
            answers: new Array(quizEngine.currentQuiz.questions.length).fill(null),
            questions: quizEngine.currentQuiz.questions,
            startTime: new Date()
        };

        // Show the magic quiz overlay
        showQuizOverlay();

        addMessageToChat(`✅ Quiz ready! I've created ${count} questions for you. Answer them in the quiz panel! 🎯`, "teacher");

        if (head) {
            TeacherBehavior.setMood('happy');
            // Only announce quiz is ready - don't read questions
            await speakText(`Quiz ready! ${count} questions for you. Good luck!`);
            setTimeout(() => TeacherBehavior.setMood('neutral'), 2000);
        }

    } catch (error) {
        console.error("Quiz generation error:", error);
        addMessageToChat("❌ Sorry, I couldn't generate the quiz. Let's try again!", "system");
    }
}

// Show quiz overlay (like magic image)
function showQuizOverlay() {
    const overlay = document.getElementById('magic-quiz-overlay');

    // Update header
    document.getElementById('quiz-overlay-subject').textContent = quizOverlayState.subject;
    document.getElementById('quiz-overlay-topic').textContent = quizOverlayState.topic;
    document.getElementById('quiz-overlay-total').textContent = quizOverlayState.questions.length;

    // Render first question
    renderQuizOverlayQuestion(0);
    renderQuizOverlayDots();
    updateQuizOverlayStats();

    // Show overlay
    overlay.classList.remove('hidden');
    document.body.classList.add('quiz-overlay-active');

    // On mobile, auto-close chat panel
    if (window.innerWidth <= 480) {
        const chatPanel = document.querySelector('.hologram-panel');
        if (chatPanel) {
            chatPanel.classList.add('hidden-by-overlay');
        }
    }

    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    console.log("📝 Quiz overlay shown");
}

// Hide quiz overlay
function hideQuizOverlay() {
    const overlay = document.getElementById('magic-quiz-overlay');
    overlay.classList.remove('visible');
    document.body.classList.remove('quiz-overlay-active');

    // On mobile, restore chat panel
    if (window.innerWidth <= 480) {
        const chatPanel = document.querySelector('.hologram-panel');
        if (chatPanel) {
            chatPanel.classList.remove('hidden-by-overlay');
        }
    }

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 500);

    quizEngine.resetQuiz();
}

// Hide results overlay
function hideResultsOverlay() {
    const overlay = document.getElementById('quiz-results-overlay');
    overlay.classList.remove('visible');

    // On mobile, restore chat panel
    if (window.innerWidth <= 480) {
        const chatPanel = document.querySelector('.hologram-panel');
        if (chatPanel) {
            chatPanel.classList.remove('hidden-by-overlay');
        }
    }

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 500);
}

// Render current question in overlay
function renderQuizOverlayQuestion(idx) {
    const q = quizOverlayState.questions[idx];
    if (!q) return;

    quizOverlayState.currentIndex = idx;

    // Update question number and text
    document.getElementById('quiz-overlay-q-num').textContent = `Question ${idx + 1}`;
    document.getElementById('quiz-overlay-q-text').textContent = q.question;

    // Clean option text (remove A) B) etc if present)
    const cleanOptions = q.options.map(opt => {
        return opt.replace(/^[A-D]\)\s*/i, '').trim();
    });

    // Render options
    const optionsContainer = document.getElementById('quiz-overlay-options');
    const existingAnswer = quizOverlayState.answers[idx];
    const correctAnswer = q.correct.toUpperCase();

    optionsContainer.innerHTML = cleanOptions.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        let classes = 'quiz-option-btn';

        if (existingAnswer) {
            classes += ' disabled';
            if (letter === existingAnswer.userAnswer) {
                classes += existingAnswer.isCorrect ? ' correct' : ' wrong';
            }
            if (letter === correctAnswer && !existingAnswer.isCorrect) {
                classes += ' correct';
            }
        }

        return `
            <button class="${classes}" data-answer="${letter}">
                <span class="opt-letter">${letter}</span>
                <span class="opt-text">${opt}</span>
            </button>
        `;
    }).join('');

    // Add click handlers (only if not answered)
    if (!existingAnswer) {
        optionsContainer.querySelectorAll('.quiz-option-btn').forEach(btn => {
            btn.addEventListener('click', handleQuizOverlayOptionClick);
        });
    }

    // Update navigation buttons
    document.getElementById('quiz-overlay-prev').disabled = idx === 0;
    document.getElementById('quiz-overlay-next').disabled = idx === quizOverlayState.questions.length - 1;

    // Update dots
    updateQuizOverlayDots();
}

// Render navigation dots
function renderQuizOverlayDots() {
    const container = document.getElementById('quiz-overlay-dots');
    container.innerHTML = '';

    quizOverlayState.questions.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = 'quiz-dot' + (idx === 0 ? ' active' : '');
        dot.addEventListener('click', () => renderQuizOverlayQuestion(idx));
        container.appendChild(dot);
    });
}

// Update dots state
function updateQuizOverlayDots() {
    document.querySelectorAll('.quiz-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === quizOverlayState.currentIndex);

        const answer = quizOverlayState.answers[i];
        if (answer) {
            dot.classList.add('answered');
            if (!answer.isCorrect) dot.classList.add('wrong');
        }
    });
}

// Update stats display
function updateQuizOverlayStats() {
    document.getElementById('quiz-overlay-current').textContent = quizOverlayState.currentIndex + 1;
    document.getElementById('quiz-overlay-score').textContent = quizOverlayState.score;
}

// Handle option click
async function handleQuizOverlayOptionClick(e) {
    const btn = e.currentTarget;
    const answer = btn.dataset.answer;
    const idx = quizOverlayState.currentIndex;
    const question = quizOverlayState.questions[idx];
    const correctAnswer = question.correct.toUpperCase();
    const isCorrect = answer === correctAnswer;

    // Store answer
    quizOverlayState.answers[idx] = {
        userAnswer: answer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
    };

    if (isCorrect) {
        quizOverlayState.score++;
    }

    // Disable all options
    document.querySelectorAll('.quiz-option-btn').forEach(b => {
        b.classList.add('disabled');
    });

    // Mark correct/wrong
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
        document.querySelector(`[data-answer="${correctAnswer}"]`)?.classList.add('correct');
    }

    // Update stats
    updateQuizOverlayStats();
    updateQuizOverlayDots();

    // Show feedback toast
    showQuizFeedbackToast(isCorrect, question.explanation);

    // Teacher speaks feedback
    if (head) {
        if (isCorrect) {
            TeacherBehavior.setMood('happy');
            await speakText("Correct!");
        } else {
            TeacherBehavior.setMood('sad');
            await speakText(`Wrong. The answer is ${correctAnswer}`);
        }
        setTimeout(() => TeacherBehavior.setMood('neutral'), 1500);
    }

    // Check if quiz is complete
    const allAnswered = quizOverlayState.answers.every(a => a !== null);

    if (allAnswered) {
        // Show results after a short delay
        setTimeout(() => {
            showQuizResults();
        }, 1500);
    } else {
        // Auto advance to next unanswered question (silently)
        setTimeout(() => {
            const nextUnanswered = quizOverlayState.answers.findIndex(a => a === null);
            if (nextUnanswered !== -1) {
                renderQuizOverlayQuestion(nextUnanswered);
                // Don't read questions - let student read silently
            }
        }, 1200);
    }
}

// Show feedback toast
function showQuizFeedbackToast(isCorrect, explanation) {
    const existing = document.querySelector('.quiz-feedback-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `quiz-feedback-toast ${isCorrect ? 'correct' : 'wrong'}`;
    toast.textContent = isCorrect ? '✅ Correct!' : '❌ Wrong!';

    document.querySelector('.quiz-overlay-content').appendChild(toast);

    setTimeout(() => toast.remove(), 1500);
}

// Show quiz results
async function showQuizResults() {
    hideQuizOverlay();

    const total = quizOverlayState.questions.length;
    const correct = quizOverlayState.score;
    const percentage = Math.round((correct / total) * 100);

    // Calculate grade
    let grade, message;
    if (percentage >= 90) {
        grade = 'A+'; message = '🌟 Excellent! You mastered this topic!';
    } else if (percentage >= 80) {
        grade = 'A'; message = '👏 Great job! Strong understanding!';
    } else if (percentage >= 70) {
        grade = 'B'; message = '👍 Good work! Keep practicing!';
    } else if (percentage >= 60) {
        grade = 'C'; message = '📚 Not bad! More study needed!';
    } else if (percentage >= 50) {
        grade = 'D'; message = '💪 Keep trying! Review the topic!';
    } else {
        grade = 'F'; message = '🤗 Don\'t worry! Let\'s review together!';
    }

    // Calculate duration
    const duration = Math.floor((new Date() - quizOverlayState.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update results overlay
    document.getElementById('results-score-percent').textContent = `${percentage}%`;
    document.getElementById('results-grade-letter').textContent = grade;
    document.getElementById('results-correct-count').textContent = correct;
    document.getElementById('results-wrong-count').textContent = total - correct;
    document.getElementById('results-time-taken').textContent = timeStr;
    document.getElementById('results-message-text').textContent = message;

    // Show results overlay
    const resultsOverlay = document.getElementById('quiz-results-overlay');
    resultsOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        resultsOverlay.classList.add('visible');
    });

    // Save to Firebase
    if (getCurrentUser()) {
        try {
            await saveQuizResult(
                quizOverlayState.subject,
                quizOverlayState.topic,
                correct,
                total,
                timeStr,
                quizOverlayState.answers
            );
            console.log("💾 Quiz saved");
        } catch (error) {
            console.error("❌ Quiz save error:", error);
        }
    }

    // Teacher announces result
    if (head) {
        if (percentage >= 70) TeacherBehavior.setMood('happy');
        await speakText(`Quiz complete! You scored ${correct} out of ${total}. ${message}`);
        setTimeout(() => TeacherBehavior.setMood('neutral'), 3000);
    }

    // Add to chat
    addMessageToChat(`📊 **Quiz Complete!**\n\nScore: ${correct}/${total} (${percentage}%)\nGrade: ${grade}\nTime: ${timeStr}\n\n${message}`, "teacher");

    quizEngine.resetQuiz();
}

// Initialize quiz overlay listeners
function initQuizOverlayListeners() {
    // Close button
    document.getElementById('close-quiz-overlay')?.addEventListener('click', hideQuizOverlay);

    // Navigation buttons
    document.getElementById('quiz-overlay-prev')?.addEventListener('click', () => {
        if (quizOverlayState.currentIndex > 0) {
            renderQuizOverlayQuestion(quizOverlayState.currentIndex - 1);
        }
    });

    document.getElementById('quiz-overlay-next')?.addEventListener('click', () => {
        if (quizOverlayState.currentIndex < quizOverlayState.questions.length - 1) {
            renderQuizOverlayQuestion(quizOverlayState.currentIndex + 1);
        }
    });

    // Results buttons
    document.getElementById('quiz-close-btn')?.addEventListener('click', hideResultsOverlay);
    document.getElementById('quiz-review-btn')?.addEventListener('click', () => {
        // Show review in chat
        hideResultsOverlay();
        let reviewMsg = "📋 **Quiz Review:**\n\n";
        quizOverlayState.questions.forEach((q, i) => {
            const ans = quizOverlayState.answers[i];
            const icon = ans?.isCorrect ? '✅' : '❌';
            reviewMsg += `${icon} **Q${i + 1}:** ${q.question}\n`;
            reviewMsg += `Your answer: ${ans?.userAnswer || 'N/A'} | Correct: ${q.correct}\n`;
            if (q.explanation) reviewMsg += `💡 ${q.explanation}\n`;
            reviewMsg += '\n';
        });
        addMessageToChat(reviewMsg, "teacher");
    });
}

// Expose globally
window.handleQuizConversation = handleQuizConversation;

document.addEventListener("DOMContentLoaded", () => {
    // initializeLightRays(); // Disabled - using classroom GLB
    createParticleStars();
    init();

    // Setup Live Talk button
    const liveTalkBtn = document.getElementById('live-talk-btn');
    if (liveTalkBtn) {
        liveTalkBtn.addEventListener('click', toggleLiveConversation);
    }

    // Initialize Quiz Overlay listeners
    initQuizOverlayListeners();
});