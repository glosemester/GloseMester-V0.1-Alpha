/**
 * Min side — lærerens kontoside: tilgangsoversikt, profil og GDPR-rettigheter.
 * Kun lærere/admin kan noensinne være innlogget (elever bruker ingen konto),
 * så siden trenger ingen elev-variant.
 */
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, MessageCircle, Download, Trash2, FileText, Lock, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { toast } from '../state/useToastStore';
import { eksporterMinData, slettMinKonto } from '../lib/data/gdpr';
import { hentTilgangsliste } from '../lib/tilgang';
import { ROUTES } from '../routes/paths';

export function MinSide() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [busy, setBusy] = useState(false);

  async function eksporter() {
    if (!firebaseUser) return;
    setBusy(true);
    try {
      toast.info('Henter data…');
      await eksporterMinData(firebaseUser.uid);
      toast.success('Data lastet ned.');
    } catch {
      toast.error('Kunne ikke eksportere data.');
    } finally {
      setBusy(false);
    }
  }

  async function slett() {
    if (!firebaseUser) return;
    if (!window.confirm('Slette kontoen din permanent? All data fjernes og kan ikke gjenopprettes.')) return;
    setBusy(true);
    try {
      await slettMinKonto(firebaseUser.uid);
      toast.success('Kontoen er slettet.');
      navigate(ROUTES.LANDING);
    } catch (e) {
      console.error(e);
      toast.error('Kunne ikke slette kontoen. Logg inn på nytt og prøv igjen.');
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>
          Hei{bruker?.displayName ? `, ${bruker.displayName}` : ''}!
        </h1>
      </header>

      {/* Tilgangsoversikt — viser hva læreren har tilgang til */}
      <Kort tittel="Din tilgang">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hentTilgangsliste(bruker).map((t) => (
            <div key={t.tekst} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
              {t.tilgjengelig
                ? <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                : <Circle size={16} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />}
              <div>
                <span style={{ color: t.tilgjengelig ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: t.tilgjengelig ? 600 : 400 }}>
                  {t.tekst}
                </span>
                {!t.tilgjengelig && t.forklaring && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block' }}>{t.forklaring}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Kort>

      {/* Profil */}
      <Kort tittel={<><User size={20} color="var(--color-primary)" aria-hidden="true" /> Min profil</>}>
        <Rad etikett="E-post" verdi={firebaseUser?.email ?? '–'} />
        <Rad etikett="Rolle" verdi={bruker?.rolle ?? '–'} />
        <Rad etikett="Bruker-ID" verdi={firebaseUser?.uid ?? '–'} />
      </Kort>

      {/* GDPR */}
      <Kort tittel={<><ShieldCheck size={20} color="var(--color-primary)" aria-hidden="true" /> Personvern & dine rettigheter</>}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 12 }}>
          I henhold til GDPR kan du laste ned eller slette dataene dine.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button" onClick={eksporter} disabled={busy} style={sekundaerKnapp}>
            <Download size={18} aria-hidden="true" /> Last ned mine data (JSON)
          </button>
          <button type="button" onClick={slett} disabled={busy} style={fareKnapp}>
            <Trash2 size={18} color="var(--color-error)" aria-hidden="true" /> Slett min konto
          </button>
        </div>
      </Kort>

      {/* Support */}
      <Kort tittel={<><MessageCircle size={20} color="var(--color-primary)" aria-hidden="true" /> Support & kontakt</>}>
        <Rad etikett="E-post" verdi="kontakt@glosemester.no" />
        <Rad etikett="Responstid" verdi="Innen 2 virkedager" />
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <a href="/vilkar.html" style={lenke}><FileText size={16} aria-hidden="true" /> Kjøpsvilkår</a>
          <a href="/personvern.html" style={lenke}><Lock size={16} aria-hidden="true" /> Personvern</a>
        </div>
      </Kort>
    </div>
  );
}

function Kort({ tittel, children }: { tittel: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-card)' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>{tittel}</h2>
      {children}
    </section>
  );
}

function Rad({ etikett, verdi }: { etikett: string; verdi: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{etikett}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>{verdi}</span>
    </div>
  );
}

const sekundaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-md)', padding: '12px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)', textAlign: 'left',
};
const fareKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'transparent', color: 'var(--color-error)', border: '2px solid var(--color-error)',
  borderRadius: 'var(--radius-md)', padding: '12px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)', textAlign: 'left',
};
const lenke: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-secondary)', fontWeight: 600, fontSize: 14, textDecoration: 'none' };
