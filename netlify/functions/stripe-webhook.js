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

    // Calculate expiry date
    const now = new Date();
    let expiryDate = new Date();

    if (plan === 'premium_monthly') {
        expiryDate.setDate(now.getDate() + 30);
    } else if (plan === 'premium_yearly') {
        expiryDate.setDate(now.getDate() + 365);
    } else {
        // Default to 30 days if plan is unknown
        expiryDate.setDate(now.getDate() + 30);
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

        await userRef.update({
            'subscription.status': subscription.status === 'canceled' ? 'free' : 'past_due'
        });

        console.log(`User ${userId} subscription status: ${subscription.status}`);
    }
}
