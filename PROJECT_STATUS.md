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