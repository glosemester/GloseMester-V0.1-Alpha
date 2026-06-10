/**
 * Bytte — kortbytte mellom elever. Krever innlogging (ProtectedRoute).
 *  - «Lag bytte»: velg et eid kort → bruk 1 sjetong → få kode + dellenke.
 *  - «Svar på bytte»: tast kode → velg returkort → bekreft → oppgjør.
 *  - Liste over egne aktive bytter (avstemmes ved last).
 *
 * Brand: Lucide-ikoner, korall primær, ingen emoji.
 */
import { useEffect, useMemo, useState } from 'react';
import { Repeat, Plus, KeyRound, Copy, Share2, X, Check, Clock, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../state/useAuthStore';
import { useTradeStore } from '../state/useTradeStore';
import { hentSamling } from '../features/kort/kortSamling';
import { getKortById, glodStil, RARITY_CONFIG, type KortDef } from '../features/kort/kortData';
import type { KortSnapshot, TradeMedId } from '../features/trade/tradeTypes';
import { lookupTrade } from '../features/trade/tradeData';
import { tilgjengeligeSjetonger } from '../features/trade/byttesjetonger';
import { TokenBalance } from '../components/TokenBalance';
import { toast } from '../state/useToastStore';

type Modus = 'oversikt' | 'lag' | 'svar';

function tilSnapshot(k: KortDef): KortSnapshot {
  return { id: k.id, name: k.name, image: k.image, rarity: k.rarity, category: k.category, fag: k.fag };
}

/** Unike eide kort (dedupert, med antall). */
function useEideKort(versjon: number): { kort: KortDef; antall: number }[] {
  return useMemo(() => {
    const antall = new Map<string, number>();
    hentSamling().forEach((k) => antall.set(String(k.id), (antall.get(String(k.id)) ?? 0) + 1));
    const ut: { kort: KortDef; antall: number }[] = [];
    for (const [id, n] of antall) {
      const def = getKortById(id);
      if (def) ut.push({ kort: def, antall: n });
    }
    return ut.sort((a, b) => a.kort.name.localeCompare(b.kort.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versjon]);
}

export function Bytte() {
  const bruker = useAuthStore((s) => s.bruker);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const uid = firebaseUser?.uid ?? '';
  const navn = bruker?.displayName ?? firebaseUser?.displayName ?? 'Elev';

  const myTrades = useTradeStore((s) => s.myTrades);
  const refreshTrades = useTradeStore((s) => s.refreshTrades);
  const oppdaterSjetonger = useTradeStore((s) => s.oppdaterSjetonger);
  const pendingTradeCode = useTradeStore((s) => s.pendingTradeCode);
  const settPendingKode = useTradeStore((s) => s.settPendingKode);

  const [modus, setModus] = useState<Modus>('oversikt');
  const [versjon, setVersjon] = useState(0);
  const eide = useEideKort(versjon);

  useEffect(() => {
    oppdaterSjetonger();
    if (uid) void refreshTrades(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Dyplenke #bytt=KODE → åpne svar-modus med koden forhåndsutfylt.
  useEffect(() => {
    if (pendingTradeCode) setModus('svar');
  }, [pendingTradeCode]);

  function ferdig() {
    setModus('oversikt');
    setVersjon((v) => v + 1);
    if (uid) void refreshTrades(uid);
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 48px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Repeat size={26} strokeWidth={2.5} color="var(--color-primary)" aria-hidden="true" />
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>Bytte</h1>
      </header>

      <div style={{ marginBottom: 20 }}>
        <TokenBalance />
      </div>

      {modus === 'oversikt' && (
        <Oversikt
          eideAntall={eide.length}
          trades={myTrades}
          uid={uid}
          onLag={() => setModus('lag')}
          onSvar={() => setModus('svar')}
        />
      )}
      {modus === 'lag' && (
        <LagBytte eide={eide} uid={uid} navn={navn} onAvbryt={() => setModus('oversikt')} onFerdig={ferdig} />
      )}
      {modus === 'svar' && (
        <SvarBytte
          eide={eide}
          uid={uid}
          navn={navn}
          startKode={pendingTradeCode ?? ''}
          onAvbryt={() => { settPendingKode(null); setModus('oversikt'); }}
          onFerdig={() => { settPendingKode(null); ferdig(); }}
        />
      )}
    </div>
  );
}

// ── Oversikt ────────────────────────────────────────────────────────────────

function Oversikt({ eideAntall, trades, uid, onLag, onSvar }: {
  eideAntall: number; trades: TradeMedId[]; uid: string; onLag: () => void; onSvar: () => void;
}) {
  const cancelTrade = useTradeStore((s) => s.cancelTrade);
  const harSjetong = tilgjengeligeSjetonger() > 0;
  const aktive = trades.filter((t) => t.trade.status === 'pending' || t.trade.status === 'accepted');

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          onClick={onLag}
          disabled={!harSjetong || eideAntall === 0}
          style={{ ...handlingKort, opacity: harSjetong && eideAntall > 0 ? 1 : 0.5 }}
        >
          <Plus size={28} strokeWidth={2.5} color="var(--color-primary)" aria-hidden="true" />
          <span style={{ fontWeight: 800 }}>Lag bytte</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {eideAntall === 0 ? 'Du har ingen kort ennå' : harSjetong ? 'Tilby et kort (1 sjetong)' : 'Øv mer for å tjene en sjetong'}
          </span>
        </button>
        <button type="button" onClick={onSvar} style={handlingKort}>
          <KeyRound size={28} strokeWidth={2.5} color="var(--color-secondary)" aria-hidden="true" />
          <span style={{ fontWeight: 800 }}>Svar på bytte</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Har du en byttekode?</span>
        </button>
      </div>

      <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>Aktive bytter</h2>
      {aktive.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Ingen aktive bytter akkurat nå.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {aktive.map(({ tradeId, trade }) => {
            const erMin = trade.initiatorUid === uid;
            return (
              <div key={tradeId} style={tradeRad}>
                <img src={trade.offeredKort.image} alt="" style={miniBilde} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {erMin ? 'Du tilbyr' : `${trade.initiatorName} tilbyr`}: {trade.offeredKort.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {trade.status === 'pending'
                      ? <><Clock size={13} aria-hidden="true" /> Venter på svar · kode {trade.code}</>
                      : <><Check size={13} aria-hidden="true" /> Godtatt</>}
                  </div>
                </div>
                {erMin && trade.status === 'pending' && (
                  <button type="button" onClick={() => void cancelTrade(uid, tradeId)} style={ikonKnapp} aria-label="Avbryt bytte">
                    <X size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Lag bytte ───────────────────────────────────────────────────────────────

function LagBytte({ eide, uid, navn, onAvbryt, onFerdig }: {
  eide: { kort: KortDef; antall: number }[]; uid: string; navn: string; onAvbryt: () => void; onFerdig: () => void;
}) {
  const createTrade = useTradeStore((s) => s.createTrade);
  const [valgt, setValgt] = useState<KortDef | null>(null);
  const [resultat, setResultat] = useState<{ code: string } | null>(null);
  const [laster, setLaster] = useState(false);

  async function lag() {
    if (!valgt) return;
    setLaster(true);
    const res = await createTrade(uid, navn, tilSnapshot(valgt));
    setLaster(false);
    if (res) setResultat({ code: res.code });
  }

  if (resultat) {
    const lenke = `${window.location.origin}/bytte#bytt=${resultat.code}`;
    return (
      <div style={panel}>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>Bytte opprettet</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Del koden, lenken eller QR-koden med en venn. De har 15 minutter på å svare.
        </p>
        <div style={kodeBoks}>{resultat.code}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <QRCodeSVG value={lenke} size={168} aria-label={`QR-kode for byttekode ${resultat.code}`} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10, textAlign: 'center', maxWidth: 320 }}>
            Vennen skanner koden og kommer rett til byttet — logger inn først hvis de ikke allerede er det.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(resultat.code); toast.success('Kode kopiert'); }} style={sekundaerKnapp}>
            <Copy size={16} aria-hidden="true" /> Kopier kode
          </button>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(lenke); toast.success('Lenke kopiert'); }} style={sekundaerKnapp}>
            <Share2 size={16} aria-hidden="true" /> Kopier lenke
          </button>
        </div>
        <button type="button" onClick={onFerdig} style={{ ...primaerKnapp, marginTop: 20, width: '100%' }}>Ferdig</button>
      </div>
    );
  }

  return (
    <div style={panel}>
      <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 4 }}>Velg kort å tilby</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 16 }}>Koster 1 byttesjetong.</p>
      <KortVelger eide={eide} valgt={valgt} onVelg={setValgt} />
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button type="button" onClick={onAvbryt} style={sekundaerKnapp}>Avbryt</button>
        <button type="button" onClick={lag} disabled={!valgt || laster} style={{ ...primaerKnapp, flex: 1, opacity: valgt && !laster ? 1 : 0.5 }}>
          {laster ? 'Oppretter…' : 'Opprett bytte'}
        </button>
      </div>
    </div>
  );
}

// ── Svar på bytte ───────────────────────────────────────────────────────────

function SvarBytte({ eide, uid, navn, startKode, onAvbryt, onFerdig }: {
  eide: { kort: KortDef; antall: number }[]; uid: string; navn: string; startKode: string; onAvbryt: () => void; onFerdig: () => void;
}) {
  const acceptTrade = useTradeStore((s) => s.acceptTrade);
  const [kode, setKode] = useState(startKode.toUpperCase());
  const [funnet, setFunnet] = useState<{ tradeId: string; tilbudt: KortSnapshot } | null>(null);
  const [valgt, setValgt] = useState<KortDef | null>(null);
  const [laster, setLaster] = useState(false);

  // Auto-slå opp hvis vi kom inn med en dyplenke-kode.
  useEffect(() => {
    if (startKode) void slaOpp(startKode.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function slaOpp(k: string) {
    setLaster(true);
    const res = await lookupTrade(k, uid);
    setLaster(false);
    if (!res.ok) {
      const m = res.feil === 'not_found' ? 'Fant ingen handel med den koden.'
        : res.feil === 'expired' ? 'Handelen er utløpt.'
        : res.feil === 'self' ? 'Du kan ikke svare på ditt eget bytte.' : 'Handelen er ikke tilgjengelig.';
      toast.error(m);
      return;
    }
    setFunnet({ tradeId: res.tradeId, tilbudt: res.trade.offeredKort });
  }

  async function bekreft() {
    if (!funnet || !valgt) return;
    setLaster(true);
    const ok = await acceptTrade(uid, navn, funnet.tradeId, tilSnapshot(valgt));
    setLaster(false);
    if (ok) onFerdig();
  }

  if (!funnet) {
    return (
      <div style={panel}>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>Tast byttekode</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (kode.length >= 4) void slaOpp(kode); }} style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="F.eks. K4QR2X"
            style={{ ...kodeInput, flex: 1 }}
          />
          <button type="submit" disabled={kode.length < 4 || laster} style={{ ...primaerKnapp, opacity: kode.length >= 4 && !laster ? 1 : 0.5 }}>
            {laster ? 'Søker…' : 'Søk'}
          </button>
        </form>
        <button type="button" onClick={onAvbryt} style={{ ...sekundaerKnapp, marginTop: 16 }}>Avbryt</button>
      </div>
    );
  }

  const cfg = RARITY_CONFIG[funnet.tilbudt.rarity];
  return (
    <div style={panel}>
      <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>Du får dette kortet</h2>
      <div className="kort-glod" style={{ ...glodStil(funnet.tilbudt.rarity), display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `2px solid ${cfg.farge}`, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
        <img src={funnet.tilbudt.image} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />
        <div>
          <div style={{ fontWeight: 800 }}>{funnet.tilbudt.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cfg.farge }}>{cfg.tekst}</div>
        </div>
      </div>

      <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>Velg kort å gi tilbake</h2>
      <KortVelger eide={eide} valgt={valgt} onVelg={setValgt} />
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button type="button" onClick={onAvbryt} style={sekundaerKnapp}>Avbryt</button>
        <button type="button" onClick={bekreft} disabled={!valgt || laster} style={{ ...primaerKnapp, flex: 1, opacity: valgt && !laster ? 1 : 0.5 }}>
          {laster ? 'Bytter…' : 'Bekreft bytte'}
        </button>
      </div>
    </div>
  );
}

// ── Felles kort-velger ──────────────────────────────────────────────────────

function KortVelger({ eide, valgt, onVelg }: {
  eide: { kort: KortDef; antall: number }[]; valgt: KortDef | null; onVelg: (k: KortDef) => void;
}) {
  if (eide.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Lock size={28} aria-hidden="true" />
        Du har ingen kort å bytte ennå.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
      {eide.map(({ kort, antall }) => {
        const cfg = RARITY_CONFIG[kort.rarity];
        const erValgt = valgt?.id === kort.id;
        return (
          <button
            key={kort.id}
            type="button"
            onClick={() => onVelg(kort)}
            className={erValgt ? undefined : 'kort-glod'}
            style={{
              ...(erValgt ? {} : glodStil(kort.rarity)),
              position: 'relative', textAlign: 'center', cursor: 'pointer', padding: 6,
              background: 'var(--color-surface)', fontFamily: 'var(--font-primary)',
              border: `2px solid ${erValgt ? 'var(--color-primary)' : cfg.farge}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: erValgt ? 'var(--shadow-md)' : 'none',
              transform: erValgt ? 'translateY(-2px)' : 'none', transition: 'all 0.12s',
            }}
          >
            <img src={kort.image} alt={kort.name} loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kort.name}</div>
            {antall > 1 && (
              <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--color-primary)', color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>×{antall}</span>
            )}
            {erValgt && (
              <span style={{ position: 'absolute', top: 2, left: 2, background: 'var(--color-primary)', color: '#fff', borderRadius: 999, width: 18, height: 18, display: 'grid', placeItems: 'center' }}>
                <Check size={12} aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Stiler ──────────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-primary)',
};
const handlingKort: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: '20px 14px', cursor: 'pointer',
  boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-primary)',
};
const tradeRad: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
  background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
};
const miniBilde: React.CSSProperties = { width: 44, height: 44, objectFit: 'contain', flexShrink: 0 };
const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '11px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const sekundaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-full)', padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const ikonKnapp: React.CSSProperties = {
  display: 'grid', placeItems: 'center', width: 36, height: 36, flexShrink: 0,
  background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)',
  borderRadius: '50%', cursor: 'pointer',
};
const kodeBoks: React.CSSProperties = {
  textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: '0.18em',
  color: 'var(--color-primary)', background: 'var(--color-primary-light)',
  borderRadius: 'var(--radius-lg)', padding: '16px 12px', fontFamily: 'var(--font-primary)',
};
const kodeInput: React.CSSProperties = {
  padding: '12px 16px', fontSize: 20, fontWeight: 800, letterSpacing: '0.12em', textAlign: 'center',
  textTransform: 'uppercase', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  outline: 'none', fontFamily: 'var(--font-primary)',
};
