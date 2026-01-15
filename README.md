# 🎓 GloseMester

**Gamifisert språklæring for norske skoler og selvstudium**

🌐 **Nettside:** [glosemester.no](https://glosemester.no)  
👨‍💻 **Utviklet av:** Øyvind Nilsen Oksvold (Oksvold EDB)  
📅 **Versjon:** v0.9.9-BETA (Januar 2026)  
📋 **Launch-plan:** [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)

GloseMester er en Progressive Web App (PWA) som gjør glosepugging om til en skattejakt. Elevene samler digitale kort, bytter dubletter og klatrer i nivåene, mens lærere enkelt kan lage prøver med QR-kode deling.

---

## 🚀 LANSERINGSSTATUS

**Nåværende fase:** BETA-testing  
**Prod-klar:** ~95% (venter på Vipps produksjon)  
**Launch ETA:** Februar 2026

✅ **Ferdig:**
- Feide innlogging med lærer/elev-skille
- Vipps betalingsintegrasjon (test)
- Firebase backend & Firestore
- PWA med offline-støtte
- Admin-panel & GloseBank (alle lærere kan dele)
- Resend e-postvarsel for skolepakke-forespørsler
- Git + Netlify auto-deploy
- Juridiske dokumenter (klare for juridisk gjennomgang)

🟡 **Pågående:**
- Vipps produksjonsgodkjenning (søknad sendt 13. jan 2026)
- Beta-testing med pilotskoler
- Juridisk gjennomgang av personvernerklæring

---

## 🆕 NYTT I v0.9.9-BETA (15. Januar 2026)

### ✅ GloseBank - Deling for alle lærere 🏦
- **Alle lærere kan dele:** Fjernet admin-begrensning på deling til GloseBank
- **Admin-godkjenning:** Admin godkjenner/avslår før prøver blir synlige
- **Firestore Rules:** Oppdatert for å tillate alle lærere å skrive til `glosebank`
- **teacher.js:** Automatisk backup til GloseBank ved lagring (bruker `delt_av`, `delt_dato`)
- **glosebank-admin.js:** Støtter både `delt_dato` og `opprettet_dato` (bakoverkompatibelt)
- **Testing:** Feide-bruker delte prøve → Pending → Godkjent → Synlig i Browse ✅

### ✅ E-postvarsel med Resend 📧
- **DNS verifisert:** DKIM + SPF records aktivert
- **Automatisk varsling:** Skolepakke-forespørsler sendes til kontakt@glosemester.no
- **Pent formatert HTML:** Profesjonell e-postmal med all kontaktinfo
- **Testing:** E-post mottatt innen 10 sekunder ✅

### ✅ Git + Netlify Auto-Deploy 🚀
- **GitHub-kobling:** Netlify deployer automatisk ved `git push`
- **Environment Variables:** Konfigurert for Vipps, Resend, Firebase
- **Ingen mer manuell opplasting:** Sparer tid på hver endring

### ✅ Multi-bruker Progressbar 📊
- **Felles teller:** Alle elever på samme prøve deler progressbar
- **Real-time synkronisering:** Oppdateres dynamisk uten refresh
- **Firestore-basert:** Bruker `resultat_av` array for å telle unike brukere

### 🛠 Bugfixes
- **glosebank-admin.js:** Fikset query-feil ved sortering (linje 90-119)
- **teacher.js:** Støtter nå både `delt_dato` og `opprettet_dato` i visning

---

## 🆕 NYTT I v0.9.8-BETA (13. Januar 2026)

### ✅ Sikkerhet & Autentisering 🔐
- **Feide Rolle-verifisering:** 4-trinns sjekk for lærer/elev
  - Steg 1: `eduPersonPrimaryAffiliation` (employee/student)
  - Steg 2: Groups API (organisasjonstilhørighet)
  - Steg 3: Brukernavn-analyse (fallback for test-brukere)
  - Steg 4: Sikker blokkering (default: elev hvis uklar)
- **Elev-blokkering:** Vennlig popup med veiledning til prøvekoder
- **Min Side forbedringer:** Viser korrekt navn og e-post fra Firestore
- **Automatisk abonnement-oppdatering:** Vipps webhook aktiverer Premium umiddelbart

### ✅ Betalingsintegrasjon 💳
- **Vipps ePay (Integrert betaling):** Produksjonsklar kode
  - Dynamisk miljø-switching (test/prod)
  - Automatisk Premium-aktivering via webhook
  - Komplett ordre-tracking i Firestore
- **Skolepakke-forespørsel:** Fullstendig skjema med Firestore-lagring
- **Kjøpsvilkår:** Publisert på glosemester.no/vilkar.html

### 🐛 Bugfixes
- **teacher.js:** Fikset `undefined variable` i abonnement-sjekk (linje 154)
- **auth.js:** Håndterer elev-blokkering gracefully
- **min-side.html:** Prioriterer Firestore-data over Firebase Auth

---

## 🆕 NYTT I v0.9.7-BETA (9. Januar 2026)

### ✅ Profesjonalisering & UI/UX 🎨
- **Ny "Om oss"-side:** Fullstendig redesignet profilside med oppdatert biografi og kontaktinfo
- **Smart Footer-logikk:** Footer vises kun på landingssiden
- **Floating Upgrade Button:** Flyttet inn i landingssiden
- **Sikkerhets-CSS:** Kritisk CSS i `<head>` for å hindre blank side
- **Navigasjons-fiks:** "Avbryt"-knapper tar deg korrekt tilbake

---

## ✨ FUNKSJONALITET

### 🎮 For Elever (Øv Selv)

**Læringssystemer:**
- **3 nivåer:** Knapper, Mix, Skriving (progressiv vanskelighetsgrad)
- **Progresjon:** 10-rute visuell bar med automatisk lagring
- **Lydstøtte:** Syntetisk tale (Web Speech API) for alle ord
- **Umiddelbar feedback:** Grønne/røde indikatorer, ingen poeng for feil

**Gamification:**
- **Kortsamling:** 4 sjeldenhetsgrader (Common, Rare, Epic, Legendary)
- **Panteordning:** Pant 2 like kort → 1 diamant
- **Master Galleri:** Full oversikt over alle samlebokskort
- **Nivåbasert belønning:** Nye kort ved fullføring av nivåer

**Tekniske features:**
- Progressive Web App (PWA) - installerbar på mobil/desktop
- Offline-støtte med Service Worker
- Responsive design (mobil-først)
- LocalStorage for lokal progresjon

---

### 🎯 For Lærere

**Autentisering:**
- **Feide OIDC:** Sikker innlogging for norske skoler
- **Google OAuth:** Alternativ innlogging
- **E-post/passord:** Tradisjonell registrering
- **Rolle-verifisering:** Automatisk skille mellom lærer og elev

**Prøvehåndtering:**
- **Dashboard:** Komplett oversikt over alle prøver
- **Prøve-editor:** Legg til/slett ord, min. 3 ord per prøve
- **QR-kode generering:** Del prøver umiddelbart med elever
- **Duplisering:** Kopier og modifiser eksisterende prøver
- **Redigering:** Endre tittel og ordliste på lagrede prøver
- **Resultatstatistikk:** Se fullføringsrate og gjennomsnittsscore

**Innholdsbibliotek:**
- **Standardprøver:** 16 ferdiglagde LK20-alignerte prøver
  - Nivå 1 (8.-10. trinn): 8 prøver
  - Nivå 2 (Vg1-Vg2): 5 prøver
  - Nivå 3 (Vg3): 3 prøver
- **GloseBank:** Deling av prøver mellom lærere (Skolepakke/Admin)
  - Søk og filtrer etter emne/nivå
  - Last ned andres prøver
  - Del egne prøver (admin-godkjenning)

**Admin-funksjoner:**
- **Admin-panel:** Full CRUD på prøver, brukere, standardprøver
- **GloseBank-moderering:** Godkjenn/avvis innsendte prøver
- **Brukeradministrasjon:** Håndter abonnementer og tilganger
- **Statistikk-dashboard:** Oversikt over bruk og aktivitet

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
- 💳 Betaling via **Vipps** (automatisk fornyelse)

**Skolepakke (5.000-10.000 kr/år):**
- ✅ Alt i Premium
- ✅ **GloseBank:** Del prøver internt på skolen
- ✅ **Ubegrenset antall lærere** (skolelisensiering)
- ✅ **Feide-integrasjon:** SSO for alle lærere
- ✅ Dedikert support og opplæring
- ✅ Faktura med 30 dagers betalingsfrist
- 📧 Forespørsel via kontakt@glosemester.no

---

## 🗂️ TEKNISK OVERSIKT

### Arkitektur

**Frontend:**
- Progressive Web App (PWA)
- Vanilla JavaScript (ES6+)
- Firebase Client SDK v9 (modular)
- CSS Grid & Flexbox (responsive design)
- Service Worker for offline-støtte

**Backend:**
- Netlify Functions (serverless Node.js)
- Firebase Admin SDK
- Feide OIDC integrasjon
- Vipps ePay API v2

**Database:**
- Cloud Firestore (NoSQL)
- Collections: `users`, `prover`, `glosebank`, `orders`, `school_inquiries`
- Firestore Security Rules (rolle-basert tilgang)

**Hosting & Deployment:**
- Netlify (glosemester.no)
- Continuous Deployment via GitHub
- Environment Variables for secrets

### Viktige filer

```
glosemester/
├── index.html                    # Landingsside
├── min-side.html                 # Brukerprofilside med abo-info
├── oppgrader.html                # Prisside med Vipps-integrasjon
├── vilkar.html                   # Kjøpsvilkår (for Vipps)
├── js/
│   ├── app.js                    # Hovedapp-logikk
│   ├── features/
│   │   ├── auth.js               # Autentisering (Feide, Google, Email)
│   │   ├── teacher.js            # Lærer-funksjoner & abo-sjekk
│   │   ├── saved-tests.js        # Prøvehåndtering
│   │   └── firebase.js           # Firebase config
│   └── core/
│       └── navigation.js         # SPA-navigasjon
├── netlify/functions/
│   ├── feide-auth.js             # Feide OIDC token exchange
│   ├── vipps-initiate.js         # Vipps betalingsinitiering
│   ├── vipps-webhook.js          # Vipps callback (auto-aktivering)
│   └── school-inquiry.js         # Skolepakke-forespørsel
├── sw.js                         # Service Worker
└── firestore.rules               # Sikkerhet & tilgangskontroll
```

---

## 🔐 Sikkerhet & Personvern

**Autentisering:**
- Firebase Authentication med Feide OIDC
- Rolle-basert tilgangskontroll (lærer/elev/admin)
- Custom tokens for Feide-brukere

**Datahåndtering:**
- GDPR-compliant personvernerklæring (under juridisk gjennomgang)
- Databehandleravtale for skoler
- Minimal datainnsamling (kun nødvendig info)
- Feide-data lagres kryptert i Firestore

**Betalingssikkerhet:**
- Vipps-integrasjon (PCI DSS-compliant)
- Ingen lagring av betalingskort
- Webhook-verifisering for ordre-bekreftelse

---

## 📋 Utviklingsplan

Se fullstendig launch-sjekkliste: **[LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)**

### Kritiske prioriteter (før launch):

**1. Vipps produksjon** ⏱️ 2-5 dager
- ✅ Søknad sendt (13. jan 2026)
- ⏳ Venter på godkjenning
- 🔧 Oppdater env vars ved godkjenning

**2. Beta-testing** ⏱️ 2-4 uker
- 🔍 Rekrutter 1-2 pilotskoler
- 🧪 Test alle kritiske flyter
- 📊 Samle feedback

**3. Juridisk gjennomgang** ⏱️ 1-2 uker
- 📄 Personvernerklæring (advokat)
- 📄 Bruksvilkår
- 💰 Kostnad: 5.000-15.000 kr

**4. Infrastruktur** ⏱️ 1 dag
- ☁️ Firebase backup (daily)
- 📊 UptimeRobot monitoring
- 🔒 Rate limiting på Functions

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
- **Vipps:** For enkel betalingsintegrasjon
- **Firebase:** For robust backend-infrastruktur
- **Netlify:** For serverless hosting og deployment
- **Beta-testere:** (kommer snart)

---

## 📊 Statistikk

**Utviklet:** November 2024 - Januar 2026  
**Kodebasis:** ~15.000 linjer (JS, HTML, CSS)  
**Standardprøver:** 16 LK20-alignerte prøver  
**Samlebokskort:** 50+ unike kort (4 sjeldenhetsgrader)  
**Støttede plattformer:** Web, iOS, Android (PWA)

---

**🚀 Klar for lansering Februar 2026!**

For teknisk dokumentasjon, se [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)