const admin = require('firebase-admin');
const axios = require('axios');

exports.handler = async function(event, context) {
  // Kun tillat POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Hent miljøvariabler
  const FEIDE_CLIENT_ID = process.env.FEIDE_CLIENT_ID;
  const FEIDE_CLIENT_SECRET = process.env.FEIDE_CLIENT_SECRET;
  const FEIDE_REDIRECT_URI = process.env.FEIDE_REDIRECT_URI; // Sjekk at denne er https://glosemester.no/ i Netlify

  // Initialiser Firebase Admin TRYGT inne i funksjonen
  if (!admin.apps.length) {
    try {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error("Mangler FIREBASE_SERVICE_ACCOUNT i Netlify env vars");
      }
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.error("Firebase Init Error:", error);
      return { statusCode: 500, body: JSON.stringify({ error: "Serverkonfigurasjon feilet (Firebase)" }) };
    }
  }

  try {
    const { code } = JSON.parse(event.body);

    if (!code) {
      return { statusCode: 400, body: "Mangler auth code" };
    }

    // 1. Bytt 'code' mot 'access_token' hos Feide
    const tokenResponse = await axios.post('https://auth.dataporten.no/oauth/token', new URLSearchParams({
      'grant_type': 'authorization_code',
      'code': code,
      'client_id': FEIDE_CLIENT_ID,
      'client_secret': FEIDE_CLIENT_SECRET,
      'redirect_uri': FEIDE_REDIRECT_URI
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const accessToken = tokenResponse.data.access_token;

    // 2. Hent brukerinfo
    const userInfoResponse = await axios.get('https://auth.dataporten.no/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const user = userInfoResponse.data;
    console.log("Feide user info:", user.sub, user.name);

    // 3. Lag Firebase Custom Token
    // Vi bruker Feide sin ID (sub) som Firebase UID
    const uid = `feide:${user.sub}`; 
    
    const additionalClaims = {
      navn: user.name,
      email: user.email,
      feideUser: true
    };

    const firebaseToken = await admin.auth().createCustomToken(uid, additionalClaims);

    return {
      statusCode: 200,
      body: JSON.stringify({ token: firebaseToken, user: user })
    };

  } catch (error) {
    console.error("Feide Auth Error:", error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Feilet under Feide-innlogging.", details: error.message })
    };
  }
};