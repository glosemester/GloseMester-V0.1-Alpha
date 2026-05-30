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
  delt `Layout`. Landing + Hjem som placeholder-sider.

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
