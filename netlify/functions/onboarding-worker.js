/**
 * onboarding-worker.js — Netlify Scheduled Function
 *
 * Erstatter glosemester-onboarding-worker (PM2) på Hetzner.
 * Kjører daglig kl. 08:00 norsk tid (06:00 UTC) via Netlify cron.
 *
 * Hva den gjør:
 *   - Henter alle Firebase-brukere med rolle "laerer" eller "admin"
 *   - Sender dag-0-velkomstepost til nye brukere (innen 24 timer)
 *   - Sender dag-2-tips til lærere som er 2 dager gamle og ikke har fått dag-2
 *   - Sender dag-5-tips til lærere som er 5 dager gamle og ikke har fått dag-5
 *   - Tracker sendte steg direkte i Firestore (onboarding_dag2_sendt, etc.)
 *
 * Miljøvariabler (sett i Netlify-dashboard):
 *   FIREBASE_SERVICE_ACCOUNT  — JSON-blob (allerede satt for feide-auth)
 *   RESEND_API_KEY             — allerede satt
 */

const { schedule } = require('@netlify/functions');
const admin = require('firebase-admin');

// ─── Firebase init ────────────────────────────────────────────────
if (!admin.apps.length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
}
const db = admin.firestore();

const APP_URL = 'https://glosemester.no';
const FROM    = 'Øyvind @ GloseMester <support@glosemester.no>';

// ─── E-postmaler (portert fra onboarding-templates.ts) ───────────

function epostSkall({ emoji, tittel, undertittel, innhold }) {
  return `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f5f5f7;margin:0;padding:0;color:#1d1d1f}
  .wrapper{max-width:600px;margin:0 auto;padding:32px 16px}
  .card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);padding:40px 36px;text-align:center;color:#fff}
  .header h1{margin:0 0 8px;font-size:28px;font-weight:800}
  .header p{margin:0;opacity:.9;font-size:15px}
  .body{padding:36px}
  .steg{display:flex;gap:16px;margin-bottom:20px;align-items:flex-start}
  .steg-nr{background:#f5f0ff;color:#7c3aed;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0;line-height:32px;text-align:center}
  .steg div{font-size:15px;line-height:1.5;color:#444;padding-top:4px}
  .steg strong{color:#1d1d1f}
  h2{font-size:19px;margin:32px 0 16px;color:#1d1d1f}
  .info-boks{background:#f5f0ff;border-left:4px solid #7c3aed;border-radius:10px;padding:18px 20px;margin:24px 0;font-size:14px;color:#555}
  .info-boks strong{color:#7c3aed;display:block;margin-bottom:6px;font-size:15px}
  .cta{display:block;background:#7c3aed;color:#fff!important;text-decoration:none;text-align:center;padding:16px 24px;border-radius:14px;font-weight:700;font-size:16px;margin:28px 0}
  .footer-tekst{text-align:center;color:#999;font-size:13px;margin-top:24px}
  .footer-tekst a{color:#7c3aed}
  a{color:#7c3aed}
  p{font-size:15px;line-height:1.6;color:#444}
</style>
</head>
<body>
<div class="wrapper">
<div class="card">
  <div class="header">
    <div style="font-size:48px;margin-bottom:12px">${emoji}</div>
    <h1>${tittel}</h1>
    <p>${undertittel}</p>
  </div>
  <div class="body">
    ${innhold}
    <p style="margin-top:36px;border-top:1px solid #f0f0f0;padding-top:24px">
      Lykke til med glosene! 📚<br><br>
      Vennlig hilsen,<br><strong>Øyvind</strong><br>
      <em>GloseMester – gøy å lære gloser!</em>
    </p>
  </div>
</div>
<div class="footer-tekst">
  <p>© 2026 GloseMester · <a href="${APP_URL}/personvern.html">Personvern</a> · <a href="${APP_URL}/faq.html">FAQ</a></p>
  <p style="font-size:12px;color:#bbb">Du mottar denne e-posten fordi du opprettet en konto på glosemester.no</p>
</div>
</div>
</body>
</html>`;
}

