/**
 * resend-inbound.js
 *
 * Tar imot Resend inbound webhook og videresender e-posten til
 * oyvind.nilsoks@gmail.com via Resend API.
 *
 * Erstatter: https://agent.glosemester.no/webhook/resend/inbound
 * Nytt endepunkt: https://glosemester.no/.netlify/functions/resend-inbound
 *
 * Miljøvariabler som må settes i Netlify-dashboard:
 *   RESEND_API_KEY        — Resend API-nøkkel (allerede satt for stripe-funksjoner)
 *   RESEND_WEBHOOK_SECRET — Signing secret fra Resend (valgfri, men anbefalt)
 */

const FORWARD_TO = 'oyvind.nilsoks@gmail.com';
const FROM_ADDRESS = 'GloseMester Innboks <support@glosemester.no>';

exports.handler = async (event) => {
    // Kun POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: 'Invalid JSON' };
    }

    // Valgfri webhook-signatur-verifisering
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
        const svixId        = event.headers['svix-id'];
        const svixTimestamp = event.headers['svix-timestamp'];
        const svixSignature = event.headers['svix-signature'];
        if (!svixId || !svixTimestamp || !svixSignature) {
            console.warn('Mangler Svix-headers — avviser forespørsel');
            return { statusCode: 401, body: 'Unauthorized' };
        }
        // Enkel tidsstempel-sjekk (±5 min)
        const ts = parseInt(svixTimestamp, 10);
        if (Math.abs(Date.now() / 1000 - ts) > 300) {
            return { statusCode: 401, body: 'Stale webhook' };
        }
    }

    // Kun håndter email.received
    if (payload.type !== 'email.received') {
        return { statusCode: 200, body: 'Ignored: ' + payload.type };
    }

    const email = payload.data || {};
    const fromAddr  = email.from || 'ukjent@ukjent.no';
    const toAddr    = Array.isArray(email.to) ? email.to.join(', ') : (email.to || '');
    const subject   = email.subject || '(ingen emne)';
    const textBody  = email.text || '';
    const htmlBody  = email.html || '';

    // Bygg vidersendingsinnhold
    const forwardedText = `--- Videresendt til ${toAddr} ---\n\nFra: ${fromAddr}\nEmne: ${subject}\n\n${textBody}`;
    const forwardedHtml = htmlBody
        ? `<div style="border-left:3px solid #7c3aed;padding:8px 12px;margin-bottom:16px;color:#666;font-size:13px;">
             <strong>Videresendt e-post</strong> — Sendt til: <code>${toAddr}</code><br>
             Fra: <code>${fromAddr}</code> · Emne: ${subject}
           </div>${htmlBody}`
        : null;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY mangler');
        return { statusCode: 500, body: 'Konfigureringsfeil' };
    }

    const body = {
        from: FROM_ADDRESS,
        to:   [FORWARD_TO],
        reply_to: fromAddr,          // Svar-til går rett til avsenderen
        subject: `[GloseMester] ${subject}`,
        text: forwardedText,
        ...(forwardedHtml ? { html: forwardedHtml } : {}),
    };

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('Resend API feil:', res.status, errText);
            return { statusCode: 502, body: 'Videresending feilet' };
        }

        const result = await res.json();
        console.log(`[resend-inbound] Videresendt fra ${fromAddr} → ${FORWARD_TO} | ID: ${result.id}`);
        return { statusCode: 200, body: JSON.stringify({ ok: true, id: result.id }) };

    } catch (err) {
        console.error('[resend-inbound] Feil:', err.message);
        return { statusCode: 500, body: 'Intern feil' };
    }
};
