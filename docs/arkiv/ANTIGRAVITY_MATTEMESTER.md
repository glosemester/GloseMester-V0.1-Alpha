# 🤖 ANTIGRAVITY PROMPT: MATTEMESTER

## 📋 KONTEKST

Du skal lage **MatteMester** som en del av **Mester Suite** - en multifaglig læringsplattform. MatteMester er en fagmodul som integreres i den eksisterende GloseMester-appen.

**KRITISK: Dette er IKKE en standalone app!**
- MatteMester er en MODUL i Mester Suite
- Bruk SAMME Firebase-database som GloseMester
- Bruk SAMME kort-system (kort deles på tvers av fag!)
- Bruk SAMME autentisering (Feide + Google)
- Bruk SAMME lærerdashboard

---

## 🔥 FIREBASE KONFIGURASJON (MÅ INKLUDERES)

```javascript
// ✅ VIKTIG: Bruk SAMME Firebase-prosjekt som GloseMester
const firebaseConfig = {
    apiKey: "AIzaSyBVrXniqVZz5t1TdS6jDSf7uS6m-6appUU",
    authDomain: "glosemester-1e67e.firebaseapp.com",
    projectId: "glosemester-1e67e",
    storageBucket: "glosemester-1e67e.firebasestorage.app",
    messagingSenderId: "370013462432",
    appId: "1:370013462432:web:fbf33e44d56629d715cec5"
};
```

---

## 📁 FILSTRUKTUR

Lag følgende filer i `js/fag/mattemester/`:

```
js/fag/mattemester/
├── oppgaver.js         // Oppgavegenerator (se spec under)
├── practice.js         // Øvingsmodus (tilpasset fra GloseMester)
└── kort-data.js        // Kort-temaer (romvesen, raketter, planeter, roboter)
```

**VIKTIG:** IKKE lag nye filer for kort-system eller galleri. Bruk eksisterende:
- `/js/shared/kort-system.js` (delt)
- `/js/features/gallery.js` (delt)
- `/js/data/cardsData.js` (utvides med nye kort)

---

## 🎨 DESIGN

**Primærfarge:** `#0071e3` (blå)
**Sekundærfarge:** `#4A90E2` (lys blå)
**Emoji:** ➕ 🔢 📐

**Kort-kategorier** (152 nye kort totalt):
- 🛸 **Romvesen** (40 kort)
- 🚀 **Raketter** (40 kort)
- 🪐 **Planeter** (36 kort)
- 🤖 **Roboter** (36 kort)

**VIKTIG:** Disse kortene legges til i `/js/data/cardsData.js` sammen med eksisterende kort (biler, guder, dyr, dinosaurer). Elevene samler alle kort i ÉN felles samling på tvers av fag!

---

## 📚 MATTEOPPGAVER - SPESIFIKASJON

### **Oppgavetyper per nivå:**

```javascript
const matteOppgaver = {
    niva1: {
        // Telling og enkle operasjoner (1-20)
        typer: ['telling', 'addisjon', 'subtraksjon'],
        tallområde: [1, 20],
        lk20: ['K1-01', 'K1-02', 'K1-03']
    },
    niva2: {
        // Utvidet tallområde (1-100)
        typer: ['addisjon', 'subtraksjon', 'ganging_enkelt'],
        tallområde: [1, 100],
        gangetabellTil: 5, // Kun 1-5 ganger
        lk20: ['K2-01', 'K2-02', 'K2-04']
    },
    niva3: {
        // Full gangetabell (1-10)
        typer: ['addisjon', 'subtraksjon', 'multiplikasjon', 'divisjon_enkel'],
        tallområde: [1, 100],
        gangetabellTil: 10,
        lk20: ['K3-02', 'K3-03', 'K3-04']
    },
    niva4: {
        // Avansert (store tall, desimaler, brøk)
        typer: ['multiplikasjon', 'divisjon', 'brøk', 'desimal', 'prosent'],
        tallområde: [1, 1000],
        gangetabellTil: 12,
        lk20: ['K4-03', 'K4-04', 'K5-02']
    }
};
```

### **Oppgavegenerator - Pseudokode:**

```javascript
function genererMatteOppgave(nivå) {
    const config = matteOppgaver[nivå];
    const type = velgTilfeldig(config.typer);

    switch(type) {
        case 'addisjon':
            const a = tilfeldigTall(config.tallområde);
            const b = tilfeldigTall(config.tallområde);
            return {
                spørsmål: `${a} + ${b}`,
                svar: a + b,
                type: 'addisjon'
            };

        case 'multiplikasjon':
            const x = tilfeldigTall([1, config.gangetabellTil]);
            const y = tilfeldigTall([1, config.gangetabellTil]);
            return {
                spørsmål: `${x} × ${y}`,
                svar: x * y,
                type: 'multiplikasjon'
            };

        case 'brøk':
            // Forenkle brøker, addere brøker, etc.
            return genererBrøkOppgave();

        // ... flere typer
    }
}
```