function velkomst(name, email, rolle) {
  const visNavn = name || email.split('@')[0];
  const fornavn = visNavn.split(' ')[0];
  const erLaerer = rolle === 'laerer' || rolle === 'admin';

  const innhold = erLaerer ? `
    <p>Du er nå registrert som <strong>lærer</strong> i GloseMester. Her kan du lage prøver, dele dem med klassen og følge elevenes fremgang – alt på ett sted.</p>
    <h2>Kom i gang på 4 steg</h2>
    <div class="steg"><span class="steg-nr">1</span><div><strong>Logg inn</strong><br>Gå til <a href="${APP_URL}">${APP_URL}</a> og logg inn med Feide eller Google.</div></div>
    <div class="steg"><span class="steg-nr">2</span><div><strong>Lag din første prøve</strong><br>Gå til <em>Lærerpanel</em> og klikk «Lag prøve». Skriv inn ordpar på norsk og fremmedspråket.</div></div>
    <div class="steg"><span class="steg-nr">3</span><div><strong>Del med klassen</strong><br>Du får en prøvekode elevene skriver inn – ingen pålogging for elevene.</div></div>
    <div class="steg"><span class="steg-nr">4</span><div><strong>Følg resultatene</strong><br>Se hvem som har tatt prøven og hvordan det gikk.</div></div>
    <a class="cta" href="${APP_URL}">Åpne GloseMester →</a>
    <div class="info-boks"><strong>📹 Instruksjonsvideoer kommer snart</strong>Korte videoer som viser deg alt du trenger å vite – publiseres på nettsiden snart.</div>
    <h2>Abonnement</h2>
    <p><strong>Gratis</strong> — opptil 3 prøver, øving og samlekort. Alltid gratis.<br>
    <strong>Premium</strong> — 49 kr/mnd eller 490 kr/år. Avansert statistikk og eksport.<br>
    <strong>Skolepakke</strong> — samlet løsning for hele skolen. <a href="mailto:kontakt@glosemester.no">Kontakt oss for tilbud.</a></p>
    <h2>Spørsmål?</h2>
    <p>Se <a href="${APP_URL}/faq">FAQ</a> eller skriv til <a href="mailto:kontakt@glosemester.no">kontakt@glosemester.no</a> – vi svarer innen én arbeidsdag.</p>
  ` : `
    <p>Du er nå registrert i GloseMester. Her kan du øve på gloser og ta prøver fra læreren din.</p>
    <div class="steg"><span class="steg-nr">1</span><div><strong>Logg inn</strong><br>Gå til <a href="${APP_URL}">${APP_URL}</a>.</div></div>
    <div class="steg"><span class="steg-nr">2</span><div><strong>Øv på gloser</strong><br>Velg et tema og øv med kortkassemetoden.</div></div>
    <div class="steg"><span class="steg-nr">3</span><div><strong>Ta prøver</strong><br>Har du fått en prøvekode fra læreren? Skriv den inn på forsiden.</div></div>
    <a class="cta" href="${APP_URL}">Åpne GloseMester →</a>
  `;

  return {
    subject: `Velkommen til GloseMester, ${visNavn}!`,
    html: epostSkall({ emoji: '🎓', tittel: `Velkommen, ${visNavn}!`, undertittel: 'Tusen takk for at du registrerte deg hos GloseMester', innhold }),
    text: `Hei ${fornavn},\n\nTusen takk for at du registrerte deg hos GloseMester!\n\nGå til ${APP_URL} for å komme i gang.\n\nSpørsmål? kontakt@glosemester.no\n\nVennlig hilsen, Øyvind\nGloseMester`,
  };
}

function dag2(name, email) {
  const fornavn = (name || email.split('@')[0]).split(' ')[0];
  const innhold = `
    <p>Hei ${fornavn}! Du registrerte deg for et par dager siden – her er en rask guide til å lage din første prøve. Det tar under to minutter.</p>
    <div class="steg"><span class="steg-nr">1</span><div><strong>Åpne lærerpanelet</strong><br>Logg inn på <a href="${APP_URL}">${APP_URL}</a> og gå til <em>Lærerpanel</em>.</div></div>
    <div class="steg"><span class="steg-nr">2</span><div><strong>Klikk «Lag prøve»</strong><br>Gi prøven en tittel og skriv inn minst fire ordpar (norsk + fremmedspråk).</div></div>
    <div class="steg"><span class="steg-nr">3</span><div><strong>Del koden eller QR-en</strong><br>Elevene skriver inn koden på forsiden – helt uten innlogging.</div></div>
    <a class="cta" href="${APP_URL}">Lag en prøve nå →</a>
    <div class="info-boks"><strong>💡 Tips</strong>Tildel prøven til en Feide-klasse, så dukker den automatisk opp hos elevene under «Mine prøver».</div>
  `;
  return {
    subject: 'Klar for din første prøve i GloseMester?',
    html: epostSkall({ emoji: '📝', tittel: 'Klar for din første prøve?', undertittel: 'En rask guide til å komme i gang', innhold }),
    text: `Hei ${fornavn},\n\nHer er en rask guide til å lage din første prøve:\n\n1. Logg inn på ${APP_URL} og gå til Lærerpanel\n2. Klikk «Lag prøve» og skriv inn ordpar\n3. Del koden med klassen (elevene trenger ikke logge inn)\n\nLag en prøve nå: ${APP_URL}\n\nVennlig hilsen, Øyvind\nGloseMester`,
  };
}

