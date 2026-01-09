/* ============================================
   SKOLEPAKKE FORESPØRSEL - Netlify Function
   Håndterer forespørsler om Skolepakke fra skoler
   ============================================ */

const admin = require('firebase-admin');

// Initialize Firebase Admin (hvis ikke allerede initialisert)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

/**
 * Send e-post til admin om ny forespørsel
 */
async function sendAdminNotification(inquiryData) {
  console.log('📧 Admin-notifikasjon:', inquiryData);
  
  // TODO: Implementer faktisk e-post-sending
  // For nå: bare logg til konsoll
  
  /* Eksempel med SendGrid:
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: 'kontakt@glosemester.no',
    from: 'system@glosemester.no',
    subject: `Ny skolepakke-forespørsel: ${inquiryData.schoolName}`,
    html: `
      <h2>Ny forespørsel om Skolepakke</h2>
      <p><strong>Skole:</strong> ${inquiryData.schoolName}</p>
      <p><strong>Org.nr:</strong> ${inquiryData.orgNumber}</p>
      <p><strong>Kontaktperson:</strong> ${inquiryData.contactPerson}</p>
      <p><strong>E-post:</strong> ${inquiryData.contactEmail}</p>
      <p><strong>Telefon:</strong> ${inquiryData.contactPhone}</p>
      <p><strong>Antall lærere:</strong> ${inquiryData.teacherCount}</p>
      <p><strong>Melding:</strong> ${inquiryData.message || 'Ingen'}</p>
    `
  };
  
  await sgMail.send(msg);
  */
}

/**
 * Send automatisk svar til skolen
 */
async function sendAutoReply(email, contactPerson, schoolName) {
  console.log(`📧 Automatisk svar til ${email}`);
  
  // TODO: Implementer faktisk e-post
  
  /* Eksempel:
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: email,
    from: 'kontakt@glosemester.no',
    subject: 'Takk for din interesse i GloseMester Skolepakke',
    html: `
      <h2>Hei ${contactPerson}!</h2>
      <p>Takk for at ${schoolName} ønsker å bruke GloseMester Skolepakke.</p>
      <p>Vi har mottatt deres forespørsel og vil kontakte dere innen 1-2 virkedager.</p>
      <h3>Dette får dere med Skolepakke:</h3>
      <ul>
        <li>✅ Ubegrenset prøver for alle lærere</li>
        <li>✅ Tilgang til GloseBank med deling mellom lærere</li>
        <li>✅ 16 ferdiglagde standardprøver</li>
        <li>✅ Resultatanalyse og Excel-eksport</li>
      </ul>
      <p>Med vennlig hilsen,<br>GloseMester-teamet</p>
    `
  };
  
  await sgMail.send(msg);
  */
}

/**
 * HOVEDFUNKSJON: Håndter skolepakke-forespørsel
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Kun POST tillatt
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    const {
      schoolName,
      orgNumber,
      contactPerson,
      contactEmail,
      contactPhone,
      teacherCount,
      message
    } = data;

    // Validering
    if (!schoolName || !orgNumber || !contactPerson || !contactEmail || !contactPhone || !teacherCount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Alle påkrevde felter må fylles ut' 
        })
      };
    }

    // Valider e-postformat
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ugyldig e-postadresse' })
      };
    }

    console.log('📋 Ny skolepakke-forespørsel:', schoolName);

    // Lagre forespørsel i Firestore
    const inquiryRef = await db.collection('school_inquiries').add({
      schoolName,
      orgNumber,
      contactPerson,
      contactEmail,
      contactPhone,
      teacherCount,
      message: message || '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Forespørsel lagret: ${inquiryRef.id}`);

    // Send notifikasjoner
    await sendAdminNotification(data);
    await sendAutoReply(contactEmail, contactPerson, schoolName);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Forespørsel mottatt! Vi kontakter dere snart.',
        inquiryId: inquiryRef.id
      })
    };

  } catch (error) {
    console.error('❌ School inquiry error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Kunne ikke sende forespørsel',
        message: error.message
      })
    };
  }
};
