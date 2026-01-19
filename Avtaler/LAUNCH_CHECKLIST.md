# 🚀 GLOSEMESTER v1.0 - KOMPLETT LAUNCH-SJEKKLISTE

## 📊 OVERSIKT

Dette dokumentet inneholder ALT som må være på plass før GloseMester kan lanseres i produksjon.

**Status-koder:**
- ✅ FERDIG - Allerede implementert
- 🟡 DELVIS - Fungerer, men trenger produksjonsoppsett
- ❌ MANGLER - Må implementeres
- 🔴 KRITISK - Må være på plass før lansering

---

# 1️⃣ TEKNISK INFRASTRUKTUR

## 1.1 Hosting & Domene
- [x] ✅ Domene registrert: glosemester.no
- [x] ✅ Netlify hosting konfigurert
- [x] ✅ HTTPS/SSL aktivert
- [x] ✅ Firebase project opprettet
- [ ] 🔴 **DNS-konfigurasjoner verifisert**
  - Sjekk at alle subdomener fungerer
  - Verifiser e-post redirects

## 1.2 Database & Backend
- [x] ✅ Firebase Firestore setup
- [x] ✅ Firestore Security Rules deployed
- [x] ✅ Firebase Authentication setup (Feide)
- [x] ✅ Netlify Functions for Feide OAuth
- [ ] 🔴 **Firestore backup-strategi**
  - Automatiske daglige backups
  - Point-in-time recovery aktivert
  - Test restore-prosedyre

## 1.3 E-post Setup
- [x] ✅ **Profesjonell e-postdomene: kontakt@glosemester.no**
  - Satt opp via Gmail
  - SPF, DKIM, DMARC records konfigurert (Resend)
  - Sending og mottak testet ✅
- [x] ✅ **E-postvarsel for skoleforespørsler** (Resend aktivert)
- [ ] ❌ **Transaksjonelle e-poster** (bekreftelser, kvitteringer)
- [ ] ❌ **Support-ticket system eller forwarding**

---

# 2️⃣ BETALINGSINTEGRASJON

## 2.1 Vipps - Fra Test til Produksjon
- [x] 🟡 Vipps test-integrasjon fungerer
- [ ] 🔴 **Søk om Vipps produksjonstilgang**
  - Gå til https://portal.vipps.no
  - Søk om "Vipps ePay" (engangsbetalinger)
  - Søk om "Vipps Recurring" (abonnementer)
  - Venter 2-5 virkedager på godkjenning
- [ ] 🔴 **Motta produksjons-credentials**
  - Client ID
  - Client Secret
  - Subscription Key (Ocp-Apim-Subscription-Key)
  - Merchant Serial Number (MSN)
- [ ] 🔴 **Oppdater Netlify Environment Variables**
  ```
  VIPPS_CLIENT_ID=<prod-id>
  VIPPS_CLIENT_SECRET=<prod-secret>
  VIPPS_SUBSCRIPTION_KEY=<prod-key>
  VIPPS_MSN=<prod-msn>
  VIPPS_MODE=production
  ```
- [ ] 🔴 **Test produksjonsbetalinger**
  - Gjennomfør test-kjøp med ekte kort
  - Verifiser at beløp trekkes
  - Sjekk at callback fungerer
  - Test refusjon

## 2.2 Fakturasystem for Skolepakker
- [ ] 🔴 **Velg fakturasystem**
  - Alternativer: Tripletex, Fiken, Poweroffice, Visma
  - Anbefaling: **Fiken** (enkel, rimelig for små bedrifter)
- [ ] ❌ **Sett opp automatisk fakturering**
  - API-integrasjon eller manuell prosess
  - Fakturamal med logo og kontaktinfo
- [ ] ❌ **Betalingspåminnelser**
  - Automatiske purringer ved forsinket betaling
  - Inkassorutiner

---

# 3️⃣ AUTOMATISERTE VARSLER & KOMMUNIKASJON

## 3.1 E-postvarsel - Skoleforespørsler
**STATUS:** ✅ FERDIG (15. januar 2026)

