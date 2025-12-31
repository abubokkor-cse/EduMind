

// Handles Stripe payments, subscriptions, and credit system


import {
    STRIPE_PUBLISHABLE_KEY,
    SUBSCRIPTION_PLANS,
    CREDIT_COSTS,
    CREDIT_PACKAGES,
    getUserCurrency
} from '../stripe-config.js';

import { auth, db } from '../firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


// Initialize Stripe

let stripe = null;
let userCurrency = 'USD'; // Default

export async function initStripe() {

    if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
    console.log("✅ Stripe initialized");
    return stripe;
}

// ===========================================
// CURRENCY DETECTION & DISPLAY
// ===========================================

// Detect and set user currency based on profile
export function setUserCurrency(studentProfile) {
    if (!studentProfile) {
        userCurrency = 'USD';
        return;
    }

    // Check country code or country name
    const country = studentProfile.country || studentProfile.countryCode || studentProfile.countryName || '';
    userCurrency = getUserCurrency(country);
    console.log(`💰 Currency set to: ${userCurrency} (Country: ${country})`);
    return userCurrency;
}

// Get current user currency
export function getCurrentCurrency() {
    return userCurrency;
}

// Format price with correct currency symbol
export function formatPrice(amount, currency = null) {
    const curr = currency || userCurrency;
    if (curr === 'BDT') {
        return `৳${amount}`;
    }
    return `$${amount}`;
}

// Get plan price in user's currency
export function getPlanPrice(planId) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return null;

    const price = typeof plan.price === 'object' ? plan.price[userCurrency] : plan.price;
    return {
        amount: price,
        formatted: formatPrice(price),
        currency: userCurrency
    };
}

// Get credit package price in user's currency
export function getPackagePrice(packageId) {
    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) return null;

    const price = typeof pkg.price === 'object' ? pkg.price[userCurrency] : pkg.price;
    return {
        amount: price,
        formatted: formatPrice(price),
        currency: userCurrency,
        credits: pkg.credits + (pkg.bonus || 0)
    };
}



// Get user's current subscription status
export async function getUserSubscription(userId) {
    if (!userId) {

        const localSub = localStorage.getItem('edumind_subscription');
        if (localSub) {
            return JSON.parse(localSub);
        }
        return getDefaultSubscription();
    }

    try {
        const subRef = doc(db, 'subscriptions', userId);
        const subDoc = await getDoc(subRef);

        if (subDoc.exists()) {
            return subDoc.data();
        } else {

            const defaultSub = getDefaultSubscription();
            await setDoc(subRef, defaultSub);
            return defaultSub;
        }
    } catch (error) {
        console.error("Error getting subscription:", error);
        return getDefaultSubscription();
    }
}

// Get default free subscription
function getDefaultSubscription() {
    const now = new Date();
    return {
        planId: 'free',
        planName: 'Free Plan',
        status: 'active',
        credits: SUBSCRIPTION_PLANS.free.credits.daily,
        totalCreditsUsed: 0,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: null,
        lastCreditReset: now.toISOString(),
        dailyUsage: {
            conversations: 0,
            quizzes: 0,
            fileUploads: 0,
            voiceMinutes: 0,
            lastReset: now.toDateString()
        }
    };
}


export async function getUserCredits(userId) {
    const subscription = await getUserSubscription(userId);
    return {
        available: subscription.credits || 0,
        totalUsed: subscription.totalCreditsUsed || 0,
        plan: subscription.planId
    };
}


