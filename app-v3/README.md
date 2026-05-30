# GloseMester v3 (React + Vite + TypeScript)

Dette er **Del B** av arkitektur-arbeidet — en strangler-fig-migrering av v2-appen
(vanilla JS i `../src/`) til React. Den vokser ved siden av dagens app, som fortsatt
kjører uendret fra repo-roten (`../index.html` → `../src/app.js`).

Se fullstendig plan i [`../docs/DEL-B-REACT-PLAN.md`](../docs/DEL-B-REACT-PLAN.md).

## Status
- **Fase B1 — scaffold:** ✅ Vite + React + TS, merkevare-tokens, PWA-plugin, ESLint.
- **Fase B2 — fundament:** ✅ react-router (alle ROUTES-stier fra v2), Zustand
  (`useAuthStore`/`useAppStore`), env-basert `lib/firebase.ts`, UID-nøklet
  `lib/storage.ts` (portet fra Del A), datalag `lib/data/users.ts`, rute-vakt og
  delt `Layout`.
- **Fase B3 (pågår) — feature-porting:**
  - ✅ Landing + auth: Feide (OAuth2) + Google (`lib/auth.ts`, samme
    endepunkter/scope som v2), Feide-callback i `AuthBootstrap`, gjenbrukbar
    `Button` + toast (`Toaster` + `useToastStore`).
  - ✅ GloseMester øvemodus: vokabular (`features/glosemester/vocabulary.ts`),
    ren øve-motor (`practiceEngine.ts`, enhetstestet), nivåvalg
    (`GlosemesterStart`) og øve-økt (`GlosemesterPractice`), XP/diamant-belønning
    (`lib/rewards.ts`) og TTS (`lib/speech.ts`).
  - ✅ Leitner spaced-repetition (NY i v3): `features/glosemester/leitner.ts`
    (bokser 1–5, vektet ordvalg, persistert per bruker/nivå, enhetstestet).
    Øvemodus velger nå neste ord via Leitner-vekting.
  - ✅ Prøvemodus (quiz): elev tar lærerens prøve via kode/QR
    (`pages/Quiz.tsx`), ren motor (`features/quiz/quizEngine.ts`), datalag
    `lib/data/prover.ts` + `lib/data/resultater.ts` (henter prøve, sender
    resultat til lærer — gjest eller innlogget).
  - ⏳ Gjenstår i B3: kort/galleri, lærer-dashboard, standalone-sider, full
    markedsførings-landingsside.

## Tester
`npm test` (Vitest) — enhetstester for øve-motoren (`practiceEngine.test.ts`),
Leitner (`leitner.test.ts`).

## Miljøvariabler
Firebase-config kan overstyres via `app-v3/.env` (se `.env.example`). Standardverdier
(dagens prod) ligger som fallback i `src/lib/firebase.ts`.

## Kom i gang
```bash
cd app-v3
npm install
npm run dev        # utviklingsserver på http://localhost:5173
npm run build      # typesjekk + bygg til ../dist
npm run typecheck  # kun typesjekk
```

## Merk
- Design-tokens er kopiert fra `../src/styles/tokens.css` (eneste kilde i v2).
  Holdes i synk manuelt til v3 overtar i fase B5.
- Egen `package.json` her holder v3-avhengighetene adskilt fra rotens
  Capacitor/vanilla-oppsett — null kollisjon med dagens app.
- Bygger til `../dist` (blir Capacitor `webDir` i fase B4).
