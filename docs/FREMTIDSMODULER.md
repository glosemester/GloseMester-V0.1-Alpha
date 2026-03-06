# Fremtidsmoduler — Spesifikasjoner for MatteMester og NorskMester

> **Status:** Satt på pause. GloseMester lanseres alene (Q2 2026).
> Disse spesifikasjonene er bevart for fremtidig utvidelse av Mester Suite.

---

## Oversikt

Mester Suite var opprinnelig planlagt med tre moduler:

| Modul | Fag | Status |
|-------|-----|--------|
| **GloseMester** | Engelske gloser (1.–10. trinn + VGS) | ✅ Aktiv — lanseres Q2 2026 |
| **MatteMester** | Matematikk (grunnleggende regneregler) | ⏸️ Pause — bevart for fremtid |
| **NorskMester** | Norsk ordforråd og grammatikk | ⏸️ Pause — bevart for fremtid |

---

## MatteMester — Spesifikasjon

### Konsept
Adaptiv matteøving basert på de fire grunnleggende regneoperasjonene. Tilpasset seg nivå etter prestasjon via `AdaptiveDifficulty`-klassen.

### Funksjonalitet (implementert i v2.3.x)
- **Operasjoner:** Addisjon, subtraksjon, multiplikasjon, divisjon
- **Nivåtilpasning:** Automatisk vanskelighetsgrad basert på siste 10 svar
- **Modus:** Flervalg (4 alternativer) og skriving (adaptivt)
- **Progresjon:** Daglig telleverket med dato-reset (`dailyCorrect`)
- **Lyd:** `spillLyd('riktig')` / `spillLyd('feil')` integrert

### Teknisk implementasjon
```
js/features/matte-practice.js     — Øvingslogikk (500+ linjer)
src/features/mattemester/         — v2.0-struktur (ikke ferdigstilt)
  ├── index.js
  ├── mattemester.js
  └── oppgave-generator.js
```

### HTML-sider i index.html (fjernet i v2.5.0)
- `#mattemester-start` — Rolle-valg (øving/kode/lærer)
- `#matte-oving-start` — Operasjonsvalg (addisjon/subtraksjon/multiplikasjon/divisjon)
- `#matte-nivaa-velger` — Nivå-valg
- `#matte-oving-omraade` — Øvingscontainer
- `#matte-resultat` — Resultatskjerm
- `<nav id="matte-oving-meny">` — Navigasjonsbar

### CSS-klasser (fjernet i v2.5.0)
- `.brand-mattemester` — Lilla merkevare-stil
- `#matte-oving-meny` — Matte-navigasjonsbar
- `#matte-oving-meny.nav-flash-green/red` — Feedback-animasjon

### Teacher-integrasjon (planlagt)
- Fag-tab `fag-tab-matte` i prøve-editor
- Separat input-seksjon `#prove-input-matte` med feltene:
  - `#matte-oppgave` — Spørsmål (f.eks. "3 + 4")
  - `#matte-svar` — Fasit
- Standardprøver med `fag: 'matte'` i Firestore

### app.js-funksjoner (fjernet i v2.5.0)
```javascript
window.velgFag('matte')          → visSide('mattemester-start')
window.velgMatteRolle(rolle)      → Navigerer til øving/kode/laerer
window.visMatteOperasjoner()      → Viser operasjonsvalg
window.startMatteOving(op)        → Starter økten
window.avsluttMatteOving()        → Avslutter og viser resultat
window.matteProvIgjen()           → Starter på nytt
```

### Gjenstående arbeid for lansering
- [ ] `dailyCorrect` nullstilles aldri ved ny dag — trenger dato-sjekk
- [ ] AdaptiveDifficulty ikke koblet til learningEngine.js
- [ ] Mangler Leitner-system (prosedyriske oppgaver passer ikke)
- [ ] Ingen standardprøver for matte i GloseBank

---

## NorskMester — Spesifikasjon

### Konsept
Leitner-basert norsk ordforrådsøving på morsmål. Nivåbasert med 6 temaer
tilpasset ulike trinn (barneskole til videregående).

### Funksjonalitet (implementert i v2.3.x)
- **Innhold:** 6 nivåer × ~30 ord = ~180 norske ordpar (antonym/synonym/definisjon)
- **Leitner-system:** Ord som besvares feil repeteres hyppigere
- **Modus:** Flervalg og skriving (adaptivt via `AdaptiveDifficulty`)
- **Diktat-modus:** Lydopptak for lærere (`startLaererDiktat`)
- **Lyd:** `spillLyd('riktig')` / `spillLyd('feil')` integrert

