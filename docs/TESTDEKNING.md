# Testdekning — analyse og forbedringsforslag

**Dato:** 2026-06-14
**Omfang:** Hele kodebasen (`app-v3/` + `netlify/functions/`)
**Type:** Analyse og prioriterte anbefalinger — ingen kodeendringer i dette dokumentet.

> Dette dokumentet beskriver *automatisert* testdekning (vitest + Playwright).
> For manuell QA-sjekkliste, se [`TESTPLAN.md`](./TESTPLAN.md).

---

## 1. Sammendrag

- **`features/`-laget (ren logikk) er godt dekket.** 14 enhetstest-filer, ~140
  tester, med gode mønstre: injiserbar RNG, in-memory `localStorage`-mock,
  immutabilitetssjekker og grensetilfeller.
- **Det finnes ingen dekningsverktøy.** Ingen `@vitest/coverage-*`, ingen
  `test:coverage`-skript, ingen terskler. Hull er dermed usynlige i CI.
- **Datalag, flere `lib/`-hjelpere og hele backend er utestet.** Spesielt
  tilgangsstyring, kortsamling/panting og progresjons-merge mangler tester
  selv om de er kritiske for henholdsvis betalingsmur, spilløkonomi og
  dataintegritet.
- **Netlify-funksjonene har null tester** — Feide-auth, Stripe-checkout/webhook
  og rolletildeling kjører uten et eneste sikkerhetsnett.

---

## 2. Nåværende dekning

### Enhetstester (vitest) — 14 filer

| Område | Fil | Verifiserer |
|---|---|---|
| Quiz | `features/quiz/quizEngine.test.ts` | Spørsmålsbygging, stokking, svarnormalisering (æ/ø/å), poeng |
| Gloser | `features/glosemester/leitner.test.ts` | Leitner-bokser: opprykk/nedrykk, vekting, mestring |
| Gloser | `features/glosemester/practiceEngine.test.ts` | Øvingsøkt-flyt, alternativbygging, retning en/no |
| Kort | `features/kort/kortReward.test.ts` | Rarity-beregning, kategori per nivå, vinnevilkår (80 %) |
| Kort | `features/kort/kortProgress.test.ts` | Felles teller, kort hver 10. riktige |
| Nivå | `features/niva/nivaSystem.test.ts` | XP→nivå, progresjon, opplåsing, nivå-opp |
| Bytte | `features/trade/tradeMachine.test.ts` | Tilstandsoverganger + rollebaserte regler |
| Bytte | `features/trade/tradeReconcile.test.ts` | Idempotent oppgjør av fullførte bytter |
| Bytte | `features/trade/byttesjetonger.test.ts` | Sjetong-terskler, opptjening, fremgang |
| Lærer | `features/teacher/resultatGruppering.test.ts` | Gruppering per elev (beste forsøk), snitt, ordstatistikk |
| Lib | `lib/rewards.test.ts` | XP per svar, diamant-bonus per 100 XP |
| Lib | `lib/payment.test.ts` | Stripe-checkout-start, auth-sjekk, feilhåndtering |
| Data | `lib/data/prover.test.ts` | Prøvekode-generering, utløp, kvote (gratis/premium) |
| Data | `lib/data/resultatKo.test.ts` | Offline resultat-kø, retry, idempotens via `klient_id` |

### E2E (Playwright) — 2 filer

| Fil | Dekker |
|---|---|
| `e2e/smoke.spec.ts` | Landing, øving niva1, kortgevinst, navigasjon, bytte-redirect, galleri, kvittering, FAQ, PWA-fallback |
| `e2e/screenshots.spec.ts` | Skjermbilde-fangst (ingen assertions) |

---

## 3. Hull i dekningen (prioritert)

### Tier 1 — høy risiko, ren logikk (høyest avkastning, enkelt å teste)

**`src/lib/tilgang.ts` — tilgangsstyring**
Rene predikater (`harSkolelisens`, `harPremiumEllerOver`, `erLaerer`,
`erFeidebruker`, `harAlleKortpakker`, `hentTilgangsliste`). Feil her = lekket
funksjonalitet eller omgått betalingsmur. Ingen avhengigheter — triviell å
teste. *Test:* alle kombinasjoner av rolle × abonnement × Feide/gjest, og at
`hentTilgangsliste` setter `tilgjengelig`/`forklaring` riktig per punkt.

