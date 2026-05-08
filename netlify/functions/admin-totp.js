const admin = require('firebase-admin');
const { authenticator } = require('otplib');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}
const db = admin.firestore();
const adminAuth = admin.auth();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { action, idToken, token } = JSON.parse(event.body || '{}');
        if (!idToken) throw new Error('Missing idToken');

        // Verify Firebase ID token
        const decoded = await adminAuth.verifyIdToken(idToken);
        const uid = decoded.uid;

        // Check admin role in Firestore
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists || userDoc.data().rolle !== 'admin') {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Ikke autorisert — krever admin-rolle' }) };
        }

        if (action === 'setup') {
            const secret = authenticator.generateSecret();
            const email = decoded.email || uid;
            const otpauthUrl = authenticator.keyuri(email, 'GloseMester Admin', secret);

            await userRef.update({
                totp_secret: secret,
                totp_setup_at: admin.firestore.FieldValue.serverTimestamp()
            });

            return { statusCode: 200, headers, body: JSON.stringify({ otpauthUrl, secret }) };
        }

        if (action === 'verify') {
            if (!token) throw new Error('Missing token');

            const { totp_secret: secret } = userDoc.data();
            if (!secret) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'TOTP ikke satt opp for denne brukeren' }) };
            }

            const isValid = authenticator.verify({ token: String(token), secret });
            return { statusCode: 200, headers, body: JSON.stringify({ valid: isValid }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ukjent action: ' + action }) };

    } catch (err) {
        console.error('admin-totp error:', err.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