**IMPLEMENTERT MED RESEND**

### ✅ Setup komplett
- Resend-konto opprettet
- DNS verifisert (DKIM + SPF)
- API-key konfigurert i Netlify Environment Variables
- Netlify Function: `school-inquiry.js` aktivert
- Sender til: kontakt@glosemester.no
- Testet: E-post mottas innen 10 sekunder ✅

### Konfigurasjon
```bash
RESEND_API_KEY=re_xxx (satt i Netlify)
```

### Netlify Function
Fil: `netlify/functions/school-inquiry.js`
- Lagrer forespørsel i Firestore (`school_inquiries`)
- Sender formatert HTML-e-post via Resend
- Inkluderer: Skoleinfo, kontaktperson, melding, reply-knapp
**ALTERNATIV: SendGrid (ikke i bruk)**
- Gratis tier: 100 e-poster/dag
- Enklere setup enn Resend
- Kan vurderes hvis Resend blir for dyrt

## 3.2 E-postbekreftelser til kunder
- [ ] ❌ **Bekreftelse på Premium-kjøp (Vipps)**
  - Sendes automatisk etter vellykket betaling
  - Inkluderer: Kvittering, abonnementsdetaljer, supportinfo
- [ ] ❌ **Bekreftelse på skolepakke-forespørsel**
  - Sendes til skolen umiddelbart
  - "Vi har mottatt forespørselen og kontakter dere innen 2 virkedager"
- [ ] ❌ **Faktura sendt (Skolepakke)**
  - Automatisk fra fakturasystem
  - Inkluderer: Betalingsdetaljer, forfallsdato, supportinfo

## 3.3 Admin-varsler
- [x] ✅ **E-post ved skoleforespørsel** (Resend aktivert)
- [ ] ❌ **Slack/Discord webhook** (valgfri)
  - Real-time varsler i Slack-kanal
  - Nyttig for rask respons

---

# 4️⃣ JURIDISKE DOKUMENTER

## 4.1 Dokumenter som MÅ være tilgjengelige
- [x] ✅ Databehandleravtale (ferdig)
- [x] ✅ Kjøpsvilkår/Salgsvilkår (ferdig, oppdatert til v0.10.0)
- [x] ✅ **Personvernerklæring** (ferdig, oppdatert til v0.10.0)
  - Tilgjengelig på /personvern.html
  - Inkluderer GDPR-compliance
  - Oppdatert med siste sikkerhetstiltak
- [x] ✅ **Bruksvilkår** (ferdig som kjøpsvilkår)
  - Generelle vilkår for bruk av GloseMester
  - Tilgjengelig på /vilkar.html
- [ ] ❌ **Informasjonskapsler (Cookie Policy)**
  - Hvis du bruker cookies/analytics

## 4.2 Juridisk gjennomgang
- [ ] 🔴 **Få advokat til å gjennomgå avtaler**
  - Spesielt databehandleravtale
  - Kostnad: 5.000-15.000 kr
  - Anbefaling: Advokatfirma med edtech-erfaring
- [ ] ❌ **Registrere i Foretaksregisteret**
  - Hvis ikke allerede gjort
  - https://www.brreg.no/

## 4.3 Samtykker & Aksepteringer
- [ ] ❌ **Implementer aksept av bruksvilkår ved registrering**
  - Checkbox: "Jeg aksepterer bruksvilkårene"
  - Lagre tidspunkt og IP i Firestore
- [ ] ❌ **Cookie-banner** (hvis nødvendig)
  - Kun hvis du bruker Google Analytics eller lignende

---

# 5️⃣ SIKKERHET & COMPLIANCE

## 5.1 GDPR-compliance
- [x] ✅ Firestore Security Rules implementert
- [x] ✅ Databehandleravtale klar
- [ ] 🔴 **Personvernerklæring publisert**
- [ ] ❌ **Implementer "Slett min konto" funksjon**
  - Bruker kan selv slette konto + alle data
  - Skal være i Min Side
- [ ] ❌ **Implementer "Eksporter mine data" funksjon**
  - GDPR-krav: Bruker kan be om sine data i maskinlesbart format
