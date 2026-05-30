# Del B — React-omskriving (v3)

> Status: **Planlagt** — utføres etter launch. Del A (arkitektur-opprydding) er
> fullført i PR #54. Denne planen forutsetter at Del A er merget.

## Context

Etter Del A er overlappet fjernet og appen har ett design-token-sett, UID-nøklet
storage og delt Feide-logikk — men den er fortsatt vanilla JS uten bundler, med
manuell DOM-manipulasjon (`innerHTML`-strenger), løst globalt `window.GloseMester`-
state og ingen typesikkerhet. Del B bygger appen om til **React + Vite + TypeScript**
for varig vedlikeholdbarhet, uten å miste funksjoner.

**Metode: strangler-fig, ikke big-bang.** Ny React-app vokser ved siden av dagens
`src/`, én feature om gangen, bak samme ruter, til paritet er nådd. Dette holder appen
kjørbar gjennom hele migreringen og lar hvert steg verifiseres isolert.

**Omfang som skal portes (dagens `src/`, ~9 800 linjer):**

| Modul | Linjer | Merknad |
|-------|--------|---------|
| `features/glosemester/glosemester.js` | 1424 | Øvemodus + Leitner — størst |
| `features/teacher/teacher-module.js` | 1129 | Dashboard, prøve-editor, analytics |
| `features/trade/trade-system.js` | 980 | Kortbytte |
| `core/kort/*` (4 filer) | ~1586 | Samling, display, reward, data |
| `core/auth/*` | ~556 | Feide + Google |
| `pages/*` (landing, velkomst, fag-start) | ~1026 | |
| `shared/quiz/quiz-engine.js` | 384 | Elev-prøvemodus |
| `core/navigation/*`, `core/pwa/*`, `core/utils/*` | ~1500 | Erstattes i stor grad av rammeverk/biblioteker |

I tillegg ~3 500 linjer frittstående HTML (`oppgrader`, `min-side`, `for-laerere`,
`for-skoler`, `om-oss`, `faq`) som absorberes som React-sider — dette rydder samtidig
opp i V1-restene (`js/features/{payment,gdpr,auth,firebase,saved-tests}.js`) og
A6-punktet (felles header/footer) fra Del A.

---

## Målarkitektur

```
index.html                  # ETT entrypoint, Vite injiserer /src/main.tsx
vite.config.ts              # bundling, env, vite-plugin-pwa (erstatter sw.js + scripts/build.js)
tsconfig.json
src/
  main.tsx                  # React-rot, <RouterProvider>
  App.tsx
  state/
    useAuthStore.ts         # Zustand — erstatter window.GloseMester.bruker
    useAppStore.ts          # aktivtFag, aktivRolle, initialized
  lib/
    firebase.ts             # én config, env-basert (import.meta.env)
    storage.ts              # UID-nøklet (porteres fra Del A storage.js)
    rate-limiter.ts
    feedback.ts             # toast/lyd/vibrasjon/confetti
    data/                   # TYNN Firestore-wrapper — samler 56 spredte kall
      prover.ts             # hentProveMedKode, lagreProve, ...
      resultater.ts
      users.ts
      glosebank.ts
      trades.ts
  components/               # Button, Card, Modal, Badge, ProgressBar, Layout (Header/Footer)
  features/
    glosemester/            # VocabularyPractice, LeitnerEngine (ren TS-modul)
    quiz/                   # QuizEngine
    kort/                   # Collection, CardDisplay, Reward, Trade
    teacher/                # Dashboard, TestEditor, Analytics, SavedTests
    auth/                   # FeideLogin, GoogleLogin, useAuth
    payment/                # Stripe (porteres opp fra V1 js/features/payment.js)
    gdpr/                   # eksport/sletting (fra V1 js/features/gdpr.js)
    onboarding/
  pages/                    # Landing, Velkomst, FagStart, MinSide, Oppgrader,
                            #   ForLaerere, ForSkoler, OmOss, Faq
netlify/functions/          # uendret (allerede ryddet i Del A; lib/feide-roles.js delt)
```

**Nøkkelvalg:**
- **Routing:** `react-router-dom` v6. Behold dagens URL-stier (`/gloser`, `/ov`,
  `/prove`, `/lærer/...`, `/min-side`) fra `core/navigation/router.js` så delbare
  lenker og QR-koder fortsatt virker.
