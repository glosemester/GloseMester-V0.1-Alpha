import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { Kort } from '../storage';

export interface ProgressData {
  samling_gloser: Kort[];
  xp_gloser: number;
  credits_gloser: number;
  kortprogresjon_gloser: number;
  spent_tokens: number;
  streak: number;
}

export async function hentProgress(uid: string): Promise<ProgressData | null | 'error'> {
  try {
    const snap = await getDoc(doc(db, 'user_progress', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      samling_gloser: (d.samling_gloser as Kort[]) ?? [],
      xp_gloser: (d.xp_gloser as number) ?? 0,
      credits_gloser: (d.credits_gloser as number) ?? 0,
      kortprogresjon_gloser: (d.kortprogresjon_gloser as number) ?? 0,
      spent_tokens: (d.spent_tokens as number) ?? 0,
      streak: (d.streak as number) ?? 0,
    };
  } catch {
    return 'error';
  }
}

export async function lagreProgress(uid: string, data: Partial<ProgressData>): Promise<void> {
  // Vakt mot «Missing or insufficient permissions»: reglene for user_progress
  // krever request.auth.uid == userId. En debounced/flush-skriving kan utløses
  // i auth-overgangen (rett etter signOut, eller før token er knyttet på) — da
  // mangler auth.currentUser eller peker på en annen uid. Hopp stille over.
  const aktiv = auth.currentUser;
  if (!aktiv || aktiv.uid !== uid) return;

  try {
    await setDoc(
      doc(db, 'user_progress', uid),
      { ...data, oppdatert: serverTimestamp() },
      { merge: true },
    );
  } catch (e) {
    console.error('[progressSync] lagreProgress feil:', e);
  }
}