- [ ] ❌ **Logg personvernhendelser**
  - Når data slettes, eksporteres, etc.

## 5.2 Sikkerhetstiltak
- [x] ✅ HTTPS/TLS aktivert
- [x] ✅ Feide OAuth sikker autentisering
- [x] ✅ Google Sign-In OAuth sikker autentisering
- [x] ✅ Firebase kryptering at rest
- [x] ✅ **CSP (Content Security Policy) konfigurert**
  - XSS-beskyttelse implementert
  - Google APIs whitelisted for autentisering
  - Firebase domener tillatt
- [x] ✅ **Rate limiting implementert**
  - Practice answers begrenset
  - Card rewards begrenset
  - Forhindrer misbruk
- [ ] ❌ **CAPTCHA på skoleforespørsel-skjema**
  - Google reCAPTCHA v3 (usynlig)
  - Forhindre spam
- [ ] ❌ **Sikkerhetsaudit**
  - Penetrasjonstesting
  - Eller minimum: OWASP Top 10-sjekk

## 5.3 Backup & Disaster Recovery
- [ ] 🔴 **Firebase backup-strategi** (Se 1.2)
- [ ] ❌ **Dokumenter restore-prosedyre**
  - Steg-for-steg guide
  - Test prosedyren
- [ ] ❌ **Koderepository backup**
  - Backup av GitHub-repo eksternt
  - Eller: Bruk GitHub sponsors for private backup

---

# 6️⃣ BRUKEROPPLEVELSE & FUNKSJONALITET

## 6.1 Feilhåndtering & Logging
- [ ] 🟡 **Console.log i produksjon**
  - FJERN eller begrens debugging-meldinger
  - Kun kritiske feil skal logges
- [ ] ❌ **Sentry/LogRocket for error tracking**
  - Fang ukjente feil i produksjon
  - Alert ved kritiske feil
  - Gratis tier: https://sentry.io/
- [ ] ❌ **Brukervennlige feilmeldinger**
  - Erstatt tekniske feil med klare meldinger
  - Eksempel: "Noe gikk galt" i stedet for "Firebase error 403"

## 6.2 Ytelse & Optimalisering
- [x] ✅ **Service Worker optimalisering**
  - Caching-strategi implementert
  - Offline-funksjonalitet testet
  - v0.9.85-BETA aktiv
- [x] ✅ **Lazy loading av bilder**
  - Implementert på kort og øvingsmodus
  - `loading="lazy"` attributt brukt
- [ ] ❌ **Code splitting**
  - Split JS-filer for raskere lasting
- [x] ✅ **Lighthouse-audit forbedringer gjennomført**
  - Dark mode implementert
  - SEO meta tags lagt til
  - PWA manifest utvidet
  - Offline.html opprettet
  - CSP security headers konfigurert

## 6.3 Responsivitet & Kompatibilitet
- [ ] 🟡 **Test på mobile enheter**
  - iOS Safari
  - Android Chrome
  - Ulike skjermstørrelser
- [ ] 🟡 **Test på nettlesere**
  - Chrome, Firefox, Safari, Edge
  - Minimum: Siste 2 versjoner
- [ ] ❌ **PWA-funksjonalitet**
  - Verifiser installering fungerer
  - Test push-varsler (hvis relevant)

## 6.4 Tilgjengelige (Accessibility)
- [ ] ❌ **WCAG 2.1 AA-compliance**
  - Minimum for offentlige tjenester
  - Bruk: https://wave.webaim.org/
- [ ] ❌ **Tastaturnavigasjon**
  - Alle funksjoner tilgjengelig uten mus
  - Tab-rekkefølge logisk
- [ ] ❌ **Skjermleser-testing**
  - Test med NVDA/JAWS (Windows) eller VoiceOver (Mac)

---

# 7️⃣ MANGLENDE SIDER & INNHOLD

## 7.1 Personvernerklæring (personvern.html)
**STATUS:** ❌ MANGLER