export async function deductCredits(userId, action, amount = null) {
    const cost = amount || CREDIT_COSTS[action] || 0;

    if (cost === 0) return { success: true, remaining: null };

    const subscription = await getUserSubscription(userId);
    const plan = SUBSCRIPTION_PLANS[subscription.planId];

    // Check if action is unlimited for this plan
    const limits = plan?.limits || {};
    if (action === 'aiConversation' && limits.dailyConversations === -1) {
        return { success: true, unlimited: true };
    }
    if (action === 'quizAttempt' && limits.dailyQuizzes === -1) {
        return { success: true, unlimited: true };
    }


    const today = new Date().toDateString();
    let dailyUsage = subscription.dailyUsage || {};

    if (dailyUsage.lastReset !== today) {

        dailyUsage = {
            conversations: 0,
            quizzes: 0,
            fileUploads: 0,
            voiceMinutes: 0,
            lastReset: today
        };

        // Also reset daily credits
        subscription.credits = plan.credits.daily;
    }


    if (subscription.credits < cost) {
        return {
            success: false,
            error: 'insufficient_credits',
            required: cost,
            available: subscription.credits
        };
    }


    if (action === 'aiConversation' && limits.dailyConversations > 0) {
        if (dailyUsage.conversations >= limits.dailyConversations) {
            return {
                success: false,
                error: 'daily_limit_reached',
                limit: limits.dailyConversations
            };
        }
        dailyUsage.conversations++;
    }

    if (action === 'quizAttempt' && limits.dailyQuizzes > 0) {
        if (dailyUsage.quizzes >= limits.dailyQuizzes) {
            return {
                success: false,
                error: 'daily_limit_reached',
                limit: limits.dailyQuizzes
            };
        }
        dailyUsage.quizzes++;
    }

    // Deduct credits
    const newCredits = subscription.credits - cost;
    const newTotalUsed = (subscription.totalCreditsUsed || 0) + cost;

    if (userId) {
        try {
            const subRef = doc(db, 'subscriptions', userId);
            await updateDoc(subRef, {
                credits: newCredits,
                totalCreditsUsed: newTotalUsed,
                dailyUsage: dailyUsage,
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating credits:", error);
        }
    } else {

        subscription.credits = newCredits;
        subscription.totalCreditsUsed = newTotalUsed;
        subscription.dailyUsage = dailyUsage;
        localStorage.setItem('edumind_subscription', JSON.stringify(subscription));
    }

    return {
        success: true,
        deducted: cost,
        remaining: newCredits
    };
}


export async function addCredits(userId, amount, reason = 'purchase') {
    if (userId) {
        try {
            const subRef = doc(db, 'subscriptions', userId);
            await updateDoc(subRef, {
                credits: increment(amount),
                lastUpdated: serverTimestamp()
            });

            // Log credit transaction
            const transRef = doc(db, 'creditTransactions', `${userId}_${Date.now()}`);
            await setDoc(transRef, {
                userId,
                amount,
                reason,
                timestamp: serverTimestamp()
            });

            return { success: true, added: amount };
        } catch (error) {
            console.error("Error adding credits:", error);
            return { success: false, error: error.message };
        }
    } else {
        const subscription = JSON.parse(localStorage.getItem('edumind_subscription') || '{}');
        subscription.credits = (subscription.credits || 0) + amount;
        localStorage.setItem('edumind_subscription', JSON.stringify(subscription));
        return { success: true, added: amount };
    }
}



// ===========================================


export async function createCheckoutSession(planId, userId) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || !plan.priceId) {
        throw new Error('Invalid plan or price not configured');
    }


    // In production, you'd create a checkout session on your server

    const paymentData = {
        planId,
        planName: plan.name,
        price: plan.price,
        userId,
        timestamp: Date.now()
    };


    localStorage.setItem('pending_payment', JSON.stringify(paymentData));


    return {
        sessionId: `demo_session_${Date.now()}`,
        url: null, // Would be Stripe checkout URL in production
        isDemo: true
    };
}


