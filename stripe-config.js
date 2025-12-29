// Stripe Configuration for EduMind
// ✅ CONFIGURED - Test Mode

// Stripe Publishable Key (safe for client-side)
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SicWpAbfnWorjnyMtW553chKp85slEzScGIAN8uD7dUHBMjWhVtjV4PVkGihgZiIoWIG14CYaiLgCXtvtsnlxgq00CiygjUNf';

// ⚠️ Secret Key should ONLY be used on server-side
// For now, we'll use client-side Stripe Checkout which doesn't need the secret key

// ===========================================
// Subscription Plans Configuration
// ===========================================
export const SUBSCRIPTION_PLANS = {
    free: {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        priceId: null, // No Stripe price for free
        currency: 'USD',
        interval: 'month',
        features: [
            '10 AI conversations per day',
            '5 quiz attempts per day',
            'Basic curriculum access',
            'Community support'
        ],
        limits: {
            dailyConversations: 10,
            dailyQuizzes: 5,
            dailyFileUploads: 2,
            maxFileSize: 5, // MB
            voiceMinutes: 5
        },
        credits: {
            daily: 50,
            bonus: 0
        }
    },
    starter: {
        id: 'starter',
        name: 'Starter Plan',
        price: 2.99, // Very low price
        priceId: 'price_starter_monthly', // Will be created in Stripe
        currency: 'USD',
        interval: 'month',
        features: [
            '50 AI conversations per day',
            '20 quiz attempts per day',
            'Full curriculum access',
            'Priority support',
            'Progress analytics'
        ],
        limits: {
            dailyConversations: 50,
            dailyQuizzes: 20,
            dailyFileUploads: 10,
            maxFileSize: 25, // MB
            voiceMinutes: 30
        },
        credits: {
            daily: 200,
            bonus: 100
        },
        popular: false
    },
    premium: {
        id: 'premium',
        name: 'Premium Plan',
        price: 9.99,
        priceId: 'price_premium_monthly', // Will be created in Stripe
        currency: 'USD',
        interval: 'month',
        features: [
            'Unlimited AI conversations',
            'Unlimited quiz attempts',
            'Full curriculum + Advanced topics',
            '24/7 Priority support',
            'Detailed analytics & reports',
            'Custom study plans',
            'Offline access'
        ],
        limits: {
            dailyConversations: -1, // Unlimited
            dailyQuizzes: -1,
            dailyFileUploads: -1,
            maxFileSize: 100, // MB
            voiceMinutes: -1
        },
        credits: {
            daily: 1000,
            bonus: 500
        },
        popular: true
    },
    pro: {
        id: 'pro',
        name: 'Pro Plan',
        price: 19.99,
        priceId: 'price_pro_monthly',
        currency: 'USD',
        interval: 'month',
        features: [
            'Everything in Premium',
            'API access',
            'White-label options',
            'Team management',
            'Custom integrations',
            'Dedicated support',
            'Early access to features'
        ],
        limits: {
            dailyConversations: -1,
            dailyQuizzes: -1,
            dailyFileUploads: -1,
            maxFileSize: 500, // MB
            voiceMinutes: -1
        },
        credits: {
            daily: 5000,
            bonus: 2000
        },
        popular: false
    }
};

// ===========================================
// Credit Costs for Different Actions
// ===========================================
export const CREDIT_COSTS = {
    aiConversation: 5,      // Per message
    quizAttempt: 10,        // Per quiz
    fileUpload: 15,         // Per file
    voiceMinute: 2,         // Per minute of voice
    imageGeneration: 25,    // Per image
    researchQuery: 20,      // Per research query
    curriculumAccess: 0,    // Free with subscription
    progressReport: 10      // Per detailed report
};

// ===========================================
// Bonus Credit Packages (One-time purchase)
// ===========================================
export const CREDIT_PACKAGES = {
    small: {
        id: 'credits_100',
        name: '100 Credits',
        credits: 100,
        price: 0.99,
        priceId: 'price_credits_100'
    },
    medium: {
        id: 'credits_500',
        name: '500 Credits',
        credits: 500,
        price: 3.99,
        bonus: 50, // Bonus credits
        priceId: 'price_credits_500'
    },
    large: {
        id: 'credits_1000',
        name: '1000 Credits',
        credits: 1000,
        price: 6.99,
        bonus: 200,
        priceId: 'price_credits_1000'
    },
    mega: {
        id: 'credits_5000',
        name: '5000 Credits',
        credits: 5000,
        price: 29.99,
        bonus: 1500,
        priceId: 'price_credits_5000'
    }
};

console.log("✅ Stripe configuration loaded");
