# Spec: GloseMester skole — reprising av Premium (29 kr)

Status: **låst, klar for implementering.** Gjelder skole/lærer-produktet (web,
Stripe). Forbruker-appen **GloseMester Junior** (App Store, engangskjøp 49 kr)
speces separat.

## 1. Scope (låst)

| Trinn | Pris | Handling |
|---|---|---|
| Gratis | 0 | Beholdes — men **3-prøvegrensen håndheves nå** (var kun UI-løfte) |
| **Premium** | **29/mnd · 290/år** | Repris fra 99/800 |
| Pro | 79 | **Parkert** — se §6. Ingen kode nå. |
| Skole | tilbud (manuell faktura) | Uendret (`skolepakke`) |

**To arbeidspakker:**
1. Repris Premium 99→29, 800→290.
2. Håndhev gratis-grensen «opptil 3 prøver» ved oppretting.

Pro droppes i denne omgang (manglet funksjoner å selge — se §6). Ingen
`'pro'`-tier i datamodell, webhook eller rules nå.

## 2. Bakgrunn fra kodebasen

- Stack: Netlify Functions + Firebase Firestore + Stripe.
- `abonnement.type` (`'free' | 'premium' | 'skolepakke'`) er **eneste** felt som
  styrer tilgang. `subscription.*` er bakoverkomp og leses ikke.
- Betalte funksjoner som finnes: ubegrenset `prover`, `standardprover` (premium+),
  `glosebank`/Feide (skolepakke).
- 3-prøvegrensen for gratis er **annonsert i `Oppgrader.tsx`, men ikke håndhevet** —
  alle kan i dag lage ubegrenset prøver.
- Ingen reelle betalende kunder i dag (kun testbrukere) → migrasjon er triviell.

## 3. Arbeidspakke 1 — Repris Premium

### 3.1 Stripe-priser
- Opprett nye Price-objekter i Stripe: **29 kr/mnd** og **290 kr/år** (NOK, recurring).
- Oppdater Netlify env:
  ```
  STRIPE_PRICE_MONTHLY = <ny 29-pris-id>
  STRIPE_PRICE_YEARLY  = <ny 290-pris-id>
  ```
- Beløpene i `netlify/functions/stripe-checkout.js` (hardkodet 9900/80000) brukes
  kun hvis Price-ID mangler — oppdater/fjern dem så de matcher 2900/29000, slik at
  fallback ikke gir feil pris.

### 3.2 Pris-UI — `app-v3/src/pages/marketing/Oppgrader.tsx`
- `PLANER`: `99 kr/mnd` → `29 kr/mnd`, `800 kr/år` → `290 kr/år`.
- Oppdater spar-tekst: «Spar 388 kr» → korrekt for 29×12−290 = **58 kr/år**
  (vurder om årlig fortsatt er verdt å fremheve med så lav besparelse; ev. gjør
  årlig til «2 måneder gratis»-vinkling = 290 ≈ 10×29).
- Behold de fire kolonnene (Gratis / Premium mnd / Premium år / Skole). Ingen Pro.

### 3.3 Webhook — `netlify/functions/stripe-webhook.js`
- **Ingen endring nødvendig.** Setter fortsatt `abonnement.type = 'premium'`.
  Prisen ligger i Stripe, ikke i webhook-logikken.

### 3.4 Etiketter
- `MinSide.tsx`, `admin/admin.js`: ingen endring (samme tier-navn).

### 3.5 Testbrukere
- Eksisterende testbrukere på «premium» er allerede `type='premium'` og funger
  uendret. Ingen Stripe-migrering av gamle abonnement nødvendig (ingen reelle).
  Ev. aktive test-abonnement i Stripe kanselleres/gjenopprettes på ny pris ved behov.

## 4. Arbeidspakke 2 — Håndhev gratis-grensen (3 prøver)

Mål: gratisbruker kan ha **maks 3 prøver**; oppretting av nr. 4 blokkeres med
oppgraderingsoppfordring. Premium/skolepakke = ubegrenset.

### 4.1 Klientsjekk — `app-v3/src/lib/data/prover.ts`
I `opprettProve()`:
```ts
if (bruker.abonnement.type === 'free') {
  const antall = await antallProverForBruker(uid); // count where opprettet_av == uid
  if (antall >= 3) throw new GrenseNaaddError(); // → UI viser «Oppgrader for flere prøver»
}
```
- Ny hjelper `antallProverForBruker(uid)` (Firestore `count()`-aggregat for å unngå
  å hente alle dokumenter).
- UI: fang feilen i `TeacherCreateTest.tsx`/`TeacherDashboard.tsx` og vis toast +
  lenke til `/oppgrader`.

### 4.2 Serversjekk — `firestore.rules`
Klienten kan omgås, så grensen bør også speiles i regler. Aggregert telling i
regler er kostbart; anbefalt mønster:
- Hold en teller `proveAntall` på brukerdokumentet, inkrementert/dekrementert når
  prøver opprettes/slettes (klient eller liten function).
- `prover/create`-regel: `allow create` kun hvis
  `type != 'free' || brukerdok.proveAntall < 3`.
- **Alternativ (enklere, mindre robust):** håndhev kun i klient nå, legg
  regel-håndheving som oppfølging. Akseptabelt gitt lav misbruksrisiko tidlig.

### 4.3 Migrasjonshensyn
- Eksisterende gratisbrukere med >3 prøver: **behold alle**, blokker kun *ny*
  oppretting. Ingen sletting/låsing av eksisterende data.

## 5. Test & rollout

- Stripe test-mode: checkout 29 og 290 → webhook → `abonnement.type='premium'` + riktig `expiresAt`.
- Verifiser at `subscription.deleted` fortsatt setter `'free'` (jf. PR #67).
- Gratis-grense: lag 3 prøver som gratisbruker → 4. blokkeres; oppgrader → 4. går gjennom.
- Oppdater Netlify env-vars **før** deploy.
- Verifiser at årlig spar-tekst stemmer med faktiske beløp.

## 6. Parkert: Pro (79) — for senere

Pro ble droppet nå fordi differensiatorene ikke finnes i koden:
- Ingen klasse-modell, ingen AI-generator, ingen resultateksport.

Når Pro skal lanseres senere kreves: minst én Pro-eksklusiv funksjon (billigst
først: **resultateksport → per-elev-rapport → AI-generator**), deretter `'pro'`
i `users.ts`, plan→tier-mapping i webhook, `firestore.rules` (premium ∪ pro),
to Stripe-priser (79/790) og en Pro-kolonne i `Oppgrader.tsx`.