### Teknisk implementasjon
```
js/features/norsk-practice.js     — Øvingslogikk (400+ linjer)
js/data/norskData.js              — Ordlister (6 nivåer)
src/features/norskmester/         — v2.0-struktur (ikke ferdigstilt)
  ├── index.js
  ├── norskmester.js
  └── norsk-data.js
```

### Datastruktur `norskData.js`
```javascript
norskVokabular = {
    niva1: [ { ord: 'sol',    beskrivelse: 'En stor stjerne'     }, ... ],
    niva2: [ { ord: 'hav',    beskrivelse: 'Stort vannområde'    }, ... ],
    niva3: [ { ord: 'frihet', beskrivelse: 'Fravær av tvang'     }, ... ],
    niva4: [ ... ],
    niva5: [ ... ],
    niva6: [ ... ]
}
```

### HTML-sider i index.html (fjernet i v2.5.0)
- `#norskmester-start` — Rolle-valg (øving/kode/lærer)
- `#norsk-oving-start` — Nivå-valg og innstillinger
- `#norsk-oving-omraade` — Øvingscontainer
- `<nav id="norsk-oving-meny">` — Navigasjonsbar

### CSS-klasser (fjernet i v2.5.0)
- `.brand-norskmester` — Rød merkevare-stil
- `#norsk-oving-meny` — Norsk-navigasjonsbar
- `#norsk-oving-meny.nav-flash-green/red` — Feedback-animasjon

### Teacher-integrasjon (planlagt)
- Fag-tab `fag-tab-norsk` i prøve-editor
- Separat input-seksjon `#prove-input-norsk` med feltene:
  - `#norsk-sporsmal` — Spørsmål (f.eks. "Hva betyr 'sol'?")
  - `#norsk-svar` — Fasit
- Standardprøver med `fag: 'norsk'` i Firestore
- Diktat-opptak med Firestore Storage

### app.js-funksjoner (fjernet i v2.5.0)
```javascript
window.velgFag('norsk')           → visSide('norskmester-start')
window.velgNorskRolle(rolle)      → Navigerer til øving/kode/laerer
window.startNorskOving(niva)      → Starter økten
window.sjekkNorskSvar()           → Sjekker input-svar
window.avsluttNorskOving()        → Avslutter økten
window.startLaererDiktat()        → Starter diktat-opptak
```

### Gjenstående arbeid for lansering
- [ ] Leitner ikke koblet opp via learningEngine.js (nøkkel: `mester_norsk_*`)
- [ ] AdaptiveDifficulty ikke ferdig integrert
- [ ] `norskData.js` mangler mange ord (30 ord per nivå er for lite)
- [ ] Diktat-opptak mangler Firebase Storage Rules
- [ ] Ingen standardprøver for norsk i GloseBank

---

## Gjeninnføring av modulene — Sjekkliste

Når GloseMester er stabilt lansert og har betalende brukere, kan modulene legges til én om gangen. Anbefalt rekkefølge:

### Fase A — Infrastruktur (1 uke)
- [ ] Legg tilbake `#fag-velger` med 2-3 fag-kort
- [ ] Gjeninnfør `velgFag()` med matte/norsk-grener
- [ ] Legg tilbake fag-tabs i lærerpanelet

### Fase B — MatteMester (2-3 uker)
- [ ] Legg tilbake `matte-practice.js` med `dailyCorrect`-fix
- [ ] Koble AdaptiveDifficulty til learningEngine.js
- [ ] Legg til 5+ standardprøver for matte
- [ ] Test hele flyten (elev + lærer)

### Fase C — NorskMester (3-4 uker)
- [ ] Legg tilbake `norsk-practice.js` og `norskData.js`
- [ ] Koble Leitner via learningEngine.js (`mester_norsk_*`)
- [ ] Utvid ordlister (minimum 100 ord per nivå)
- [ ] Legg til 5+ standardprøver for norsk
- [ ] Firebase Storage Rules for diktat
- [ ] Test hele flyten (elev + lærer + diktat)

---

## Arkiverte git-commits

Kode for begge modulene er bevart i git-historikken:

- `b8671ab` — Siste commit med alle 3 moduler intakt
- Grep etter `matte-practice`, `norsk-practice`, `norskData` for å finne koden

---

*Sist oppdatert: 6. mars 2026 — v2.5.0 simplification*
