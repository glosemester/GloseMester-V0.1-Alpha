import { useState } from 'react';
import { CheckCircle2, Mail, School, BookOpen, Users, MessageCircle, FileText } from 'lucide-react';
import { MarketingLayout, InfoKort } from './MarketingLayout';
import { sendSkoleforesporsel, type SkoleForesporsel } from '../../lib/data/skoleforesporsel';
import { toast } from '../../state/useToastStore';

const TOMT: SkoleForesporsel = {
  schoolName: '', orgNumber: '', contactPerson: '', contactEmail: '', contactPhone: '', teacherCount: '', message: '',
};

function ForesporselSkjema() {
  const [data, setData] = useState<SkoleForesporsel>(TOMT);
  const [sender, setSender] = useState(false);
  const [sendt, setSendt] = useState(false);

  function felt<K extends keyof SkoleForesporsel>(k: K, v: string) {
    setData((d) => ({ ...d, [k]: v }));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSender(true);
    const res = await sendSkoleforesporsel(data);
    if (res.ok) {
      setSendt(true);
      toast.success('Takk! Vi tar kontakt snart.');
    } else {
      toast.error(res.feil ?? 'Kunne ikke sende forespørselen.');
    }
    setSender(false);
  }

  if (sendt) {
    return (
      <InfoKort tittel={<><CheckCircle2 size={20} color="var(--color-success)" aria-hidden="true" /> Forespørsel mottatt</>}>
        Takk for interessen! Vi tar kontakt på {data.contactEmail} så snart som mulig.
      </InfoKort>
    );
  }

  return (
    <InfoKort tittel={<><Mail size={20} color="var(--color-primary)" aria-hidden="true" /> Be om tilbud</>}>
      <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input required value={data.schoolName} onChange={(e) => felt('schoolName', e.target.value)} placeholder="Skolens navn *" style={inp} />
        <input required value={data.orgNumber} onChange={(e) => felt('orgNumber', e.target.value)} placeholder="Organisasjonsnummer *" style={inp} />
        <input required value={data.contactPerson} onChange={(e) => felt('contactPerson', e.target.value)} placeholder="Kontaktperson *" style={inp} />
        <input required type="email" value={data.contactEmail} onChange={(e) => felt('contactEmail', e.target.value)} placeholder="E-post *" style={inp} />
        <input required value={data.contactPhone} onChange={(e) => felt('contactPhone', e.target.value)} placeholder="Telefon *" style={inp} />
        <input required type="number" min="1" value={data.teacherCount} onChange={(e) => felt('teacherCount', e.target.value)} placeholder="Antall lærere *" style={inp} />
        <textarea value={data.message} onChange={(e) => felt('message', e.target.value)} placeholder="Melding (valgfritt)" rows={3} style={{ ...inp, resize: 'vertical' }} />
        <button type="submit" disabled={sender} style={knapp}>{sender ? 'Sender…' : 'Send forespørsel'}</button>
      </form>
    </InfoKort>
  );
}

const inp: React.CSSProperties = {
  padding: '11px 14px', fontSize: 15, border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', outline: 'none', fontFamily: 'var(--font-primary)',
};
const knapp: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '12px 18px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)',
};

export function ForSkoler() {
  return (
    <MarketingLayout
      tittel="For skoler"
      ingress="GloseMester Skolepakke gir hele skolen tilgang — med Feide-innlogging, delt prøvebank og ubegrenset antall lærere."
    >
      <InfoKort tittel={<><School size={20} color="var(--color-primary)" aria-hidden="true" /> Feide-innlogging</>}>
        Sikker pålogging for alle lærere via Feide. Ingen separate passord å holde styr på.
      </InfoKort>
      <InfoKort tittel={<><BookOpen size={20} color="var(--color-primary)" aria-hidden="true" /> GloseBank</>}>
        Del prøver internt på skolen, slik at lærere kan gjenbruke og bygge videre
        på hverandres opplegg.
      </InfoKort>
      <InfoKort tittel={<><Users size={20} color="var(--color-primary)" aria-hidden="true" /> Ubegrenset antall lærere</>}>
        Én skolelisens dekker alle lærerne deres — ingen begrensning på antall kontoer.
      </InfoKort>
      <InfoKort tittel={<><MessageCircle size={20} color="var(--color-primary)" aria-hidden="true" /> Dedikert support</>}>
        Prioritert support og opplæring, samt fakturering med 30 dagers betalingsfrist.
      </InfoKort>
      <InfoKort tittel={<><FileText size={20} color="var(--color-primary)" aria-hidden="true" /> Avtaler</>}>
        Tilgang reguleres av en <a href="/skoleavtale.html" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>skoleavtale</a>{' '}
        og en <a href="/databehandleravtale.html" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>databehandleravtale</a>{' '}
        (GDPR art. 28). Begge kan leses og signeres digitalt.
      </InfoKort>
      <ForesporselSkjema />
    </MarketingLayout>
  );
}