- **State:** Zustand (minimal, ingen boilerplate). `useAuthStore` erstatter
  `window.GloseMester.bruker` og `window.MesterSuite`-aliaset.
- **Data:** Tynne typede wrappere i `lib/data/` rundt alle Firestore-kall (i dag 56
  spredt over 8 filer). Komponenter kaller aldri Firestore direkte → lettere å sikre,
  teste og cache.
- **PWA:** `vite-plugin-pwa` (Workbox) genererer service worker → erstatter manuelt
  vedlikeholdt `sw.js` med dets cache-liste.
- **QR:** bytt CDN-`qrcodejs` mot npm-pakken `qrcode` (bundles, ingen ekstern CDN).
- **Bygg:** `vite build` → `dist/`; Capacitor `webDir` settes til `dist/`;
  `scripts/build.js` og `www/`-mønsteret utgår.

---

## Faser (hver = egen PR, app forblir kjørbar)

**B1 — Verktøy-scaffold (ingen feature-port ennå).**
Legg til Vite + React + TS + ESLint/Prettier + `vite-plugin-pwa`. `tsconfig` med
`strict: true`. Importer `src/styles/tokens.css` + `components.css` fra Del A uendret.
`main.tsx` rendrer en tom `<App>`. Verifiser `vite dev` og `vite build`.

**B2 — Fundament: ruter, state, lib.**
`react-router` med alle ROUTES-stier. `useAuthStore` + `onAuthStateChanged`-binding.
`lib/firebase.ts` (env-basert), `lib/storage.ts` (UID-nøklet, port fra Del A),
`lib/data/*`-wrappere. Delt `components/Layout` (Header/Footer — løser A6).

**B3 — Port feature for feature** (én PR per, paritet mot dagens app før neste):
1. Landing + auth (Feide/Google) — minst risiko, validerer fundamentet
2. GloseMester øvemodus + Leitner (`glosemester.js` → `LeitnerEngine` ren TS + UI)
3. Quiz/prøvemodus (`quiz-engine.js`)
4. Kort: samling, display, reward, trade
5. Teacher: dashboard, prøve-editor, analytics, mine-prøver
6. Standalone-sider som React-ruter: min-side, oppgrader (**Stripe**), for-laerere,
   for-skoler, om-oss, faq — fjern V1 `js/`-restene her

**B4 — Bytt bygg.**
Capacitor `webDir` → `dist/`. Fjern `scripts/build.js`, manuelt `sw.js`, `index.html`
gammel script-tag. Test `npm run build` + `cap sync` (iOS/Android).

**B5 — Slett gjenværende vanilla.**
Når paritet er bekreftet for alle features: slett gamle `src/*.js`-moduler og hele
`js/`. Oppdater README.

---

## Risikoer og mottiltak

- **Stripe-betaling (live inntekt):** port sist (B3.6), test grundig i Stripe
  test-modus mot deploy-preview før prod. Behold Netlify-funksjonene uendret.
- **Feide-innlogging:** funksjonene er server-side og uendret; kun klient-kallet
  reimplementeres. Test mot Feide testmiljø.
- **localStorage-paritet:** behold nøyaktig nøkkelskjema fra Del A (`mester_*_<uid>`)
  så migrerte brukere beholder kort/XP/diamanter.
- **URL-paritet:** ikke endre stier → QR-koder og delte prøvelenker fortsetter å virke.
- **Tidsbruk:** ~9 800 linjer logikk + 3 500 HTML. Realistisk flere uker; derfor
  feature-for-feature med kjørbar app hele veien, ikke en lang frittstående branch.

---

## Verifisering (per feature-PR)

1. `vite build` uten typefeil; `vite dev` kjører.
2. Sammenlign React-versjonen mot dagens app på deploy-preview: samme flyt, samme
   URL, samme data i Firestore/localStorage.
3. Kjerneflyter: elev øve (3 nivåer) → kort-belønning → bytte; lærer lag/rediger
   prøve → QR → elev tar prøve via kode → resultat til lærer; Feide + Google login;
   oppgrader via Stripe (test-modus).
4. `cap sync` bygger iOS/Android mot `dist/` (fra B4).
5. PWA: offline-last og install-prompt fungerer via `vite-plugin-pwa`.
