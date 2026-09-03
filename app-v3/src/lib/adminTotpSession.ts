/**
 * Husker 2FA-verifisering for adminpanelet per nettleser-fane-økt (ikke
 * per server-sesjon) — nøyaktig samme mønster som den gamle v2-admin-siden.
 * Nøkkelen holder uid-en til den sist verifiserte admin-brukeren, slik at et
 * kontobytte i samme fane ikke arver en annen brukers verifisering.
 */
const NOKKEL = 'adminTotpVerified';

/** Uid-en til sist 2FA-verifiserte admin i denne fane-økten, eller null. */
export function hentTotpVerifisertUid(): string | null {
  try {
    return sessionStorage.getItem(NOKKEL);
  } catch {
    return null;
  }
}

export function settTotpVerifisertUid(uid: string): void {
  try {
    sessionStorage.setItem(NOKKEL, uid);
  } catch {
    /* tom — sessionStorage utilgjengelig (f.eks. privat modus) */
  }
}

export function fjernTotpVerifisert(): void {
  try {
    sessionStorage.removeItem(NOKKEL);
  } catch {
    /* tom */
  }
}
