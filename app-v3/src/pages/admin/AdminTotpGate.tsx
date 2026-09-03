/**
 * 2FA-port foran adminpanelet. Rollesjekken (kun rolle==='admin') skjer i
 * Admin.tsx FØR denne monteres — denne komponenten legger TOTP-verifisering
 * på toppen for en allerede bekreftet admin-bruker.
 *
 * Fire steg: laster → oppsett (ingen totp_secret ennå) → verifiser (kode
 * finnes, men ikke verifisert denne fane-økten) → bekreftet (rendrer children).
 * Verifisert-status huskes per fane-økt (adminTotpSession), samme mønster som
 * den gamle v2-admin-siden.
 */
import { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../../state/useAuthStore';
import { hentBrukerData, type BrukerData } from '../../lib/data/users';
import { totpSetup, totpVerify, totpReset } from '../../lib/data/adminTotp';
import { hentTotpVerifisertUid, settTotpVerifisertUid, fjernTotpVerifisert } from '../../lib/adminTotpSession';
import { toast } from '../../state/useToastStore';

type Steg = 'laster' | 'oppsett' | 'verifiser' | 'bekreftet';

export function AdminTotpGate({ children }: { children: React.ReactNode }) {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [steg, setSteg] = useState<Steg>('laster');
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [kode, setKode] = useState('');
  const [busy, setBusy] = useState(false);

  // Finn riktig utgangssteg: allerede verifisert denne økten, eller sjekk om
  // brukeren har satt opp TOTP fra før.
  useEffect(() => {
    let aktiv = true;
    async function init() {
      if (!firebaseUser) return;
      if (hentTotpVerifisertUid() === firebaseUser.uid) {
        setSteg('bekreftet');
        return;
      }
      const data = (await hentBrukerData(firebaseUser.uid)) as (BrukerData & { totp_secret?: string }) | null;
      if (!aktiv) return;
      setSteg(data?.totp_secret ? 'verifiser' : 'oppsett');
    }
    void init();
    return () => {
      aktiv = false;
    };
  }, [firebaseUser]);

  // Start oppsett (genererer/lagrer hemmelighet server-side) idet vi går inn i 'oppsett'-steget.
  useEffect(() => {
    if (steg !== 'oppsett' || !firebaseUser || otpauthUrl) return;
    let aktiv = true;
    (async () => {
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await totpSetup(idToken);
        if (!aktiv) return;
        setOtpauthUrl(res.otpauthUrl);
        setSecret(res.secret);
      } catch {
        toast.error('Kunne ikke starte 2FA-oppsett.');
      }
    })();
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steg, firebaseUser]);

  async function bekreft(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !kode.trim()) return;
    setBusy(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const { valid } = await totpVerify(idToken, kode.trim());
      if (valid) {
        settTotpVerifisertUid(firebaseUser.uid);
        setSteg('bekreftet');
        setKode('');
      } else {
        toast.error('Feil kode — prøv igjen.');
      }
    } catch {
      toast.error('Kunne ikke verifisere koden.');
    } finally {
      setBusy(false);
    }
  }

  async function nullstill() {
    if (!firebaseUser) return;
    if (!window.confirm('Nullstille 2FA-oppsettet? Du må sette opp en ny autentiseringskode med det samme.')) return;
    setBusy(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      await totpReset(idToken);
      fjernTotpVerifisert();
      setOtpauthUrl(null);
      setSecret(null);
      setSteg('oppsett');
    } catch {
      toast.error('Kunne ikke nullstille 2FA.');
    } finally {
      setBusy(false);
    }
  }

  if (steg === 'bekreftet') return <>{children}</>;

  if (steg === 'laster') {
    return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={boks}>
        {steg === 'oppsett' ? (
          <>
            <ShieldCheck size={40} color="var(--color-primary)" aria-hidden="true" />
            <h2 style={tittel}>Sett opp 2FA</h2>
            <p style={tekst}>Skann QR-koden med en autentiseringsapp (f.eks. Google Authenticator), og skriv inn 6-sifret kode for å bekrefte.</p>
            {otpauthUrl ? (
              <>
                <div style={{ background: '#fff', padding: 12, borderRadius: 'var(--radius-md)' }}>
                  <QRCodeSVG value={otpauthUrl} size={180} />
                </div>
                {secret && (
                  <p style={{ ...tekst, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                    Manuell nøkkel: {secret}
                  </p>
                )}
              </>
            ) : (
              <p style={tekst}>Genererer nøkkel…</p>
            )}
          </>
        ) : (
          <>
            <KeyRound size={40} color="var(--color-primary)" aria-hidden="true" />
            <h2 style={tittel}>Bekreft 2FA</h2>
            <p style={tekst}>Skriv inn koden fra autentiseringsappen din.</p>
          </>
        )}

        <form onSubmit={bekreft} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <input
            autoFocus
            inputMode="numeric"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            placeholder="6-sifret kode"
            style={input}
          />
          <button type="submit" disabled={busy || !kode.trim()} style={primaerKnapp}>
            {busy ? 'Sjekker…' : 'Bekreft'}
          </button>
        </form>

        {steg === 'verifiser' && (
          <button type="button" onClick={nullstill} disabled={busy} style={ghostKnapp}>
            Nullstill 2FA-oppsett
          </button>
        )}
      </div>
    </div>
  );
}

const boks: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: '32px 28px', maxWidth: 360, width: '100%',
  boxShadow: 'var(--shadow-card)', textAlign: 'center', fontFamily: 'var(--font-primary)',
};
const tittel: React.CSSProperties = { fontWeight: 900, fontSize: 'var(--font-size-lg)', margin: 0 };
const tekst: React.CSSProperties = { color: 'var(--color-text-muted)', fontSize: 14, margin: 0 };
const input: React.CSSProperties = {
  padding: '12px 14px', fontSize: 18, textAlign: 'center', letterSpacing: 2,
  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none',
  fontFamily: 'var(--font-primary)',
};
const primaerKnapp: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '12px 18px', fontWeight: 700, cursor: 'pointer',
  fontFamily: 'var(--font-primary)',
};
const ghostKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-text-muted)', border: 'none',
  fontWeight: 600, fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
  fontFamily: 'var(--font-primary)',
};
