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

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': 'https://glosemester.no',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { code, redirect_uri } = JSON.parse(event.body || '{}');
        if (!code) throw new Error('Missing code');

        const redirectUri = redirect_uri || 'https://glosemester.no/';

        // 1. Bytt code mot access token
        const tokenRes = await axios.post(FEIDE_TOKEN_URL, new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: FEIDE_CLIENT_ID,
            client_secret: FEIDE_CLIENT_SECRET
        }));
        const accessToken = tokenRes.data.access_token;

        // 2. Hent brukerinfo
        const userRes = await axios.get(FEIDE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const feideUser = userRes.data;

        // 3. Prøv å hente groups (valgfritt)
        let groupsData = null;
        try {
            const groupsRes = await axios.get(FEIDE_GROUPS_URL, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            groupsData = groupsRes.data;
        } catch (groupsErr) {
            // fc:gogroup (klasser) krever scopet `groups-edu`. Logg feil EKSPLISITT
            // — tidligere svelget en tom catch feilen, så manglende klasser var usynlig.
            console.error('feide-auth groups-API feilet:', JSON.stringify({
                status: groupsErr.response && groupsErr.response.status,
                data: groupsErr.response && groupsErr.response.data,
                message: groupsErr.message
            }));
        }

        // 4. Bygg UID
        let feideId = feideUser.sub;
        if (!feideId && feideUser.userid) {
            feideId = Array.isArray(feideUser.userid) ? feideUser.userid[0] : feideUser.userid;
        }
        const uid = `feide_${feideId}`;

        // 5. Bestem rolle (laerer eller elev) + plukk ut klasser/grupper.
        const rolle = bestemRolle(feideUser, groupsData);
        const grupper = hentRelevanteGrupper(groupsData);

        // Diagnostikk (Netlify function-logg) for å feilsøke rolle ute i felten.
        console.log('feide-auth rolle:', JSON.stringify({
            uid,
            rolle,
            primaryAffiliation: feideUser.eduPersonPrimaryAffiliation || null,
            affiliation: feideUser.eduPersonAffiliation || null,
            groupsHentet: Array.isArray(groupsData),
            antallGrupper: grupper.length,
            antallKlasser: grupper.filter((g) => g.type === 'fc:gogroup').length,
            antallOrg: grupper.filter((g) => g.type === 'fc:org').length
        }));

        // 6. Lagre/oppdater bruker i Firestore. abonnement settes kun ved
        //    opprettelse (merge bevarer ev. eksisterende skolelisens).
        const docRef = db.collection('users').doc(uid);
        const finnes = (await docRef.get()).exists;
        await docRef.set({
            uid,
            displayName: feideUser.name,
            email: feideUser.email || '',
            feide_id: feideId,
            kilde: 'feide',
            rolle,
            feide_grupper: grupper,
            // Flatt id-felt så lærere kan slå opp klasse-roster med
            // array-contains-any (objekt-array kan ikke spørres direkte).
            feide_gruppe_ids: grupper.map((g) => g.id),
            ...(finnes ? {} : { abonnement: { type: 'free' } }),
            siste_innlogging: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 7. Lag Firebase custom token
        const token = await admin.auth().createCustomToken(uid, { rolle, feide_id: feideId });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ token, user: { ...feideUser, rolle } })
        };

    } catch (err) {
        console.error('feide-auth error:', err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
