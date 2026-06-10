/**
 * Intern Netlify-funksjon: sender Web Push-varsler til elever i oppgitte
 * Feide-grupper. Kalles fra opprettProve (via intern fetch) etter at en prøve
 * er tildelt. Bruker VAPID-nøkler fra miljøvariabler.
 *
 * Miljøvariabler som må settes i Netlify:
 *   VAPID_PUBLIC_KEY   — den offentlige VAPID-nøkkelen
 *   VAPID_PRIVATE_KEY  — den private VAPID-nøkkelen
 *   VAPID_EMAIL        — kontakt-e-post (f.eks. kontakt@glosemester.no)
 */
import webPush from 'web-push';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, body: 'Ugyldig JSON' };
  }

  const { gruppeIds, tittel } = body;
  if (!Array.isArray(gruppeIds) || gruppeIds.length === 0) {
    return { statusCode: 400, body: 'Mangler gruppeIds' };
  }

  initAdmin();
  const db = getFirestore();

  webPush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'kontakt@glosemester.no'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  // Hent alle brukere i disse gruppene som har push-abonnement.
  // array-contains-any tillater maks 10 verdier.
  const resultater = [];
  for (let i = 0; i < gruppeIds.length; i += 10) {
    const chunk = gruppeIds.slice(i, i + 10);
    const snap = await db
      .collection('users')
      .where('feide_gruppe_ids', 'array-contains-any', chunk)
      .get();
    resultater.push(...snap.docs);
  }

  // Dedupliser på uid
  const sett = new Map();
  resultater.forEach((d) => sett.set(d.id, d));

  const utsendinger = [...sett.values()].map(async (d) => {
    // pushSubscription er nå lagret i private-subkolleksjon.
    const privSnap = await d.ref.collection('private').doc('data').get();
    const { pushSubscription } = privSnap.exists ? privSnap.data() : {};
    if (!pushSubscription) return;
    try {
      await webPush.sendNotification(
        pushSubscription,
        JSON.stringify({
          title: 'Ny prøve tildelt',
          body: tittel ?? 'Læreren din har tildelt en ny prøve.',
          url: '/mine-prover',
        }),
      );
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Utløpt abonnement — rydd opp.
        await privSnap.ref.update({ pushSubscription: null });
      }
    }
  });

  await Promise.allSettled(utsendinger);
  return { statusCode: 200, body: 'ok' };
};
