/**
 * GDPR-funksjoner — dataeksport (art. 20) og kontosletting (art. 17).
 * Portet fra v2 (js/features/gdpr.js), men uten betalingsspesifikk logikk.
 */
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/** Samler all brukerdata til ett JSON-objekt (jf. v2 eksporterMinData). */
export async function samleBrukerData(uid: string): Promise<Record<string, unknown>> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const profil = userSnap.exists() ? userSnap.data() : null;

  const proverSnap = await getDocs(query(collection(db, 'prover'), where('opprettet_av', '==', uid)));
  const prover = proverSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let resultater: unknown[] = [];
  try {
    const resSnap = await getDocs(query(collection(db, 'resultater'), where('prove_eier', '==', uid)));
    resultater = resSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Kunne ikke hente resultater:', e);
  }

  return {
    eksportertDato: new Date().toISOString(),
    profil,
    prover,
    resultater,
  };
}

/** Laster ned brukerdata som JSON-fil i nettleseren. */
export async function eksporterMinData(uid: string): Promise<void> {
  const data = await samleBrukerData(uid);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `glosemester-mine-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Sletter brukerens Firestore-dokument og Firebase Auth-konto (art. 17). */
export async function slettMinKonto(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
  if (auth.currentUser) {
    await auth.currentUser.delete();
  }
}
