# Lansering & vekst — lærere (B2B)

**Dato:** 2026-05-07  
**Fokus:** Øke oppdagbarhet og konvertering blant lærere  
**Kontekst:** GloseMester er ~80% prod-klar. Største barriere er at lærere ikke vet at appen finnes.

---

## 1. SEO & organisk søk

Lærere googler løsninger som «gloser engelsk skole», «lære engelske ord 4. trinn».

**Tiltak:**
- Lag dedikerte landingssider per trinn: `/for-laerere/1-4-trinn`, `/for-laerere/5-7-trinn`
- Skriv 3–5 bloggartikler: «Slik lærer elever gloser raskere» — naturlig innhold som ranker
- Legg til strukturerte data (Schema.org `EducationalApplication`) i `<head>`
- Optimaliser `<title>` og `<meta description>` per side (nå generisk)
- Legg til `sitemap.xml` og send til Google Search Console

**Filer:** `index.html`, `om-oss.html`, ny `/for-laerere/`-side

---

## 2. Lærerdrevet viralitet (in-app)

Når én lærer tar i bruk appen, skal det spre seg til kollegaer.

**Tiltak:**
- **Del-lenke etter test-oppretting:** «Del GloseMester med en kollega» — én-klikks e-post/kopier
- **Elev-invitasjon:** Elevene ser «Anbefal til læreren din» etter økt med bra score
- **Klassekode-flyt:** Gjør det enklere å distribuere klassekode (stor QR + kopierbar lenke)
- **«Laget av GloseMester»-branding** på QR-koder og delte test-lenker

**Filer:** `src/features/teacher/teacher-module.js`

---

## 3. Direktekanaler — lærernettverk & Facebook

Norske lærere er aktive i Facebook-grupper («Engelsklærere i Norge», «Lærere deler» osv.).

**Tiltak:**
- Lag 3–5 ferdige innlegg (tekst + bilde) klare til å poste
- Lag en «prøv gratis»-annonse: «Lag en glose-test på 2 minutter»
- Post i Utdanningsnytt-forum og norsklærer.no
- Lag en kort demo-video (60 sek) som viser test-opprettingsflyt

---

## 4. Dedikert lærer-landingsside (`/for-laerere`)

Nåværende forside er generell — lærere trenger sin egen side.

**Innhold:**
- Headline: «Lag engelske glose-tester på 2 minutter»
- 3 konkrete fordeler: Ferdig på sekunder / Deles med QR / Elevene elsker det
- Skjermbilde/GIF av test-opprettingsflyt
- Pris-seksjon: Gratis (3 tester) vs. Premium (99 kr/mnd)
- Testimonial-plass (klar for første anmeldelse)
- Én CTA: «Lag din første test — gratis»

---

## 5. Feide-integrasjon som vekstmotor

Feide-innlogging senker friksjon og gir troverdighet i skole-Norge.

**Tiltak:**
- Fremhev «Logg inn med Feide» tydeligere på innloggingssiden
- Send søknad til Feide om å bli listeført på feide.no/tjenester (gratis, høy troverdighet)
- Legg til «Godkjent av Feide»-badge på landingssiden

---

## 6. Onboarding for nye lærere

Lærere møter dashbordet direkte i dag — ingen guidet oppsett.

**Tiltak:**
- Steg-for-steg velkomstflyt (3 steg): Velg fag → Lag første test → Del med klasse
- Ferdig mal-test ved første innlogging («Dyr på engelsk — 10 ord») som kan redigeres
- E-post dag 1: «Her er din første test — klar til bruk»
- E-post dag 3: «Vet du at du kan dele med QR-kode?»

---

## Prioritering

| Tiltak | Impact | Innsats | Prioritet |
|--------|--------|---------|-----------|
| SEO-landingsside `/for-laerere` | Høy | Lav | 🔴 Gjør nå |
| Feide-listeføring (søknad) | Høy | Lav | 🔴 Gjør nå |
| Del-lenke til kollega (in-app) | Høy | Lav | 🔴 Gjør nå |
| Onboarding-flyt | Høy | Medium | 🟠 Neste sprint |
| Blogginnlegg (SEO) | Medium | Medium | 🟠 Neste sprint |
| Demo-video | Medium | Medium | 🟠 Neste sprint |
| Facebook-grupper outreach | Medium | Lav | 🟡 Løpende |
| Schema.org + sitemap | Lav | Lav | 🟡 Løpende |