function dag5(name, email) {
  const fornavn = (name || email.split('@')[0]).split(' ')[0];
  const innhold = `
    <p>Hei ${fornavn}! Her er noen tips for å få mest mulig ut av GloseMester med klassen din.</p>
    <h2>Tips fra andre lærere</h2>
    <div class="steg"><span class="steg-nr">★</span><div><strong>Tildel til Feide-klasser</strong><br>Da slipper elevene å taste kode – prøven ligger klar under «Mine prøver».</div></div>
    <div class="steg"><span class="steg-nr">★</span><div><strong>Vis QR-koden på storskjerm</strong><br>Elevene skanner og er i gang på sekunder.</div></div>
    <div class="steg"><span class="steg-nr">★</span><div><strong>Følg resultatene i sanntid</strong><br>Se hvem som har gjennomført og hvor det glipper, mens prøven pågår.</div></div>
    <h2>Vil du ha mer?</h2>
    <p>Med <strong>Premium</strong> får du ubegrenset antall prøver og avansert statistikk – for <strong>49 kr/mnd</strong> eller <strong>490 kr/år</strong>.</p>
    <a class="cta" href="${APP_URL}/oppgrader">Se Premium →</a>
    <div class="info-boks"><strong>🏫 Er dere flere lærere?</strong>Skolepakke gir hele skolen tilgang med Feide-innlogging. <a href="mailto:kontakt@glosemester.no">Kontakt oss</a> for et tilbud.</div>
  `;
  return {
    subject: 'Tips for å få mest mulig ut av GloseMester',
    html: epostSkall({ emoji: '🚀', tittel: 'Få mest mulig ut av GloseMester', undertittel: 'Tips og muligheter for klassen din', innhold }),
    text: `Hei ${fornavn},\n\nNoen tips for å få mest mulig ut av GloseMester:\n\n- Tildel prøver til Feide-klasser\n- Vis QR-koden på storskjerm\n- Følg resultater i sanntid\n\nPremium (49 kr/mnd): ${APP_URL}/oppgrader\n\nVennlig hilsen, Øyvind\nGloseMester`,
  };
}

// ─── Resend-sender ────────────────────────────────────────────────

async function sendEpost({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Hoved-logikk ────────────────────────────────────────────────

async function kjørOnboarding() {
  const snapshot = await db.collection('users')
    .where('rolle', 'in', ['laerer', 'admin', 'elev'])
    .get();

  const naa = Date.now();
  let sendt = 0;

  for (const doc of snapshot.docs) {
    const u = doc.data();
    const uid = doc.id;
    const email = u.email;
    const name  = u.displayName || '';
    const rolle = u.rolle || 'elev';

    if (!email) continue;

    // Bruk opprettetDato (ISO-streng eller Firestore Timestamp)
    let opprettet;
    if (u.opprettetDato?.toDate) {
      opprettet = u.opprettetDato.toDate().getTime();
    } else if (u.opprettetDato) {
      opprettet = new Date(u.opprettetDato).getTime();
    } else {
      continue; // ukjent alder, hopp over
    }

    const dagerGammel = (naa - opprettet) / (1000 * 60 * 60 * 24);

    // ── Dag 0: velkomst ──────────────────────────────────────────
    if (!u.onboarding_sent && dagerGammel < 1) {
      try {
        const epost = velkomst(name, email, rolle);
        await sendEpost({ to: email, ...epost });
        await doc.ref.update({ onboarding_sent: true });
        console.log(`[dag0] Sendt til ${email}`);
        sendt++;
      } catch (e) {
        console.error(`[dag0] Feil for ${email}:`, e.message);
      }
      continue;
    }

    // Dag 2 og 5 kun for lærere
    if (rolle !== 'laerer' && rolle !== 'admin') continue;

    // ── Dag 2 ────────────────────────────────────────────────────
    if (!u.onboarding_dag2_sendt && dagerGammel >= 2 && dagerGammel < 3) {
      try {
        const epost = dag2(name, email);
        await sendEpost({ to: email, ...epost });
        await doc.ref.update({ onboarding_dag2_sendt: true });
        console.log(`[dag2] Sendt til ${email}`);
        sendt++;
      } catch (e) {
        console.error(`[dag2] Feil for ${email}:`, e.message);
      }
    }

    // ── Dag 5 ────────────────────────────────────────────────────
    if (!u.onboarding_dag5_sendt && dagerGammel >= 5 && dagerGammel < 6) {
      try {
        const epost = dag5(name, email);
        await sendEpost({ to: email, ...epost });
        await doc.ref.update({ onboarding_dag5_sendt: true });
        console.log(`[dag5] Sendt til ${email}`);
        sendt++;
      } catch (e) {
        console.error(`[dag5] Feil for ${email}:`, e.message);
      }
    }
  }

  console.log(`[onboarding-worker] Ferdig — ${sendt} e-poster sendt`);
  return { sendt, brukere: snapshot.size };
}

// ─── Netlify Scheduled Function ───────────────────────────────────
// Kjører daglig kl. 08:00 norsk tid (06:00 UTC)

const handler = async () => {
  try {
    const result = await kjørOnboarding();
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error('[onboarding-worker] Fatal:', err.message);
    return { statusCode: 500, body: err.message };
  }
};

module.exports.handler = schedule('0 6 * * *', handler);
