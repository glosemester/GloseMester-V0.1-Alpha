# Plan: Forenkle til GloseMester-only (v2.5.0)

> **Mål:** Fjerne MatteMester og NorskMester fra kodebasen.
> GloseMester lanseres alene. De andre modulene bevares i `docs/FREMTIDSMODULER.md`.

---

## Bakgrunn

Appen har i dag tre fag:
- ✅ **GloseMester** — Engelske gloser (kjerne-produktet)
- ⏸️ **MatteMester** — Matte (ufullstendig, forvirrer brukere)
- ⏸️ **NorskMester** — Norsk (ufullstendig, for lite innhold)

Fag-valgskjermen er unødvendig når det bare er ett fag. Lærerpanelet har faner og input-felter for matte/norsk som aldri brukes. Appen fremstår som halvferdig. Løsningen: fjern alt som ikke er GloseMester.

---

## Omfang — hva fjernes vs. hva beholdes

### Fjernes
| Hva | Fil(er) | Linjer |
|-----|---------|--------|
| MatteMester-sider | `index.html` linje 253–450 + nav 543–549 | ~200 |
| NorskMester-sider | `index.html` linje 452–556 | ~105 |
| Fag-valgskjerm (3 kort → direkte start) | `index.html` linje 136–210 | ~75 |
| Fag-tabs i lærerpanel | `index.html` linje 850–910 | ~60 |
| MatteMester JS | `js/features/matte-practice.js` | ~500 |
| NorskMester JS | `js/features/norsk-practice.js` | ~400 |
| Norsk orddata | `js/data/norskData.js` | ~200 |
| `velgMatteRolle()` | `js/app.js` | ~33 |
| `velgNorskRolle()` | `js/app.js` | ~31 |
| MatteMester v2.0 | `src/features/mattemester/` | hel mappe |
| NorskMester v2.0 | `src/features/norskmester/` | hel mappe |
| Brand-CSS for matte/norsk | `css/main.css` | ~50 |
| Menu-CSS for matte/norsk-nav | `css/main.css` | ~20 |

### Beholdes uendret
- `js/features/practice.js` — GloseMester øvemodus
- `js/features/learningEngine.js` — Leitner + AdaptiveDifficulty
- `js/vocabulary.js` — Engelske ord
- `js/shared/quiz.js` — Prøvemodus for elever
- `js/features/teacher-analytics.js` — Statistikk
- `js/features/saved-tests.js` — Mine prøver
- `js/features/kort-display.js` — Kortsamling
- `js/data/cardsData.js` — Kortbelønninger
- Hele `css/main.css` minus matte/norsk-spesifikke regler
- Alle Netlify-funksjoner
- Alle Firebase/Stripe-filer

---

## Steg-for-steg implementering

### Steg 1 — Fjern HTML-sider (index.html)

**1a. Erstatt `#fag-velger` med direkte GloseMester-start**

Den eksisterende fag-valgskjermen (3 kort) erstattes av en enkel splash/landing som sender brukeren direkte til GloseMester-start, eller fjernes helt og navigasjonen starter på `#glosemester-start`.

```html
<!-- FJERNES (linje 136-210): -->
<div id="fag-velger" class="page active">
    <div class="fag-grid">
        <!-- GloseMester, MatteMester, NorskMester kort -->
    </div>
</div>

<!-- ERSTATTES MED: -->
<div id="fag-velger" class="page active">
    <!-- Tom / redirect til glosemester-start automatisk via JS -->
</div>
```

Alternativt: sett `active` direkte på `#glosemester-start` og fjern `#fag-velger` helt.

**1b. Fjern MatteMester-sider (~200 linjer)**

Slett hele disse blokkene fra index.html:
- `<div id="mattemester-start" class="page">` (linje ~253–290)
- `<div id="matte-oving-start" class="page">` (linje ~331–348)
- `<div id="matte-nivaa-velger" class="page">` (linje ~350–361)
- `<div id="matte-oving-omraade" class="page">` (linje ~363–435)
- `<div id="matte-resultat" class="page">` (linje ~437–450)
- `<nav id="matte-oving-meny">` (linje ~543–549)