---

## 🎮 PRACTICE-MODUS (practice.js)

Tilpass `js/fag/glosemester/practice.js` til matematikk:

**Forskjeller fra GloseMester:**

1. **Input-metode:**
   ```javascript
   // GloseMester: Tekst-input eller flervalg
   // MatteMester: Tall-tastatur (0-9, delete)

   <div id="tall-tastatur">
       <button onclick="leggTilTall(1)">1</button>
       <button onclick="leggTilTall(2)">2</button>
       <!-- ... 3-9 -->
       <button onclick="leggTilTall(0)">0</button>
       <button onclick="slettTall()">⌫</button>
   </div>
   ```

2. **Ingen "retning":**
   - GloseMester har norsk→engelsk og engelsk→norsk
   - MatteMester har kun oppgave→svar

3. **Ingen bilder:**
   - Matematikk trenger ikke bildestøtte på samme måte

4. **Samme belønningssystem:**
   - 10 riktige = 1 kort
   - Bruk `hentTilfeldigKort()` fra `/js/shared/kort-system.js`

---

## 🏆 KORTBELØNNING - FELLES SYSTEM

**VIKTIG:** MatteMester bruker SAMME kort-system som GloseMester!

```javascript
// I practice.js - når 10 riktige er nådd:
import { hentTilfeldigKort } from '../../shared/kort-system.js';

async function giKortBelønning() {
    const kort = await hentTilfeldigKort();

    // Lagre i SAMME samling som GloseMester
    let samling = JSON.parse(localStorage.getItem('kortSamling') || '[]');

    const eksisterende = samling.find(k => k.id === kort.id);
    if (eksisterende) {
        eksisterende.antall++;
    } else {
        samling.push({ ...kort, antall: 1 });
    }

    localStorage.setItem('kortSamling', JSON.stringify(samling));
    visKortPopup(kort);
}
```

**Odds:**
- 85% Common (romvesen, raketter lett)
- 11% Rare (planeter, roboter vanlig)
- 3% Epic (legendære raketter, spesielle planeter)
- 1% Legendary (spesielle romvesen, unike roboter)

---

## 📊 PRØVESYSTEM - MULTI-FAG STØTTE

MatteMester bruker SAMME prøvesystem som GloseMester:

```javascript
// Når lærer lager matteprøve:
await addDoc(collection(db, "prover"), {
    tittel: "Gangetabellen 1-5",
    ordliste: [...matteOppgaver], // Array med oppgaver
    type: 'matte', // ✅ VIKTIG: Angir fagtype
    opprettet_av: user.uid,
    opprettet_dato: serverTimestamp()
});

// Når elev tar matteprøve:
await addDoc(collection(db, "resultater"), {
    prove_id: proveId,
    prove_type: 'matte', // ✅ VIKTIG
    poengsum: riktige,
    elev_id: elevId
});
```

---

## 🎨 UI/UX - MATTEMESTER

**Farge-tema:**
```css
:root {
    --matte-primary: #0071e3;
    --matte-secondary: #4A90E2;
    --matte-success: #34c759;
    --matte-error: #ff3b30;
}
```

**Oppgave-display:**
```html
<div class="matte-oppgave-kort">
    <div class="oppgave-nummer">#3 av 50</div>
    <div class="oppgave-tekst">12 × 5</div>
    <div class="oppgave-input">
        <span id="svar-display">_</span>
    </div>
</div>

<div class="tall-tastatur">
    <!-- 0-9, delete -->
</div>
```

---

## 📝 LK20-TILPASNING

MatteMester følger norsk læreplan (LK20):

**Nivå 1-2 (1.-2. trinn):**
- Telling til 100
- Addisjon/subtraksjon innen 20
- Enkle gangestykker (dobling)

**Nivå 3 (3.-4. trinn):**
- Full gangetabell 1-10
- Divisjon som reversert ganging
- Tallforståelse til 1000

**Nivå 4 (5.-7. trinn):**
- Store tall (millioner)
- Desimaler og prosent
- Brøker
- Algebra (intro)

---

## 🔗 INTEGRASJON MED MESTER SUITE

**Navigasjon:**
```javascript
// Fra fagvelger → MatteMester
function velgFag('matte') {
    visSide('mattemester-start');
}

// Tilbake til fagvelger
function tilbakeTilFagvelger() {
    visSide('fag-velger');
}
```

