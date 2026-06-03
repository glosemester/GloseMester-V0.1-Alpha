# 🎓 GloseMester

**Motiverende språklæring for norske skoler og selvstudium**

🌐 **Nettside:** [glosemester.no](https://glosemester.no)
👨‍💻 **Utviklet av:** Øyvind Nilsen Oksvold (Oksvold EDB)
📅 **Versjon:** v2.4.2-ALPHA (6. mars 2026)
📋 **Launch-plan:** [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)

GloseMester er en Progressive Web App (PWA) som gjør glosepugging om til en skattejakt. Elevene samler digitale kort, bytter dubletter og klatrer i nivåene, mens lærere enkelt kan lage prøver med QR-kode deling.

---

## 🆕 NYTT I v2.5.0-ALPHA (30. mai 2026) — Arkitektur-opprydding (Del A)

### ✅ Fjernet kodeoverlapp fra halvferdig V1→V2-migrering
- **`www/` ut av versjonskontroll:** ren build-output (256 filer), nå i `.gitignore`
- **34 foreldreløse V1-filer slettet:** reachability-analyse viste at kun 6 av 40
  `js/`-filer faktisk lastes (av standalone-sidene `oppgrader.html`/`min-side.html`).
  Gammel SPA-motor, `admin-verktoey`, `brukeradmin`, `quiz`, `practice`, `teacher`
  m.fl. var død kode
- **`index-v2.html` slettet:** foreldreløs alt-entry med utdatert lilla-merkevare

### ✅ Sikkerhet
- **Cross-user-lekkasje fikset:** `storage.js` nøkler nå på Firebase UID (ikke
  klient-satt `window.brukerNavn`). Engangsmigrering bevarer eksisterende progresjon
- **Delt Feide-rollelogikk:** `netlify/functions/lib/feide-roles.js` (fjernet ~23
  duplikate linjer mellom web- og mobil-funksjonen)

### ✅ Design-system
- **`src/styles/tokens.css`:** eneste kilde til sannhet for farger/typografi/spacing
  (korall #FF6B47 + Nunito, fra brand-guiden). `--t-*` og nivåfarger er nå
  token-alias; ingen hardkodet lilla igjen

**Filer:** `.gitignore`, `js/` (beskåret), `src/styles/*`, `src/core/utils/storage.js`,
`src/app.js`, `netlify/functions/*`, `sw.js`, `index.html`

---

## 🆕 NYTT I v2.4.2-ALPHA (6. mars 2026) — Design-gjennomgang

### ✅ Øvemodus og prøvemodus — konsistens
- **`#quiz-spm` inline-stil fjernet:** `font-size:32px` inline-attributt overstyrer ikke lenger CSS-regelen — spørsmålstekst i prøvemodus er nå lik øvemodus (3.5rem/56px + mobilskalering)
- **Prøvemodus glassmorphism:** `#prove-omraade` byttet fra `.card-container` til `.game-container` — visuell konsistens med øvemodus
- **Lydknapp mer synlig:** `.audio-btn-small` opacity økt fra `0.2` → `0.45` — 🔊-ikonet i svaralternativer er nå synlig uten hover
- **Quiz-popups CSS-refaktorert:** Alle popup-funksjoner (`visRiktigPopup`, `visFeilPopup`, `visFerdigPopup`) bruker nå CSS-klasser (`.quiz-popup-overlay`, `.quiz-popup-modal`, `.quiz-popup-riktig/feil/ferdig`) i stedet for 100+ inline-stiler

**Filer:** `index.html`, `css/main.css`, `js/shared/quiz.js`

---

## 🆕 NYTT I v2.4.1-ALPHA (6. mars 2026) — Kritiske bugfixer

### ✅ Practice/Quiz fikset + mobildesign
- **Lydknapp apostrof-bug:** `btnTekst` direkte i `onclick`-streng krasjet ved norske ord med apostrof (`it's`). Erstattet med `addEventListener`-closure
- **`pulse-green` keyframe lagt til:** `.answer-btn.correct` animasjon fungerer nå
- **`height: 100vh` mobile-fiks:** `.game-container` på mobil bruker nå `min-height: calc(100dvh - 90px); height: auto` — nav-baren dekker ikke lenger innholdet
- **Mobile media queries:** Spørsmålstekst skalerer til `2rem` (600px) og `1.7rem` (400px); svarknapper bredere og mer luftige

**Filer:** `js/features/practice.js`, `css/main.css`

---

## 🆕 NYTT I v2.4.0-ALPHA (5. mars 2026) — Dashboard redesign + bugfixer

### ✅ Lærer-dashboard — komplett redesign
- **Ny hero-seksjon:** Gradient-bakgrunn (`#0a0a1a → #0071e3`), hilsen med dato, abonnementsbadge
- **To hovdkort:** Lag Prøve (blå gradient) og Mine Prøver med live antall
- **Mini stats-rad:** Glassmorfisk rad med antall prøver, gjennomføringer og snitt %
- **Siste prøve-snarvei:** `#siste-prove-snarvei` viser rask tilgang til siste prøve med kopi-kode
- **Tom-tilstand:** Ny onboarding-melding når ingen prøver er opprettet
- **Persistent sidebar desktop:** `@media (min-width: 1100px)` — sidebar fast til venstre, hamburger skjult
- **Søk i Mine Prøver:** Klient-side filter på tittel via `<input type="search">`
- **Separate statistikk-side:** `#laerer-statistikk` med full analytics, dashboard er nå rent og fokusert
- **`lastMiniDashboard()`:** Ny rask Firestore-funksjon (ikke `initDashboard()`) for dashboard-visning

### ✅ Kritiske bugfixer (v2.4.0)
- **K1 — XSS i `kort-display.js`:** `onclick="resirkulerKort('${kort.id}')"` → `data-kortid` + `addEventListener`
- **K4 — Memory leak i `practice.js`:** `inputFelt.onkeydown` → `removeEventListener` + `addEventListener` med lagret referanse
- **H1 — Leitner-algoritme:** Krev 2 riktige på rad for å avansere boks; feil gir -1 (ikke -2)
- **H3 — ARIA på flervalg:** `aria-label="Svar: {tekst}"` og `type="button"` på alle svar-alternativer
- **H4 — `prefers-reduced-motion`:** Confetti og float-score animasjoner deaktivert for bevegelsessensitive brukere

**Filer:** `index.html`, `css/main.css`, `js/features/teacher-analytics.js`, `js/core/navigation.js`, `js/features/saved-tests.js`, `js/features/kort-display.js`, `js/features/practice.js`, `js/features/learningEngine.js`

---

## 🆕 NYTT I v2.3.2-ALPHA (5. mars 2026)

### ✅ H2 — Feedbacktid og «Neste»-knapp
- Tilbakemeldingstid økt fra 1000ms → **2000ms** etter riktig svar
- **«Neste →»-knapp** vises i feedback-elementet — bruker kan styre tempoet selv
- Timer avbrytes ved klikk; knappen forsvinner automatisk ved neste spørsmål

**Filer:** `js/features/practice.js`, `css/main.css`

---

## 🆕 NYTT I v2.3.1-ALPHA (4. mars 2026)

### ✅ GloseMester — Strukturforenkling 📚
- **Nivå 1+2 slått sammen:** Gammel niva1 (40 ord) og niva2 (50 ord) er nå ett nivå (90 ord, ingen bilder)
- **Bilder fjernet:** Alle image-felt fjernet fra vokabular — fokus på tekst/lyd fremfor visuelt
- **3 nivåer:** Redusert fra 4 til 3 (Enkel → Middels → Avansert)

### ✅ Design & UX
- **Lydknapp diskretisert:** 🔊-knapp gjort mindre fremtredende for å unngå utilsiktede klikk
- **Desktop-optimalisering:** `@media (min-width: 1024px)` og `1400px`-regler for stor-skjerm
- **Mer app-aktig:** Navigasjonsbar, game-container og rolle-grid skalerer korrekt på store skjermer

### ✅ Bugfixes (v2.3.0)
- **Tilfeldig rekkefølge i øv-modus:** Spørsmål stokkes nå riktig ved oppstart
- **TDZ-bug quiz.js:** Lukk-knapp i feil-svar-popup fungerer nå
- **QR-koder client-side:** Fjernet avhengighet av `api.qrserver.com`

---

## 🚀 LANSERINGSSTATUS

**Nåværende fase:** ALPHA-testing
**Prod-klar:** ~80%
**Launch ETA:** Q2 2026

✅ **Ferdig:**
- Feide innlogging med lærer/elev-skille
- Stripe betalingsintegrasjon + webhook
- Firebase backend & Firestore
- PWA med offline-støtte
- Admin-panel & GloseBank
- Resend e-postvarsel for skolepakke-forespørsler
- Git + Netlify auto-deploy
- Juridiske dokumenter (under juridisk gjennomgang)
- Rate limiting på Netlify Functions
- GDPR-compliance (cookie, eksport, sletting)
- Lærer-dashboard redesign
- Glassmorfisk øvemodus + prøvemodus

🟡 **Pågående:**
- Beta-testing med pilotskoler
- Stripe konfigurasjon (test-modus → prod)
- Juridisk gjennomgang av personvernerklæring

---

## 📋 UTVIKLINGSPLAN — TODO-liste

### 🔴 Kritiske bugs (må fikses før launch)

| # | Oppgave | Fil | Status |
|---|---------|-----|--------|
| K2 | Fix duplikate Firebase-imports | `js/features/gdpr.js` | ⏳ |
| K3 | Fix storage-nøkkelkollisjon (bruk Firebase UID) | `js/features/storage.js` | ⏳ |

> **K1** (XSS kort-display) og **K4** (memory leak practice.js) er allerede fikset i v2.4.0.

---

### 🟠 Høy prioritet

| # | Oppgave | Fil | Status |
|---|---------|-----|--------|
| H5 | Paginering for kortsamling (IntersectionObserver) | `js/features/kort-display.js` | ⏳ |
| — | Reaktiver lydeffekter (`spillLyd`) | `js/ui/helpers.js` | ⏳ |
| — | Leitner-integrasjon i NorskMester | `js/features/norsk-practice.js` | ⏳ |
| — | AdaptiveDifficulty i MatteMester | `js/features/matte-practice.js` | ⏳ |
| — | Fag-filter i Standardprøver (engelsk/matte/norsk) | `js/features/standardprove.js` | ⏳ |

> **H1** (Leitner-algoritme), **H2** (2s feedback + Neste-knapp), **H3** (ARIA), **H4** (reduced-motion) er ferdig.

---

### 🟡 Medium prioritet

| # | Oppgave | Fil | Status |
|---|---------|-----|--------|
| M1 | Refaktorer global state til modul-scope objekt | `js/features/practice.js` | ⏳ |
| M2 | Utvid vokabular (100 ord/nivå, nå 50) | `js/vocabulary.js` | ⏳ |
| M3 | Erstatt magiske tall med navngitte konstanter | `js/features/practice.js` | ⏳ |
| M4 | localStorage skjemavalidering for Leitner-data | `js/features/storage.js` | ⏳ |
| — | `dailyCorrect` nullstilles aldri i MatteMester | `js/features/matte-practice.js` | ⏳ |

---

### 🟢 Lav prioritet

| # | Oppgave | Fil | Status |
|---|---------|-----|--------|
| L1 | Hinte-system (vis første bokstav etter 2 feil) | `js/features/practice.js` | ⏳ |
| L2 | «Neste repetisjon»-oversikt (Leitner) | `js/features/learningEngine.js` | ⏳ |
| L4 | Konsistent navngiving (norsk/engelsk mix) | Alle filer | ⏳ |

---

### 🏗️ v2.0 Fremtidsplan (`src/`-strukturen)

| Oppgave | Status |
|---------|--------|
| Autentisering v2 (Google + Feide-modal) | ⏳ |
| Prøvemodus for elever (Firestore-kobling) | ⏳ |
| QR-kode integrasjon v2 | ⏳ |
| PWA install-knapp v2 | ⏳ |
| Resultatsending elev → lærer | ⏳ |
| NorskMester-modul v2 | ⏳ |
| `index-v2.html` erstatter `index.html` | ⏳ |

---

## ✨ FUNKSJONALITET

### 🎮 For Elever (Øv Selv)

**Læringssystemer:**
- **3 nivåer:** Knapper, Mix, Skriving (progressiv vanskelighetsgrad)
- **Leitner-system:** Ord som man svarer feil på repeteres hyppigere
- **Progresjon:** 10-rute visuell bar med automatisk lagring
- **Lydstøtte:** Syntetisk tale (Web Speech API) for alle ord
- **Umiddelbar feedback:** Grønne/røde indikatorer, «Neste →»-knapp

**Motivasjon og belønning:**
- **Kortsamling:** 4 sjeldenhetsgrader (Common, Rare, Epic, Legendary)
- **Panteordning:** Pant 2 like kort → 1 diamant
- **Master Galleri:** Full oversikt over alle samlebokskort
- **Nivåbasert belønning:** Nye kort ved fullføring av nivåer

**Tekniske features:**
- Progressive Web App (PWA) — installerbar på mobil/desktop
- Offline-støtte med Service Worker
- Responsive design (mobil-først + desktop-optimalisering)
- LocalStorage for lokal progresjon

---

### 🎯 For Lærere

**Autentisering:**
- **Feide OIDC:** Sikker innlogging for norske skoler
- **Google OAuth:** Alternativ innlogging
- **E-post/passord:** Tradisjonell registrering
- **Rolle-verifisering:** Automatisk skille mellom lærer og elev

**Dashboard:**
- **Hero-seksjon:** Dato, hilsen, abonnementsbadge
- **Rask oversikt:** Antall prøver, gjennomføringer, snitt %
- **Siste prøve-snarvei:** Kopi kode direkte fra dashboard
- **Separat statistikk-side:** Full analytics med grafer og CSV-eksport

**Prøvehåndtering:**
- **Prøve-editor:** Legg til/slett ord, min. 3 ord per prøve
- **QR-kode generering:** Del prøver umiddelbart med elever
- **Duplisering:** Kopier og modifiser eksisterende prøver
- **Søk i Mine Prøver:** Filtrer etter tittel klient-side
- **Resultatstatistikk:** Se fullføringsrate og gjennomsnittsscore

**Innholdsbibliotek:**
- **Standardprøver:** 16 ferdiglagde LK20-alignerte prøver
- **GloseBank:** Deling av prøver mellom lærere (Skolepakke/Admin)

---

### 💳 Betalingsmodell & Abonnementer

**Gratis Tier:**
- ✅ Opptil 3 prøver
- ✅ Alle elev-funksjoner (øving, samling, galleri)
- ✅ QR-kode deling
- ✅ Basis resultatstatistikk

**Premium Lærer (99 kr/mnd eller 800 kr/år):**
- ✅ **Ubegrenset** antall prøver
- ✅ Full redigering og duplisering
- ✅ Tilgang til 16 Standardprøver (LK20-alignert)
- ✅ Avansert resultatstatistikk
- ✅ Prioritert support (2 virkedager)
- 💳 Betaling via **Stripe** kortbetaling (automatisk fornyelse)

**Skolepakke (5.000-10.000 kr/år):**
- ✅ Alt i Premium
- ✅ **GloseBank:** Del prøver internt på skolen
- ✅ **Ubegrenset antall lærere** (skolelisensiering)
- ✅ **Feide-integrasjon:** SSO for alle lærere
- ✅ Dedikert support og opplæring
- ✅ Faktura med 30 dagers betalingsfrist

---

## 🗂️ TEKNISK OVERSIKT

### Arkitektur

**Frontend:**
- Progressive Web App (PWA)
- Vanilla JavaScript (ES6+ modules)
- Firebase Client SDK v9 (modular)
- CSS Grid & Flexbox (responsive design)
- Service Worker for offline-støtte

**Backend:**
- Netlify Functions (serverless Node.js)
- Firebase Admin SDK
- Feide OIDC integrasjon
- Stripe Checkout API

**Database:**
- Cloud Firestore (NoSQL)
- Collections: `users`, `prover`, `glosebank`, `orders`, `school_inquiries`
- Firestore Security Rules (rolle-basert tilgang)

**Hosting & Deployment:**
- Netlify (glosemester.no)
- Continuous Deployment via GitHub
- Environment Variables for secrets

### Viktige filer

> **Arkitektur:** Den deployede appen er nå **v3** (React, i `app-v3/`).
> `npm run build` i rota (og Netlify) bygger v3 til `dist/` (ikke
> versjonskontrollert) — den gamle v2-byggkjeden (`scripts/build.js` → `www/`)
> og det manuelle `sw.js` er fjernet (B4). V2-koden (`src/`, `js/`, `index.html`,
> frittstående `*.html`) ligger igjen som referanse og fjernes i B5
> (jf. `docs/DEL-B-REACT-PLAN.md`). Filtreet under beskriver fortsatt v2.

```
glosemester/
├── index.html                       # SPA-entrypoint (laster src/app.js)
├── min-side.html                    # Frittstående: brukerprofil + abo
├── oppgrader.html                   # Frittstående: prisside med Stripe
├── src/
│   ├── app.js                       # App-init, ruter, auth-state
│   ├── styles/
│   │   ├── tokens.css               # ENESTE design-token-kilde (korall + Nunito)
│   │   ├── redesign.css             # Globale komponentstiler
│   │   ├── glosemester.css          # Øvedel/quiz
│   │   ├── teacher.css              # Lærer-UI (alias over tokens.css)
│   │   ├── menu.css                 # Navigasjon
│   │   └── landing.css              # Landingsside
│   ├── core/
│   │   ├── auth/                    # firebase-config.js, auth-service.js
│   │   ├── kort/                    # kort-system/-data/-display/-reward.js
│   │   ├── navigation/             # router.js, app-header.js, menu-system.js
│   │   ├── pwa/                     # installer.js, ios-popup.js
│   │   └── utils/                   # storage.js (UID-nøklet), feedback.js, rate-limiter.js
│   ├── features/
│   │   ├── glosemester/            # vocabulary-data.js + øvemodus
│   │   ├── teacher/                # teacher-module.js (dashboard + prøver)
│   │   ├── trade/                   # kortbytte
│   │   └── onboarding/
│   ├── shared/quiz/quiz-engine.js   # Prøvemodus for elever
│   └── pages/                       # landing.js, velkomst.js, fag-start.js
├── js/                              # KUN standalone-sider (oppgrader/min-side)
│   ├── features/                    # firebase, auth, payment, gdpr, saved-tests
│   ├── ui/helpers.js
│   └── vendor/                      # jsQR, xlsx
├── netlify/functions/
│   ├── lib/feide-roles.js           # Delt rollelogikk (web + mobil)
│   ├── feide-auth.js                # Feide OIDC token exchange (web)
│   ├── feide-mobile-auth.js         # Feide OIDC (mobil)
│   ├── stripe-checkout.js           # Stripe Checkout initiering
│   ├── stripe-webhook.js            # Stripe webhook (auto-aktivering)
│   └── school-inquiry.js            # Skolepakke-forespørsel
├── sw.js                            # Service Worker
└── firestore.rules                  # Sikkerhet & tilgangskontroll
```

---

## 🔐 Sikkerhet & Personvern

**Autentisering:**
- Firebase Authentication med Feide OIDC
- Rolle-basert tilgangskontroll (lærer/elev/admin)
- Custom tokens for Feide-brukere

**Kode-sikkerhet:**
- Rate limiting på alle brukerinteraksjoner
- XSS-beskyttelse: `data-*` + `addEventListener` i stedet for inline `onclick`
- Sanitering av brukerinput i quiz-popups

**Datahåndtering:**
- GDPR-compliant personvernerklæring (under juridisk gjennomgang)
- Databehandleravtale for skoler
- Minimal datainnsamling
- Feide-data lagres kryptert i Firestore

**Betalingssikkerhet:**
- Stripe-integrasjon (PCI DSS Level 1)
- Ingen lagring av betalingskort
- Webhook signatur-verifisering for ordre-bekreftelse

---

## 📞 Kontakt & Support

**Utvikler:** Øyvind Nilsen Oksvold
**Bedrift:** Oksvold EDB (Org.nr: 836 906 012)
**E-post:** kontakt@glosemester.no
**Support:** Innen 2 virkedager
**Nettside:** https://glosemester.no

---

## 📜 Lisens & Opphavsrett

© 2025-2026 Øyvind Nilsen Oksvold / Oksvold EDB
Alle rettigheter forbeholdt.

**GloseMester** er et registrert merke.

---

## 🙏 Takk til

- **Feide / Sikt:** For sikker autentisering i norsk utdanningssektor
- **Stripe:** For sikker betalingsintegrasjon
- **Firebase:** For robust backend-infrastruktur
- **Netlify:** For serverless hosting og deployment
- **Beta-testere:** (kommer snart)

---

## 📊 Statistikk

**Utviklet:** November 2024 — mars 2026
**Kodebasis:** ~18.000 linjer (JS, HTML, CSS)
**Standardprøver:** 16 LK20-alignerte prøver
**Samlebokskort:** 50+ unike kort (4 sjeldenhetsgrader)
**Støttede plattformer:** Web, iOS, Android (PWA)

---

**🚀 Mål: lansering Q2 2026**

For teknisk dokumentasjon, se [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)
