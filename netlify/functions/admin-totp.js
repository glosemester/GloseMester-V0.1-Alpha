const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}
const db = admin.firestore();
const adminAuth = admin.auth();

// ── Pure-Node TOTP (RFC 6238 / HOTP RFC 4226) — no npm deps ──

function base32Decode(base32) {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const str = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
    let bits = 0, value = 0;
    const out = [];
    for (const ch of str) {
        const idx = alpha.indexOf(ch);
        if (idx === -1) continue;
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
    }
    return Buffer.from(out);
}

function hotp(secret, counter) {
    const key = base32Decode(secret);
    const msg = Buffer.alloc(8);
    msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    msg.writeUInt32BE(counter >>> 0, 4);
    const hmac = crypto.createHmac('sha1', key).update(msg).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) |
                 (hmac[offset + 2] << 8) | hmac[offset + 3];
    return String(code % 1000000).padStart(6, '0');
}

function verifyTotp(token, secret) {
    const T = Math.floor(Date.now() / 1000 / 30);
    const t = String(token).padStart(6, '0');
    // Allow ±1 step for clock skew
    return hotp(secret, T - 1) === t || hotp(secret, T) === t || hotp(secret, T + 1) === t;
}

function generateSecret() {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = crypto.randomBytes(20);
    let result = '', buf = 0, left = 0;
    for (const byte of bytes) {
        buf = (buf << 8) | byte; left += 8;
        while (left >= 5) { result += alpha[(buf >>> (left - 5)) & 31]; left -= 5; }
    }
    return result;
}

// ─────────────────────────────────────────────

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': 'https://glosemester.no',
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

        const decoded = await adminAuth.verifyIdToken(idToken);
        const uid = decoded.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists || userDoc.data().rolle !== 'admin') {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Ikke autorisert — krever admin-rolle' }) };
        }

        if (action === 'setup') {
            const secret = generateSecret();
            const email = decoded.email || uid;
            const otpauthUrl = `otpauth://totp/GloseMester%20Admin:${encodeURIComponent(email)}?secret=${secret}&issuer=GloseMester%20Admin&algorithm=SHA1&digits=6&period=30`;

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
            const valid = verifyTotp(token, secret);
            return { statusCode: 200, headers, body: JSON.stringify({ valid }) };
        }

        if (action === 'reset') {
            await userRef.update({ totp_secret: admin.firestore.FieldValue.delete() });
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ukjent action: ' + action }) };

    } catch (err) {
        console.error('admin-totp error:', err.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