**1c. Fjern NorskMester-sider (~105 linjer)**

Slett:
- `<div id="norskmester-start" class="page">` (linje ~292–328)
- `<div id="norsk-oving-start" class="page">` (linje ~452–480)
- `<div id="norsk-oving-omraade" class="page">` (linje ~482–540)
- `<nav id="norsk-oving-meny">` (linje ~550–556)

**1d. Forenkle lærerpanel — fjern fag-tabs**

Fjern multi-fag-tabs og behold bare GloseMester-input direkte:

```html
<!-- FJERNES: -->
<div class="fag-tabs">
    <button id="fag-tab-gloser" ...>Gloser</button>
    <button id="fag-tab-matte" ...>Matte</button>   <!-- fjern -->
    <button id="fag-tab-norsk" ...>Norsk</button>   <!-- fjern -->
</div>
<div id="prove-input-matte">...</div>   <!-- fjern hele -->
<div id="prove-input-norsk">...</div>   <!-- fjern hele -->

<!-- BEHOLDES (eventuelt uten wrapper): -->
<div id="prove-input-gloser">
    <!-- norsk ord + engelsk oversettelse -->
</div>
```

---

### Steg 2 — Forenkle app.js

**2a. Fjern imports**
```javascript
// FJERNES:
import './data/norskData.js';

import {
    visMatteOperasjoner, startMatteOving,
    avsluttMatteOving, matteProvIgjen
} from './features/matte-practice.js';

import {
    startNorskOving, sjekkNorskSvar,
    avsluttNorskOving, startLaererDiktat
} from './features/norsk-practice.js';
```

**2b. Fjern window-eksporter**
```javascript
// FJERNES:
window.visMatteOperasjoner = visMatteOperasjoner;
window.startMatteOving = startMatteOving;
window.avsluttMatteOving = avsluttMatteOving;
window.matteProvIgjen = matteProvIgjen;
window.startNorskOving = startNorskOving;
window.sjekkNorskSvar = sjekkNorskSvar;
window.avsluttNorskOving = avsluttNorskOving;
window.startLaererDiktat = startLaererDiktat;
```

**2c. Forenkle `velgFag()`**
```javascript
// FØR:
window.velgFag = function(fag) {
    if (fag === 'gloser') visSide('glosemester-start');
    else if (fag === 'matte') visSide('mattemester-start');
    else if (fag === 'norsk') visSide('norskmester-start');
};

// ETTER (eller fjern funksjonen og kall visSide direkte):
window.velgFag = function() {
    visSide('glosemester-start');
};
```

**2d. Fjern `velgMatteRolle()` og `velgNorskRolle()` (~64 linjer)**

**2e. Forenkle `skjulAlleMenyer()`**
```javascript
// FØR:
['elev-meny', 'oving-meny', 'laerer-meny', 'matte-oving-meny', 'norsk-oving-meny']

// ETTER:
['elev-meny', 'oving-meny', 'laerer-meny']
```

---

### Steg 3 — Forenkle navigation.js

**3a. Fjern menu-referanser**
```javascript
// FJERNES:
const matteOvingMeny = document.getElementById('matte-oving-meny');
const norskOvingMeny = document.getElementById('norsk-oving-meny');
// ...
if (matteOvingMeny) matteOvingMeny.style.display = 'none';
if (norskOvingMeny) norskOvingMeny.style.display = 'none';
// ...
if (fag === 'matte' && matteOvingMeny) matteOvingMeny.style.display = 'flex';
else if (fag === 'norsk' && norskOvingMeny) norskOvingMeny.style.display = 'flex';
```

**3b. Fjern matte/norsk-cases i switch/if**

Fjern alle `case 'matte-*'` og `case 'norsk-*'` navigasjons-cases.

---

### Steg 4 — Forenkle teacher.js

**4a. Fjern `velgProveFag()`** (hele funksjonen, ~35 linjer)

**4b. Fjern input-lyttere for matte/norsk**
```javascript
// FJERNES:
const matteOppgave = document.getElementById('matte-oppgave');
const norskSporsmal = document.getElementById('norsk-sporsmal');
// ... tilhørende event listeners
```

