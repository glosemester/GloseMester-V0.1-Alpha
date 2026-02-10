# 🎓 Mester Suite v2.0.2-ALPHA - Komplett Arkitektur & Funksjonsoversikt

**Dato:** 2026-02-10
**Versjon:** v2.0.2-ALPHA
**Branch:** `claude/fag-start-final-RJt6w`

---

## 📋 INNHOLDSFORTEGNELSE

1. [Overordnet Arkitektur](#overordnet-arkitektur)
2. [Filstruktur](#filstruktur)
3. [Fagmoduler](#fagmoduler)
4. [Brukerflyter](#brukerflyter)
5. [Kjernefunksjonalitet](#kjernefunksjonalitet)
6. [Teknisk Stack](#teknisk-stack)
7. [Status & Gjenstående Arbeid](#status--gjenstående-arbeid)

---

## 🏗️ OVERORDNET ARKITEKTUR

### Konseptmodell

```
┌─────────────────────────────────────────────────────────────────┐
│                     MESTER SUITE v2.0                           │
│                                                                 │
│  Entry Point: index-v2.html                                    │
│  ├─ Landing Page (fagvelger)                                   │
│  │   ├─ 📚 GloseMester                                         │
│  │   ├─ ➕ MatteMester                                         │
│  │   └─ 📖 NorskMester (kommer snart)                          │
│  │                                                              │
│  └─ Fag-Start (3-valgsstruktur)                               │
│      ├─ 🧠 ØV SELV (åpen for alle)                            │
│      │   └─ Nivåvelger → Øvingsmodus                          │
│      ├─ 📝 PRØVE (gratis for elever)                          │
│      │   └─ Skriv prøvekode → Gjennomfør prøve               │
│      └─ 🎓 LÆRER (krever innlogging)                          │
│          └─ Lærerportal → Lag/administrer prøver             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 FILSTRUKTUR

```
GloseMester-V0.1-Alpha/
│
├── index.html                  # v1.0 (gammel versjon - FASIT)
├── index-v2.html              # v2.0 Entry Point
├── offline.html               # PWA offline fallback
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker v2.0.2-ALPHA
│
├── src/
│   ├── app.js                 # v2.0 Main entry point
│   │
│   ├── core/
│   │   ├── auth/
│   │   │   └── firebase-config.js
│   │   │
│   │   ├── navigation/
│   │   │   ├── router.js           # Client-side routing
│   │   │   └── menu-system.js      # ✅ NEW: Bottom nav + hamburger menu
│   │   │
│   │   ├── kort/
│   │   │   ├── kort-system.js      # Card reward system
│   │   │   ├── kort-data.js        # Card database
│   │   │   ├── kort-reward.js      # Reward logic
│   │   │   └── kort-display.js     # Card UI components
│   │   │
│   │   └── utils/
│   │       ├── feedback.js         # ✅ Toast, vibration, TTS
│   │       ├── storage.js          # ✅ NEW: localStorage management
│   │       └── rate-limiter.js     # ✅ NEW: Rate limiting system
│   │
│   ├── pages/
│   │   ├── landing.js         # Fagvelger (3 fag)
│   │   └── fag-start.js       # 3-choice mellomledd
│   │
│   ├── features/
│   │   ├── base-modul.js      # Abstract base class for all subjects
│   │   │
│   │   ├── glosemester/
│   │   │   ├── index.js
│   │   │   ├── glosemester.js      # ✅ UPDATED: Credits/XP, rate limiting
│   │   │   └── vocabulary-data.js
│   │   │
│   │   ├── mattemester/
│   │   │   ├── index.js
│   │   │   ├── mattemester.js          # ✅ UPDATED: Credits/XP, rate limiting
│   │   │   └── oppgave-generator.js
│   │   │
│   │   └── teacher/
│   │       └── teacher-module.js       # ✅ NEW: Complete teacher portal
│   │
│   └── styles/
│       ├── redesign.css       # Playwize design system
│       └── landing.css
│
├── css/                       # v1.0 CSS (compatibility)
│   ├── main.css
│   ├── kort.css
│   └── popups.css
│
├── js/                        # v1.0 JS (compatibility/FASIT)
│   ├── app.js
│   ├── init.js
│   ├── core/
│   ├── features/
│   └── ui/
│
└── sounds/                    # Audio feedback
    ├── pop.mp3
    ├── correct.mp3
    ├── wrong.mp3
    └── fanfare.mp3
```

---

## 🎯 FAGMODULER

### 1. 📚 **GloseMester** (KOMPLETT)

**Funksjonalitet:**
- ✅ 4 nivåer (niva1-4) med 500+ engelske gloser
- ✅ Flervalgsmodus basert på nivå:
  - Niva 1-2: 100% flervalg
  - Niva 3: 50% flervalg / 50% skriving
  - Niva 4: 20% flervalg / 80% skriving
- ✅ Text-to-Speech (TTS) på hvert alternativ (🔊-knapp)
- ✅ Bilder på utvalgte ord
- ✅ Språkretning: NO→EN eller EN→NO
- ✅ 10-box progress tracker (mot nytt kort)
- ✅ Kontinuerlig kort-belønning (hver 10. riktige)
- ✅ Credits/XP system med yellow progress bar
- ✅ "X riktige i dag"-teller
- ✅ Diamond bonus hver 100 XP (10 diamanter)
- ✅ Rate limiting (100 svar/10 min, 20 kort/time)
- ✅ Vibrasjon ved feil svar
- ✅ Toast-meldinger for feedback

**Datafiler:**
- `vocabulary-data.js` - Ordbok med norsk/engelsk/bilder

---

### 2. ➕ **MatteMester** (KOMPLETT)

**Funksjonalitet:**
- ✅ 3 nivåer (niva1-3)
- ✅ 4 operasjoner: Pluss, Minus, Gange, Dele
- ✅ Dynamisk oppgavegenerering basert på nivå
- ✅ Tallastatur (0-9, backspace, clear, check)
- ✅ Forklaringer ved feil svar
- ✅ 10-box progress tracker
- ✅ Kontinuerlig kort-belønning
- ✅ Credits/XP system
- ✅ "X riktige i dag"-teller
- ✅ Diamond bonus hver 100 XP
- ✅ Rate limiting
- ✅ Vibrasjon ved feil svar

**Datafiler:**
- `oppgave-generator.js` - Matematisk oppgavemotor

---

### 3. 📖 **NorskMester** (PLANLAGT)

**Status:** 🚧 Kommer snart

**Planlagt funksjonalitet:**
- Grammatikk-øvelser
- Tekstforståelse
- Skriveoppdrag
- Samme kort-system som de andre

---

## 👥 BRUKERFLYTER

### 🧠 **ØV SELV** (Åpen for alle - ingen innlogging)

```
1. Landing Page → Velg fag (GloseMester/MatteMester)
2. Fag-Start → Trykk "Øv Selv"
3. Nivåvelger → Velg nivå (niva1-4)
4. Øvingsmodus:
   ├─ Se spørsmål
   ├─ Svar (flervalg eller skriving)
   ├─ Få feedback (riktig/feil)
   ├─ Progress tracker (10 bokser → kort)
   ├─ XP progress bar (100 XP → 10 diamanter)
   └─ "X riktige i dag"-teller
5. Avslutt → Se resultat → Velg igjen eller tilbake
```

**Meny:** Bottom nav (Øv, Samling, Galleri, Avslutt)

---

### 📝 **PRØVE** (Gratis for elever - ingen innlogging)

```
1. Landing Page → Velg fag
2. Fag-Start → Trykk "Prøve"
3. Skriv inn prøvekode (6-tegn, f.eks. "A3K9Z2")
4. Gjennomfør prøve:
   ├─ Tidsbegrensning (valgfritt)
   ├─ Fast rekkefølge (eller shuffled)
   ├─ Samme feedback som Øv Selv
   └─ Ingen kort-belønning (kun XP)
5. Lever inn → Se resultat → Resultater sendes til lærer
```

**Meny:** Bottom nav (Øv, Samling, Galleri, Avslutt)

---

### 🎓 **LÆRER** (Krever innlogging - Feide/Email)

```
1. Landing Page → Velg fag
2. Fag-Start → Trykk "Lærer"
3. Logg inn (Feide/Email/Google)
4. Lærerportal Dashboard:
   ├─ Oversikt over alle prøver
   ├─ Statistikk (antall prøver per fag)
   └─ Velg fag for å lage ny prøve

5. Lag prøve:
   ├─ Velg fag (GloseMester/MatteMester)
   ├─ Fyll inn:
   │   ├─ Prøvetittel
   │   ├─ Nivå
   │   ├─ Antall spørsmål (5-50)
   │   ├─ Tidsbegrensning (0-120 min)
   │   └─ Bland rekkefølge (checkbox)
   └─ Opprett prøve

6. Prøve opprettet:
   ├─ Unik 6-tegn kode genereres (f.eks. "K7M3P1")
   ├─ QR-kode (kan scannes av elever)
   ├─ Kopier kode/link
   └─ Del med elever

7. Administrer prøver:
   ├─ Se alle lagrede prøver
   ├─ Klikk på prøve → Se detaljer
   ├─ Se resultater:
   │   ├─ Elevnavn
   │   ├─ Score (%)
   │   ├─ Antall riktige/totalt
   │   └─ Tidspunkt
   └─ Slett prøve

8. Hamburger-meny:
   ├─ 📊 Dashboard
   ├─ 📝 Lagrede Prøver
   ├─ 📚 Standardprøver (🚧 kommer snart)
   ├─ 📚 GloseBank (🚧 kommer snart)
   ├─ 🔧 Admin (🚧 kommer snart)
   └─ 🚪 Logg ut
```

**Meny:** Top nav (hamburger + brukernavn + Hjem-knapp)

---

## ⚙️ KJERNEFUNKSJONALITET

### 🎁 **Kort-system**

**Hvordan det fungerer:**
1. **Kontinuerlig belønning:** Hver 10. riktige svar = nytt kort
2. **Rate limiting:** Maks 20 kort per time (forhindrer spam)
3. **Lagring:** Alle kort lagres i localStorage
4. **Visning:** Popup-animasjon med kort-bilde og beskrivelse
5. **Samling:** Se alle innsamlede kort i "Mine Kort"
6. **Galleri:** Se statistikk og sjeldne kort

**Kort-typer:**
- GloseMester: Pokemon-inspirerte kort basert på gloser
- MatteMester: Matematiske helte-kort

---

### 💎 **Credits/XP System**

**Hvordan det fungerer:**
1. **XP-opptjening:** 1 XP per riktig svar
2. **Progress bar:** Yellow bar viser fremgang mot 100 XP
3. **Diamond bonus:** Hver 100 XP = 10 diamanter automatisk
4. **Lagring:** Per fag (gloser/matte) i localStorage
5. **Display:** "Mot neste bonuspoeng (100 xp): 47/100"

**Bruk av diamanter:**
- 💎 Fremtidig funksjonalitet: Kjøp power-ups, temaer, ekstrakort

---

### 📊 **"X riktige i dag"-teller**

**Hvordan det fungerer:**
1. **Tracking:** Teller inkrementeres ved hvert riktig svar
2. **Dagsreset:** Nullstilles automatisk ved midnatt
3. **Lagring:** Per fag i localStorage med timestamp
4. **Display:** Vises i praksis-header: "42 riktige i dag"

---

### 🔒 **Rate Limiting**

**Limiters:**
- **practiceLimiter:** 100 svar per 10 minutter
- **cardLimiter:** 20 kort per time
- **testSaveLimiter:** 10 prøver per time
- **schoolInquiryLimiter:** 3 forespørsler per dag

**Feedback:**
- Toast-melding: "🃏 Du har mottatt nok kort for nå! Kom tilbake om 15 minutter"
- Countdown til reset

---

### 📱 **Menu System**

**3 typer menyer:**

#### 1. **Elev-meny** (Bottom Nav)
```
┌────────────────────────────────────────┐
│  🏠 Hjem  🃏 Mine Kort  🏆 Galleri  🚪 Logg ut  │
└────────────────────────────────────────┘
```

#### 2. **Øving-meny** (Bottom Nav)
```
┌───────────────────────────────────────────────┐
│  📚 Øv  🃏 Samling  🏆 Galleri  ❌ Avslutt  │
└───────────────────────────────────────────────┘
```

#### 3. **Lærer-meny** (Top Nav + Hamburger Drawer)
```
┌─────────────────────────────────────────┐
│  ☰ Meny    BrukerNavn    🏠 Hjem       │
└─────────────────────────────────────────┘

Drawer (åpnes med hamburger):
├─ 📊 Dashboard
├─ 📝 Lagrede Prøver
├─ 📚 Standardprøver
├─ 📚 GloseBank
├─ 🔧 Admin
└─ 🚪 Logg ut
```

---

### 🎨 **Playwize Design System**

**Farger:**
```css
--primary-purple: #7C3AED    /* Hovedfarge */
--vibrant-orange: #FB923C    /* MatteMester */
--sunny-yellow: #FBBF24      /* Accents */
--background: #F5F3FF        /* Bakgrunn */
```

**Radiuser:**
```css
--radius-sm: 12px
--radius-md: 20px
--radius-lg: 30px
--radius-xl: 50px
```

**Font:**
- Heading: `Outfit`, `Poppins`
- Body: `Inter`, `DM Sans`

**Effekter:**
- Blobs (svevende gradienter)
- Wave backgrounds
- Bounce/slide animations
- Gradient text
- Drop shadows

---

### 🔊 **Feedback-system**

**Typer:**
1. **Toast-meldinger**
   - Success (grønn): "✅ Riktig!"
   - Error (rød): "❌ Feil svar"
   - Warning (gul): "⚠️ Vennligst fyll ut alle felt"
   - Info (blå): "ℹ️ Prøvekode kopiert!"

2. **Vibrasjon**
   - Feil svar: 200ms vibrasjon

3. **Text-to-Speech (TTS)**
   - Høyttalerknapp (🔊) på flervalgsalternativer
   - Leser opp på norsk eller engelsk

4. **Lydeffekter**
   - `correct.mp3` - Riktig svar
   - `wrong.mp3` - Feil svar
   - `pop.mp3` - Knappeklikk
   - `fanfare.mp3` - Kort vunnet

---

## 💾 DATALAGRING (localStorage)

**Keys:**

```javascript
// Kort
'mester_kort_samling'         // Array av kort-objekter
'mester_kort_stats'           // Statistikk

// Credits/XP
'mester_credits_gloser'       // Diamanter for GloseMester
'mester_credits_matte'        // Diamanter for MatteMester
'mester_total_correct_gloser' // Total XP for GloseMester
'mester_total_correct_matte'  // Total XP for MatteMester

// Daily tracking
'mester_daily_correct_gloser' // { date, count }
'mester_daily_correct_matte'  // { date, count }

// Rate limiting
'mester_rate_limit_data'      // { action: [timestamps] }

// Teacher
'mester_teacher_tests'        // Array av prøve-objekter

// User preferences
'mester_user_prefs'           // Settings
```

---

## 🔧 TEKNISK STACK

### Frontend
- **HTML5** - Semantisk markup
- **CSS3** - Grid, Flexbox, Custom Properties
- **JavaScript ES6+** - Modules, Classes, Async/Await
- **PWA** - Service Worker, Manifest, Offline support

### Libraries
- **QRCode.js** (planlagt) - QR-generering
- **Web Speech API** - Text-to-Speech
- **Vibration API** - Haptisk feedback
- **localStorage** - Client-side storage

### Backend (v1.0 compatibility)
- **Firebase** - Authentication, Firestore
- **Feide** - SSO for skoler

### Design
- **Playwize-inspirert** - Moderne, leken estetikk
- **Mobile-first** - Responsivt for mobil/iPad
- **Accessibility** - ARIA labels, keyboard navigation

---

## ✅ STATUS & GJENSTÅENDE ARBEID

### ✅ FERDIG IMPLEMENTERT

#### Kjernefunksjonalitet
- [x] Fagvelger landing page (3 fag)
- [x] Fag-start mellomledd (Øv Selv / Prøve / Lærer)
- [x] GloseMester full funksjonalitet
- [x] MatteMester full funksjonalitet
- [x] Kort-system med kontinuerlig belønning
- [x] Credits/XP system med diamond bonus
- [x] "X riktige i dag"-teller
- [x] Rate limiting system
- [x] Feedback-system (toast, vibrasjon, TTS)
- [x] Storage utilities (localStorage management)
- [x] Menu System (elev/øving/lærer menyer)
- [x] Teacher Module (komplett lærerportal)

#### Design
- [x] Playwize design system (redesign.css)
- [x] Blob-bakgrunner og wave-effekter
- [x] High-radius komponenter (20-50px)
- [x] Gradient text
- [x] Smooth animasjoner
- [x] Google Fonts integrert

#### PWA
- [x] Service Worker v2.0.2-ALPHA
- [x] Cache-strategi (network-first HTML, cache-first assets)
- [x] Offline fallback page
- [x] Manifest.json

---

### 🚧 GJENSTÅENDE ARBEID

#### Høy prioritet
- [ ] **PWA Install-knapp** - "Installer app"-knapp med iOS fallback
- [ ] **QR-kode integrasjon** - Faktisk QR-generering (ikke placeholder)
- [ ] **Prøve-modus implementering** - Elever kan ta prøver med prøvekode
- [ ] **Resultatsending til lærer** - Prøveresultater lagres og vises
- [ ] **Authentication** - Feide/Email/Google innlogging for lærere
- [ ] **Responsive design testing** - Test på mobil/iPad
- [ ] **Hamburger menu funksjonalitet** - Fullstendig implementert

#### Medium prioritet
- [ ] **Galleri-side** - Vis alle innsamlede kort med statistikk
- [ ] **Samling-side** - Kortvisning med sortering/filtrering
- [ ] **Standardprøver** - Ferdige prøver lærere kan bruke
- [ ] **GloseBank** - Database med delte gloselister
- [ ] **NorskMester** - Tredje fag med grammatikk/tekst
- [ ] **Sound system** - Lydeffekter ved events
- [ ] **Elev-meny for prøve** - Bottom nav under prøvegjennomføring

#### Lav prioritet
- [ ] **Admin-panel** - Brukerstyring, innholdsadministrasjon
- [ ] **Analytics** - Tracking av brukeraktivitet
- [ ] **Logger** - Error logging og debugging
- [ ] **GDPR** - Cookie consent, datapolicy
- [ ] **Teacher analytics** - Dashboard med dyptgående statistikk
- [ ] **Export/Import** - CSV-eksport av resultater
- [ ] **Skolepakke** - Betalingsløsning for skoler
- [ ] **Progress dashboard** - Visuell fremgangsvisning
- [ ] **Learning engine** - Adaptiv vanskelighetsgrad
- [ ] **Darkmode** - Mørkt tema

---

## 🐛 KJENTE ISSUES

1. **Storage import missing** - GloseMester og MatteMester importerer ikke storage-funksjoner ennå
2. **Menu system ikke integrert** - MenuSystem må kobles til fag-start.js
3. **Teacher auth mangler** - Lærerinnlogging ikke implementert ennå
4. **QR placeholder** - QR-generering viser kun placeholder
5. **Prøve-modus UI mangler** - Må lage separate UI for prøver vs øving

---

## 📊 KODEMETRIKK

**Totalt antall filer (v2.0):** ~25 filer
**Lines of Code (LoC):**
- `teacher-module.js`: 740 linjer
- `menu-system.js`: 666 linjer
- `glosemester.js`: 839 linjer
- `mattemester.js`: ~800 linjer
- `rate-limiter.js`: 177 linjer
- `storage.js`: 176 linjer
- `feedback.js`: 171 linjer

**Total LoC (estimat):** ~10,000+ linjer v2.0-kode

---

## 📦 DEPLOYMENT

### Development
```bash
# Start lokal server
python -m http.server 8000

# Åpne i nettleser
http://localhost:8000/index-v2.html
```

### Production
```bash
# Push til GitHub
git push origin claude/fag-start-final-RJt6w

# Merge til main via PR
# Deploy via GitHub Pages / Netlify / Vercel
```

---

## 🔗 LENKER & RESSURSER

- **GitHub Repo:** `glosemester/GloseMester-V0.1-Alpha`
- **Branch:** `claude/fag-start-final-RJt6w`
- **Figma Design:** (referanse til gemini.md)
- **v1.0 FASIT:** `index.html` + `js/`

---

## 📝 VERSJONERING

- **v0.10.4** - Siste v1.0 release
- **v2.0.0-ALPHA** - Initial v2.0 refactoring
- **v2.0.1-ALPHA** - Credits/XP og rate limiting
- **v2.0.2-ALPHA** - MenuSystem og TeacherModule ✅ **CURRENT**

---

## 👨‍💻 UTVIKLERNOTATER

### Hvordan legge til nytt fag (f.eks. NorskMester)

1. Opprett modul:
   ```javascript
   // src/features/norskmester/norskmester.js
   export class NorskMester extends FagModul {
     constructor() {
       super('norsk');
     }
     // Implementer required methods...
   }
   ```

2. Legg til i landing.js:
   ```javascript
   {
     id: 'norsk',
     name: 'NorskMester',
     emoji: '📖',
     gradient: 'linear-gradient(135deg, #FBBF24, #FCD34D)'
   }
   ```

3. Legg til i fag-start.js:
   ```javascript
   'norsk': {
     name: 'NorskMester',
     emoji: '📖',
     // ...
   }
   ```

4. Oppdater Service Worker:
   ```javascript
   './src/features/norskmester/norskmester.js',
   './src/features/norskmester/index.js',
   './src/features/norskmester/norsk-data.js'
   ```

---

## 🎯 NESTE STEG (Prioritert)

1. **Fix storage imports** i GloseMester og MatteMester
2. **Integrer MenuSystem** i fag-start.js og app.js
3. **Implementer PWA install-knapp** med iOS fallback
4. **Test på mobil/iPad** - responsivt design
5. **Implementer Prøve-modus** - elever kan ta prøver
6. **Koble Teacher Module til prøvesystem** - resultatsending
7. **Legg til Feide-autentisering** for lærere
8. **QR-kode integrasjon** med qrcode.js

---

**Dokument opprettet:** 2026-02-10
**Sist oppdatert:** 2026-02-10
**Forfatter:** Claude (AI Assistant)
**Versjon:** 1.0
