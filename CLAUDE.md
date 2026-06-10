# GloseMester — instruksjoner for AI-assistenter

Gamifisert glose-PWA for norske skoler (React + Vite + TypeScript). Live på
[glosemester.no](https://glosemester.no) via Netlify. All UI-tekst og alle
identifikatorer er på norsk bokmål (f.eks. `hentProveMedKode`, `lagreResultat`).

## Struktur

- `app-v3/` — **den aktive appen** (React). Alt utviklingsarbeid skjer her.
  - `src/pages/` — sider (elev), `src/pages/teacher/` — lærersider
  - `src/lib/data/` — Firestore-datalag (én modul per collection)
  - `src/features/` — ren, testbar logikk (quizEngine, resultatGruppering, kort …)
  - `e2e/` — Playwright-smoketester
- `netlify/functions/` — serverless backend (Feide-auth, Stripe, push)
- `firestore.rules` — sikkerhetsregler (deployes MANUELT, se under)
- `docs/UTVIKLING.md` — oppsett og arbeidsflyt for mennesker

## Kommandoer (kjøres fra `app-v3/`)

| Kommando | Hva |
|---|---|
| `npm run dev` | Dev-server på localhost:5173 |
| `npm test` | Enhetstester (vitest) — skal alltid være grønne før push |
| `npm run lint` / `npm run typecheck` | Kodekvalitet |
| `npm run build` | Produksjonsbygg (tsc + vite → `../dist`) |
| `npm run e2e` | Playwright (krever `npx playwright install chromium` første gang) |

## Arbeidsflyt (ufravikelig)

1. `git checkout main && git pull` før du begynner.
2. Jobb i branch — aldri commit rett på `main`, aldri `git push --force` på main.
3. Push branch → PR → vent på grønn CI → merge. Netlify publiserer `main` automatisk.
4. CI kjører kun ved endringer i `app-v3/**` (paths-filter) — dokumentasjons-PR-er får bare Netlify-sjekker.

## Viktige fallgruver

- **`firestore.rules` deployes ikke av Netlify.** Manuelt: `firebase deploy --only firestore:rules --project glosemester-1e67e` — og alltid ETTER at klientendringer som påvirker spørringer er publisert.
- **Ikke kjør `npm audit fix --force`** — kjente sårbarhetsvarsler er akseptert; force-fix brekker bygget.
- **Aldri commit `.env`-filer.** Hemmeligheter (Stripe/Feide/Resend) bor i Netlify-env; Firebase-webconfig i koden er offentlig med vilje.
- Ny service worker tar over umiddelbart (skipWaiting) — ikke fjern dette, ellers blir brukere sittende på gammel cache.
- Resultater grupperes per elev med beste forsøk (`features/teacher/resultatGruppering.ts`) — ikke vis rå `resultater`-lister i lærer-UI.

## Stil

- Norske identifikatorer, kommentarer og UI-tekster.
- Inline style-objekter (ingen CSS-moduler/Tailwind); design-tokens via `var(--color-*)`.
- Ren logikk legges i `features/` med `.test.ts` ved siden av — datalag uten Firebase-avhengighet i logikkfiler.
- Nye kortpakker: følg oppskriften i `kortData.ts` + `docs/KORTBILDER_GENERERING.md`.
