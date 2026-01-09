# 🎓 GloseMester

**Gamifisert språklæring for skoler og selvstudium**

🌐 **Nettside:** [glosemester.no](https://glosemester.no)  
👨‍💻 **Utviklet av:** Øyvind Nilsen Oksvold  
📅 **Versjon:** v0.7.6-BETA (Januar 2026)

GloseMester er en Progressive Web App (PWA) som gjør glosepugging om til en skattejakt. Elevene samler digitale kort, bytter dubletter og klatrer i nivåene, mens lærere enkelt kan lage prøver med QR-kode deling.

---

## 🆕 NYTT I v0.7.6-BETA (8. Januar 2026)

### ✅ Feide Innlogging & Backend (FERDIG) 🔐
- **Full OIDC Integrasjon:** Sikker innlogging for lærere via Feide.
- **Serverless Backend:** Ny `Netlify Functions` arkitektur for å håndtere hemmeligheter.
- **Firebase Custom Auth:** Feide-brukere konverteres automatisk til sikre Firebase-brukere.
- **Skolelisens-UI:** Tydelig skille mellom privat innlogging og skole-innlogging.
- **Test-støtte:** Full støtte for Feide Test Users i utviklingsmodus.

### ✅ Sikkerhetsoppgradering (FERDIG) 🛡️
- **Environment Variables:** Ingen hemmeligheter (API keys/Secrets) ligger lenger i koden.
- **Secure Token Exchange:** "Handshake" med Feide skjer på lukket server, ikke i nettleseren.
- **Package Management:** Innført `package.json` for håndtering av backend-avhengigheter (`axios`, `firebase-admin`).

---

## 🆕 NYTT I v0.7.5-BETA (8. Januar 2025)

### ✅ Mobilmeny-forbedring (FERDIG) 📱
- **☰ Hamburger-meny** for mobil (<768px)
- **Desktop uendret:** Alle knapper synlige som før
- **Thumb-friendly:** Stor slide-in meny fra venstre
- **Auto-lukking:** Klikk utenfor eller på overlay → meny lukkes
- **User-email:** Vises øverst i hamburger-menyen

### ✅ Konsistent UX: Øving = Prøve (FERDIG) 🎯
- **10-rute progress bar** i BÅDE øving og prøve
- **Visuell motivasjon:** Se tydelig hvor nær du er neste kort
- **Persistent progress:** Lagres automatisk i localStorage
- **Lik samling-visning:** Diamanter, bonus-bar, pant-info overalt

### ✅ Oppdaterte priser (FERDIG) 💰
- **Premium:** 99 kr/mnd eller 800 kr/år (før: 500 kr/år)
- **Skolepakke:** Uendret (5000-10000 kr/år)

---

## ✨ FUNKSJONALITET

### 🎮 For Elever (Øv Selv)

**Nivåbasert læring:**
- **Nivå 1:** Kun flervalg (knapper) – perfekt for nybegynnere
- **Nivå 2:** Blanding av skriving og knapper (50/50)
- **Nivå 3:** Mest skriving (80%) – for de som vil bli eksperter

**Progresjon:** - **10-rute visuell bar** (samme i øving OG prøve!)
- Hvert riktig svar fyller en rute
- Ved 10/10 får man en belønning (et kort)
- **PERSISTENT:** Progress lagres automatisk, nullstilles IKKE ved avslutning

**Læringsfokus:** - Ved feil svar stopper spillet opp, viser fasiten
- "Søren heller"-popup krever at eleven trykker videre
- Ingen poeng for feil svar

**Lydstøtte:** - Alle ord kan leses opp med syntetisk tale (Norsk/Engelsk)

### 🏆 Samling & Galleri

**Kortsamling:** - Samle unike kort med ulik sjeldenhetsgrad (Common, Rare, Epic, Legendary)
- **Lik visning overalt:** Diamanter, bonus-bar, pant-info i både øving og prøve

**Panteordning:** - Pant to like kort mot 1 diamant
- Bruk diamanter til å kjøpe nye kort

**Master Galleri:** - Oversikt over alle mulige kort i spillet
- Se hva du mangler!

### 🎯 For Lærere

**Lærerportal:**
- **Feide-innlogging:** Sikker tilgang med skolekonto.
- Lag egne prøver med norsk-engelsk ordlister
- Dashboard med oversikt over alle prøver
- **Auto-lagring til GloseBank** (deles med andre lærere)
- **Mobiloptimalisert:** Hamburger-meny på små skjermer

**Lagrede Prøver:**
- Se alle dine prøver
- **✏️ Rediger prøver:** Endre tittel og ordliste
- **📋 Dupliser prøver:** Lag kopier med nytt navn
- Generer QR-kode (elever kan skanne og starte umiddelbart)
- Prøvekode (20 tegn) for deling
- Resultater fra elever (anonyme)
- Excel-eksport av resultater
- Vanskeligste ord-analyse
- Slett prøver

**📚 Standardprøver (Premium/Skolepakke):**
- **16 ferdiglagde prøver** (290 ord totalt)
- LK20-alignerte prøver for barneskole og ungdomsskole
- Filter etter nivå
- Forhåndsvisning
- Kopieres til eget bibliotek med ett klikk

**📚 GloseBank (Skolepakke):**
- Søk og bla i godkjente prøver fra andre lærere
- Filter på fag, nivå, emne, LK20
- Forhåndsvisning av ordlister
- Last ned til eget bibliotek
- Gi rating (1-5 stjerner + kommentar)
- Se statistikk (nedlastninger, ratings)

**🔧 Admin (Kun admin-bruker):**
- **Fanebasert admin-panel:** GloseBank, Brukere, Verktøy
- **GloseBank:** Godkjenn/avvis prøver, rediger metadata, publiser/skjul/slett
- **Brukeradministrasjon:** Se alle brukere, rediger abonnementer, statistikk
- **Verktøy:** Legg til standardprøver med ett klikk

### 💳 Betalingsmodell

**Gratis Tier:**
- Lag opptil **3 prøver**
- Alle elev-funksjoner (Øv Selv, Samling, Galleri)
- QR-koder og prøvekoder

**Premium Lærer (99 kr/mnd eller 800 kr/år):**
- **Ubegrenset** antall prøver
- **✏️ Rediger** og **📋 Dupliser** prøver
- Resultatvisning og Excel-eksport
- Tilgang til **16 Standardprøver**
- **Fleksibel betaling:** Månedlig eller årlig

**Skolepakke (5000-10000 kr/år):**
- Alt i Premium
- **GloseBank** - Søk og del prøver med andre lærere
- **Feide-integrasjon** (Krever databehandleravtale)
- Priser:
  - 1-5 lærere: 5000 kr/år
  - 6-15 lærere: 7000 kr/år
  - 16+ lærere: 10000 kr/år

---

## 🗂️ TEKNISK OVERSIKT

### Filstruktur