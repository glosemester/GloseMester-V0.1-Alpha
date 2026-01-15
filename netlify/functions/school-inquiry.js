/* ============================================
   SKOLEPAKKE FORESPØRSEL - MED RESEND E-POST
   ============================================ */

const admin = require('firebase-admin');
const { Resend } = require('resend'); // ✅ RESEND

// Initialize Firebase Admin
if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error("Mangler FIREBASE_SERVICE_ACCOUNT i Netlify env vars");
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

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
            orgNumber: orgNumber.replace(/\s/g, ''),
            contactPerson,
            contactEmail: contactEmail.toLowerCase(),
            contactPhone,
            teacherCount: parseInt(teacherCount),
            message: message || '',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Forespørsel lagret: ${inquiryRef.id}`);
        
        // ✅ SEND E-POSTVARSEL MED RESEND
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            const emailData = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'kontakt@glosemester.no',
                to: process.env.RESEND_TO_EMAIL || 'oyvind.nilsoks@gmail.com',
                subject: `🏫 Ny skolepakke-forespørsel: ${schoolName}`,
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0071e3; color: white; padding: 25px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
        .info-section { background: white; padding: 15px; margin-bottom: 15px; border-radius: 6px; border-left: 4px solid #0071e3; }
        .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .value { color: #333; font-size: 16px; }
        .message-box { background: white; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #ddd; }
        .footer { text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        .button { display: inline-block; background: #0071e3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏫 Ny Skolepakke-forespørsel</h1>
    </div>
    <div class="content">
        <div class="info-section">
            <div class="label">Skole</div>
            <div class="value">${schoolName}</div>
        </div>
        
        <div class="info-section">
            <div class="label">Organisasjonsnummer</div>
            <div class="value">${orgNumber}</div>
        </div>
        
        <div class="info-section">
            <div class="label">Kontaktperson</div>
            <div class="value">${contactPerson}</div>
        </div>
        
        <div class="info-section">
            <div class="label">E-post</div>
            <div class="value"><a href="mailto:${contactEmail}" style="color: #0071e3;">${contactEmail}</a></div>
        </div>
        
        <div class="info-section">
            <div class="label">Telefon</div>
            <div class="value">${contactPhone}</div>
        </div>
        
        <div class="info-section">
            <div class="label">Antall lærere</div>
            <div class="value">${teacherCount}</div>
        </div>
        
        ${message ? `
        <div class="message-box">
            <div class="label">Melding fra skolen</div>
            <div class="value" style="margin-top: 10px;">${message}</div>
        </div>
        ` : ''}
        
        <a href="mailto:${contactEmail}?subject=Re: Skolepakke-forespørsel GloseMester" class="button">
            📧 Svar på forespørsel
        </a>
        
        <div class="footer">
            <strong>Forespørsel-ID:</strong> ${inquiryRef.id}<br>
            <strong>Mottatt:</strong> ${new Date().toLocaleString('no-NO', { timeZone: 'Europe/Oslo' })}<br>
            <br>
            <em>Denne e-posten ble automatisk sendt fra GloseMester</em>
        </div>
    </div>
</body>
</html>
                `
            });
            
            console.log('✅ E-postvarsel sendt via Resend:', emailData.id);
            
        } catch (emailError) {
            // Logg feilen, men ikke fail hele requesten
            console.error('⚠️ Resend e-post feilet:', emailError.message);
            // Forespørselen er allerede lagret i Firestore, så det er OK
        }

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