export async function upgradeSubscription(userId, newPlanId) {
    const plan = SUBSCRIPTION_PLANS[newPlanId];
    if (!plan) {
        throw new Error('Invalid plan');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscriptionData = {
        planId: newPlanId,
        planName: plan.name,
        status: 'active',
        credits: plan.credits.daily + plan.credits.bonus,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: endDate.toISOString(),
        lastCreditReset: now.toISOString(),
        dailyUsage: {
            conversations: 0,
            quizzes: 0,
            fileUploads: 0,
            voiceMinutes: 0,
            lastReset: now.toDateString()
        },
        updatedAt: serverTimestamp()
    };

    if (userId) {
        try {
            const subRef = doc(db, 'subscriptions', userId);
            await setDoc(subRef, subscriptionData, { merge: true });
            return { success: true, subscription: subscriptionData };
        } catch (error) {
            console.error("Error upgrading subscription:", error);
            return { success: false, error: error.message };
        }
    } else {
        localStorage.setItem('edumind_subscription', JSON.stringify(subscriptionData));
        return { success: true, subscription: subscriptionData };
    }
}


export async function purchaseCredits(packageId, userId) {
    const creditPackage = CREDIT_PACKAGES[packageId];
    if (!creditPackage) {
        throw new Error('Invalid credit package');
    }

    const totalCredits = creditPackage.credits + (creditPackage.bonus || 0);

    // For demo, add credits directly
    const result = await addCredits(userId, totalCredits, `purchase_${packageId}`);

    if (result.success) {

        if (userId) {
            const purchaseRef = doc(db, 'purchases', `${userId}_${Date.now()}`);
            await setDoc(purchaseRef, {
                userId,
                packageId,
                credits: totalCredits,
                price: creditPackage.price,
                timestamp: serverTimestamp()
            });
        }
    }

    return result;
}


// UI Functions

// Helper to get price value for a plan
function getPlanPriceValue(plan) {
    if (typeof plan.price === 'object') {
        return plan.price[userCurrency] || plan.price.USD;
    }
    return plan.price;
}

// Helper to get currency symbol
function getCurrencySymbol() {
    return userCurrency === 'BDT' ? '৳' : '$';
}

// Helper to get package price value
function getPackagePriceValue(pkg) {
    if (typeof pkg.price === 'object') {
        return pkg.price[userCurrency] || pkg.price.USD;
    }
    return pkg.price;
}

export function showSubscriptionPlans() {
    const existingModal = document.getElementById('subscription-modal');
    if (existingModal) {
        existingModal.classList.remove('hidden');
        return;
    }

    const currencySymbol = getCurrencySymbol();

    const modal = document.createElement('div');
    modal.id = 'subscription-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="subscription-modal-content">
            <div class="modal-header">
                <h2>📚 Choose Your Learning Plan</h2>
                <button class="close-modal-btn" onclick="document.getElementById('subscription-modal').classList.add('hidden')">×</button>
            </div>
            <div class="plans-container">
                ${Object.values(SUBSCRIPTION_PLANS).map(plan => {
        const priceValue = getPlanPriceValue(plan);
        return `
                    <div class="plan-card ${plan.popular ? 'popular' : ''}" data-plan-id="${plan.id}">
                        ${plan.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
                        <h3>${plan.name}</h3>
                        <div class="plan-price">
                            ${priceValue === 0 ? '<span class="price">Free</span>' : `
                                <span class="currency">${currencySymbol}</span>
                                <span class="price">${priceValue}</span>
                                <span class="interval">/month</span>
                            `}
                        </div>
                        <div class="plan-credits">
                            <span class="credit-amount">${plan.credits.daily}</span> credits/day
                            ${plan.credits.bonus > 0 ? `<span class="bonus">+${plan.credits.bonus} bonus</span>` : ''}
                        </div>
                        <ul class="plan-features">
                            ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
                        </ul>
                        <button class="select-plan-btn ${plan.id === 'free' ? 'current' : ''}" 
                                data-plan="${plan.id}"
                                ${plan.id === 'free' ? 'disabled' : ''}>
                            ${plan.id === 'free' ? 'Current Plan' : 'Select Plan'}
                        </button>
                    </div>
                `}).join('')}
            </div>
            <div class="credit-packages-section">
                <h3>💎 Need More Credits?</h3>
                <div class="credit-packages">
                    ${Object.values(CREDIT_PACKAGES).map(pkg => {
            const pkgPrice = getPackagePriceValue(pkg);
            return `
                        <div class="credit-package" data-package-id="${pkg.id}">
                            <span class="package-credits">${pkg.credits}</span>
                            <span class="package-name">${pkg.name}</span>
                            ${pkg.bonus ? `<span class="package-bonus">+${pkg.bonus} bonus!</span>` : ''}
                            <span class="package-price">${currencySymbol}${pkgPrice}</span>
                            <button class="buy-credits-btn" data-package="${pkg.id}">Buy</button>
                        </div>
                    `}).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelectorAll('.select-plan-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async () => {
            const planId = btn.dataset.plan;
            await handlePlanSelection(planId);
        });
    });

    modal.querySelectorAll('.buy-credits-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const packageId = btn.dataset.package;
            await handleCreditPurchase(packageId);
        });
    });
}