**INNHOLD:**
1. Hvem som er behandlingsansvarlig
2. Hvilke personopplysninger som samles inn
3. Formålet med behandlingen
4. Rettsgrunnlag for behandling
5. Hvor lenge data lagres
6. Hvem data deles med (underleverandører)
7. Dine rettigheter (innsyn, sletting, etc.)
8. Hvordan kontakte oss

**MAL:** Jeg kan lage dette hvis ønskelig (si ifra!)

## 7.2 Bruksvilkår (bruksvilkar.html)
**STATUS:** ❌ MANGLER (Har kjøpsvilkår, men trenger også generelle bruksvilkår)

**INNHOLD:**
1. Hvem kan bruke tjenesten
2. Brukerens ansvar
3. Forbudt bruk
4. Immaterielle rettigheter
5. Ansvarsbegrensning
6. Oppsigelse/stenging av konto
7. Endringer i vilkårene

## 7.3 Støttesider
- [ ] ❌ **/hjelp.html eller /support.html**
  - FAQ (Ofte stilte spørsmål)
  - Brukerveiledninger
  - Kontaktskjema
- [ ] ❌ **/om.html**
  - Om GloseMester
  - Teamet bak
  - Hvorfor vi laget tjenesten
- [ ] ❌ **/oppgrader.html**
  - Oversikt over pakker (Gratis, Premium, Skolepakke)
  - Prissammenligning
  - CTA-knapper for kjøp

## 7.4 Landing Page
- [ ] 🟡 **Forbedre forsiden**
  - Klar verdiproposisjon
  - Demonstrasjonsvideo
  - Testimonials (hvis mulig)
  - CTA: "Prøv gratis" / "Logg inn med Feide"

---

# 8️⃣ MARKEDSFØRING & KOMMUNIKASJON

## 8.1 Pre-launch
- [ ] ❌ **Beta-testing med pilotskole**
  - 1-3 skoler tester i 4-6 uker
  - Samle tilbakemeldinger
  - Fiks kritiske bugs
- [ ] ❌ **Lag pitch-deck for skoler**
  - Presentasjon for skoleledere
  - PDF-versjon for utsending

## 8.2 Launch-strategi
- [ ] ❌ **Pressemeld ing til lokale medier**
  - "Lokal edtech-startup lanserer gloselæringsverktøy"
- [ ] ❌ **Sosiale medier**
  - Facebook-side for GloseMester
  - LinkedIn-profil
  - Instagram (hvis relevant)
- [ ] ❌ **Kontakt Feide/Sikt**
  - Be om å bli listet som "Feide-integrasjon"
  - Gi synlighet i skolesektoren

## 8.3 Salgsmateriell
- [ ] ❌ **Produktark (PDF)**
  - 1-2 sider med funksjoner, priser, kontaktinfo
  - Kan sendes til skoleledere
- [ ] ❌ **Demo-video**
  - 2-3 minutter
  - Vis hvordan GloseMester fungerer
  - Publiser på YouTube

---

# 9️⃣ SUPPORT & VEDLIKEHOLD

## 9.1 Support-rutiner
- [ ] 🔴 **Definer responstid**
  - Eksempel: "Vi svarer innen 2 virkedager"
  - Hold løftet!
- [ ] ❌ **Support-mal (e-post templates)**
  - Standardsvar på vanlige spørsmål
  - Profesjonell tone
- [ ] ❌ **Eskaleringsprosedyre**
  - Hva gjør du ved kritisk feil?
  - Hvem kontakter du?

