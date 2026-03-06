# AI-prompt: Forenkle GloseMester til kun én modul

> Kopier hele prompten under og lim den inn i en ny Claude Code-sesjon.

---

```
Du skal forenkle GloseMester-appen fra 3 moduler (GloseMester, MatteMester, NorskMester) til kun GloseMester.

Prosjektet ligger i: /home/user/GloseMester-V0.1-Alpha
Branch: claude/plan-mestersuite-2.0-eZWce (eller aktuell branch)

Les disse filene FØR du begynner:
- docs/PLAN_GLOSEMESTER_ONLY.md  ← detaljert steg-for-steg plan
- docs/FREMTIDSMODULER.md         ← specs som skal bevares (ikke slett disse)

---

## OPPGAVE

Gjennomfør alle 8 stegene i PLAN_GLOSEMESTER_ONLY.md. Her er et sammendrag:

### Steg 1 — index.html: Fjern HTML-blokker
1a. Erstatt `#fag-velger`-skjermen (linje ~136–210) med en enkel container som
    automatisk redirecter til `#glosemester-start` via JS (ingen fag-valg nødvendig)
1b. Slett hele disse HTML-blokkene:
    - `<div id="mattemester-start">` (~linje 253–290)
    - `<div id="matte-oving-start">` (~linje 331–348)
    - `<div id="matte-nivaa-velger">` (~linje 350–361)
    - `<div id="matte-oving-omraade">` (~linje 363–435)
    - `<div id="matte-resultat">` (~linje 437–450)
    - `<nav id="matte-oving-meny">` (~linje 543–549)
    - `<div id="norskmester-start">` (~linje 292–328)
    - `<div id="norsk-oving-start">` (~linje 452–480)
    - `<div id="norsk-oving-omraade">` (~linje 482–540)
    - `<nav id="norsk-oving-meny">` (~linje 550–556)
1c. I lærerpanelet (~linje 850–910):
    - Fjern fag-tabs: `<button id="fag-tab-matte">` og `<button id="fag-tab-norsk">`
    - Fjern hele `<div id="prove-input-matte">` og `<div id="prove-input-norsk">`
    - Fjern eller skjul `.fag-tabs` wrapper hvis den bare har én tab igjen
    - Behold `<div id="prove-input-gloser">` som alltid synlig (fjern `style="display:none"`)

### Steg 2 — js/app.js: Rydd opp imports og funksjoner
- Fjern import av `norskData.js`
- Fjern import av `matte-practice.js` og alle dens exports
- Fjern import av `norsk-practice.js` og alle dens exports
- Fjern alle `window.velgMatteRolle`, `window.startMatteOving` osv. eksporter
- Forenkle `velgFag()` til å alltid kalle `visSide('glosemester-start')`
  (eller fjern funksjonen og oppdater HTML til å kalle visSide direkte)
- Slett `velgMatteRolle()`-funksjonen (~linje 256–288)
- Slett `velgNorskRolle()`-funksjonen (~linje 293–324)
- I `skjulAlleMenyer()`: fjern 'matte-oving-meny' og 'norsk-oving-meny' fra array

### Steg 3 — js/core/navigation.js: Forenkle meny-logikk
- Fjern de to linjene som henter `matte-oving-meny` og `norsk-oving-meny` via getElementById
- Fjern linjene som skjuler/viser disse menyene
- Fjern alle `case 'matte-*'` og `case 'norsk-*'` navigasjonsgrener

### Steg 4 — js/features/teacher.js: Fjern fag-logikk
- Slett hele `velgProveFag()`-funksjonen (~35 linjer)
- Fjern `window.velgProveFag = velgProveFag` eksport-linjen
- Fjern event-lyttere for `#matte-oppgave` og `#norsk-sporsmal` input-feltene
- Fjern switch-case-grener i `leggTilOrd()` som håndterer 'matte' og 'norsk'

### Steg 5 — Slett JS-filer
Slett disse filene:
- js/features/matte-practice.js
- js/features/norsk-practice.js
- js/data/norskData.js
- src/features/mattemester/ (hele mappen)
- src/features/norskmester/ (hele mappen)

### Steg 6 — css/main.css: Fjern matte/norsk-spesifikke regler
Slett CSS-reglene for disse selektorene:
- `.brand-mattemester` og alle regler der inne
- `.brand-norskmester` og alle regler der inne
- `#matte-oving-meny` (navigasjonsbar)
- `#norsk-oving-meny` (navigasjonsbar)
- `#matte-oving-meny.nav-flash-green`, `#matte-oving-meny.nav-flash-red`
- `#norsk-oving-meny.nav-flash-green`, `#norsk-oving-meny.nav-flash-red`
- Eventuelle andre regler som kun bruker `#matte-*` eller `#norsk-*` selektorer

### Steg 7 — Tilpass lærerpanel-design
Siden fag-tabs er fjernet:
- Sørg for at GloseMester-ord-input (`#prove-input-gloser`) vises direkte uten tabs
- Fjern CSS/JS som skjuler/viser input-seksjoner basert på valgt fag
- Tittel og ord-input skal være umiddelbart synlige når læreren åpner "Lag prøve"
- Ingen funksjonelle endringer i selve legg-til-ord-logikken

### Steg 8 — Oppdater startflyt
- Finn alle steder i app.js / auth.js / init.js der det kalles `visSide('fag-velger')`
- Endre disse til:
  - Elev: `visSide('glosemester-start')`
  - Lærer: `visSide('laerer-dashboard')`
- Sørg for at appen ikke starter på en blank/tom skjerm

---

## VIKTIGE KRAV

1. IKKE slett docs/FREMTIDSMODULER.md — denne filen skal beholdes
2. IKKE endre GloseMester-kode (practice.js, vocabulary.js, learningEngine.js, quiz.js, kortsamling osv.)
3. IKKE endre lærerpanelet funksjonelt — bare fjern matte/norsk-referanser
4. Test at GloseMester-flyten fortsatt fungerer etter endringene
5. Commit med melding: "refactor: Forenkle til GloseMester-only (v2.5.0) — fjern MatteMester og NorskMester"
6. Push til aktuell branch

---

## VERIFISERING FØR COMMIT

Sjekk at disse fungerer etter endringene:
- [ ] App starter uten feil (ingen ReferenceError på slettede funksjoner)
- [ ] Elev kan starte GloseMester-øving direkte etter innlogging
- [ ] Lærer kan lage ny prøve (ord-input synlig uten fag-tabs)
- [ ] Lærer-dashboard laster statistikk
- [ ] Ingen konsoll-feil relatert til matte/norsk
- [ ] Grep etter `matte-practice` og `norsk-practice` i index.html/app.js — ingen treff

---

## GREP-SJEKKLISTE (kjør disse for å finne gjenværende referanser)

```bash
grep -n "mattemester\|matte-practice\|velgMatteRolle\|matte-oving" index.html js/app.js
grep -n "norskmester\|norsk-practice\|velgNorskRolle\|norsk-oving" index.html js/app.js
grep -n "velgProveFag\|fag-tab-matte\|fag-tab-norsk\|prove-input-matte\|prove-input-norsk" index.html js/features/teacher.js
grep -n "fag-velger\|velgFag" js/app.js js/core/navigation.js
```

Alle disse skal returnere 0 treff etter at endringene er gjort.
```

---

*Prompt-versjon: 1.0 — 6. mars 2026*
