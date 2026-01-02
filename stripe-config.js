// Stripe Config - Publishable key (safe for public repos)

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SicWpAbfnWorjnyMtW553chKp85slEzScGIAN8uD7dUHBMjWhVtjV4PVkGihgZiIoWIG14CYaiLgCXtvtsnlxgq00CiygjUNf';

// ===========================================
// Subscription Plans Configuration
// ===========================================

// Currency detection helper
export function getUserCurrency(countryCode = null) {
    if (!countryCode) return 'USD';

    // Normalize to lowercase for comparison
    const country = countryCode.toLowerCase().trim();

    // Bangladesh detection (multiple formats)
    if (country === 'bd' ||
        country === 'bangladesh' ||
        country === 'বাংলাদেশ' ||
        country.includes('bangladesh')) {
        return 'BDT';
    }
    return 'USD'; // Default for international
}

export const SUBSCRIPTION_PLANS = {
    free: {
        id: 'free',
        name: 'Free Plan',
        price: {
            BDT: 0,
            USD: 0
        },
        priceId: null, // No Stripe price for free
        interval: 'month',
        features: [
            '15 minutes per day',
            '10 AI conversations per day',
            '3 quiz attempts per day',
            '1 file upload per day',
            '10 voice minutes per day',
            'Ads every 3 sessions'
        ],
        limits: {
            dailyMinutes: 15,
            dailyConversations: 10,
            dailyQuizzes: 3,
            dailyFileUploads: 1,
            maxFileSize: 5, // MB
            voiceMinutes: 10
        },
        credits: {
            daily: 30,
            bonus: 0
        }
    },
    starter: {
        id: 'starter',
        name: 'Starter Plan',
        price: {
            BDT: 299,
            USD: 9.99
        },
        priceId: {
            BDT: 'price_starter_bdt_monthly',
            USD: 'price_starter_usd_monthly'
        },
        interval: 'month',
        features: [
            '45 minutes per day',
            '30 AI conversations per day',
            '10 quiz attempts per day',
            '5 file uploads per day',
            '30 voice minutes per day',
            'No ads',
            'Progress analytics'
        ],
        limits: {
            dailyMinutes: 45,
            dailyConversations: 30,
            dailyQuizzes: 10,
            dailyFileUploads: 5,
            maxFileSize: 25, // MB
            voiceMinutes: 30
        },
        credits: {
            daily: 150,
            bonus: 0
        },
        popular: false
    },
    premium: {
        id: 'premium',
        name: 'Premium Plan',
        price: {
            BDT: 599,
            USD: 19.99
        },
        priceId: {
            BDT: 'price_premium_bdt_monthly',
            USD: 'price_premium_usd_monthly'
        },
        interval: 'month',
        features: [
            '2 hours per day',
            '100 AI conversations per day',
            '30 quiz attempts per day',
            '20 file uploads per day',
            '90 voice minutes per day',
            'No ads',
            '24/7 Priority support',
            'Detailed analytics & reports'
        ],
        limits: {
            dailyMinutes: 120,
            dailyConversations: 100,
            dailyQuizzes: 30,
            dailyFileUploads: 20,
            maxFileSize: 100, // MB
            voiceMinutes: 90
        },
        credits: {
            daily: 500,
            bonus: 0
        },
        popular: true
    },
    pro: {
        id: 'pro',
        name: 'Pro Plan',
        price: {
            BDT: 999,
            USD: 29.99
        },
        priceId: {
            BDT: 'price_pro_bdt_monthly',
            USD: 'price_pro_usd_monthly'
        },
        interval: 'month',
        features: [
            'Unlimited daily usage',
            'Unlimited AI conversations',
            'Unlimited quiz attempts',
            'Unlimited file uploads',
            'Unlimited voice minutes',
            'No ads',
            'Team management',
            'White-label options',
            'Dedicated support',
            'Early access to features'
        ],
        limits: {
            dailyMinutes: -1, // Unlimited
            dailyConversations: -1,
            dailyQuizzes: -1,
            dailyFileUploads: -1,
            maxFileSize: 500, // MB
            voiceMinutes: -1
        },
        credits: {
            daily: 10000,
            bonus: 0
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
        price: {
            BDT: 99,
            USD: 0.99
        },
        bonus: 0,
        priceId: {
            BDT: 'price_credits_100_bdt',
            USD: 'price_credits_100_usd'
        }
    },
    medium: {
        id: 'credits_500',
        name: '500 Credits + 50 Bonus',
        credits: 500,
        price: {
            BDT: 399,
            USD: 3.99
        },
        bonus: 50, // 10% bonus
        priceId: {
            BDT: 'price_credits_500_bdt',
            USD: 'price_credits_500_usd'
        }
    },
    large: {
        id: 'credits_1000',
        name: '1000 Credits + 200 Bonus',
        credits: 1000,
        price: {
            BDT: 699,
            USD: 6.99
        },
        bonus: 200, // 20% bonus
        priceId: {
            BDT: 'price_credits_1000_bdt',
            USD: 'price_credits_1000_usd'
        }
    },
    mega: {
        id: 'credits_5000',
        name: '5000 Credits + 1500 Bonus',
        credits: 5000,
        price: {
            BDT: 2999,
            USD: 29.99
        },
        bonus: 1500, // 30% bonus
        priceId: {
            BDT: 'price_credits_5000_bdt',
            USD: 'price_credits_5000_usd'
        }
    }
};

console.log("✅ Stripe configuration loaded");
