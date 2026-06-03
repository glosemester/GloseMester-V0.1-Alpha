# Stripe – Skolepriser (betalingstier)

Betalingstier for **GloseMester Skolepakke**, opprettet i Stripe via Stripe MCP.
Prisene følger spesifikasjonen i `prompts/PROMPT-3-PAYMENT.md` og `skoleavtale.html`
(5 000–10 000 kr/år, avtales ut fra skolens størrelse).

> **Konto:** `glosemester.no` (`acct_1SxQnc8T0fEZM9GZ`)
> **Modus:** LIVE (`livemode: true`) — produktene/prisene ble opprettet i live-modus.
> Pris-ID-er er offentlige identifikatorer (ikke hemmeligheter) og kan trygt
> ligge i repoet. De er **ikke** belastende i seg selv — ingen blir trukket
> før det opprettes en Checkout-sesjon / et abonnement mot prisen.

## Tier-oversikt

| Tier | Antall lærere | Pris (eks. mva.) | Intervall | Produkt-ID | Pris-ID |
|------|---------------|------------------|-----------|------------|---------|
| Liten | 1–5 | 5 000 kr/år | Årlig | `prod_UdXPHWJCoR3TPd` | `price_1TeGKi8T0fEZM9GZehFZXu0Z` |
| Mellom | 6–15 | 7 000 kr/år | Årlig | `prod_UdXPInt5vsJpED` | `price_1TeGKk8T0fEZM9GZi4pW40vg` |
| Stor | 16+ | 10 000 kr/år | Årlig | `prod_UdXPQQxl9YiXgC` | `price_1TeGKn8T0fEZM9GZKyJeO9EI` |

Beløp er i NOK. I Stripe lagres de i øre (minste enhet): 500000 / 700000 / 1000000.

## Foreslåtte miljøvariabler (Netlify)

Følger samme mønster som de eksisterende `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`
i `netlify/functions/stripe-checkout.js`:

```
STRIPE_PRICE_SKOLE_LITEN=price_1TeGKi8T0fEZM9GZehFZXu0Z
STRIPE_PRICE_SKOLE_MELLOM=price_1TeGKk8T0fEZM9GZi4pW40vg
STRIPE_PRICE_SKOLE_STOR=price_1TeGKn8T0fEZM9GZKyJeO9EI
```

## Merknad om skoleflyt

Skoler håndteres i dag via kontaktskjema (`netlify/functions/school-inquiry.js`) og
manuell fakturering med 30 dagers betalingsfrist, jf. `skoleavtale.html`. Disse
betalingstierene gjør det mulig å:

- opprette abonnement/faktura direkte mot riktig pris-ID når en skoleavtale signeres, eller
- senere tilby selvbetjent Checkout for skoler ved å utvide `stripe-checkout.js`
  med `skole_liten` / `skole_mellom` / `skole_stor` på samme måte som premium-planene.