**Meny-struktur:**
```html
<!-- Samme som GloseMester -->
<nav id="matte-meny">
    <button onclick="visSide('matte-start')">Øv</button>
    <button onclick="visSamling()">Samling</button>
    <button onclick="visGalleri()">🏆 Galleri</button>
    <button onclick="tilbakeTilFagvelger()">Avslutt</button>
</nav>
```

---

## 🚀 IMPLEMENTASJONSPLAN

### **Steg 1: Oppgavegenerator**
```javascript
// js/fag/mattemester/oppgaver.js
export function genererOppgaver(nivå, antall = 50) {
    const oppgaver = [];
    for (let i = 0; i < antall; i++) {
        oppgaver.push(genererEnOppgave(nivå));
    }
    return oppgaver;
}
```

### **Steg 2: Practice-modus**
```javascript
// js/fag/mattemester/practice.js
// Basert på js/fag/glosemester/practice.js
// Endre:
// - Input fra tekst til tall-tastatur
// - Fjern språkretning
// - Behold kortbelønning 100%
```

### **Steg 3: Kort-data**
```javascript
// js/fag/mattemester/kort-data.js
export const matteKort = [
    // Romvesen (40 kort)
    { id: 'romvesen_01', navn: 'Zorg', kategori: 'romvesen', rarity: 'common' },
    // ... 39 flere

    // Raketter (40 kort)
    { id: 'rakett_01', navn: 'Saturn V', kategori: 'raketter', rarity: 'rare' },
    // ... 39 flere

    // Planeter (36 kort)
    { id: 'planet_01', navn: 'Mars', kategori: 'planeter', rarity: 'epic' },
    // ... 35 flere

    // Roboter (36 kort)
    { id: 'robot_01', navn: 'R2-D2', kategori: 'roboter', rarity: 'legendary' },
    // ... 35 flere
];
```

### **Steg 4: Legg til i cardsData.js**
```javascript
// js/data/cardsData.js
import { matteKort } from '../fag/mattemester/kort-data.js';

const cardsData = [
    ...eksisterendeGloseKort, // Biler, guder, dyr, dino
    ...matteKort               // ✅ NYE: Romvesen, raketter, planeter, roboter
];
```

---

## ✅ SJEKKLISTE

- [ ] oppgaver.js genererer matteoppgaver for nivå 1-4
- [ ] practice.js har tall-tastatur istedenfor tekst-input
- [ ] kort-data.js har 152 nye kort (romvesen, raketter, planeter, roboter)
- [ ] cardsData.js oppdatert med nye kort
- [ ] Samme kortbelønning-system som GloseMester
- [ ] Samme galleri (viser ALLE kort på tvers)
- [ ] Samme prøvesystem med type: 'matte'
- [ ] Firebase bruker SAMME database
- [ ] Navigasjon mellom fagvelger ↔ MatteMester fungerer
- [ ] Service Worker cacher nye filer

---

## 🎯 FORVENTET RESULTAT

Etter implementering skal:
1. Fagvelger vise "MatteMester" som aktiv (ikke "kommer snart")
2. Klikk på MatteMester → mattemester-start med rollevelger
3. "Øv Selv" → velg nivå 1-4 → få matteoppgaver med tall-tastatur
4. 10 riktige → få kort fra SAMME pool som GloseMester
5. Galleri viser ALLE kort (både glose-kort og matte-kort)
6. Lærer kan lage matteprøver med type: 'matte'

---

## 📞 VIKTIGE PÅMINNELSER

**DOs:**
✅ Bruk SAMME Firebase-prosjekt
✅ Bruk SAMME kort-samling (localStorage: 'kortSamling')
✅ Bruk SAMME galleri og samling-side
✅ Følg LK20 læreplan
✅ Lag tall-tastatur for input
✅ Test at kortbelønning fungerer på tvers av fag

**DON'Ts:**
❌ IKKE lag ny database eller Firebase-prosjekt
❌ IKKE lag separat kort-system per fag
❌ IKKE lag nytt galleri - bruk eksisterende
❌ IKKE glem type: 'matte' i prøver og resultater
❌ IKKE hardkod admin-status

---

## 🎨 NESTE STEG ETTER IMPLEMENTERING

Når MatteMester er klar:
1. Deploy til Netlify
2. Test at fagvelger → MatteMester fungerer
3. Test at kort samles på tvers av GloseMester og MatteMester
4. Lag NorskMester med samme struktur
5. Beta-testing med skoler

---

**Versjon:** v0.11.0-ALPHA
**Laget av:** Øyvind Nilsen Oksvold
**For:** Mester Suite (GloseMester, MatteMester, NorskMester)
