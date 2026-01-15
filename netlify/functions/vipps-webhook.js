const admin = require('firebase-admin');

// 1. Koble til Firebase (samme rutine som før)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

exports.handler = async function(event, context) {
    // Vipps sender data via POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        console.log("Mottok webhook fra Vipps:", JSON.stringify(data));

        // 2. Hent ut viktig info fra beskjeden til Vipps
        const orderId = data.orderId;
        const transactionInfo = data.transactionInfo;
        
        // Vi trenger status for å vite om pengene er sikret
        // RESERVED = Pengene er reservert på kortet (Godt nok for oss)
        // SALE = Pengene er trukket (Også bra)
        const status = transactionInfo ? transactionInfo.status : 'UNKNOWN';

        if (status !== 'RESERVED' && status !== 'SALE') {
            console.log(`Ordre ${orderId} har status ${status}. Vi gjør ingenting ennå.`);
            // Vi svarer 200 OK til Vipps uansett, ellers fortsetter de å mase
            return { statusCode: 200, body: 'OK, men ikke betalt ennå' };
        }

        // 3. Finn ordren i vår database
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            console.error(`Fant ikke ordre med ID: ${orderId}`);
            return { statusCode: 200, body: 'Order not found' };
        }

        const orderData = orderDoc.data();

        // Sjekk om vi allerede har behandlet denne (så vi ikke gir dobbel tid)
        if (orderData.status === 'PAID') {
            console.log("Ordren er allerede behandlet.");
            return { statusCode: 200, body: 'Already processed' };
        }

        // 4. Beregn ny utløpsdato for abonnementet
        const now = new Date();
        let expiryDate = new Date();

        if (orderData.plan === 'premium_monthly') {
            expiryDate.setDate(now.getDate() + 30); // Legg til 30 dager
        } else if (orderData.plan === 'premium_yearly') {
            expiryDate.setDate(now.getDate() + 365); // Legg til 1 år
        }

        // 5. OPPDATER BRUKEREN (Gi dem Premium!)
        const userRef = db.collection('users').doc(orderData.userId);
        
        await userRef.update({
            'subscription.status': 'premium',
            'subscription.plan': orderData.plan,
            'subscription.expiresAt': admin.firestore.Timestamp.fromDate(expiryDate),
            'subscription.lastPaymentDate': admin.firestore.Timestamp.fromDate(now),
            'subscription.provider': 'vipps'
        });

        // 6. Oppdater ordren til PAID i loggen vår
        await orderRef.update({
            status: 'PAID',
            vippsStatus: status,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`SUKSESS! Bruker ${orderData.userId} er oppgradert til ${orderData.plan}.`);

        // Svar Vipps at alt gikk bra
        return { statusCode: 200, body: 'Ordre behandlet' };

    } catch (error) {
        console.error("Feil i vipps-webhook:", error);
        // Viktig: Vi svarer 500 her slik at Vipps prøver igjen senere hvis databasen vår var nede
        return { statusCode: 500, body: error.message };
    }
};