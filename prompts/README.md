# 🎓 GloseMester

**Gamifisert språklæring for skoler og selvstudium**

🌐 **Nettside:** [glosemester.no](https://glosemester.no)  
👨‍💻 **Utviklet av:** Øyvind Nilsen Oksvold  
📅 **Versjon:** v0.7.6-BETA (Januar 2025)

GloseMester er en Progressive Web App (PWA) som gjør glosepugging om til en skattejakt. Elevene samler digitale kort, bytter dubletter og klatrer i nivåene, mens lærere enkelt kan lage prøver med QR-kode deling.

---

## 🆕 NYTT I v0.7.6-BETA (9. Januar 2025)

### ✅ Hamburger-meny redesign (FERDIG) 🍔
- **☰ Alltid synlig:** Hamburger-meny på både desktop og mobil
- **Enklere layout:** Navn + Hamburger + Hjem (kun 2 knapper synlige)
- **Logg ut i meny:** Trygt plassert nederst i drawer
- **Konsistent:** Samme opplevelse på alle enheter
- **Event listeners:** Ingen onclick-attributter, moderne JavaScript
- **Drawer-design:** 280px bred slide-in fra venstre

### ✅ Konsistent UX: Øving = Prøve (FERDIG) 🎯
- **10-rute progress bar** i BÅDE øving og prøve
- **Visuell motivasjon:** Se tydelig hvor nær du er neste kort
- **Persistent progress:** Lagres automatisk i localStorage
- **IKKE nullstilles:** Progress fortsetter mellom sesjoner
- **Lik samling-visning:** Diamanter, bonus-bar, pant-info overalt

### ✅ Oppdaterte priser (FERDIG) 💰
- **Premium:** 99 kr/mnd eller 800 kr/år
- **Skolepakke:** 5000-10000 kr/år (avhengig av antall lærere)
- **Bedre verdiforslag:** Månedlig fleksibilitet

### ✅ E-postadresser oppdatert (FERDIG) 📧
- **Generell kontakt:** kontakt@glosemester.no
- **Systemvarsler:** system@glosemester.no
- **Personvernerklæring:** Oppdatert med nye adresser

---

## 🆕 NYTT I v0.7.5-BETA (8. Januar 2025)

### ✅ Mobilmeny-forbedring
- Hamburger-meny for mobil
- Desktop uendret
- Auto-lukking ved klikk utenfor

### ✅ Kampanjekode og QR-scanner fixes
- Kampanjekode-knapp fungerer
- QR-scanner aktivert
- Event listeners i stedet for onclick

---

## 🆕 NYTT I v0.7.4-BETA (Januar 2025)

### ✅ Rediger og dupliser prøver
- **✏️ Rediger-knapp** på alle lagrede prøver
- **📋 Dupliser-knapp** for å lage kopier
- **Brukeradministrasjon** med fanebasert admin-panel
- **16 Standardprøver** (290 ord totalt)

---

## ✨ FUNKSJONALITET

### 🎮 For Elever (Øv Selv)

**Nivåbasert læring:**
- **Nivå 1:** Kun flervalg (knapper) – perfekt for nybegynnere
- **Nivå 2:** Blanding av skriving og knapper (50/50)
- **Nivå 3:** Mest skriving (80%) – for de som vil bli eksperter

**Progresjon:** 
- **10-rute visuell bar** (samme i øving OG prøve!)
- Hvert riktig svar fyller en rute
- Ved 10/10 får man en belønning (et kort)
- **PERSISTENT:** Progress lagres automatisk, nullstilles IKKE

**Læringsfokus:** 
- Ved feil svar stopper spillet opp, viser fasiten
- "Søren heller"-popup krever at eleven trykker videre
- Ingen poeng for feil svar

**Lydstøtte:** 
- Alle ord kan leses opp med syntetisk tale (Norsk/Engelsk)

### 🏆 Samling & Galleri

**Kortsamling:** 
- Samle unike kort med ulik sjeldenhetsgrad (Common, Rare, Epic, Legendary)
- **Lik visning overalt:** Diamanter, bonus-bar, pant-info i både øving og prøve

**Panteordning:** 
- Pant to like kort mot 1 diamant
- Bruk diamanter til å kjøpe nye kort

**Master Galleri:** 
- Oversikt over alle mulige kort i spillet
- Se hva du mangler!

### 🎯 For Lærere

**Lærerportal:**
- Lag egne prøver med norsk-engelsk ordlister
- Dashboard med oversikt over alle prøver
- **Auto-lagring til GloseBank** (deles med andre lærere)
- **Hamburger-meny:** Ryddig design på alle enheter

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
- **GloseBank:** Godkjenn/avvis prøver, rediger metadata
- **Brukeradministrasjon:** Se alle brukere, rediger abonnementer
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
- **Skolepakke** for alle lærere på skolen
- Priser:
  - 1-5 lærere: 5000 kr/år
  - 6-15 lærere: 7000 kr/år
  - 16+ lærere: 10000 kr/år

**Kampanjekoder:**
- Premium: `BETA2026` (90 dager), `LANSERING` (30 dager), `TEST30` (30 dager), `TEST7` (7 dager)
- Skolepakke: `SKOLE2026` (365 dager), `SKOLEPILOT` (180 dager), `SKOLETEST` (30 dager)

---

## 🔧 GJENSTÅENDE UTVIKLING

### 🎯 Neste Steg (Prioritert rekkefølge)

#### **STEG 1: FIX Hamburger-meny (KRITISK)** 🚨
**Status:** Under debugging  
**Prioritet:** 🔴 KRITISK  
**Problem:** Drawer vises ikke som vertikal slide-in  
**Estimert tid:** 1-2 timer

#### **STEG 2: Betalingsløsning (HØY PRIORITET)** 💳
**Status:** Ikke startet  
**Prioritet:** 🔴 HØY  
**Estimert tid:** 8-12 timer

**Funksjoner:**
- **Vipps ePay** for Premium (månedlig/årlig)
- **Faktura** for Skolepakke
- **Feide** for elevpålogging (valgfritt)
- Webhook for automatisk oppgradering
- E-postkvitteringer
- Auto-fornyelse varsler

#### **STEG 3: Dashboard med statistikk** 📊
**Status:** Ikke startet  
**Prioritet:** 🟡 MIDDELS  
**Estimert tid:** 3-4 timer

**Funksjonalitet:**
- Total antall prøver og elevbesvarelser
- Mest populære prøver
- Grafer over tid (Chart.js)
- Aktivitet siste 7/30 dager

#### **STEG 4: CSV import av prøver** 📄
**Status:** Ikke startet  
**Prioritet:** 🟡 MIDDELS  
**Estimert tid:** 2 timer

#### **STEG 5: Markedsføring og salg** 📢
**Status:** Ikke startet  
**Prioritet:** 🔴 HØY  
**Estimert tid:** Kontinuerlig

**Aktiviteter:**
- Landingsside for lærere
- Facebook/LinkedIn annonser
- Kontakt skoler direkte
- Bloggposter og innholdsmarkedsføring

---

## 📝 UTVIKLINGSHISTORIKK

### v0.7.6-BETA (9. Januar 2025)
✅ **Hamburger-meny redesign** - Alltid synlig, drawer-design  
✅ **Event listeners** - Moderne JavaScript uten onclick  
✅ **Logg ut i meny** - Trygt plassert nederst  
✅ **Konsistent UX** - Samme opplevelse overalt

### v0.7.5-BETA (8. Januar 2025)
✅ **Mobilmeny** - Hamburger for mobil  
✅ **Kampanjekode fix** - Knapp fungerer  
✅ **QR-scanner fix** - Aktivert

### v0.7.4-BETA (Januar 2025)
✅ **Rediger prøver** - Endre eksisterende  
✅ **Dupliser prøver** - Lag kopier  
✅ **Brukeradministrasjon** - Admin-panel  
✅ **16 Standardprøver** - 290 ord totalt

### v0.7.0-BETA (Januar 2025)
✅ Standardprøver infrastruktur  
✅ Admin-verktøy

### v0.6.x-BETA (Januar 2025)
✅ GloseBank Browse og Admin  
✅ Rating-system

### v0.5.x (Desember 2024)
✅ Nytt prissystem  
✅ QR-kode funksjonalitet  
✅ Resultat-lagring

---

## 🚀 DEPLOYMENT

**Netlify:** Automatisk deployment fra Git  
**URL:** https://glosemester.no  
**Service Worker:** Versjon v0.7.6-BETA

**Deploy-prosess:**
1. Commit endringer til Git
2. Push til hovedgren
3. Netlify bygger automatisk
4. Bump `sw.js` versjon for cache-invalidering
5. Test i produksjon (ALLTID hard refresh: Ctrl+Shift+R)

---

## 📞 KONTAKT

**Utvikler:** Øyvind Nilsen Oksvold  
**E-post generelt:** kontakt@glosemester.no  
**E-post system:** system@glosemester.no  
**GitHub:** [Privat repository]

---

## 🔒 PERSONVERN & SIKKERHET

**For elever:**
- ✅ 100% anonym - ingen registrering kreves
- ✅ Ingen sporing eller cookies
- ✅ Lokal lagring (localStorage) - vi ser aldri dataen

**For lærere:**
- ✅ Firebase Authentication (Google/Email)
- ✅ Kryptert lagring (AES-256)
- ✅ HTTPS-kryptering
- ✅ GDPR-compliant
- ✅ Ingen deling med tredjeparter (utenom betaling)

**Se fullstendig personvernerklæring:** [personvern.html](personvern.html)

---

**Sist oppdatert:** 9. januar 2025  
**Versjon:** v0.7.6-BETA
