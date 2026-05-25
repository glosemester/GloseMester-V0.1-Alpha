# Teknisk Utviklerbriefing – GloseMester Mobil

**Dato:** 24. mai 2026  
**Prosjekteier:** Øyvind Nilsoks – oyvind.nilsoks@gmail.com  
**Status:** Klar for utvikling

---

## 1. Prosjektoversikt

**Mål:** Bygge en React Native (Expo) mobilapp av den eksisterende web-appen GloseMester –
et norsk pedagogisk vokabularspill for engelskopplæring på barneskole/ungdomsskole-nivå.

**Eksisterende web-app:** glosemester.no (PWA)  
**Web-repository:** `glosemester/GloseMester-V0.1-Alpha` (GitHub)  
**Nytt mobil-repository:** Eget repo, f.eks. `GloseMester-App`

> ⚠️ **KRITISK:** Web-repoet skal ikke røres. Mobilappen skal leve i et helt separat repository.

---

## 2. Eksisterende Web-App – Teknisk Analyse

### Tech Stack
- Vanilla JavaScript (ES6 modules), HTML5, CSS3
- Firebase (Firestore, Auth, Hosting)
- Netlify Functions (serverless backend)
- Feide OAuth (norsk skoleinnlogging)
- Stripe (betalingsintegrasjon – se seksjon 8 for mobil)
- Service Worker (PWA/offline)

### Arkitektur
Dual-arkitektur under migrering:
- `js/` – Legacy (v0.10.3, window globals)
- `src/` – Ny modulær (v2.6.0, ES6 klasser)

### Kjernelogikk å portere

**Vokabulardata** (`js/vocabulary.js` + `src/features/glosemester/vocabulary-data.js`)
```
Nivå 1: 90 ord  – enkle substantiv (dyr, familie, farger, tall, mat, kropp)
Nivå 2: 50 ord  – klær, vær, følelser, tid
Nivå 3: 50 ord  – gaming, meninger, samfunn, fremtid
```

**Quiz-motor** (`js/features/quiz.js` – 24KB)
- Flervalg og skriveinndata
- Riktig/feil scoring
- TTS (tekst-til-tale) for uttale
- Tidtaker-modus

**Øvingsmodus** (`js/features/practice.js` – 21KB)
- Flashcard-system
- Riktig/feil registrering
- Lyd-feedback (correct.mp3, wrong.mp3 osv.)

**Leitner Spaced Repetition** (`js/features/learningEngine.js` – 11KB)
- 5-boks Leitner-algoritme
- Tilpasser seg brukerens prestasjoner

**Brukerroller**
```
'oving'   – elev i øvingsmodus (ingen innlogging)
'kode'    – elev via QR-kode/kampanjekode fra lærer
'laerer'  – lærer med dashbord og statistikk
```

**Lærerdashbord** (`js/features/teacher.js`, `teacher-analytics.js`)
- Opprette klasser og dele QR-koder
- Se elevstatistikk per glose og nivå
- Eksportere resultater til Excel (xlsx)

**Kortsystem** (`src/core/kort/`)
- Virtuelle kort som belønning etter fullførte quiz
- Galleri av innsamlede kort
- Kategorier: dyr, dinosaurer, biler, guder (bilderessurser finnes i repo)

**Autentisering** (`js/features/auth.js`)
- Feide OAuth (via Netlify Function)
- Google Sign-In (Firebase Auth)
- Anonym/gjeste-modus

**Lydressurser** (`sounds/`)
```
correct.mp3, wrong.mp3, win.mp3, pop.mp3, fanfare.mp3
```

---

## 3. Mobilapp – Foreslått Arkitektur

### Tech Stack
```
React Native + Expo SDK (siste stabile)
Navigation:     expo-router (file-based routing)
Animasjoner:    react-native-reanimated + react-native-gesture-handler
State:          Zustand
Storage:        @react-native-async-storage/async-storage
Audio:          expo-av
TTS:            expo-speech
Icons:          @expo/vector-icons
Firebase:       firebase JS SDK (v10+)
i18n:           i18next + react-i18next
IAP:            react-native-iap
```

