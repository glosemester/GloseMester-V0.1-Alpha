\# 🚀 GloseMester - Prosjektstatus

\*\*Dato:\*\* 16.12.2025

\*\*Versjon:\*\* v0.1-ALPHA (Refaktorering Fase)

\*\*Server:\*\* Python `http.server` (Port 8000)



\## ✅ Nylig Fullført

\* \*\*Bugfix:\*\* Løst `Uncaught ReferenceError`. Alle knapper i `teacher.js` bruker nå `addEventListener`.

\* \*\*HTML/JS:\*\* Fjernet `onclick` fra "Legg til ord" og "Lagre Prøve".

\* \*\*Funksjonalitet:\*\* "Legg til ord" virker. "Lagre Prøve" virker (oppdaterer UI og flytter brukeren til Biblioteket, men lagrer ikke til database ennå).



\## 🚧 Pågående Arbeid

\* System Restore: Flytter til ny chat for å resette minne.

\* Implementere faktisk lagring (Persistens) til Firebase/LocalStorage slik at prøver ikke forsvinner ved refresh.



\## 🐛 Kjente Bugs / Obs

\* \*\*Browser Extensions:\*\* Mye støy i konsollen (`Request timeout`, `undefined control`) fra plugins. Ignorer disse.

\* \*\*Data-tap:\*\* Prøver lagret i biblioteket forsvinner hvis man refresher siden (fordi databasen ikke er koblet på funksjonen ennå).



\## 🗺️ Roadmap (Neste 3 steg)

1\.  \*\*System Restore:\*\* Starte ny chat med oppdaterte filer.

2\.  \*\*Persistens:\*\* Koble `lagreProveTilBibliotek` mot `js/features/storage.js` eller Firebase.

3\.  \*\*UI:\*\* Få "Start"-knappen på prøvene i biblioteket til å faktisk starte en prøve (generere QR-kode/kode).



\## 📂 Viktige Fil-endringer

\* \*\*`index.html`\*\*: Nye ID-er: `btn-legg-til-ord`, `btn-lagre-prove`.

\* \*\*`js/features/teacher.js`\*\*: Komplett refaktorering med `setupEditorListeners` og `visProveIBibliotek`.