## 9.2 Overvåking
- [ ] 🔴 **Uptime monitoring**
  - Gratis: UptimeRobot (https://uptimerobot.com/)
  - Varsler deg hvis siden er nede
- [ ] ❌ **Firebase usage monitoring**
  - Hold øye med kostnader
  - Sett alarmer hvis trafikk eksploderer
- [ ] ❌ **Analytics**
  - Google Analytics 4 (valgfri)
  - Firebase Analytics
  - Plausible Analytics (GDPR-vennlig alternativ)

## 9.3 Oppdateringsrutiner
- [ ] ❌ **Changelog**
  - Dokumenter alle endringer
  - Informer brukere om nye funksjoner
- [ ] ❌ **Versjonshåndtering**
  - Semantisk versjonering (v1.0.0, v1.1.0, etc.)
  - Tag releases i GitHub
- [ ] ❌ **Regelmessige sikkerhetoppdateringer**
  - Oppdater npm-pakker månedlig
  - Følg med på CVE-er

---

# 🔟 TESTING & KVALITETSSIKRING

## 10.1 Funksjonstesting
- [ ] 🟡 **Manuell testing av alle kritiske flows**
  - Registrering / Innlogging (Feide)
  - Lag prøve
  - Elev gjennomfører prøve
  - Resultatvisning
  - Kjøp Premium (Vipps test → prod)
  - Skolepakke-forespørsel
- [ ] ❌ **Automated testing**
  - Minimum: E2E-tester for kritiske flows
  - Verktøy: Cypress, Playwright
- [ ] ❌ **Load testing**
  - Hva skjer hvis 100 elever tar prøve samtidig?
  - Verktøy: k6, JMeter

## 10.2 User Acceptance Testing (UAT)
- [ ] ❌ **Test med ekte lærere**
  - Minst 5 lærere
  - Ulike nivå (barneskole, ungdomsskole, vgs)
- [ ] ❌ **Test med ekte elever**
  - Minst 20 elever
  - Ulike aldre
- [ ] ❌ **Samle tilbakemeldinger**
  - Exit-survey etter testing
  - Iterér basert på feedback

---

# 1️⃣1️⃣ ADMINISTRATIVT

## 11.1 Fakturering & Regnskap
- [ ] 🔴 **Velg regnskapssystem**
  - Fiken, Tripletex, Poweroffice
  - Integrer med fakturasystem
- [ ] 🔴 **MVA-registrering**
  - Hvis ikke allerede gjort
  - Obligatorisk ved omsetning >50.000 kr/år
- [ ] ❌ **Rutiner for manuell fakturering**
  - Skolepakker som ikke betaler via fakturasystem

## 11.2 Forsikring
- [ ] ❌ **Ansvarsforsikring**
  - Dekker feil/mangler i produktet
  - Anbefalt for bedrifter som leverer tjenester til skoler
- [ ] ❌ **Cyberforsikring** (valgfri)
  - Dekker datalekkasjer, cyberangrep

## 11.3 Kontrakter & Avtaler
- [ ] 🔴 **Standard skolepakke-avtale**
  - Mal for avtale med skoler
  - Inkluderer: Pris, varighet, databehandleravtale
- [ ] ❌ **Underleverandøravtaler**
  - Firebase/Google Cloud
  - Netlify
  - Vipps

---

# 1️⃣2️⃣ POST-LAUNCH

## 12.1 Første måned
- [ ] ❌ **Daglig monitoring**
  - Sjekk feil, bugs, brukerklager
  - Rask respons på problemer
- [ ] ❌ **Samle feedback**
  - Survey til early adopters
  - Hva fungerer? Hva må forbedres?

## 12.2 Kontinuerlig forbedring
- [ ] ❌ **Roadmap for neste features**
  - Basert på brukertilbakemeldinger
  - Prioriter høyest verdi først
- [ ] ❌ **A/B-testing**
  - Test ulike UI-variabler
  - Optimaliser konverteringsrate

---

# 📊 PRIORITERT LAUNCH-LISTE

## 🔴 KRITISK (MÅ VÆRE FERDIG FØR LAUNCH)

1. **Vipps produksjon**
   - ✅ Søknad sendt (13. jan 2026)
   - ⏳ Venter på godkjenning
   - ❌ Oppdater credentials når godkjent
   - ❌ Test betalinger i produksjon

2. **E-post setup**
   - ✅ kontakt@glosemester.no fungerer
   - ✅ E-postvarsel for skoleforespørsler (Resend)
   - ❌ Bekreftelser til kunder (Vipps-kvitteringer)

3. **Juridiske dokumenter**
   - ✅ Personvernerklæring publisert (v0.10.0, 19. jan 2026)
   - ✅ Bruksvilkår publisert (v0.10.0, 19. jan 2026)
   - ⏳ Få advokat til å gjennomgå (anbefalt, men ikke kritisk for beta-test)

4. **Firestore backup**
   - ❌ Automatiske backups aktivert
   - ❌ Test restore

5. **Uptime monitoring**
   - ❌ UptimeRobot setup
   - ❌ Varsler deg ved nedetid

6. **Sikkerhet**
   - ❌ Rate limiting på functions
   - ❌ CAPTCHA på skjemaer
   - ❌ Fjern debug-logging

7. **Testing**
   - ❌ Beta-test med 1-2 skoler
   - 🟡 Manuell testing av alle flows
   - ❌ Fix kritiske bugs

## 🟡 VIKTIG (BØR VÆRE FERDIG)

8. Fakturasystem for skolepakker
9. "Slett min konto" funksjon
10. Feilhåndtering & Sentry
11. Mobile testing
12. Forbedre landing page

## ⚪ NICE TO HAVE (KAN VENTE)

13. Analytics
14. A/B-testing
15. Automated testing
16. Demo-video

---

# 📞 KONTAKTINFO FOR EKSTERNE TJENESTER

**Vipps:**
- Portal: https://portal.vipps.no
- Support: https://vipps.no/hjelp/bedrift/

**SendGrid:**
- Registrering: https://signup.sendgrid.com/
- Docs: https://docs.sendgrid.com/

**Fiken (Regnskap/Faktura):**
- Registrering: https://fiken.no/
- Pris: Fra 0 kr/mnd (gratis tier)

**UptimeRobot:**
- Registrering: https://uptimerobot.com/
- Gratis: 50 monitors

**Sentry (Error tracking):**
- Registrering: https://sentry.io/signup/
- Gratis: 5000 errors/mnd

---

# ✅ OPPSUMMERING

**Oppdatert:** 19. januar 2026

**Total estimert tid før launch:**
- Kritiske oppgaver: 2-4 uker (Vipps + Juridisk)
- Viktige oppgaver: 2-3 uker
- Total: **4-7 uker**

**Estimert kostnad:**
- Vipps setup: Gratis
- Advokat (juridisk): 5.000-15.000 kr
- Fakturasystem: 0-500 kr/mnd
- Resend e-post: Gratis (100/dag)
- Forsikring: 2.000-5.000 kr/år (valgfri)
- **Total one-time: 5.000-15.000 kr**
- **Total månedlig: 0-500 kr**

**Ferdigstilt 15. januar 2026:**
✅ GloseBank - Alle lærere kan dele prøver
✅ Multi-bruker progressbar
✅ Resend e-postvarsel (DNS verifisert)
✅ Git + Netlify auto-deploy
✅ Firestore Rules oppdatert

**Ferdigstilt 19. januar 2026 (v0.10.0-BETA):**
✅ Nytt 4-nivå system (Nivå 1-4, 40-50 ord per nivå)
✅ Bildestøtte på Nivå 1 (Bilder)
✅ Justert kortbelønning (85% vanlige, 11% sjeldne, 3% episke, 1% legendariske)
✅ Gudekort kun tilgjengelig på Nivå 3 og 4
✅ Nivå 1 og 2: 100% flervalg (ingen skriving)
✅ Raskere feedback (1 sekund) og deaktiverte klikk under riktig svar
✅ Footer med versjonsinformasjon på startsiden
✅ Google Sign-In CSP-fiks (OAuth fungerer nå)
✅ Fjernet floating version-tag (bedre UX)

**Neste steg:**
1. ⏳ Vent på Vipps produksjonsgodkjenning (2-5 dager)
2. 🔒 Sett opp Firestore backup (Firebase Console)
3. 📊 Sett opp UptimeRobot (5 min setup)
4. 📄 Få advokat til å gjennomgå juridiske dokumenter (valgfri for beta)
5. 🧪 Beta-test med 1-2 skoler (2-4 uker)
6. 🚀 Launch Februar 2026!