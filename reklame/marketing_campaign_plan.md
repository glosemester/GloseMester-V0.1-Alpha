# Markedsføringsplan: Mester Suite (GloseMester)

## 1. Executive Summary
**Produkt:** Mester Suite (bestående av GloseMester, MatteMester, og NorskMester).
**Hovedmål:** Posisjonere Mester Suite som den foretrukne, gratis læringsplattformen for mengdetrening i norsk skole, ved å fremheve gamification-elementet ("samle kort") som en unik motivator.
**Nøkkelbudskap:** "Læring blir en lek når du samler på kunnskap."

## 2. Produktanalyse
Basert på analyse av applikasjonen (`index.html`, `js/app.js`):

### Kjernefunksjoner & Fordeler
| Funksjon | Fordel for Brukeren | Bevis (Evidence) |
| :--- | :--- | :--- |
| **Samlekort-system** | Gir umiddelbar belønning. Elever *vil* gjøre lekser for å få neste kort. | *Se `css/kort.css`: "Physical Card Look", "Holographic Overlay Effect", Rare/Epic/Legendary badges.* |
| **GloseMester** | Gjør kjedelig glosepugging til et spill. | *Fagvelger i `index.html`: "Lær gloser og samle kort".* |
| **MatteMester** | Mengdetrening i matte med umiddelbar feedback. | *`matte-oving-omraade` i `index.html` med eget tastatur og score.* |
| **NorskMester** | Dekker rettskriving og diktat (viktig for LK20). | *`norsk-diktat-container` med "Les opp"-knapp (TTS).* |
| **Lærer-dashboard** | Full oversikt uten rettearbeid. Enkel tildeling med kode/QR. | *`laerer-dashboard` med "Analytics Dashboard" og "Eksporter til CSV".* |
| **PWA (Install App)** | Ingen nedlasting fra App Store nødvendig. Fungerer på alle enheter. | *`sw.js` og "Installer App på mobilen"-knapp i `index.html`.* |

### Visual Asset Extraction
*   **Hovedbilde/Logo:** `header.png` (Mester Suite logo).
*   **Symboler:** Emojis brukes konsekvent som ikoner (📚, ➕, 📖, 💎).
*   **Ikon:** `icon.png` (App-ikon).

## 3. Målgrupper

### Primær: Lærere (1.-10. trinn)
*   **Demografi:** Norske lærere, alder 25-60.
*   **Psychographics:** Travle, ønsker engasjerte elever, ser etter "ferdig opplegg".
*   **Pain Points:** Rettebyrden, elever som glemmer lekser, uengasjerte elever.

### Sekundær: Foreldre
*   **Demografi:** Foreldre med barn i grunnskolen.
*   **Pain Points:** "Leksekampen" hjemme, skjermtid som ikke er lærerik.

### Tertiær: Elever (Sluttbruker)
*   **Drivkraft:** Samleobjekter (kort), gamification (XP, level up), konkurranse (vennlig).

## 4. Visuell Strategi
Hentet fra `css/main.css` og `css/kort.css`:

### Fargepalett
*   **Primary Blue (GloseMester/General):** `#667eea` til `#764ba2` (Gradient).
*   **Accent Blue:** `#0071e3` (Apple-like blue).
*   **NorskMester Rød:** `#e74c3c`.
*   **MatteMester Lilla:** `#af52de`.
*   **Bakgrunn:** `#f5f5f7` (Lys, ren, "Apple-style").
*   **Rarity Colors:** Common (`#a1a1a1`), Rare (`#0071e3`), Epic (`#8e44ad`), Legendary (`#f1c40f` - Gold).

### Typografi
*   **Hoofdfonter:** 'Outfit', 'Poppins', -apple-system.
*   **Stil:** Moderne, rund, vennlig, høy lesbarhet.

### Bildestil
*   **Estetikk:** "Physical Trading Cards" med skygger og "shine"-effekter.
*   **Stemning:** Playful, ren, oversiktlig.

## 5. Innholdsplan (Sosiale Medier)

### Kanal: Facebook (Målgruppe: Lærere & Foreldre)

**Post 1: Lærerens hverdag**
*   **Vinkel:** Gain/Logic (Spar tid).
*   **Konsept:** "Ferdig rettebuke før fredagstacoen?"
*   **Bilde:** Split-screen. Venstre: Rødpenn og papirbunke. Høyre: En lærer som trykker "Eksporter CSV" på GloseMester og smiler.
*   **Tekst:** "Gloseprøver trenger ikke være kjedelige (eller tidkrevende å rette!). La Mester Suite ta seg av rettingen, mens elevene har det gøy med å samle kort. 💎 Prøv gratis nå!"

**Post 2: Foreldre & Skjermtid**
*   **Vinkel:** Pain Relief (Leksekamp).
*   **Konsept:** "Ja takk, mer skjermtid?"
*   **Bilde:** Barn som viser frem et "Legendarisk" kort på iPaden til en forelder.
*   **Tekst:** "Endelig en app hvor skjermtid = læringstid. 📚✨ I GloseMester pugger barna gloser og matte for å vinne kort til samlingen sin. Ingen reklame, ingen kjøpepress – bare læring."

### Kanal: Instagram (Visuelt fokus)

**Post 3: Feature Highlight (MatteMester)**
*   **Vinkel:** Gamification/Fun.
*   **Bilde:** Video/GIF av et kort som snur seg ("flip") og avslører en sjelden drage-karakter etter at et mattestykke er løst.
*   **Tekst:** "Hva gjemmer seg bak kortet? 🐉 Løs gangestykket for å finne det ut! #MatteMester #Skole #Gamification"

**Post 4: "Visste du at..." (Tips)**
*   **Bilde:** QR-kode scanneren i appen.
*   **Tekst:** "Visste du at læreren kan lage en prøve på 1-2-3 og dele den med en QR-kode på tavla? 📷 Ingen innlogging nødvendig for elevene!"

### Kanal: Plakat (Skolegang/Klasserom)
*   **Format:** A3/A4.
*   **Budskap:** "BLI EN MESTER!"
*   **Visuelt:** Store, fargerike kort (Løve, Romskip, etc.) som flyr ut av en telefon.
*   **CTA:** "Gå til glosemester.no – Start samlingen i dag!"