### Foreslått mappestruktur
```
GloseMester-App/
├── app/                        # expo-router sider
│   ├── (tabs)/
│   │   ├── index.tsx           # Hjem / nivåvalg
│   │   ├── quiz.tsx            # Quiz-modus
│   │   ├── practice.tsx        # Øving / flashcards
│   │   ├── cards.tsx           # Kortgalleri
│   │   └── profile.tsx         # Profil / statistikk
│   ├── teacher/                # Lærer-seksjon
│   │   ├── dashboard.tsx
│   │   ├── class.tsx
│   │   └── analytics.tsx
│   ├── auth/
│   │   └── login.tsx
│   └── _layout.tsx
├── components/
│   ├── FlashCard.tsx           # Kortflipping (Reanimated)
│   ├── QuizOption.tsx
│   ├── ProgressBar.tsx
│   └── LevelBadge.tsx
├── store/
│   ├── useUserStore.ts         # Brukerstate (Zustand)
│   ├── useQuizStore.ts
│   └── useProgressStore.ts
├── data/
│   └── vocabulary.ts           # Portert fra vocabulary.js
├── locales/                    # i18n oversettelser
│   ├── nb.json                 # Norsk bokmål
│   └── en.json                 # Engelsk (fremtidig)
├── utils/
│   ├── leitner.ts              # Spaced repetition algoritme
│   ├── scoring.ts
│   └── tts.ts                  # Text-to-speech wrapper
└── assets/
    ├── sounds/                 # Kopiert fra web-repo
    └── images/                 # Kopiert fra web-repo
```

### Skjermer – Prioritert rekkefølge
1. Velkomstskjerm / Rollevalg (elev / lærer / gjest)
2. Nivåvalg (1, 2, 3)
3. Øvingsmodus (flashcards med flip-animasjon)
4. Quiz-modus (flervalg + skriveinndata)
5. Resultatskjerm med kortbelønning
6. Kortgalleri
7. Lærer-dashbord
8. Innlogging (Feide / Google)

---

## 4. Miljøoppsett – Nåværende Status

### Utviklermaskinen (ferdig ✅)
- **OS:** Linux Mint
- **Node.js:** Installert
- **Prosjektmappe:** `~/Apper/GloseMester-App`
- **Expo SDK:** 56 (siste `create-expo-app`)

### Mobiltest – Blokkert 🚧
- **Testenhet:** Android 12
- **Problem:** Expo Go fra Play Store støtter ikke siste SDK
- **Feilmelding:** `"Project is incompatible with this version of Expo Go"`

### Anbefalte løsninger (velg én)

**Alternativ A – Development Build (anbefalt):**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile development
# Installer .apk direkte på testenheten – omgår Expo Go helt
```

**Alternativ B – Android Studio Emulator:**
```bash
# Installer Android Studio på Linux
# Opprett AVD med Android 12
npx expo start --android
```

**Alternativ C – Match SDK til Expo Go-versjon:**
```bash
# Sjekk Expo Go versjon: Innstillinger → Apper → Expo Go
# Nedgrader prosjektet til matchende SDK
npx expo install expo@~XX.0.0
npx expo install --fix
```

---

## 5. Firebase-konfigurasjon

Eksisterende Firebase-prosjekt finnes for web-appen. Mobilappen trenger:
- Nytt Firebase-prosjekt **eller** tilgang til eksisterende
- `google-services.json` for Android
- `GoogleService-Info.plist` for iOS
- Firestore collections å opprette/gjenbruke: `users`, `classes`, `progress`, `results`

Eksisterende Netlify Functions kan gjenbrukes for Feide OAuth og Stripe –
mobilappen kaller dem som vanlige REST-endepunkter.

---

## 6. Nøkkelfiler å Lese i Web-Repoet

| Fil | Hvorfor viktig |
|-----|----------------|
| `js/vocabulary.js` | Hele ordbankstrukturen – konverter til TypeScript |
| `js/features/quiz.js` | Full quiz-logikk (24KB) |
| `js/features/learningEngine.js` | Leitner-algoritmen – kan brukes nesten uendret |
| `js/features/practice.js` | Øvingsmodus-logikk (21KB) |
| `js/features/saved-tests.js` | Testhistorikk og -administrasjon (47KB) |
| `src/features/glosemester/vocabulary-data.js` | Ryddigere versjon av ordbanken |
| `src/core/kort/` | Kortsystem med belønningslogikk |
| `sounds/` | Lydressurser – kopier direkte |
| `images/` | Kortbilder (dyr, dino, biler, guder) – kopier direkte |

---

## 7. Designretningslinjer

- **Primærfarge:** `#7C3AED` (lilla, fra manifest.json)
- **Stil:** Glassmorphism, rounded corners, store tap-targets (min. 44x44pt)
- **Animasjoner:** 60fps kortflipping med `react-native-reanimated`
- **Offline-first:** All kjernelogikk skal fungere uten internett
- **Safe areas:** Støtte for notch og home indicator bar
- **Typografi:** Fluid padding, lesbar skriftstørrelse for barn (min. 16sp)