async function handlePlanSelection(planId) {
    const plan = SUBSCRIPTION_PLANS[planId];
    const priceValue = getPlanPriceValue(plan);
    showStripePaymentModal('subscription', planId, priceValue, plan.name);
}


async function handleCreditPurchase(packageId) {
    const pkg = CREDIT_PACKAGES[packageId];
    const totalCredits = pkg.credits + (pkg.bonus || 0);
    const pkgPrice = getPackagePriceValue(pkg);
    showStripePaymentModal('credits', packageId, pkgPrice, `${pkg.name}${pkg.bonus ? ` (+${pkg.bonus} bonus)` : ''}`);
}

// Show Stripe Payment Modal
async function showStripePaymentModal(type, itemId, price, itemName) {

    const existingPayment = document.getElementById('stripe-payment-modal');
    if (existingPayment) existingPayment.remove();

    const user = auth.currentUser;
    const userEmail = user?.email || '';
    const currencySymbol = getCurrencySymbol();

    const modal = document.createElement('div');
    modal.id = 'stripe-payment-modal';
    modal.className = 'stripe-payment-overlay';
    modal.innerHTML = `
        <div class="stripe-payment-content">
            <div class="payment-header">
                <h2>💳 Complete Payment</h2>
                <button class="close-payment-btn" id="close-stripe-payment">×</button>
            </div>
            
            <div class="payment-summary">
                <div class="payment-item">
                    <span class="item-name">${itemName}</span>
                    <span class="item-price">${currencySymbol}${typeof price === 'number' ? price.toFixed(2) : price}</span>
                </div>
                ${type === 'subscription' ? '<p class="recurring-note">Billed monthly • Cancel anytime</p>' : ''}
            </div>

            <form id="stripe-payment-form">
                <div class="form-group">
                    <label for="payment-email">Email</label>
                    <input type="email" id="payment-email" value="${userEmail}" required placeholder="your@email.com">
                </div>
                
                <div class="form-group">
                    <label for="cardholder-name">Cardholder Name</label>
                    <input type="text" id="cardholder-name" required placeholder="John Doe">
                </div>

                <div class="form-group">
                    <label>Card Details</label>
                    <div id="card-element" class="stripe-card-element">
                        <!-- Stripe Card Element will be mounted here -->
                    </div>
                    <div id="card-errors" class="card-errors" role="alert"></div>
                </div>

                <button type="submit" id="submit-payment" class="submit-payment-btn">
                    <span id="button-text">Pay ${currencySymbol}${typeof price === 'number' ? price.toFixed(2) : price}</span>
                    <span id="spinner" class="spinner hidden"></span>
                </button>
            </form>

            <div class="payment-footer">
                <p>🔒 Secured by <strong>Stripe</strong></p>
                <div class="payment-badges">
                    <span>💳 Visa</span>
                    <span>💳 Mastercard</span>
                    <span>💳 Amex</span>
                </div>
            </div>

            <div id="payment-success" class="payment-success hidden">
                <div class="success-icon">✅</div>
                <h3>Payment Successful!</h3>
                <p id="success-message">Your ${type === 'subscription' ? 'subscription' : 'credits'} have been activated.</p>
                <button id="close-success" class="btn-primary">Continue</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);


    await initStripeElements(type, itemId, price, itemName);

    // Close button handler
    document.getElementById('close-stripe-payment').addEventListener('click', () => {
        modal.remove();
    });


    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


async function initStripeElements(type, itemId, price, itemName) {
    if (!stripe) {
        await initStripe();
    }

    const elements = stripe.elements();

    // Create card element with custom styling
    const style = {
        base: {
            color: '#ffffff',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)'
            }
        },
        invalid: {
            color: '#ff6b6b',
            iconColor: '#ff6b6b'
        }
    };

    const cardElement = elements.create('card', { style });
    cardElement.mount('#card-element');


    cardElement.on('change', (event) => {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });


    const form = document.getElementById('stripe-payment-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitBtn = document.getElementById('submit-payment');
        const buttonText = document.getElementById('button-text');
        const spinner = document.getElementById('spinner');

        // Disable button and show spinner
        submitBtn.disabled = true;
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');

        const email = document.getElementById('payment-email').value;
        const name = document.getElementById('cardholder-name').value;

        try {

            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: name,
                    email: email
                }
            });

            if (error) {
                throw error;
            }

            console.log('✅ Payment method created:', paymentMethod.id);


            // In production, you'd send paymentMethod.id to your server to create a subscription/charge
            await processTestPayment(type, itemId, paymentMethod.id, email);

        } catch (error) {
            console.error('Payment error:', error);
            document.getElementById('card-errors').textContent = error.message || 'Payment failed. Please try again.';
            submitBtn.disabled = false;
            buttonText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    });
}


async function processTestPayment(type, itemId, paymentMethodId, email) {
    const user = auth.currentUser;
    const userId = user?.uid || null;


    await new Promise(resolve => setTimeout(resolve, 1500));

    let result;
    if (type === 'subscription') {
        result = await upgradeSubscription(userId, itemId);
    } else {
        result = await purchaseCredits(itemId, userId);
    }

    if (result.success) {
        // Show success state
        document.getElementById('stripe-payment-form').classList.add('hidden');
        document.getElementById('payment-success').classList.remove('hidden');


        updateCreditsDisplay();


        document.getElementById('close-success').addEventListener('click', () => {
            document.getElementById('stripe-payment-modal').remove();
            document.getElementById('subscription-modal')?.classList.add('hidden');
        });

        // Log the transaction
        if (userId) {
            const transactionRef = doc(db, 'transactions', `${userId}_${Date.now()}`);
            await setDoc(transactionRef, {
                userId,
                type,
                itemId,
                paymentMethodId,
                email,
                status: 'completed',
                timestamp: serverTimestamp()
            });
        }
    } else {
        throw new Error(result.error || 'Payment processing failed');
    }
}


export function createCreditsDisplay() {
    return document.getElementById('progress-widget');
}


export async function updateCreditsDisplay() {
    const user = auth.currentUser;
    const userId = user?.uid || null;

    const credits = await getUserCredits(userId);

    // Update progress widget in header
    const progressWidget = document.getElementById('progress-widget');
    if (progressWidget) {
        let topicsLearned = 0;
        let totalProgress = 0;

        try {
            const studentProfile = localStorage.getItem('edumind_student_profile');
            if (studentProfile) {
                const profile = JSON.parse(studentProfile);
                topicsLearned = profile.topicsLearned || profile.subjects?.length || 0;
                totalProgress = Math.min(100, topicsLearned * 10);
            }
        } catch (e) { }

        const progressFill = progressWidget.querySelector('.progress-fill');
        const progressStats = progressWidget.querySelector('.progress-stats');

        if (progressFill) progressFill.style.width = `${totalProgress}%`;
        if (progressStats) progressStats.textContent = `${topicsLearned} topics`;
    }


    const creditsBtnText = document.getElementById('credits-btn-text');
    if (creditsBtnText) {
        creditsBtnText.textContent = credits.available === -1 ? '∞' : credits.available;
    }
}


// Usage Tracking



export async function canPerformAction(action) {
    const user = auth.currentUser;
    const userId = user?.uid || null;

    const subscription = await getUserSubscription(userId);
    const plan = SUBSCRIPTION_PLANS[subscription.planId];
    const limits = plan?.limits || {};
    const cost = CREDIT_COSTS[action] || 0;

    // Check if unlimited
    if (action === 'aiConversation' && limits.dailyConversations === -1) {
        return { allowed: true, unlimited: true };
    }
    if (action === 'quizAttempt' && limits.dailyQuizzes === -1) {
        return { allowed: true, unlimited: true };
    }


    if (subscription.credits < cost) {
        return {
            allowed: false,
            reason: 'insufficient_credits',
            required: cost,
            available: subscription.credits,
            upgradeNeeded: true
        };
    }


    const today = new Date().toDateString();
    const dailyUsage = subscription.dailyUsage || {};

    if (dailyUsage.lastReset !== today) {
        return { allowed: true, cost };
    }

    if (action === 'aiConversation' && limits.dailyConversations > 0) {
        if ((dailyUsage.conversations || 0) >= limits.dailyConversations) {
            return {
                allowed: false,
                reason: 'daily_limit',
                limit: limits.dailyConversations,
                used: dailyUsage.conversations,
                upgradeNeeded: true
            };
        }
    }

    if (action === 'quizAttempt' && limits.dailyQuizzes > 0) {
        if ((dailyUsage.quizzes || 0) >= limits.dailyQuizzes) {
            return {
                allowed: false,
                reason: 'daily_limit',
                limit: limits.dailyQuizzes,
                used: dailyUsage.quizzes,
                upgradeNeeded: true
            };
        }
    }

    return { allowed: true, cost };
}

// Show upgrade prompt
export function showUpgradePrompt(reason) {
    const messages = {
        insufficient_credits: "You've run out of credits! Upgrade your plan or purchase more credits to continue learning.",
        daily_limit: "You've reached your daily limit! Upgrade to Premium for unlimited access."
    };

    const modal = document.createElement('div');
    modal.className = 'upgrade-prompt-overlay';
    modal.innerHTML = `
        <div class="upgrade-prompt">
            <div class="upgrade-icon">⚡</div>
            <h3>Need More Access?</h3>
            <p>${messages[reason] || 'Upgrade to continue using EduMind.'}</p>
            <div class="upgrade-actions">
                <button class="btn-upgrade" onclick="this.closest('.upgrade-prompt-overlay').remove(); window.showSubscriptionPlans();">
                    View Plans
                </button>
                <button class="btn-later" onclick="this.closest('.upgrade-prompt-overlay').remove();">
                    Maybe Later
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}


window.showSubscriptionPlans = showSubscriptionPlans;


// Initialize on Load

export async function initPayments() {
    try {
        await initStripe();


        const header = document.querySelector('.glass-header') || document.querySelector('header');
        if (header) {
            const creditsDisplay = createCreditsDisplay();
            // Insert before header-actions or at end
            const headerContent = header.querySelector('.header-content') || header;
            headerContent.appendChild(creditsDisplay);
        }


        await updateCreditsDisplay();

        console.log("✅ Payment system initialized");
        return true;
    } catch (error) {
        console.error("Error initializing payments:", error);
        return false;
    }
}


export { CREDIT_COSTS };

console.log("✅ Payment module loaded");
