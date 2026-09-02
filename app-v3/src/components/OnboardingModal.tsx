/**
 * Velkomst-modal for nye lærere — vises én gang etter første innlogging.
 * Kun lærere logger inn, så modalen trenger ingen elev-variant.
 * Sett/lest via localStorage-nøkkel per UID slik at den ikke dukker opp igjen.
 */
import { useEffect, useState } from 'react';
import { Trophy, Target, FileText, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../state/useAuthStore';

const STORAGE_KEY = (uid: string) => `gm_onboarding_vist_${uid}`;

interface Steg {
  ikon: React.ReactNode;
  tittel: string;
  tekst: string;
}

export function OnboardingModal() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const [vis, setVis] = useState(false);
  const [steg, setSteg] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const sett = localStorage.getItem(STORAGE_KEY(uid));
    if (!sett) setVis(true);
  }, [uid]);

  function lukk() {
    if (uid) localStorage.setItem(STORAGE_KEY(uid), '1');
    setVis(false);
  }

  if (!vis || !uid) return null;

  const stegListe: Steg[] = [
    {
      ikon: <Target size={40} color="var(--color-primary)" aria-hidden="true" />,
      tittel: 'Velkommen til GloseMester',
      tekst: 'Du er logget inn som lærer. Her kan du lage gloser-prøver og dele dem med klassen på sekunder.',
    },
    {
      ikon: <FileText size={40} color="var(--color-primary)" aria-hidden="true" />,
      tittel: 'Lag og del prøver',
      tekst: 'Gå til Lærerpanel → Ny prøve. Velg nivå og ord, sett frist, og del koden eller QR-koden med elevene.',
    },
    {
      ikon: <Trophy size={40} color="var(--color-primary)" aria-hidden="true" />,
      tittel: 'Se resultater',
      tekst: 'Når elevene har tatt prøven ser du hvem som er ferdig direkte i Klassestatus — uten at du trenger å rette noe.',
    },
  ];

  const erSiste = steg === stegListe.length - 1;
  const gjeldende = stegListe[steg];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Velkommen til GloseMester"
      onClick={lukk}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 28px 28px',
          maxWidth: 400, width: '100%',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          fontFamily: 'var(--font-primary)',
        }}
      >
        <button
          type="button"
          onClick={lukk}
          aria-label="Lukk"
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
          {gjeldende.ikon}
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(18px, 4vw, 22px)', lineHeight: 1.2, color: 'var(--color-text)' }}>
            {gjeldende.tittel}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.6, maxWidth: '36ch' }}>
            {gjeldende.tekst}
          </p>
        </div>

        {/* Steg-indikatorer */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
          {stegListe.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === steg ? 20 : 8, height: 8, borderRadius: 999,
                background: i === steg ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'width 0.2s ease',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {steg > 0 && (
            <button
              type="button"
              onClick={() => setSteg((s) => s - 1)}
              style={{ ...sekundaerKnapp, flex: 1 }}
            >
              Tilbake
            </button>
          )}
          <button
            type="button"
            onClick={erSiste ? lukk : () => setSteg((s) => s + 1)}
            style={{ ...primaerKnapp, flex: 2 }}
          >
            {erSiste ? 'Kom i gang' : <><ChevronRight size={16} aria-hidden="true" /> Neste</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '12px 20px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)', fontSize: 15,
};
const sekundaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--color-surface)', color: 'var(--color-text-muted)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-full)', padding: '10px 18px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)', fontSize: 15,
};
