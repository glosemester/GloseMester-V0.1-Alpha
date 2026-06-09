/**
 * Web Push — abonnement-styring for varsler om nye tildelte prøver.
 * Abonnementsendepunktet lagres på brukerens Firestore-dokument.
 */
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Generert med `npx web-push generate-vapid-keys`.
// Skal samsvare med VAPID_PUBLIC_KEY i Netlify-miljøet.
export const VAPID_PUBLIC_KEY =
  'BG0z6Z2mdtaYhCUciA0zDDyFM6-pxdHfbS2zUDfqWl_m7xrc7trZ3POdHwKTJA1-iJPMvLe7H9r4IgQsAEaPZeg';

export function pushStøttes(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function varselStatus(): NotificationPermission | 'unsupported' {
  if (!pushStøttes()) return 'unsupported';
  return Notification.permission;
}

export async function abonnerPåVarsler(uid: string): Promise<boolean> {
  if (!pushStøttes()) return false;
  const tillatelse = await Notification.requestPermission();
  if (tillatelse !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
  });

  await updateDoc(doc(db, 'users', uid), { pushSubscription: sub.toJSON() });
  return true;
}

export async function avmelding(uid: string): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  await updateDoc(doc(db, 'users', uid), { pushSubscription: null });
}

export async function erAbonnert(): Promise<boolean> {
  if (!pushStøttes()) return false;
  if (Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  return Boolean(await reg.pushManager.getSubscription());
}

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