**`src/features/kort/kortSamling.ts` — kortsamling og panting**
`panteKort` (2 dubletter → 1 nytt kort, krever ≥3 kopier), `fjernKort`
(antall-semantikk), `samlingStats`, og `hentSamling`-hydrering mot `kortData`.
Tar allerede injiserbar `rng` — direkte testbar; krever at storage-laget mockes.
*Test:* nøyaktig 3 kopier vs. >3 vs. <3, at riktig rarity trekkes, og at
hydrering plukker opp korrigerte bildestier/navn.

**`src/lib/progressSync.ts` — progresjons-merge og synk**
`mergeProgress`/`mergeSamling` (max for XP/diamanter/streak, union for kort) og
tre-veis `onLogin`-merge (gjest + lokal + Firestore), inkludert
offline-grenen (`serverResult === 'error'`). Kritisk for dataintegritet ved
flere enheter og gjest→innlogging. *Merk:* merge-funksjonene er modul-private —
anbefal enten å eksportere dem for test, eller å teste via `onLogin` med mocket
`hentProgress`/`lagreProgress` og storage.

### Tier 2 — datalag og hjelpere (moderat)

- **`src/lib/data/resultater.ts`** — `byggResultatDokument`: gjest får auto-ID +
  tidsstempel, innlogget beholder UID. Ren bygger som mater offline-køen.
- **`src/lib/data/kampanje.ts`** — `finnKampanje` + aktivering: utløp/dato,
  dobbel-aktivering.
- **`src/lib/streak.ts`** — daglig streak: økning/nullstilling rundt
  døgnovergang.
- **`src/lib/storage.ts`** — UID-nøklet navnerom + migrering av legacy-nøkler.
  Fundament som `progressSync` hviler på.

### Tier 3 — serverless backend (`netlify/functions/`)

Null dekning i dag. Disse er CommonJS `.js` og ligger utenfor dagens
vitest-glob (`app-v3`), så de trenger et eget Node-testmål (se §4).

- **`lib/feide-roles.js`** — `bestemRolle` / `hentRelevanteGrupper`: ren
  gruppeparsing. Enkleste backend-gevinst, høyest korrekthetsverdi (avgjør
  lærer vs. elev).
- **`stripe-webhook.js`** — hendelsesruting (`checkout.session.completed`,
  `invoice.payment_succeeded`, abonnement slettet/oppdatert) → abonnementsstatus.
  Mange feilmoduser; mock Stripe + Firebase Admin.
- **`stripe-checkout.js`** — plan-validering + metadata.
- **`school-inquiry.js`** — skjemavalidering + e-post/Stripe-feilhåndtering.

---

## 4. Manglende verktøy

- Legg til **`@vitest/coverage-v8`** og et **`test:coverage`**-skript i
  `app-v3/package.json`.
- Sett en beskjeden **dekningsbaseline** rettet mot `src/features/**` og
  `src/lib/**` (ekskluder sider/UI). Start lavt og hev gradvis så terskelen
  ikke blokkerer eksisterende arbeid.
- Koble en **ikke-blokkerende dekningsrapport** inn i eksisterende CI-workflow
  (paths-filteret `app-v3/**` gjelder fortsatt).
- Backend trenger **eget Node/Vitest-prosjektoppsett** siden funksjonene er CJS
  og i dag ekskludert fra oppsettet i `app-v3/vite.config.ts`.

---

## 5. UI / integrasjon (lavere prioritet)

Sider og hooks (`features/teacher/useLaererProver.ts`, lærersidene) dekkes kun
indirekte via Playwright-smoketesten. Å utvide e2e til en full lærer-flyt
(lag prøve → tildel → se resultater) er et større, separat løft — nevnt her,
men ikke prioritert i denne omgang.

---

## 6. Anbefalt rekkefølge

1. **Legg til dekningsverktøy** (§4) — gjør hull synlige i CI før vi fyller dem.
2. **Tier 1** — `tilgang.ts`, `kortSamling.ts`, `progressSync.ts`.
3. **`feide-roles.js` + `stripe-webhook.js`** — høyest backend-risiko.
4. **Tier 2** — datalag-byggere, kampanje, streak, storage.
