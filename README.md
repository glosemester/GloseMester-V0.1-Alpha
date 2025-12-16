# \# 🎮 GloseMester v0.1-ALPHA

# \## ⚠️ Status: DEBUGGING PÅGÅR

# Vi jobber med å fikse kritiske feil i Øvemodus (UI og Lagring).

# Se `PROJECT\_STATUS.md` for detaljer før du gjør endringer.

# \*\*Lær gloser og samle kort!\*\*

# 

# Norsk språklæringsapp som gamifiserer glosepugging ved å la elever samle digitale kort.

# 

# \## 📦 Funksjoner

# 

# \- 🎯 Øvingsmodus (1-7 trinn, 235+ ordpar)

# \- 📝 Prøver fra lærer (med QR-koder)

# \- 🎴 152 samlekort i 4 kategorier:

#   - 🚗 Biler (38 kort)

#   - 🏛️ Guder (38 kort - Norse/Greek)

#   - 🦖 Dinosaurer (38 kort)

#   - 🾾 Søte Dyr (38 kort)

# \- 💎 Byttepoeng-system (100 riktige = 10 poeng)

# \- 📱 PWA (Progressive Web App)

# \- 📤 Eksporter/Importer samling via QR



\## 🛠️ Teknologi

\- \*\*Frontend:\*\* Vanilla JS (ES6 Modules), CSS3

\- \*\*Backend:\*\* Firebase (Lærer), LocalStorage (Elev)

\- \*\*Verktøy:\*\* QR Scanner, Google Analytics

# \## 🚀 Start lokalt

# ```bash

# python -m http.server 8000

# \## 🚀 Kom i gang

# ```bash

# \# Klon repo

# git clone https://github.com/oyvindoksvold/glosemester-v0.1-alpha.git

# 

# \# Åpne mappen

# cd glosemester-v0.1-alpha

# 

# \# Start lokal server

# python -m http.server 8000

# 

# \# Åpne i nettleser

# http://localhost:8000

# ```

# 

# \## 📁 Struktur

# ```

# glosemester-v0.1-alpha/

# ├── index.html

# ├── manifest.json

# ├── sw.js

# ├── header.png

# ├── icon.png

# ├── personvern.html

# ├── css/

# │   ├── main.css          (600 linjer - Design system)

# │   ├── kort.css          (200 linjer - Kort-styling)

# │   └── popups.css        (250 linjer - Popup-styling)

# ├── js/

# │   ├── vocabulary.js     (235 ordpar)

# │   ├── collection.js     (152 kort)

# │   ├── export-import.js  (QR export/import)

# │   ├── init.js           (Global state)

# │   │

# │   ├── core/

# │   │   ├── navigation.js (100 linjer)

# │   │   ├── credits.js    (80 linjer)

# │   │   ├── storage.js    (150 linjer)

# │   │   └── analytics.js  (60 linjer)

# │   │

# │   ├── features/

# │   │   ├── quiz.js           (150 linjer)

# │   │   ├── practice.js       (120 linjer)

# │   │   ├── teacher.js        (180 linjer)

# │   │   ├── qr-scanner.js     (200 linjer)

# │   │   └── kort-display.js   (250 linjer)

# │   │

# │   └── ui/

# │       └── helpers.js    (100 linjer)

# │

# └── prompts/

#     ├── 00-MASTER-LISTE.md

#     ├── 01-BILER.md

#     ├── 02-GUDER.md

#     ├── 03-DINOSAURER.md

#     ├── 04-DYR.md

#     └── GUIDE.md

# ```

# 

# \## 🎨 Roadmap

# 

# \### v0.1-ALPHA (Nå)

# \- \[x] Modularisert arkitektur

# \- \[x] 4 kort-kategorier definert

# \- \[x] Midjourney prompts (152 stk)

# \- \[x] Placeholder-system (CSS emoji)

# 

# \### v0.2-ALPHA (Om 1-2 uker)

# \- \[ ] Generere første 38 bilder (1 kategori)

# \- \[ ] Test med ekte brukere

# \- \[ ] Bug fixes

# 

# \### v0.3-BETA (Om 1 måned)

# \- \[ ] Alle 152 bilder generert

# \- \[ ] Alle kategorier fungerer

# \- \[ ] Beta-testing med lærere

# 

# \### v1.0-RELEASE (Om 2 måneder)

# \- \[ ] Alle bilder polert

# \- \[ ] Markedsføringsmateriell

# \- \[ ] Lansering på glosemester.no

# 

# \## 🛠️ Teknologi

# 

# \- \*\*Frontend:\*\* HTML5, CSS3, Vanilla JavaScript

# \- \*\*PWA:\*\* Service Worker, Manifest

# \- \*\*QR:\*\* QRCode.js, jsQR

# \- \*\*Analytics:\*\* Google Analytics

# \- \*\*Storage:\*\* localStorage

# \- \*\*Modular:\*\* ES6 modules

# 

# \## 🎯 Mål

# 

# \- \*\*Elever:\*\* Gratis å bruke

# \- \*\*Lærere:\*\* 49 kr/mnd (individuell) eller 300 kr/mnd (skole)

# \- \*\*Lansering:\*\* Januar 2025

# 

# \## 👨‍💻 Utvikler

# 

# \*\*Øyvind Nilsen Oksvold\*\*

# \- Nettside: \[glosemester.no](https://glosemester.no)

# \- Prosjekt: GloseMester v0.1-ALPHA

# 

# \## 📜 Lisens

# 

# MIT License

# 

# \## 🙏 Takk til

# 

# \- Elever og lærere i Steinkjer kommune for testing

# \- Claude (Anthropic) for utviklingshjelp

# \- Midjourney for bildegenerering

# 

# \## 📞 Kontakt

# 

# For spørsmål eller feedback, kontakt via GitHub Issues.

