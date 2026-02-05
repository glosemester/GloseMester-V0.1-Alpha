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

// Generate unique order ID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.handler = async function (event, context) {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: ''
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { plan, userId, userEmail } = data;

        // Validate required fields
        if (!userId || !plan) {
            console.error("Missing userId or plan:", data);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Mangler bruker-ID eller plan.' })
            };
        }

        // Determine price based on plan
        let priceId, amount, description;

        if (plan === 'premium_monthly') {
            priceId = process.env.STRIPE_PRICE_MONTHLY;
            amount = 9900; // 99 NOK in øre
            description = "GloseMester Premium - Månedlig";
        } else if (plan === 'premium_yearly') {
            priceId = process.env.STRIPE_PRICE_YEARLY;
            amount = 80000; // 800 NOK in øre
            description = "GloseMester Premium - Årlig";
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Ugyldig abonnement valgt.' })
            };
        }

        const orderId = generateUUID();
        console.log(`Creating Stripe checkout for order ${orderId}, plan: ${plan}`);

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.BASE_URL}/oppgrader.html?status=success&orderId=${orderId}`,
            cancel_url: `${process.env.BASE_URL}/oppgrader.html?status=cancelled`,
            customer_email: userEmail || undefined,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                plan: plan,
                orderId: orderId
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    plan: plan,
                    orderId: orderId
                }
            }
        });

        // Save order to Firestore
        await db.collection('orders').doc(orderId).set({
            userId: userId,
            userEmail: userEmail || "Ukjent",
            plan: plan,
            amount: amount,
            status: 'INITIATED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            stripeSessionId: session.id,
            provider: 'stripe'
        });

        console.log(`Stripe session created: ${session.id}`);

        // Return checkout URL
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: session.url,
                orderId: orderId
            })
        };

    } catch (error) {
        console.error("Error in stripe-checkout:", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
