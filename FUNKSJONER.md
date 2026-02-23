# Mester Suite — Komplett Funksjonsoversikt & Lanseringsplan

> **Sist oppdatert:** 2026-02-13
> **Gjeldende versjon:** v2.3.0-ALPHA
> **Formål:** Gi utviklere full oversikt over alt som finnes i appen, hva som fungerer, hva som mangler, og hva som må fikses før lansering.

---

## Innholdsfortegnelse

1. [Prosjektoversikt](#1-prosjektoversikt)
2. [Arkitektur & Filstruktur](#2-arkitektur--filstruktur)
3. [Sider & Navigasjon](#3-sider--navigasjon)
4. [Funksjoner per modul](#4-funksjoner-per-modul)
   - [4.1 GloseMester (Engelskøving)](#41-glosemester-engelskøving)
   - [4.2 MatteMester](#42-mattemester)
   - [4.3 NorskMester](#43-norskmester)
   - [4.4 Prøvesystem (Elev)](#44-prøvesystem-elev)
   - [4.5 Lærerdashboard](#45-lærerdashboard)
   - [4.6 Diktat-opptaker](#46-diktat-opptaker)
   - [4.7 Kortsamling & Belønning](#47-kortsamling--belønning)
   - [4.8 Læringsmotor (Leitner)](#48-læringsmotor-leitner)
   - [4.9 Autentisering](#49-autentisering)
   - [4.10 Betaling & Abonnement](#410-betaling--abonnement)
   - [4.11 GDPR & Personvern](#411-gdpr--personvern)
   - [4.12 GloseBank](#412-glosebank)
   - [4.13 Standardprøver](#413-standardprøver)
   - [4.14 Admin-panel](#414-admin-panel)
   - [4.15 PWA & Service Worker](#415-pwa--service-worker)
   - [4.16 Feedback & Animasjoner](#416-feedback--animasjoner)
   - [4.17 Statistikk & Dashboard](#417-statistikk--dashboard)
5. [Kritiske bugs som MÅ fikses](#5-kritiske-bugs-som-må-fikses)
6. [Forbedringer for lansering](#6-forbedringer-for-lansering)
7. [Teknisk gjeld](#7-teknisk-gjeld)
8. [Versjonsoversikt](#8-versjonsoversikt)

---

## 1. Prosjektoversikt

**Mester Suite** er en gamifisert læringsplattform (PWA) for norske skoler med tre fag:

| Fag | Beskrivelse | Målgruppe |
|-----|-------------|-----------|
| **GloseMester** | Engelsk gloselæring med Leitner spaced repetition | 1.–10. trinn |
| **MatteMester** | Matteøving (4 regnearter, 3 nivåer per LK20) | 1.–8. trinn |
| **NorskMester** | Norskøving: diktat, ordklasser, rettskriving, nynorsk | 1.–10. trinn |

**Teknologier:** Vanilla JS (ES Modules), Firebase (Auth + Firestore + Storage), Netlify Functions, PWA/Service Worker, Feide OAuth2, Stripe betaling.

**Brukerroller:**
- **Elev** — Øver/tar prøver anonymt (ingen innlogging, alt i localStorage)
- **Lærer** — Lager prøver, ser resultater, bruker diktat-opptaker (krever innlogging)
- **Admin** — Modererer GloseBank, administrerer brukere, fyller standardprøver

---

## 2. Arkitektur & Filstruktur

```
GloseMester-V0.1-Alpha/
├── index.html              # Hoved-SPA (23 sider, 5 nav-menyer, 9 popups)
├── oppgrader.html          # Prisside (Gratis/Premium/Skolepakke)
├── om-oss.html             # Om utvikler
├── personvern.html         # Personvernerklæring (GDPR)
├── min-side.html           # Min konto (abonnement, GDPR-handlinger)
├── offline.html            # Offline-fallback
├── vilkar.html             # Kjøpsvilkår
├── sw.js                   # Service Worker (cache + oppdatering)
├── manifest.json           # PWA-manifest
├── firebase.json           # Firebase hosting-konfig
├── firestore.rules         # Firestore sikkerhetsregler
│
├── js/
│   ├── init.js             # Entry point — global state, DOMContentLoaded
│   ├── app.js              # Hovedkontroller — navigasjon, SW, hamburger, kampanjekoder
│   ├── vocabulary.js       # Innebygd ordliste (4 nivåer, 190 ord)
│   ├── collection.js       # Databro mellom gammel/ny kortdata
│   ├── export-import.js    # Backup/restore av brukerdata (Base64)
│   │
│   ├── core/
│   │   ├── analytics.js    # Google Analytics wrapper (deaktivert for GDPR)
│   │   ├── auth-helpers.js # Rolle-sjekk (erAdmin, hentBrukerRolle)
│   │   ├── credits.js      # Diamant-system (localStorage)
│   │   ├── logger.js       # Miljøbevisst logging + global error handler
│   │   ├── navigation.js   # SPA-navigasjon (visSide, oppdaterMenyer, popstate)
│   │   ├── rate-limiter.js # Rate limiting (practice, test, kort, lagring)
│   │   └── storage.js      # localStorage-abstraksjon (kort, diamanter, XP, prøver)
│   │
│   ├── shared/
│   │   ├── kort-system.js  # Kortsamling, gevinst-popup, resirkulering
│   │   └── quiz.js         # Prøvemotor (kode-oppslag, svarsjekk, resultatlagring)
│   │
│   ├── ui/
│   │   └── helpers.js      # Lyd, vibrasjon, toast, TTS, konfetti, escapeHtml
│   │
│   ├── data/
│   │   ├── cardsData.js    # 120 samlekort (biler, guder, dinosaurer, dyr)
│   │   └── norskData.js    # NorskMester orddata (6 nivåer)
│   │
│   └── features/
│       ├── auth.js              # Autentisering (Google, epost, Feide)
│       ├── practice.js          # GloseMester øving med Leitner
│       ├── matte-practice.js    # MatteMester øving
│       ├── norsk-practice.js    # NorskMester øving (diktat/flervalg/skriving)
│       ├── quiz.js              # Quiz-flyt for elever
│       ├── teacher.js           # Lærers prøve-editor (multi-fag)
│       ├── teacher-analytics.js # Lærerdashboard statistikk + Canvas-graf
│       ├── saved-tests.js       # Lagrede prøver: CRUD, QR, Excel-eksport
│       ├── diktat-recorder.js   # Stemmeopptak per ord, Firebase Storage
│       ├── standardprove.js     # Ferdiglagde standardprøver (premium)
│       ├── glosebank-admin.js   # GloseBank admin-moderering
│       ├── glosebank-browse.js  # GloseBank søk for skolepakke-brukere
│       ├── admin-verktoey.js    # Admin: fyll standardprøver i Firestore
│       ├── payment.js           # Stripe checkout-integrasjon
│       ├── gdpr.js              # Samtykke, dataeksport, datasletting
│       ├── feedback.js          # Konfetti, hint, motivasjon, animasjoner
│       ├── gallery.js           # Galleri over alle samlekort
│       ├── kort-display.js      # Kort-progresjon, gevinst, samling
│       ├── learningEngine.js    # Leitner 5-boks + adaptiv vanskelighet
│       ├── progressDashboard.js # Elev-statistikk, streaks, badges
│       ├── qr-scanner.js        # QR-kamera-skanner (jsQR)
│       ├── brukeradmin.js       # Admin brukeradministrasjon
│       └── firebase.js          # Firebase konfig + re-eksport
│
├── css/
│   ├── main.css               # Hovedstiler (600+ linjer)
│   ├── kort.css               # Kortstiler (rarity, animasjoner)
│   ├── popups.css             # Popup/modal-stiler
│   ├── standardprover.css     # Standardprøve-kort
│   ├── glosebank-admin.css    # Admin GloseBank-stiler
│   └── glosebank-browse.css   # GloseBank søk-stiler
│
├── sounds/                    # Lydeffekter (pop, correct, wrong, win, fanfare)
└── images/                    # Samlekort-bilder + dyr-bilder for nivå 1
```

---

## 3. Sider & Navigasjon

### Alle sider i index.html (23 `div.page`-seksjoner)

| # | Side-ID | Formål | Nav-meny |
|---|---------|--------|----------|
| 1 | `fag-velger` | **Startside** — Velg fag (Gloser/Matte/Norsk) | Ingen |
| 2 | `glosemester-start` | GloseMester rollevalg (Øving/Kode/Lærer) | Ingen |
| 3 | `mattemester-start` | MatteMester rollevalg | Ingen |
| 4 | `norskmester-start` | NorskMester rollevalg | Ingen |
| 5 | `matte-oving-start` | MatteMester — Velg operasjon (+, -, ×, ÷) | `matte-oving-meny` |
| 6 | `matte-nivaa-velger` | MatteMester — Velg nivå (1–3) | `matte-oving-meny` |
| 7 | `matte-oving-omraade` | MatteMester — Oppgaveområde med numpad | `matte-oving-meny` |
| 8 | `matte-resultat` | MatteMester — Resultatskjerm | `matte-oving-meny` |
| 9 | `norsk-oving-start` | NorskMester — Velg nivå (6 nivåer) | `norsk-oving-meny` |
| 10 | `norsk-oving-omraade` | NorskMester — Øvingsområde (diktat/flervalg/skriving) | `norsk-oving-meny` |
| 11 | `elev-dashboard` | Elev — Skriv prøvekode, QR-skanner, lagrede prøver | `elev-meny` |
| 12 | `oving-start` | GloseMester — Velg nivå (1–4) | `oving-meny` |
| 13 | `oving-omraade` | GloseMester — Øvingsområde med bildestøtte | `oving-meny` |
| 14 | `oving-samling` | GloseMester — Kortsamling (øvemodus) | `oving-meny` |
| 15 | `elev-samling` | Elev — Kortsamling (prøvemodus) | `elev-meny` |
| 16 | `galleri-visning` | Galleri — Alle tilgjengelige kort | (kontekstavhengig) |
| 17 | `laerer-dashboard` | Lærer — Dashboard med statistikk | `laerer-meny` |
| 18 | `lag-prove` | Lærer — Lag ny prøve (gloser/matte/norsk) | `laerer-meny` |
| 19 | `lagrede-prover` | Lærer — Mine lagrede prøver | `laerer-meny` |
| 20 | `standardprover` | Standardprøver (Premium/Skolepakke) | `laerer-meny` |
| 21 | `glosebank-browse` | GloseBank søk (Skolepakke) | `laerer-meny` |
| 22 | `admin-panel` | Admin — GloseBank, brukere, verktøy | `laerer-meny` |
| 23 | `diktat-recorder` | Lærer — Diktat-opptaker (3-stegs flyt) | `laerer-meny` |

### Navigasjonsmenyer (5 bunnnav-barer)

| Meny-ID | Sider | Knapper |
|---------|-------|---------|
| `elev-meny` | elev-dashboard, elev-samling, galleri | Hjem, Mine Kort, Galleri |
| `oving-meny` | oving-start, oving-omraade, oving-samling, galleri | Øv, Samling, Galleri, Avslutt |
| `matte-oving-meny` | matte-* sider | Øv, Galleri, Avslutt |
| `norsk-oving-meny` | norsk-* sider | Øv, Samling, Galleri, Avslutt |
| `laerer-meny` | laerer-*, lagrede-*, standard*, glosebank-*, admin-*, diktat-* | Dashboard, Ny Prøve, Mine Prøver, Logg Ut |

### Popups & Modaler

| Popup-ID | Formål |
|----------|--------|
| `laerer-login-popup` | Lærerinnlogging (Google/Epost/Feide) |
| `laerer-register-popup` | Ny lærer-registrering |
| `personvern-popup` | Personvernsamtykke ved første innlogging |
| `gevinst-popup` | Animert kortgevinst |
| `feil-svar-popup` | Feil svar med riktig fasit |
| `scanner-popup` | QR-kamera-overlay |
| `ios-install-popup` | iOS PWA-installasjonsguide |
| `upgrade-modal` | Oppgraderingsbeskjed |
| `info-modal` | Generell info-modal |
| `skolepakke-modal` | Skolepakke-henvendelse (i oppgrader.html) |

---

## 4. Funksjoner per modul

### 4.1 GloseMester (Engelskøving)

**Filer:** `practice.js`, `vocabulary.js`, `learningEngine.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| 4 nivåer (LK20-tilpasset) | Nivå 1–4 med 40–50 ord hver | Fungerer |
| Leitner spaced repetition | 5 bokser med økende intervaller | Fungerer |
| Adaptiv vanskelighet | Flervalg ved lav score, skriving ved høy | Fungerer |
| Språkretning | Norsk→Engelsk og Engelsk→Norsk | Fungerer |
| Text-to-speech | Opplesning av spørsmål | Fungerer |
| Bildestøtte | Bilder for dyr i nivå 1 | Fungerer |
| XP-system | 1 XP per riktig, kort per 10, diamant per 100 | Fungerer |
| Leitner-visualisering | 5-boks statusindikator under øving | Fungerer |

### 4.2 MatteMester

**Fil:** `matte-practice.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| 4 regnearter | Addisjon, subtraksjon, multiplikasjon, divisjon | Fungerer |
| 3 nivåer per regneart | LK20 trinn 1–2, 3–5, 6–8 | Fungerer |
| Numpad-input | On-screen talltastatur + fysisk tastatur | Fungerer |
| 10 oppgaver per runde | Fast antall per økt | Fungerer |
| Resultatskjerm | Oppsummering med "Prøv igjen"-knapp | Fungerer |
| XP/kort-belønninger | Samme system som GloseMester | Fungerer |
| Desimaloppgaver | Divisjon nivå 3 har desimalsvar | Fungerer |

**Mangler:**
- Ingen Leitner/spaced repetition (kun tilfeldig generering)
- `dailyCorrect` nullstilles aldri mellom økter
- Floating point-feil mulig ved desimaler (0.1 + 0.2)

### 4.3 NorskMester

**Filer:** `norsk-practice.js`, `norskData.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| 6 nivåer | Diktat (2), Ordklasser, Rettskriving, Synonymer, Nynorsk | Fungerer |
| Diktatmodus | Robotstemme leser opp → elev skriver | Fungerer |
| Lærerdiktat | Lærer-innleste lydfiler fra Firebase Storage | Fungerer |
| Flervalg | 4 alternativer for ordklasser/synonymer | Fungerer |
| Skrivemodus | Fritekst for rettskriving/nynorsk | Fungerer |
| XP/kort-belønninger | Samme system som GloseMester | Fungerer |

**Mangler:**
- Ingen Leitner/spaced repetition (kun tilfeldig rekkefølge)
- `stokkArray()` er duplisert fra practice.js

### 4.4 Prøvesystem (Elev)

**Filer:** `quiz.js` (features + shared), `qr-scanner.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Prøvekode-oppslag | Skriv inn kode → hent fra Firestore | Fungerer |
| QR-skanning | Kamera-basert QR-lesing med jsQR | Fungerer |
| Offline-prøver | Base64-kodet prøve uten nett | Fungerer |
| Svarsjekk | Flervalg + skriving med feedback | Fungerer |
| Resultatlagring | Anonymt til Firebase med crypto.randomUUID | Fungerer |
| Lokal prøvecache | 7 dagers TTL i localStorage | Fungerer |
| Språkretning | Bytt norsk↔engelsk midt i prøve | Fungerer |
| Text-to-speech | Opplesning av prøvespørsmål | Fungerer |
| XP/kort-belønninger | Per riktig svar + bonusdiamanter | Fungerer |

**Mangler:**
- ~~QR-URL bruker `?prove=` men skanner parser `?quiz=`~~ — **FIKSET** (scanner håndterer begge parametre)
- Ingen visuell skanneindikator (ramme/linje) i QR-scanneren

### 4.5 Lærerdashboard

**Filer:** `teacher.js`, `teacher-analytics.js`, `saved-tests.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Lag prøve (gloser) | Norsk/Engelsk ordpar → lagre til Firestore | Fungerer |
| Lag prøve (matte) | Spørsmål/svar-par for matteoppgaver | Fungerer |
| Lag prøve (norsk) | Spørsmål/svar-par for norskoppgaver | Fungerer |
| Abonnementsjekk | Gratis (3 prøver), Premium (ubegrenset), Skolepakke | Fungerer |
| Rate limiting | Maks 10 prøver per time | Fungerer |
| GloseBank-backup | Automatisk backup til GloseBank ved lagring | Fungerer |
| Se resultater | Resultattabell med gjennomsnitt, beste/verste | Fungerer |
| Excel-eksport | Eksporter resultater som .xlsx | Fungerer |
| QR-kode | Generer/last ned/skriv ut QR for prøve | Fungerer |
| Dupliser prøve | Kopier eksisterende prøve med ny kode | Fungerer |
| Rediger prøve | Endre tittel og ordliste | Fungerer |
| Slett prøve | Slett fra Firestore | Fungerer |
| Statistikk-dashboard | Totalt prøver, gjennomføringer, snitt-score | Fungerer |
| Aktivitetsgraf | Canvas søylediagram siste 7 dager | Fungerer |
| CSV-eksport | Eksporter dashboard-statistikk | Fungerer |

**Mangler:**
- `sjekkKampanjeKode()` er bare en placeholder (`alert()`)
- ~~`slettProve()` sletter ikke tilhørende resultater i Firestore~~ — **FIKSET**
- `skrivUtQRKode()` bruker `window.print()` som skriver ut hele siden
- ~~Tidssone hardkodet til UTC+1~~ — **FIKSET** (bruker nå `Intl.DateTimeFormat` + `Date.UTC`)
- CSV eksporterer kun topp 5 prøver, ikke alle
- Gjennomsnitt-beregning er uvektet (snitt av snitt)

### 4.6 Diktat-opptaker

**Fil:** `diktat-recorder.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Velg ordliste | Forhåndsdefinerte nivåer eller egne ord | Fungerer |
| Opptak per ord | MediaRecorder API (webm/opus eller mp4) | Fungerer |
| Forhøndslytting | Lytt på opptak før du går videre | Fungerer |
| Firebase Storage | Last opp lydfiler med TTL | Fungerer |
| Delingskode | 6-tegns kode for deling med elever | Fungerer |
| TTL auto-sletting | 90 dager (gratis) / 180 dager (premium) | Fungerer |
| Eksport/import | JSON med base64-kodet lyd | Fungerer |
| Elevavspilling | Hent diktat via kode, spill av lærerlyd | Fungerer |
| Mine diktat-sett | Liste over egne sett med nedtelling | Fungerer |

**Mangler:**
- `MAKS_OPPTAK_PER_TIME = 200` definert men aldri sjekket — ingen rate limiting
- Filer lastes opp sekvensielt — kan parallelliseres
- Filnavn i Storage kan inneholde norske tegn — encoding-problemer mulig

### 4.7 Kortsamling & Belønning

**Filer:** `kort-display.js`, `kort-system.js` (shared), `gallery.js`, `cardsData.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| 120 samlekort | 4 kategorier: biler, guder, dinosaurer, dyr | Fungerer |
| Rarity-system | Vanlig 85%, Sjelden 11%, Episk 3%, Legendarisk 1% | Fungerer |
| Kortgevinst-popup | Animert popup med konfetti for legendariske | Fungerer |
| Samling med sortering | Nyeste / Sjeldenhet / Navn | Fungerer |
| Resirkulering | Bytt 2 duplikater + 1 diamant → nytt kort | Fungerer |
| Diamant-valuta | Opptjent per 100 XP, brukt til resirkulering | Fungerer |
| XP-progresjonsbarer | 10-segment kortbar + diamantbar | Fungerer |
| Galleri | Alle kort med eid/låst-status | Fungerer |

**Mangler:**
- Galleri har ingen filtrering eller søk
- ~~Gallery.js er debug-versjon med massiv console.log~~ — **FIKSET** (all debug-logging fjernet)
- Ingen image error handling (fallback ved manglende bilde)

### 4.8 Læringsmotor (Leitner)

**Fil:** `learningEngine.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| 5-boks Leitner | Nye→Lærende→Kjent→Nesten→Mestret | Fungerer |
| Spaced repetition | 0/1/3/7/30 dagers intervaller | Fungerer |
| Adaptiv vanskelighet | Flervalg < 50% treffsikkerhet, skriving > 70% | Fungerer |
| Daglig aktivitetslogg | Registrerer aktive dager for streak | Fungerer |
| Ord-statistikk | Riktig/feil/streak per ord | Fungerer |

**Mangler:**
- All progress KUN i localStorage — tapt ved browser-wipe, ingen synkronisering
- `resetAllProgress()` bruker `confirm()` direkte (UI-logikk i datalaget)
- Kun brukt i GloseMester — MatteMester og NorskMester har ikke Leitner

### 4.9 Autentisering

**Fil:** `auth.js`, `auth-helpers.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Google-innlogging | Firebase Google popup | Fungerer |
| Epost/passord | Firebase Email Auth | Fungerer |
| Feide (Dataporten) | OAuth2 via Netlify backend | Fungerer |
| Rolle-sjekk | Admin/Lærer/Elev fra Firestore | Fungerer |
| Auto-innlogging | `onAuthStateChanged` listener | Fungerer |
| Personvernsamtykke | Popup ved første innlogging | Fungerer |

**Mangler:**
- Feide Client ID hardkodet direkte i filen
- `avvisPersonvern()` blokkerer ikke faktisk tilgang — bare `alert()`
- 11 funksjoner eksponert på `window` — XSS-risiko
- `window.auth` eksponerer Firebase Auth globalt

### 4.10 Betaling & Abonnement

**Filer:** `payment.js`, `teacher.js` (abonnementsjekk)

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Stripe checkout | Via Netlify function → redirect | Fungerer |
| 3 planer | Gratis, Premium (mnd/år), Skolepakke | Fungerer |
| Kampanjekoder | Hardkodede koder i app.js | Fungerer |
| Tilgangssjekk | Sjekker Firestore for aktivt abo | Fungerer |

**Mangler:**
- Ingen server-side verifisering av betaling — stoler på URL-parameter `?status=success`
- Kampanjekodene er hardkodet i klienten (BETA2026, LANSERING, TEST7, SKOLE2026, etc.)
- `alert()` i stedet for toast for betalingsmeldinger
- Skolepakke-henvendelse via Netlify function, men ingen oppfølgings-flyt

### 4.11 GDPR & Personvern

**Fil:** `gdpr.js`, `personvern.html`, `min-side.html`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Cookie-banner | Godta alle / Kun nødvendige | Fungerer |
| Cookie-innstillinger | Endre samtykke etterpå | Fungerer |
| Dataeksport (Art. 20) | Last ned brukerdata som JSON | Delvis |
| Datasletting (Art. 17) | Slett konto + data + Firebase Auth | Delvis |
| Personvernerklæring | Komplett GDPR-dokument | Fungerer |

**Mangler / KRITISK:**
- ~~`slettMinData()` søker etter `bruker_id` men quiz.js bruker `elev_id`~~ — **FIKSET** (søker nå `prove_eier`, `elev_id` og `bruker_id`)
- ~~`slettMinData()` sletter IKKE diktat-sett fra Firebase Storage~~ — **FIKSET** (sletter nå diktat-sett + Storage-filer)
- ~~`slettMinData()` sletter IKKE GloseBank-entries~~ — **FIKSET** (sletter nå GloseBank-oppføringer)
- `eksporterMinData()` henter IKKE resultater — kun profil og prøver
- Analytics-kode er død kode (gtag sjekkes men er fjernet)

### 4.12 GloseBank

**Filer:** `glosebank-admin.js`, `glosebank-browse.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Admin: Godkjenn prøver | Moderering av delte prøver | Fungerer |
| Admin: Rediger metadata | Tittel, nivå, emne, LK20-mål | Fungerer |
| Admin: Skjul/slett | Skjul fra brukere eller permanent slett | Fungerer |
| Admin: Filtrer | Pending/godkjent/alle | Fungerer |
| Bruker: Søk | Tekstsøk i godkjente prøver | Fungerer |
| Bruker: Last ned | Kopier prøve til eget bibliotek | Fungerer |

**Mangler:**
- ~~`erAdmin()` mangler `await` i glosebank-admin.js~~ — **FIKSET** (`async/await` korrekt)
- ~~Søk kun på tittel~~ — **FIKSET** (søker nå på tittel, emne, nivå og ordinnhold)
- ~~Massiv debug-logging i browse-modulen~~ — **FIKSET** (all debug-logging fjernet)
- `alert()` ved nedlasting i stedet for toast

### 4.13 Standardprøver

**Filer:** `standardprove.js`, `admin-verktoey.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| 21 ferdiglagde prøver | Engelskfaget, barneskole + ungdomsskole | Fungerer |
| Nivå-filtrering | Barneskole/Ungdomsskole/Videregående | Fungerer |
| Forhåndsvisning | Se ordliste før kopiering | Fungerer |
| Kopier til bibliotek | Legg prøve i eget Firestore | Fungerer |
| Admin: Fyll database | Batch-opprett alle standardprøver | Fungerer |

**Mangler:**
- Ingen videregående-prøver (kategori finnes i UI men ingen prøver)
- Kun engelskfaget — ingen matte- eller norsk-standardprøver
- UI sier "16+ prøver" men det er 21
- All prøvedata hardkodet i JS-filen (~750 linjer)

### 4.14 Admin-panel

**Filer:** `brukeradmin.js`, `glosebank-admin.js`, `admin-verktoey.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| 3 faner | GloseBank, Brukere, Verktøy | Fungerer |
| Brukeradministrasjon | Se alle brukere, endre abonnement | Fungerer |
| GloseBank-moderering | Godkjenn/rediger/skjul/slett | Fungerer |
| Standardprøve-verktøy | Fyll database med prøver | Fungerer |

**Mangler:**
- ~~`erAdmin()` mangler `await` i brukeradmin.js~~ — **FIKSET** (`async/await` korrekt)
- Ingen paginering i brukerlisten (henter ALLE brukere)
- Ingen søk/filtrering av brukere
- Ingen realtime-oppdatering etter abonnementsendring

### 4.15 PWA & Service Worker

**Filer:** `sw.js`, `manifest.json`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Offline-støtte | Cache-first for assets, network-first for HTML | Fungerer |
| Auto-oppdatering | Periodisk sjekk (30 min) + visibilitychange | Fungerer |
| Versjonsjekk | MessageChannel klient↔SW | Fungerer |
| Oppdaterings-popup | "Ny versjon klar!" med Oppdater-knapp | Fungerer |
| Manuell sjekk | Trykk versjon i footer | Fungerer |
| Install-prompt | PWA-installasjonsknapp + iOS-guide | Fungerer |
| Offline-side | offline.html med auto-reload | Fungerer |

**Mangler:**
- ~~`manifest.json` peker på `index-v2.html`~~ — **FIKSET** (peker nå til `./index.html`)
- Kun ett ikon (192/512) — bør ha flere størrelser
- Ingen bakgrunnssynkronisering

### 4.16 Feedback & Animasjoner

**Fil:** `feedback.js`, `helpers.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Konfetti (canvas) | confetti.js-basert | Fungerer |
| Mini-konfetti (CSS) | Lette CSS-partikler | Fungerer |
| Flash/Pulse/Shake | Visuelle element-animasjoner | Fungerer |
| Toast-meldinger | Tilgjengelig (ARIA) toast-system | Fungerer |
| Lydeffekter | 5 lyder (pop, correct, wrong, win, fanfare) | Deaktivert |
| Vibrasjon | Haptic feedback | Fungerer |

**Mangler:**
- Lydeffekter er deaktivert i koden (spillLyd er no-op)
- `genererHint()` og `visHintIPopup()` eksporteres men brukes aldri
- `feirMilepal()` eksporteres men kalles aldri
- Motiverende meldinger (`hentMotivasjon()`) brukes aldri

### 4.17 Statistikk & Dashboard

**Fil:** `progressDashboard.js`

| Funksjon | Beskrivelse | Status |
|----------|-------------|--------|
| Streak-beregning | Nåværende + lengste streak | Fungerer |
| Mestringsgrad | Per nivå: mestret/lærer/ny | Fungerer |
| Badge-system | 11 mulige badges | Delvis |
| Mini-stats | Kompakt streak/XP/mestret-visning | Fungerer |

**Mangler:**
- 3 av 11 badges er uoppnåelige (perfect_10, early_bird, night_owl — TODOs)
- Badge-visning sier "X/X" i stedet for "X/11"
- All data fra localStorage — ingen server-sync

---

## 5. Kritiske bugs som MÅ fikses

### Prioritet 1 — Sikkerhets/tilgangsfeil

| # | Bug | Fil | Status |
|---|-----|-----|--------|
| 1 | ~~`erAdmin()` mangler `await`~~ | `brukeradmin.js` | **FIKSET** — `async/await` korrekt |
| 2 | ~~`erAdmin()` mangler `await`~~ | `glosebank-admin.js` | **FIKSET** — `async/await` korrekt |
| 3 | Betaling verifiseres via URL-param | `payment.js` | **ÅPEN** — Trenger server-side Stripe webhook |

### Prioritet 2 — Funksjonsfeil

| # | Bug | Fil | Status |
|---|-----|-----|--------|
| 4 | ~~QR-URL `?prove=` vs `?quiz=` mismatch~~ | `qr-scanner.js` | **FIKSET** — Håndterer begge parametre |
| 5 | ~~GDPR-sletting søker feil felt~~ | `gdpr.js` | **FIKSET** — Søker `prove_eier`, `elev_id` og `bruker_id` |
| 6 | ~~GDPR-sletting mangler diktat/GloseBank~~ | `gdpr.js` | **FIKSET** — Sletter diktat, Storage-filer og GloseBank |
| 7 | ~~GDPR-eksport mangler GloseBank-data~~ | `gdpr.js` | **FIKSET** — Eksporterer nå profil, prøver, resultater, diktat og GloseBank |
| 8 | ~~`manifest.json` peker på `index-v2.html`~~ | `manifest.json` | **FIKSET** — Peker til `./index.html` |
| 9 | ~~Tidssone hardkodet UTC+1~~ | `teacher-analytics.js` | **FIKSET** — Bruker `Date.UTC` + `Intl` offset |

### Prioritet 3 — UX-feil

| # | Bug | Fil | Status |
|---|-----|-----|--------|
| 10 | `avvisPersonvern()` blokkerer ikke tilgang | `auth.js` | **ÅPEN** |
| 11 | ~~`slettProve()` sletter ikke resultater~~ | `saved-tests.js` | **FIKSET** |
| 12 | `skrivUtQRKode()` skriver ut hele siden | `saved-tests.js` | **ÅPEN** |

---

## 6. Forbedringer for lansering

### Må ha (P0)

- [x] **Fiks Prioritet 1 bugs** — Admin-tilgang (`erAdmin()` await) fikset
- [x] **Fiks Prioritet 2 bugs** — QR-mismatch, GDPR-sletting, manifest.json, tidssone — alle fikset
- [ ] **Firebase Storage Rules** — regler for diktat-mappen (se egen guide)
- [ ] **Konsistent versjonsnummer** — én kilde til sannhet for versjon
- [x] **Fjern all debug-logging** — ~150 console.log fjernet fra 28 filer (2026-02-13)
- [x] **Fiks manifest.json** — peker nå på `./index.html`
- [ ] **Test betalingsflyt ende-til-ende** — Stripe webhook for server-verifisering

### Bør ha (P1)

- [ ] **Leitner for MatteMester og NorskMester** — nå bare tilfeldig generering
- [ ] **Lydeffekter** — deaktivert i koden, bør reaktiveres eller fjernes
- [ ] **Standardprøver for matte og norsk** — kun engelskfaget nå
- [ ] **Videregående-prøver** — kategori finnes i UI men ingen innhold
- [x] **Søk i GloseBank på emne/nivå/ordinnhold** — fikset, søker nå i tittel, emne, nivå og ordliste
- [ ] **Paginering i brukeradmin** — skalerer ikke med mange brukere
- [x] **Sommertid-håndtering** — fikset, bruker nå `Intl.DateTimeFormat` + `Date.UTC`
- [ ] **Progress-synkronisering** — elev-fremgang kun i localStorage, tapt ved nettleserbyte
- [ ] **QR-skanner visuell indikator** — ramme/linje for bedre UX
- [ ] **Fiks 3 uoppnåelige badges** — implementer perfectStreak, earlyBird, nightOwl

### Fint å ha (P2)

- [ ] **Bruk felles `stokkArray()`-utility** — duplisert i practice.js og norsk-practice.js
- [ ] **Flytt hardkodede standardprøver** til Firestore eller JSON-fil
- [ ] **Reduser `window.*` funksjoner** — 50+ funksjoner på global scope
- [ ] **Erstatt `alert()` med toast** overalt — inkonsistent UX
- [ ] **Aktiver hint-systemet** — `genererHint()` og `feirMilepal()` er klar men ubrukt
- [ ] **Aktiver motiverende meldinger** — `hentMotivasjon()` er klar men ubrukt
- [ ] **Lazy loading i galleri** — filtrering/søkefunksjonalitet
- [ ] **Image fallback** — feilhåndtering for manglende kortbilder
- [ ] **Offline-modus forbedring** — bakgrunnssynkronisering når nett kommer tilbake
- [ ] **Tilgjengelighet (a11y)** — ARIA-attributter finnes i quiz, bør utvides
- [ ] **Kampanjekode-system** — flytt fra hardkodet i klient til Firestore

---

## 7. Teknisk gjeld

### Gjennomgående mønstre som bør adresseres

| Problem | Omfang | Forslag |
|---------|--------|---------|
| ~~**Debug-logging i produksjon**~~ | ~~16 av 23 feature-filer~~ | **FIKSET** — ~150 console.log fjernet fra 28 filer (2026-02-13) |
| **Global state på `window`** | 50+ funksjoner + variabler | Flytt til modul-exports eller event bus |
| **Inline HTML-styles i JS** | Nesten alle feature-filer | Flytt til CSS-klasser |
| **Duplisert kode** | `stokkArray()`, abonnementsjekk, progresjons-UI | Lag felles utilities |
| **Inkonsistente Firestore-feltnavn** | `bruker_id` vs `elev_id`, `nivaa` vs `niva` | Standardiser med typer/konstanter |
| **Versjonsnumre spredd** | 6+ forskjellige versjoner i kodebasen | Én `VERSION` konstant, importer overalt |
| **`setTimeout` for DOM-venting** | auth.js, init.js, navigation.js | Bruk MutationObserver eller events |
| **Tomme catch-blokker** | teacher.js, brukeradmin.js | Logg eller håndter feil |
| **XSS-risiko** | glosebank-admin ordliste, window-funksjoner | Bruk `escapeHtml()` konsekvent (finnes i helpers.js) |

### Versjonsnumre i kodebasen (inkonsistente)

| Sted | Versjon |
|------|---------|
| `sw.js` APP_VERSION | `v2.2.1-ALPHA` |
| `app.js` KLIENT_VERSJON | `v2.2.1-ALPHA` |
| `app.js` initApp() log | `v0.9.8-BETA` |
| `app.js` header-kommentar | `v0.7.6-BETA` |
| `init.js` APP_VERSION | `v0.10.4` |
| `index.html` footer | `v0.13.0-ALPHA` |
| `personvern.html` | `v0.10.0-BETA` |

---

## 8. Versjonsoversikt

### Firestore-collections

| Collection | Formål | Tilgang |
|-----------|--------|---------|
| `users` | Brukerprofiler (lærere) | Eier + admin |
| `prover` | Læreres prøver | Autentisert (les), eier (skriv) |
| `resultater` | Elevresultater (anonymt) | Alle kan opprette, prøve-eier kan lese |
| `felles_prover` | Delte prøver (GloseBank-kandidater) | Admin |
| `glosebank` | Godkjente GloseBank-prøver | Skolepakke + admin |
| `standardprover` | Ferdiglagde prøver | Premium + Skolepakke + admin |
| `glosebank_ratings` | Vurderinger av GloseBank-prøver | Autentisert |
| `school_inquiries` | Skolepakke-henvendelser | Alle kan opprette, admin kan lese |
| `orders` | Betalingsordrer | Eier + admin |

### Firebase Storage

| Mappe | Formål | Regler |
|-------|--------|--------|
| `diktat/{userId}/{settId}/` | Lydopptak per diktat-sett | **MÅ SETTES OPP — se Firebase Console** |

### Netlify Functions

| Funksjon | Formål |
|----------|--------|
| `stripe-checkout` | Oppretter Stripe checkout-session |
| `school-inquiry` | Mottar skolepakke-henvendelser |
| Feide token-exchange | Bytter Feide auth-code mot token |

---

---

## 9. PLAN: Standardprøver for Matte og Norsk

### Bakgrunn
Standardprøver finnes i dag kun for **Engelsk** (GloseMester). For å dekke alle tre fag i Mester Suite trengs tilsvarende for **MatteMester** og **NorskMester**.

### Fase 1 — Datamodell (Firestore)
Utvid `standardprover`-collection med et `fag`-felt:
- `fag: "engelsk"` — eksisterende prøver (ordliste med `s`/`e`-par)
- `fag: "matte"` — nye matteprøver
- `fag: "norsk"` — nye norskprøver

**Matteprøve-struktur:**
```
{
  fag: "matte",
  tittel: "Gangetabellen 1-10",
  nivaa: "barneskole",
  trinn: "3. trinn",
  emne: "multiplikasjon",
  oppgaver: [
    { sporsmal: "7 × 8", svar: "56", type: "regnestykke" },
    { sporsmal: "Hva er halvparten av 120?", svar: "60", type: "tekstoppgave" }
  ]
}
```

**Norskprøve-struktur:**
```
{
  fag: "norsk",
  tittel: "Rettskriving – dobbel konsonant",
  nivaa: "barneskole",
  trinn: "5. trinn",
  emne: "rettskriving",
  oppgaver: [
    { sporsmal: "Fyll inn riktig: ka__e (katt/kate)", svar: "katte", type: "fyll_inn" },
    { sporsmal: "Er 'solen' hankjønn, hunkjønn eller intetkjønn?", svar: "hankjønn", type: "flervalgssporsmal", alternativer: ["hankjønn","hunkjønn","intetkjønn"] }
  ]
}
```

### Fase 2 — UI-endringer i `standardprove.js`
1. Legg til **fag-filter** (fane eller dropdown): Engelsk | Matte | Norsk
2. `lagProveKort()` — vis forskjellig korttype basert på `fag`
3. `visPreview()` — tilpass forhåndsvisning for matte/norsk-oppgaver

### Fase 3 — Quiz-motor per fag
- **Matte**: Vis regnestykke → input-felt for svar → sjekk numerisk likhet
- **Norsk**: Støtt oppgavetypene `fyll_inn`, `flervalgssporsmal`, `diktat` (gjenbruk diktat-motor)
- **Engelsk**: Eksisterende ordliste-quiz (uendret)

Disse kan implementeres som egne rendere i `quiz.js` som velges basert på `prove.fag`.

### Fase 4 — Innholdsproduksjon
Lag 8-10 standardprøver per fag, fordelt på nivå:

| Fag | Barneskole | Ungdomsskole | Totalt |
|-----|-----------|-------------|--------|
| Matte | 5 (gangetabell, addisjon, brøk, geometri, måleenheter) | 5 (algebra, prosent, likninger, statistikk, funksjoner) | 10 |
| Norsk | 5 (rettskriving, ordklasser, les/forstå, grammatikk, diktat) | 5 (sjanger, nynorsk, argumentasjon, grammatikk, tekstanalyse) | 10 |

### Fase 5 — Kopiering og resultat
- `kopierProve()` må lagre `fag`-felt i `prover`-collection
- Resultat-visning må tilpasses for ulike oppgavetyper
- XP-beregning beholdes uendret (riktig svar = XP)

### Estimert arbeid
- Fase 1-2: Datamodell + UI-filter
- Fase 3: Quiz-motor utvidelse (størst jobb)
- Fase 4: Innholdsproduksjon (kan gjøres parallelt)
- Fase 5: Tilpasninger

### Prioritet
Start med **Fase 1+2** (legge til fag-filter og datamodell) slik at eksisterende engelskprøver får `fag: "engelsk"`, deretter **Fase 3** for matteprøver (enklere oppgavetype), og til slutt norskprøver.

---

*Dokumentet er oppdatert 2026-02-13. Oppdater ved større endringer.*
