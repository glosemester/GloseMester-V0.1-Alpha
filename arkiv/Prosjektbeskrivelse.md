Prosjektbeskrivelse: GloseMester v1.0 (Development Reboot)
Produkt: GloseMester - En PWA (Progressive Web App) for gloseøving med gamification (samlekort). Teknologi: Vanilla JavaScript (ES6 Modules), HTML5, CSS3, Firebase (Backend for lærere), LocalStorage (Database for elever).

1. Kjernefunksjonalitet
Elev (Øving): Velger trinn (1-7). Svarer på gloser. Får poeng. Hvert 10. poeng gir et tilfeldig kort. Alt lagres lokalt.

Elev (Prøve): Skanner QR-kode fra lærer. Tar en spesifikk prøve. Får belønning basert på resultat.

Lærer: Logger inn (Google/Firebase). Lager prøver. Lagrer i skyen. Genererer QR-kode til elevene.

Samling: Visning av vunnede kort med filtrering og sortering.

2. Arkitektur & Dataflyt
Frontend: index.html er en SPA (Single Page Application). Navigasjon styres ved å vise/skjule <div class="page">.

Modularitet: Prosjektet er nylig refaktorert fra "spaghettikode" til ES6 moduler. js/app.js er inngangsporten som styrer event listeners.

State Management:

Global State: init.js holder variabler som brukerNavn, credits, aktivProve.

Persistens: storage.js håndterer lagring til localStorage (for elever) og synk mot Firebase (for lærere).

3. Nåværende Status & Kritisk Bug-liste
Vi er i en overgangsfase (Refactoring). Appen kjører, men har funksjonelle hull som må tettes før v1.0.

🚨 Kritiske Feil (Må fikses først):

UI i Øvemodus: Når en elev går inn i "Øv selv" (practice mode), forsvinner navigasjonsmenyen (Hjem, Min Samling, Logg ut) og Credit-visningen. Eleven blir "fanget" i øvelsen uten mulighet til å se poengsummen sin live eller navigere bort.

Belønningssystemet: Selv om animasjonen sier "Du har fått et kort", blir ikke kortet faktisk lagt til i localStorage eller i samlingen. Funksjonskallet mellom practice.js og storage.js/collection.js feiler eller lagrer ikke permanent.

Import/Eksport: Modulene krangler litt med window-objektet, noe som gjør at funksjoner definert i moduler ikke alltid er tilgjengelige for HTML-knapper.