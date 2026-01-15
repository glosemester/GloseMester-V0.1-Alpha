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
const FEIDE_TOKEN_URL = "https://auth.dataporten.no/oauth/token";
const FEIDE_USERINFO_URL = "https://auth.dataporten.no/openid/userinfo";

// ⚠️ VIKTIG: Groups API krever spesifikk tilgang i Feide-portalen
const FEIDE_GROUPS_URL = "https://groups-api.dataporten.no/groups/me/groups";

function erLaerer(userinfo, groupsData = null) {
    console.log(`🔍 Sjekker rolle: ${userinfo.name}`);

    // ============================================
    // STEG 1: SJEKK eduPersonPrimaryAffiliation
    // ============================================
    const primaryAffiliation = userinfo.eduPersonPrimaryAffiliation || 
                              userinfo['https://n.feide.no/claims/eduPersonPrimaryAffiliation'];
    
    if (primaryAffiliation) {
        console.log("✅ Fant primaryAffiliation:", primaryAffiliation);
        
        if (primaryAffiliation.toLowerCase() === 'employee' || 
            primaryAffiliation.toLowerCase() === 'faculty' ||
            primaryAffiliation.toLowerCase() === 'staff') {
            console.log("✅ LÆRER (employee/faculty/staff)");
            return true;
        }
        
        if (primaryAffiliation.toLowerCase() === 'student' ||
            primaryAffiliation.toLowerCase() === 'pupil') {
            console.log("❌ ELEV (student/pupil)");
            return false;
        }
    }

    // ============================================
    // STEG 2: SJEKK GROUPS DATA (hvis tilgjengelig)
    // ============================================
    if (groupsData && Array.isArray(groupsData)) {
        console.log("🔍 Sjekker groups data...");
        
        for (const group of groupsData) {
            const membership = group.membership || {};
            const primaryAff = membership.primaryAffiliation || membership.basic;
            
            if (primaryAff) {
                console.log("  - Group affiliation:", primaryAff);
                
                if (primaryAff.toLowerCase() === 'employee' ||
                    primaryAff.toLowerCase() === 'faculty' ||
                    primaryAff.toLowerCase() === 'staff') {
                    console.log("✅ LÆRER (fra groups)");
                    return true;
                }
                
                if (primaryAff.toLowerCase() === 'student' ||
                    primaryAff.toLowerCase() === 'pupil') {
                    console.log("❌ ELEV (fra groups)");
                    return false;
                }
            }
        }
    }

    // ============================================
    // STEG 3: FALLBACK - SJEKK BRUKERNAVN
    // ============================================
    console.log("⚠️ Ingen klar affiliation - sjekker brukernavn...");
    
    const principalName = (userinfo.eduPersonPrincipalName || 
                          userinfo['https://n.feide.no/claims/eduPersonPrincipalName'] || '').toLowerCase();
    
    const email = (userinfo.email || '').toLowerCase();
    
    console.log("  - principalName:", principalName);
    console.log("  - email:", email);
    
    // LÆRER-ORD I BRUKERNAVN (for test-brukere)
    const laererOrd = ['teacher', 'ansatt', 'tilsatt', 'laerer', 'lærer', 'admin'];
    
    if (laererOrd.some(ord => principalName.includes(ord) || email.includes(ord))) {
        console.log("✅ LÆRER (brukernavn inneholder lærer-ord)");
        return true;
    }
    
    // ELEV-ORD I BRUKERNAVN
    const elevOrd = ['student', 'elev', 'pupil'];
    
    if (elevOrd.some(ord => principalName.includes(ord) || email.includes(ord))) {
        console.log("❌ ELEV (brukernavn inneholder elev-ord)");
        return false;
    }

    // ============================================
    // STEG 4: STANDARD = BLOKKÉR
    // ============================================
    console.log("⚠️ UKLAR ROLLE - blokkerer som standard");
    return false;
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'POST') return { statusCode: 200, headers, body: '' };

    try {
        const { code, redirect_uri } = JSON.parse(event.body);
        if (!code) throw new Error('Missing code');

        console.log("📥 Feide auth request");

        // 1. TOKEN EXCHANGE
        const tokenRes = await axios.post(FEIDE_TOKEN_URL, new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirect_uri || 'https://glosemester.no/',
            client_id: FEIDE_CLIENT_ID,
            client_secret: FEIDE_CLIENT_SECRET
        }));

        console.log("✅ Token OK");
        const accessToken = tokenRes.data.access_token;

        // 2. USERINFO
        const userRes = await axios.get(FEIDE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const feideUser = userRes.data;

        console.log("✅ Userinfo:", feideUser.name);
        console.log("📋 Userinfo data:", JSON.stringify(feideUser, null, 2));

        // 3. PRØV Å HENTE GROUPS DATA
        // ⚠️ Dette vil feile hvis "system-all-users" ikke er aktivert
        let groupsData = null;
        try {
            const groupsRes = await axios.get(FEIDE_GROUPS_URL, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            groupsData = groupsRes.data;
            console.log("✅ Groups data hentet:", JSON.stringify(groupsData, null, 2));
        } catch (e) {
            // Dette er FORVENTET hvis du ikke har aktivert groups-tilgang
            console.log("⚠️ Kunne ikke hente groups (forventet hvis ikke aktivert):", e.response?.status || e.message);
        }

        // 4. UID
        let feideId = feideUser.sub;
        if (!feideId && feideUser.userid) {
            feideId = Array.isArray(feideUser.userid) ? feideUser.userid[0] : feideUser.userid;
        }
        const uid = `feide_${feideId}`;

        // 5. SJEKK ROLLE
        if (!erLaerer(feideUser, groupsData)) {
            console.log("🚫 BLOKKERT");
            
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    error: 'student_blocked',
                    message: 'GloseMester er kun for lærere.',
                    rolle: 'elev'
                })
            };
        }

        console.log("✅ GODKJENT");

        // 6. LAGRE
        await db.collection('users').doc(uid).set({
            navn: feideUser.name,
            email: feideUser.email || '',
            feide_id: feideId,
            kilde: 'feide',
            rolle: 'laerer',
            siste_innlogging: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log("✅ User saved");

        // 7. TOKEN
        const token = await admin.auth().createCustomToken(uid, { 
            rolle: 'laerer', 
            feide_id: feideId 
        });

        console.log("✅ Returnerer 200 OK");

        return {
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                token, 
                user: { 
                    ...feideUser, 
                    rolle: 'laerer'
                } 
            })
        };

    } catch (err) {
        console.error("❌ Error:", err.message);
        console.error("Stack:", err.stack);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: err.message }) 
        };
    }
};