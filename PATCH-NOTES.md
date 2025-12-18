# PATCH NOTES – Free/Premium (v0.6 beta)

## Endring
- **Free**: kan lagre maks **1 prøve totalt** (ingen lokal lagring i tillegg).
- **Premium**: ubegrenset lagring + (forberedt) deling/koder.

## Implementasjon
- `teacher.js`: sjekker plan i `users/{uid}` (default `free`) og teller prøver i `prover` (eierId == uid).
- Ved Free og eksisterende >= 1: viser Premium-popup og avbryter lagring.
- Shadow save til `felles_prover` skjer kun når lagring faktisk er tillatt.
- `app.js`: lærer-rolle går alltid via `openTeacherPortal()` (samtykke + login), og versjonslogg er oppdatert.
- `index.html`: fjernet dobbel modul-binding i inline script; kun `init.js` + `app.js` importeres.

## Filer i denne patchen
- `index.html`
- `js/app.js`
- `js/features/teacher.js`
- `js/features/firebase.js` (uendret, medfølger for konsistens)
- `css/popups.css` (uendret, medfølger for konsistens)