---

## 8. Betalingsløsning – Stripe vs. In-App Purchase

### Anbefaling: Dropp Stripe for mobilappen – bruk IAP

Apple og Google **krever** at kjøp av digitalt innhold (abonnementer, premium-tilgang)
i apper går gjennom deres egne betalingssystemer. Brudd på denne regelen fører til
avvisning eller fjerning fra App Store / Play Store.

| | Stripe (web) | In-App Purchase (mobil) |
|---|---|---|
| Kommisjon | ~1.4% + fast | 15–30% til Apple/Google |
| Krav | Valgfritt på web | **Obligatorisk** i app |
| Implementasjon | Allerede ferdig | Må bygges nytt |
| Kontroll | Full kontroll | Apple/Google bestemmer |

### Anbefalt oppsett
- **Web (glosemester.no):** Behold Stripe som nå
- **Mobil:** Implementer `react-native-iap` for abonnementer
- **Backend:** Verifiser IAP-kvitteringer server-side (Netlify Function)
  og oppdater brukerstatus i Firestore

### Produkter å sette opp i App Store / Play Store
```
no.glosemester.premium.monthly   – Månedlig abonnement
no.glosemester.premium.yearly    – Årlig abonnement
no.glosemester.teacher.monthly   – Lærerabonnement månedlig
no.glosemester.teacher.yearly    – Lærerabonnement årlig
```

---

## 9. Flerspråklig Støtte (i18n)

### Teknisk implementasjon
Sett opp `i18next` + `react-i18next` fra dag én.
Koster lite å bygge inn fra starten – koster mye å legge til etterpå.

```
locales/
├── nb.json    # Norsk bokmål (app-tekster, UI)
├── en.json    # Engelsk UI (fremtidig)
├── es.json    # Spansk UI (fremtidig)
└── ...
```

### To typer flerspråklighet i GloseMester

| Type | Eksempel | Vanskelighetsgrad |
|---|---|---|
| **App-språk (UI)** | Menyknapper og instruksjoner på f.eks. arabisk | Enkel – oversett JSON-filer |
| **Glose-par (innhold)** | Lære spansk→norsk, fransk→norsk | Middels – nytt datasett per språkpar |

### Anbefalt datamodell for fremtidig utvidelse
```typescript
interface VocabularyItem {
  id: string;
  translations: {
    [langPair: string]: {
      question: string;
      answer: string;
    }
  };
  level: 1 | 2 | 3;
  category: string;
  imageUrl?: string;
}

// Eksempel
{
  id: "apple",
  translations: {
    "no-en": { question: "eple", answer: "apple" },
    "no-es": { question: "eple", answer: "manzana" },
    "en-es": { question: "apple", answer: "manzana" }
  },
  level: 1,
  category: "mat"
}
```

### Anbefaling
Bygg i18n-støtte inn fra starten, men prioriter norsk–engelsk i MVP.
Strukturer datamodellen slik at nye språkpar legges til som innhold –
uten kodeendringer.

---

## 10. Veikart (forslag)

| Fase | Innhold | Estimat |
|------|---------|---------|
| **MVP** | Øving + Quiz (nivå 1), offline støtte, anonymt | 3–4 uker |
| **v1.0** | Alle 3 nivåer, kortsystem, IAP, Google-innlogging | 4–6 uker |
| **v1.1** | Lærerdashbord, klasseadministrasjon, Feide | 3–4 uker |
| **v1.2** | Diktat-modus, spaced repetition, statistikk | 2–3 uker |
| **v2.0** | Flerspråklig støtte, nytt språkpar | TBD |

---

*Dokument generert: 24. mai 2026*  
*Kontakt: oyvind.nilsoks@gmail.com*