**4c. Fjern `window.velgProveFag = velgProveFag` eksport**

---

### Steg 5 — Slett JS-filer

```bash
rm js/features/matte-practice.js
rm js/features/norsk-practice.js
rm js/data/norskData.js
rm -rf src/features/mattemester/
rm -rf src/features/norskmester/
```

---

### Steg 6 — Rydd CSS (main.css)

Slett disse reglene:
- `.brand-mattemester` og `.brand-norskmester` (merkevare-farger)
- `#matte-oving-meny` og `#norsk-oving-meny` (navbars)
- `#matte-oving-meny.nav-flash-green/red` og `#norsk-oving-meny.nav-flash-green/red`
- Eventuelt: `.fag-grid` kan beholdes men redesignes til 1 kort

---

### Steg 7 — Tilpass lærerpanel-design

Uten fag-tabs trenger lærerpanelet et litt enklere design:

```
[ lag-prove siden ]
  - Tittel-felt (uendret)
  - Ord-input: Norsk → Engelsk (uendret, bare uten tabs over)
  - Legg til-knapp (uendret)
  - Lagret prøve-liste (uendret)
```

Ingen endringer i selve ord-input-logikken. Bare fjerne wrapper og tabs.

---

### Steg 8 — Oppdater startflyt

Siden `#fag-velger` er borte, må appen starte direkte på riktig side:

```
Logget inn som elev   → visSide('glosemester-start')
Logget inn som lærer  → visSide('laerer-dashboard')
Ikke logget inn       → visSide('landing') eller login-skjerm
```

Endre `init.js` / `app.js` / `auth.js` der det kalles `visSide('fag-velger')` til å peke direkte på riktig destinasjon.

---

## Ny brukerflyt etter forenkling

### Elev
```
Login → GloseMester Start
  ↓ Velg trinn (5–7, 8–10, VGS)
  ↓ Velg retning (Norsk→Engelsk / Engelsk→Norsk)
  ↓ Velg modus (Øv / Ta prøve med kode)
  ↓ Øving / Quiz
  ↓ Resultat + kortbelønning
```

### Lærer
```
Login → Dashboard
  ↓ Lag prøve [Tittel + ord-liste]
  ↓ Del via kode / QR
  ↓ Se resultater i statistikk
```

---

## Estimert arbeid

| Steg | Tid |
|------|-----|
| Fjerne HTML-blokker (steg 1) | 30 min |
| Forenkle app.js (steg 2) | 20 min |
| Forenkle navigation.js (steg 3) | 15 min |
| Forenkle teacher.js (steg 4) | 20 min |
| Slette filer (steg 5) | 5 min |
| Rydde CSS (steg 6) | 20 min |
| Tilpasse lærerpanel (steg 7) | 15 min |
| Oppdatere startflyt (steg 8) | 15 min |
| Testing + bugfixes | 30 min |
| **Total** | **~2,5 timer** |

---

## Risikovurdering

| Risiko | Sannsynlighet | Håndtering |
|--------|--------------|------------|
| Fag-logikk brukes av GloseMester-kode | Lav | Grep etter `aktivtFag === 'gloser'` i practice.js |
| `velgFag()` kalles fra uventede steder | Middels | Grep etter `velgFag(` i hele kodebasen |
| CSS-endringer bryter GloseMester-design | Lav | Bare slett klasser som inneholder "matte" eller "norsk" |
| Lærerpanel-logikk avhenger av `aktivProveFag` | Middels | Sjekk teacher.js for `aktivProveFag`-variabel |

---

## Etter forenkling

Resultat:
- Renere brukerflyt — ingen unødvendig fag-velger
- ~750 linjer mindre JS
- ~200 linjer mindre HTML
- ~70 linjer mindre CSS
- 3 færre JS-filer
- Raskere og enklere å vedlikeholde

---

*Plan skrevet: 6. mars 2026*
*Utfør med AI-prompten i docs/PROMPT_GLOSEMESTER_ONLY.md*
