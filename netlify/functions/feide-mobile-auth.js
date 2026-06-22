const admin = require('firebase-admin');
const axios = require('axios');
const { bestemRolle, hentRelevanteGrupper } = require('./lib/feide-roles');

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
const FEIDE_TOKEN_URL = "https://auth.dataporten.no/oauth/token";
const FEIDE_USERINFO_URL = "https://auth.dataporten.no/openid/userinfo";
// showAll=true: ta MED utløpte/inaktive grupper. Skoleårsgrupper (klasser/fag)
// utløper midt i juni, så uten dette satt lærere hele sommeren igjen med kun
// skoletilhørighet (fc:org utløper aldri). hentRelevanteGrupper filtrerer så
// til aktive + ev. forrige skoleår. Jf. Feide groups-API docs.
const FEIDE_GROUPS_URL = "https://groups-api.dataporten.no/groups/me/groups?showAll=true";
const MOBILE_REDIRECT_URI = "https://glosemester.no/.netlify/functions/feide-mobile-auth";
const APP_SCHEME = "no.glosemester.app://auth";

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const params = event.queryStringParameters || {};
    const { code, error } = params;

    if (error) {
        const errUrl = `${APP_SCHEME}?error=${encodeURIComponent(error)}`;
        return { statusCode: 302, headers: { Location: errUrl }, body: '' };
    }

    if (!code) {
        return { statusCode: 400, body: 'Mangler kode fra Feide' };
    }

    try {
        // 1. Bytt code mot access token
        const tokenRes = await axios.post(FEIDE_TOKEN_URL, new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: MOBILE_REDIRECT_URI,
            client_id: FEIDE_CLIENT_ID,
            client_secret: FEIDE_CLIENT_SECRET
        }));
        const accessToken = tokenRes.data.access_token;

        // 2. Hent brukerinfo fra Feide
        const userRes = await axios.get(FEIDE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const feideUser = userRes.data;

        // 3. Hent grupper (brukes til rollesjekk for lærere)
        let groupsData = null;
        try {
            const groupsRes = await axios.get(FEIDE_GROUPS_URL, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            groupsData = groupsRes.data;
        } catch (groupsErr) {
            console.error('feide-mobile-auth groups-API feilet:', JSON.stringify({
                status: groupsErr.response && groupsErr.response.status,
                data: groupsErr.response && groupsErr.response.data,
                message: groupsErr.message
            }));
        }

        // 4. Bygg Firebase-bruker-ID
        let feideId = feideUser.sub;
        if (!feideId && feideUser.userid) {
            feideId = Array.isArray(feideUser.userid) ? feideUser.userid[0] : feideUser.userid;
        }
        const uid = `feide_${feideId}`;

        // 5. Bestem rolle (laerer eller elev) + plukk ut klasser/grupper.
        const rolle = bestemRolle(feideUser, groupsData);
        const grupper = hentRelevanteGrupper(groupsData);

        // 6. Lagre/oppdater bruker i Firestore. abonnement settes kun ved
        //    opprettelse (merge bevarer ev. eksisterende skolelisens).
        const docRef = db.collection('users').doc(uid);
        const finnes = (await docRef.get()).exists;
        await docRef.set({
            uid,
            displayName: feideUser.name || '',
            email: feideUser.email || '',
            feide_id: feideId,
            kilde: 'feide',
            rolle,
            feide_grupper: grupper,
            feide_gruppe_ids: grupper.map((g) => g.id),
            ...(finnes ? {} : { abonnement: { type: 'free' } }),
            siste_innlogging: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 7. Lag Firebase custom token
        const firebaseToken = await admin.auth().createCustomToken(uid, { rolle, feide_id: feideId });

        // 8. Send appen tilbake med token via custom URL-skjema
        const navn = encodeURIComponent(feideUser.name || '');
        const token = encodeURIComponent(firebaseToken);
        const redirectUrl = `${APP_SCHEME}?token=${token}&rolle=${rolle}&navn=${navn}`;

        return {
            statusCode: 302,
            headers: { Location: redirectUrl },
            body: ''
        };

    } catch (err) {
        console.error('feide-mobile-auth feil:', err.message);
        const errUrl = `${APP_SCHEME}?error=${encodeURIComponent('Innlogging feilet: ' + err.message)}`;
        return { statusCode: 302, headers: { Location: errUrl }, body: '' };
    }
};
