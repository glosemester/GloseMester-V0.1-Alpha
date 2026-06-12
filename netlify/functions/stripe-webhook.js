const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

exports.handler = async function (event, context) {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Verify webhook signature
    const sig = event.headers['stripe-signature'];
    let stripeEvent;

    try {
        stripeEvent = stripe.webhooks.constructEvent(
            event.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    console.log(`Received Stripe webhook: ${stripeEvent.type}`);

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = stripeEvent.data.object;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object;
                await handleSubscriptionCancelled(subscription);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            default:
                console.log(`Unhandled event type: ${stripeEvent.type}`);
        }

        return { statusCode: 200, body: 'Webhook processed' };

    } catch (error) {
        console.error('Error processing webhook:', error);
        return { statusCode: 500, body: error.message };
    }
};

async function handleCheckoutCompleted(session) {
    console.log('Processing checkout.session.completed:', session.id);

    const userId = session.metadata?.userId || session.client_reference_id;
    const plan = session.metadata?.plan;
    const orderId = session.metadata?.orderId;

    if (!userId) {
        console.error('No userId found in session');
        return;
    }

    // Fetch actual subscription period end from Stripe
    const now = new Date();
    let expiryDate = new Date();

    if (session.subscription) {
        try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            expiryDate = new Date(subscription.current_period_end * 1000);
        } catch (err) {
            console.error('Could not fetch subscription, falling back to fixed days:', err.message);
            expiryDate.setDate(now.getDate() + (plan === 'premium_yearly' ? 365 : 30));
        }
    } else {
        expiryDate.setDate(now.getDate() + (plan === 'premium_yearly' ? 365 : 30));
    }

    // Update user subscription in Firestore
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
        // Firestore rules check abonnement.type
        'abonnement.type': 'premium',
        'abonnement.expiresAt': admin.firestore.Timestamp.fromDate(expiryDate),
        // Also keep subscription fields for compatibility
        'subscription.status': 'premium',
        'subscription.plan': plan || 'premium_monthly',
        'subscription.expiresAt': admin.firestore.Timestamp.fromDate(expiryDate),
        'subscription.lastPaymentDate': admin.firestore.Timestamp.fromDate(now),
        'subscription.provider': 'stripe',
        'subscription.stripeCustomerId': session.customer,
        'subscription.stripeSubscriptionId': session.subscription
    });

    console.log(`User ${userId} upgraded to ${plan}`);

    // Update order status if we have orderId
    if (orderId) {
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
            await orderRef.update({
                status: 'PAID',
                stripePaymentStatus: session.payment_status,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    console.log(`SUCCESS! User ${userId} upgraded to ${plan}`);
}

async function handleSubscriptionCancelled(subscription) {
    console.log('Processing subscription cancellation:', subscription.id);

    const userId = subscription.metadata?.userId;

    if (!userId) {
        console.error('No userId found in subscription metadata');
        return;
    }

    const userRef = db.collection('users').doc(userId);

    await userRef.update({
        // Premium gates utelukkende på abonnement.type — den MÅ settes til 'free'
        // for å faktisk fjerne tilgangen (subscription.status leses ikke i appen).
        'abonnement.type': 'free',
        'abonnement.expiresAt': admin.firestore.FieldValue.delete(),
        'subscription.status': 'free',
        'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`User ${userId} subscription cancelled`);
}

async function handleSubscriptionUpdated(subscription) {
    console.log('Processing subscription update:', subscription.id);

    const userId = subscription.metadata?.userId;

    if (!userId) {
        console.log('No userId in metadata, skipping update');
        return;
    }

    // Only act if subscription status changed to cancelled or past_due
    if (subscription.status === 'canceled' || subscription.status === 'past_due') {
        const userRef = db.collection('users').doc(userId);

        const oppdatering = {
            'subscription.status': subscription.status === 'canceled' ? 'free' : 'past_due'
        };
        // 'canceled' fjerner tilgangen umiddelbart. 'past_due' beholder premium
        // gjennom Stripe sin retry-/grace-periode — tilgangen revokeres først når
        // abonnementet faktisk slettes (customer.subscription.deleted).
        if (subscription.status === 'canceled') {
            oppdatering['abonnement.type'] = 'free';
            oppdatering['abonnement.expiresAt'] = admin.firestore.FieldValue.delete();
        }

        await userRef.update(oppdatering);

        console.log(`User ${userId} subscription status: ${subscription.status}`);
    }
}

async function handleInvoicePaymentSucceeded(invoice) {
    console.log('Processing invoice.payment_succeeded:', invoice.id);

    // Only handle subscription renewals (not the initial invoice, which is covered by checkout.session.completed)
    if (invoice.billing_reason !== 'subscription_cycle') {
        console.log(`Skipping invoice with billing_reason: ${invoice.billing_reason}`);
        return;
    }

    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
        console.log('No subscription ID on invoice, skipping');
        return;
    }

    let userId, plan;
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        userId = subscription.metadata?.userId;
        plan = subscription.metadata?.plan;

        if (!userId) {
            console.error('No userId in subscription metadata for renewal');
            return;
        }

        const expiryDate = new Date(subscription.current_period_end * 1000);

        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            'abonnement.type': 'premium',
            'abonnement.expiresAt': admin.firestore.Timestamp.fromDate(expiryDate),
            'subscription.status': 'premium',
            'subscription.expiresAt': admin.firestore.Timestamp.fromDate(expiryDate),
            'subscription.lastPaymentDate': admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Renewed subscription for user ${userId} until ${expiryDate.toISOString()}`);
    } catch (err) {
        console.error('Error handling invoice renewal:', err);
        throw err;
    }
}
