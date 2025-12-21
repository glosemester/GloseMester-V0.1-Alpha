# 🚀 GloseMester - Prosjektstatus

**Dato:** 16.12.2025
**Versjon:** v0.5-BETA (Design & Logic Overhaul)
**Server:** Netlify / Python `http.server`
**Url:** glosemester.no (Planlagt)

---

## ✅ Nylig Fullført (Store Seire)

### 1. Arkitektur & Kjerne
* **Module System Reparasjon:** Løst kritisk konflikt mellom `index.html` og ES6 Moduler. `storage.js` er nå en ren modul som importeres korrekt.
* **Global Bridge:** Opprettet sikre koblinger mellom modul-funksjoner og HTML `onclick`-eventer i `app.js`.
* **Service Worker:** Oppgradert `sw.js` til "Network First"-strategi. Sikrer at brukere alltid får siste versjon uten å måtte tømme cache manuelt.
* **Sikkerhet:** Implementert enkel passordbeskyttelse ("Alpha Access") i `init.js` for testing på nett.

### 2. Design & UX (v5.0)
* **Totalrenovering av CSS:** Gikk fra "Fake Phone"-ramme til et moderne, responsivt **Grid System**.
* **Responsivitet:** Appen tilpasser seg nå sømløst mellom PC (3 kolonner), iPad og Mobil (1 kolonne).
* **Active Game UI:** Øvemodusen har fått dedikert styling. Knappene for "1-2 trinn" er nå store, trykkvennlige flater med 3D-effekt.
* **Navigasjon:** Implementert "Floating Dock" (meny) i bunnen med Glassmorphism-effekt (Blur).

### 3. Logikk & State
* **Progresjons-lagring:** Fikset bug hvor "Veien til 10 Byttepoeng" ikke oppdaterte seg. Koblet `credits` direkte mot LocalStorage og UI.
* **Navigasjons-flyt:** Løst problemet hvor menyer forsvant i "Øv selv"-modus. Menyene styres nå strengt av `navigation.js`.

---

## 🚧 Pågående Arbeid

* **Testing:** Verifisere at designet "sitter" på fysiske enheter (iPhone/Android) via Netlify.
* **Innhold:** Legge inn flere ordlister (vokabular) for 3.-7. trinn.
* **Lærer-modus:** Sikre at opprettelse av prøver og QR-generering fungerer med den nye lagrings-modulen.

---

## 🗺️ Roadmap: Veien til v1.0 Lansering

Fokus nå skifter fra "koding av funksjoner" til **Design-polering og Testing**.

### Fase 1: Design & "Feel" (Nåværende fokus)
* [ ] **Micro-interaksjoner:** Legge til konfetti-animasjon når man finner et kort.
* [ ] **Feedback:** Bedre visuell feedback ved feil svar (riste på skjermen?).
* [ ] **Ikoner:** Vurdere å bytte ut noen emojis med SVG-ikoner for et enda proffere uttrykk.
* [ ] **Loading States:** Legge inn en spinner/laste-animasjon hvis nettet er tregt.

### Fase 2: Strukturert Testing (QA)
* **Enhets-test:** Teste appen på:
    * iPhone (Safari) - Sjekke adressebar-oppførsel.
    * Android (Chrome) - Sjekke "Install App" prompt.
    * iPad/Tablet - Sjekke at Grid-layout utnytter plassen.
* **Bruker-test:** La 2-3 personer prøve appen uten instruksjoner. Observere hvor de står fast.

### Fase 3: Lansering (Release Candidate)
* [ ] **Domene:** Peke `glosemester.no` mot produksjonsserver.
* [ ] **Fjerne Passord:** Slette Alpha-sperren i `init.js`.
* [ ] **Analytics:** Verifisere at vi teller antall øvinger korrekt.

---

## 🐛 Kjente Bugs / Obs
* **Safari iOS:** Kan noen ganger ha problemer med `100vh` og adressebaren i bunnen. Vi bruker `padding-bottom` for å motvirke dette, men må testes.
* **Cache:** Selv med ny `sw.js` kan noen gamle enheter trenge en "Hard Refresh" første gang.



17.12.25

