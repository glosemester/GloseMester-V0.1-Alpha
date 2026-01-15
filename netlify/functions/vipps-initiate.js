const admin = require('firebase-admin');

// 1. Koble til Firebase (Databasen vår)
// Vi sjekker om vi allerede er koblet til for å unngå kræsj ved flere kjøp
if (!admin.apps.length) {
    // Vi henter den hemmelige nøkkelen fra Netlify-innstillingene
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// En liten hjelper for å lage unike ordrenummer (f.eks: a4f2-9bc1...)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.handler = async function(event, context) {
    // Sikkerhetssjekk: Vi godtar kun POST-meldinger (data sendt fra knappen)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Les dataene som kommer fra nettsiden (hvem kjøper hva?)
        const data = JSON.parse(event.body);
        const { plan, userId, userEmail } = data;

        // Sjekk at vi har det vi trenger
        if (!userId || !plan) {
            console.error("Mangler userId eller plan:", data);
            return { statusCode: 400, body: JSON.stringify({ error: 'Mangler bruker-ID eller plan.' }) };
        }

        // 3. Bestem pris og tekst basert på valgt pakke
        let amount = 0;       // Pris i ØRE (Vipps tenker i øre)
        let description = ""; // Teksten kunden ser i Vipps

        if (plan === 'premium_monthly') {
            amount = 9900; // 99 kroner
            description = "GloseMester Premium - Månedlig";
        } else if (plan === 'premium_yearly') {
            amount = 80000; // 800 kroner
            description = "GloseMester Premium - Årlig";
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Ugyldig abonnement valgt.' }) };
        }

        // 4. Logg inn hos Vipps (Hent Access Token)
        // Vi bruker test-miljøet (apitest.vipps.no)
        console.log("Kobler til Vipps...");
        const authResponse = await fetch("https://apitest.vipps.no/accessToken/get", {
            method: 'POST',
            headers: {
                'client_id': process.env.VIPPS_CLIENT_ID,
                'client_secret': process.env.VIPPS_CLIENT_SECRET,
                'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY,
                'Merchant-Serial-Number': process.env.VIPPS_MERCHANT_SERIAL
            }
        });

        const authData = await authResponse.json();
        
        if (!authResponse.ok) {
            console.error("Vipps innlogging feilet:", authData);
            throw new Error("Kunne ikke koble til betalingsløsningen.");
        }

        const accessToken = authData.access_token;
        const orderId = generateUUID(); // Lag et unikt nummer for denne handelen

        // 5. Opprett selve betalingen hos Vipps
        console.log(`Oppretter ordre ${orderId} på ${amount/100} kr.`);

        const paymentPayload = {
            customerInfo: {}, // Vi lar Vipps spørre om nummeret
            merchantInfo: {
                merchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL,
                // Hit sender Vipps nettleseren tilbake etter betaling:
                fallBack: `${process.env.BASE_URL}/oppgrader.html?status=success&orderId=${orderId}`,
                // Hit roper Vipps i bakgrunnen for å bekrefte kjøpet (viktig!):
                callbackPrefix: `${process.env.BASE_URL}/.netlify/functions/vipps-webhook`,
                isApp: false // Vi er en nettside
            },
            transaction: {
                amount: amount,
                orderId: orderId,
                transactionText: description,
                currency: "NOK",
                useExplicitCheckoutFlow: true // Gir best flyt på mobil
            }
        };

        const paymentResponse = await fetch("https://apitest.vipps.no/ecomm/v2/payments", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentPayload)
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
            console.error("Vipps nektet betalingen:", paymentData);
            throw new Error("Kunne ikke starte betalingen hos Vipps.");
        }

        // 6. Lagre bestillingen i din database (Firestore)
        // Vi setter status til 'INITIATED'. Vi endrer den til 'PAID' når pengene faktisk kommer.
        await db.collection('orders').doc(orderId).set({
            userId: userId,
            userEmail: userEmail || "Ukjent",
            plan: plan,
            amount: amount,
            status: 'INITIATED', // Venter på betaling
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            vippsOrderId: orderId,
            environment: 'TEST'
        });

        // 7. Suksess! Send Vipps-lenken tilbake til nettleseren
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                vippsUrl: paymentData.url, // Her skal brukeren sendes
                orderId: orderId 
            })
        };

    } catch (error) {
        console.error("Kritisk feil i vipps-initiate:", error);
        return {
            statusCode: 500, // Serverfeil
            body: JSON.stringify({ error: error.message })
        };
    }
};