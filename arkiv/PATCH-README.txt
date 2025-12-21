PATCH: visibility-1
- Fjernet dobbelt ES-module binding i index.html ("Alt koblet opp fra index.html!") som skapte konflikter/blanke visninger.
- Lagt til onclick på lærer-dashboard-knapp i lærer-meny.
- Alias: window.lukkScanner -> stopQRScanner (kompatibilitet med gammel HTML).
- Bumpet SW APP_VERSION for å tvinge mobil til å hente nye filer.

Etter deploy på mobil:
- Slett nettsteddata (Safari -> Avansert -> Nettstedsdata) eller fjern PWA og åpne på nytt.