Dato: 17.12.2025 Gjeldende Versjon: v0.5.2 (Release Candidate) Fase: Beta-testing / Design-polering

✅ Nylig Fullført (Siste 24t)
"Candy Glass" Redesign: Fullstendig overhaling av UI. Gikk fra "Bootstrap-stil" til et taktilt, barnevennlig design med 3D-knapper, sterke farger og glassmorphism.

Lyd-motor: Implementert lydeffekter (Pling, Buzz, Win, Pop) som gir umiddelbar feedback.

Holo-Kort: Samlekortene har nå en "Legendary Shine"-effekt ved mouse-over/tilt.

Robusthet: Fikset kritisk bug hvor spillet låste seg ved feil svar. Feilhåndtering er nå intern i practice.js og ikke avhengig av eksterne bibliotek.

Viralitet: Lagt inn "Del med en venn"-knapp (Native Share) og tydeliggjort backup/flytting av bruker.

⚠️ Kjente Utfordringer / Fokusområder
Assets: Vi mangler den endelige logoen og headeren (Prompts er laget, men bildene må genereres og lastes opp).

Innhold: Vokabularet for 5.-7. trinn er fortsatt "placeholder"-data. Må fylles ut før lansering.

🗺️ Detaljert Roadmap (Veien videre)
Vi deler utviklingen inn i tre tydelige faser: Lansering, Vekst, og Skalering.

🟢 Fase 1: "The Polished Product" (v0.6 -> v1.0)
Mål: En stabil versjon som ser proff ut, som du kan vise frem til lærere og foreldre uten forbehold.

Design & Merkevare (Umiddelbart):

[ ] Generere Logo og Header med AI-prompts.

[ ] Implementere disse i index.html og manifest.json (for app-ikon på hjemskjerm).

[ ] Oppdatere "Om GloseMester"-teksten med litt mer "salgspitch".

Innhold:

[ ] Utvide ordlistene i vocabulary.js slik at det er minst 50 ord per trinn.

Infrastruktur:

[ ] Sette opp glosemester.no (DNS og Hosting).

[ ] Sørge for HTTPS (Sikkerhet hengelås).

[ ] Fjerne passord-sperren (Alpha-lock) når vi går live.

🟡 Fase 2: "The Social Classroom" (v1.1 -> v1.5)
Mål: Gjøre appen viral i skolegården og nyttig for læreren.

Elev-til-Elev (Viralitet):

[ ] QR-Bytting av kort: Implementere en funksjon der Elev A viser en QR-kode for et kort, og Elev B skanner den for å motta kortet. (Krever ingen server/innlogging, kun lokal logikk).

Lærer-Verktøy:

[ ] Del Prøve: Gjøre det superenkelt for en lærer å sende en prøve-kode til en kollega (f.eks. via e-post eller Teams).

[ ] Crowdsourcing (Starten på databasen): Når en lærer lager en prøve, sendes en anonym kopi til din Firebase-database. Slik bygger du opp "Norges største glosebank" i bakgrunnen.

Kommersialisering (Light):

[ ] Legge inn "Støtt oss / Kjøp meg en kaffe"-knapp for foreldre.

🔵 Fase 3: "The Business" (v2.0 -> Fremtiden)
Mål: Abonnement og B2B-salg.

GloseMester Home (B2C - Foreldre):

[ ] Egen foreldre-modul (Passordbeskyttet område i appen).

[ ] Statistikk: "Se hva barnet ditt har lært".

[ ] Freemium-modell: Gratis å spille, men betal for å fjerne reklame eller få "Gull-pakker" med kort.

GloseMester Skole (B2B - Kommune):

[ ] Feide-pålogging: Dette er nøkkelen til kommune-salg. Krever omskriving av backend.

[ ] Lærer-Dashboard: Se hvilke elever som har gjort leksen (krever Feide/Innlogging).

👨‍💻 Din "To-Do" akkurat nå:
Generer bildene (Logo/Header) med AI-promptene du fikk.

Test v0.5.2 grundig på mobil (spill gjennom en hel runde, sjekk at popups virker).

Gi klarsignal: Når du sier "Go", hjelper jeg deg å sette opp de siste filene for vocabulary.js (mer innhold) og klargjøre for glosemester.no.