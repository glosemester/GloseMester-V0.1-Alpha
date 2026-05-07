const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}
const db = admin.firestore();

const FEIDE_CLIENT_ID = "82131d17-cccd-48da-8397-4e9d70434d4d";
const FEIDE_CLIENT_SECRET = process.env.FEIDE_CLIENT_SECRET;
const FEIDE_AUTHORIZE_URL = "https://auth.dataporten.no/oauth/authorize";
const FEIDE_TOKEN_URL = "https://auth.dataporten.no/oauth/token";
const FEIDE_USERINFO_URL = "https://auth.dataporten.no/openid/userinfo";
const FEIDE_GROUPS_URL = "https://groups-api.dataporten.no/groups/me/groups";

// Must match exactly what is registered in Feide-portalen
const CALLBACK_URI = "https://glosemester.no/.netlify/functions/feide-auth";

function erLaerer(userinfo, groupsData = null) {
    const primaryAffiliation = userinfo.eduPersonPrimaryAffiliation ||
                               userinfo['https://n.feide.no/claims/eduPersonPrimaryAffiliation'];

    if (primaryAffiliation) {
        const aff = primaryAffiliation.toLowerCase();
        if (aff === 'employee' || aff === 'faculty' || aff === 'staff') return true;
        if (aff === 'student' || aff === 'pupil') return false;
    }

    if (groupsData && Array.isArray(groupsData)) {
        for (const group of groupsData) {
            const aff = ((group.membership || {}).primaryAffiliation || (group.membership || {}).basic || '').toLowerCase();
            if (aff === 'employee' || aff === 'faculty' || aff === 'staff') return true;
            if (aff === 'student' || aff === 'pupil') return false;
        }
    }

    const principalName = (userinfo.eduPersonPrincipalName ||
                           userinfo['https://n.feide.no/claims/eduPersonPrincipalName'] || '').toLowerCase();
    const email = (userinfo.email || '').toLowerCase();

    if (['teacher', 'ansatt', 'tilsatt', 'laerer', 'lærer', 'admin'].some(w => principalName.includes(w) || email.includes(w))) return true;
    if (['student', 'elev', 'pupil'].some(w => principalName.includes(w) || email.includes(w))) return false;

    // Default: block unknown roles
    return false;
}

async function exchangeCodeForToken(code) {
    const tokenRes = await axios.post(FEIDE_TOKEN_URL, new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URI,
        client_id: FEIDE_CLIENT_ID,
        client_secret: FEIDE_CLIENT_SECRET
    }));
    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(FEIDE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const feideUser = userRes.data;

    let groupsData = null;
    try {
        const groupsRes = await axios.get(FEIDE_GROUPS_URL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        groupsData = groupsRes.data;
    } catch {}

    let feideId = feideUser.sub;
    if (!feideId && feideUser.userid) {
        feideId = Array.isArray(feideUser.userid) ? feideUser.userid[0] : feideUser.userid;
    }
    const uid = `feide_${feideId}`;

    if (!erLaerer(feideUser, groupsData)) {
        const err = new Error('Kun for lærere');
        err.code = 'STUDENT_BLOCKED';
        throw err;
    }

    await db.collection('users').doc(uid).set({
        uid,
        displayName: feideUser.name,
        email: feideUser.email || '',
        feide_id: feideId,
        kilde: 'feide',
        rolle: 'laerer',
        abonnement: { type: 'free' },
        siste_innlogging: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const token = await admin.auth().createCustomToken(uid, { rolle: 'laerer', feide_id: feideId });
    return { token, user: feideUser };
}

exports.handler = async (event) => {
    const params = event.queryStringParameters || {};

    // ── GET (no code): kick off OAuth → redirect browser to Feide ──
    if (event.httpMethod === 'GET' && !params.code && !params.error) {
        const finalRedirect = params.redirect || 'https://glosemester.no/index.html';
        const state = Buffer.from(JSON.stringify({ redirect: finalRedirect })).toString('base64');

        const authUrl =
            `${FEIDE_AUTHORIZE_URL}` +
            `?client_id=${encodeURIComponent(FEIDE_CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(CALLBACK_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent('openid profile email')}` +
            `&state=${encodeURIComponent(state)}`;

        return {
            statusCode: 302,
            headers: { Location: authUrl, 'Cache-Control': 'no-store' },
            body: ''
        };
    }

    // ── GET (with code/error): OAuth callback from Feide ──
    if (event.httpMethod === 'GET' && (params.code || params.error)) {
        let finalRedirect = 'https://glosemester.no/index.html';
        try {
            const stateData = JSON.parse(Buffer.from(decodeURIComponent(params.state || ''), 'base64').toString());
            finalRedirect = stateData.redirect || finalRedirect;
        } catch {}

        if (params.error) {
            return {
                statusCode: 302,
                headers: {
                    Location: `${finalRedirect}#feide_error=${encodeURIComponent(params.error)}`,
                    'Cache-Control': 'no-store'
                },
                body: ''
            };
        }

        try {
            const { token, user } = await exchangeCodeForToken(params.code);
            const userData = encodeURIComponent(JSON.stringify({
                displayName: user.name,
                email: user.email || '',
                rolle: 'laerer'
            }));
            return {
                statusCode: 302,
                headers: {
                    Location: `${finalRedirect}#feide_token=${encodeURIComponent(token)}&feide_user=${userData}`,
                    'Cache-Control': 'no-store'
                },
                body: ''
            };
        } catch (err) {
            const errorCode = err.code === 'STUDENT_BLOCKED' ? 'student_blocked' : 'auth_failed';
            return {
                statusCode: 302,
                headers: {
                    Location: `${finalRedirect}#feide_error=${errorCode}`,
                    'Cache-Control': 'no-store'
                },
                body: ''
            };
        }
    }

    // ── POST: legacy JSON API ──
    if (event.httpMethod === 'POST') {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };
        try {
            const { code } = JSON.parse(event.body || '{}');
            if (!code) throw new Error('Missing code');
            const result = await exchangeCodeForToken(code);
            return { statusCode: 200, headers, body: JSON.stringify(result) };
        } catch (err) {
            return {
                statusCode: err.code === 'STUDENT_BLOCKED' ? 403 : 500,
                headers,
                body: JSON.stringify({ error: err.message })
            };
        }
    }

    return { statusCode: 405, body: 'Method not allowed' };
};
