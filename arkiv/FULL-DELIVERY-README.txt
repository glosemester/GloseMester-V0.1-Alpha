GloseMester – FULL leveranse (Netlify + SW + Navigasjon)
Dato: 2025-12-18

Inkluderer:
- sw.js: versjonsbasert cache + iOS/Netlify-sikker strategi
- netlify.toml og _headers: hindrer hard caching av sw.js og index.html
- js/core/navigation.js: robust velgRolle/visSide (ingen null.style crash)
- index.html: init.js/app.js lastes som ES-moduler (fjernet classic init.js)

Etter deploy (mobil/iPhone):
1) Slett nettsteddata for domenet (Innstillinger → Safari → Avansert → Nettstedsdata)
2) Hvis PWA er installert: fjern app-ikonet og installer på nytt
3) Åpne siden igjen

SW APP_VERSION: v0.6-beta-2025-12-18-05
