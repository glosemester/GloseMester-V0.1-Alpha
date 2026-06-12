# Stripe — ende-til-ende-testing

Oppskrift for å teste hele betalingsveien (Premium-abonnement) lokalt med
Stripe i **testmodus**. Ingen ekte penger involveres.

## Arkitektur (kort)

```
Oppgrader.tsx ──(klikk)──> payment.ts ──POST──> netlify/functions/stripe-checkout.js
      │                                                   │ lager Checkout-sesjon + order-doc (INITIATED)
      │ <── redirect til Stripe Checkout ─────────────────┘
      │
   [bruker betaler med testkort hos Stripe]
      │
      ├── redirect ──> /oppgrader?status=success   (Oppgrader.tsx viser kvittering)
      └── webhook ──> netlify/functions/stripe-webhook.js
                          checkout.session.completed → abonnement.type = 'premium'
                          customer.subscription.deleted → abonnement.type = 'free'  ← revokering
```

Premium gates på **`users/{uid}.abonnement.type == 'premium'`** (jf.
`firestore.rules`). Det er dette feltet webhooken skriver — ikke
`subscription.status`.

## Miljøvariabler (Netlify → Site settings → Environment variables)

Bruk **test**-verdier (`sk_test_…`, `price_…` fra testmodus):

| Variabel | Beskrivelse |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Hemmelig nøkkel (`sk_test_…`) |
| `STRIPE_PRICE_MONTHLY` | Price-ID for månedlig plan (99 kr) |
| `STRIPE_PRICE_YEARLY` | Price-ID for årlig plan (800 kr) |
| `STRIPE_WEBHOOK_SECRET` | Signeringshemmelighet for webhooken (`whsec_…`) |
| `BASE_URL` | Brukes kun som fallback for retur-URL (v3 sender egen `successUrl`) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON for Firebase Admin (server-side skriving) |

## Lokal testkjøring

Krever [Stripe CLI](https://stripe.com/docs/stripe-cli) og
[Netlify CLI](https://docs.netlify.com/cli/get-started/).

```bash
# 1. Kjør appen + funksjonene lokalt (bygger v3 og serverer functions)
netlify dev

# 2. I et annet skall: videresend Stripe-webhooks til den lokale funksjonen.
#    Kommandoen skriver ut en whsec_… — sett den som STRIPE_WEBHOOK_SECRET.
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

### Happy path (kjøp → premium)

1. Logg inn, gå til `/oppgrader`, velg en plan → du sendes til Stripe Checkout.
2. Betal med testkortet **`4242 4242 4242 4242`** (hvilken som helst fremtidig
   utløpsdato, hvilken som helst CVC/postnr).
3. Du redirectes til `/oppgrader?status=success` (kvitterings-toast vises).
4. Verifiser i Firestore at `users/{uid}.abonnement.type` er `"premium"` og at
   `orders/{orderId}.status` er `"PAID"`.

### Revokering (oppsigelse → free) — regresjonssjekk for inntektslekkasjen

Tidligere ble premium **aldri** fjernet ved oppsigelse. Test at det nå skjer:

```bash
# Avbestill abonnementet (eller bruk Stripe Dashboard → Subscriptions → Cancel)
stripe trigger customer.subscription.deleted
```

Verifiser at `users/{uid}.abonnement.type` settes tilbake til `"free"`.
(For et ekte abonnement som sies opp ved periodeslutt, fyres
`customer.subscription.deleted` når perioden faktisk utløper.)

### Fornyelse

```bash
stripe trigger invoice.payment_succeeded
```

Kun `billing_reason === 'subscription_cycle'` behandles (forlenger
`abonnement.expiresAt`); den første fakturaen dekkes av
`checkout.session.completed`.

## Automatiserte tester

`app-v3/src/lib/payment.test.ts` dekker klientsiden (innlogging påkrevd,
korrekt payload, redirect, feilhåndtering). Kjør med:

```bash
cd app-v3 && npm test
```

Webhook-funksjonen (`netlify/functions/`) er CommonJS utenfor Vitest-oppsettet
og testes i dag manuelt via `stripe trigger` som beskrevet over.
