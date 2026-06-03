# Stripe – Skolepriser (betalingstier)

Betalingstier for **GloseMester Skolepakke**, opprettet i Stripe via Stripe MCP.
Prisene avtales ut fra skolens størrelse (gjeldende satser: 2 000–8 000 kr/år).

> **Konto:** `glosemester.no` (`acct_1SxQnc8T0fEZM9GZ`)
> **Modus:** LIVE (`livemode: true`) — produktene/prisene ble opprettet i live-modus.
> Pris-ID-er er offentlige identifikatorer (ikke hemmeligheter) og kan trygt
> ligge i repoet. De er **ikke** belastende i seg selv — ingen blir trukket
> før det opprettes en Checkout-sesjon / et abonnement mot prisen.

## Tier-oversikt

| Tier | Antall lærere | Pris (eks. mva.) | Intervall | Produkt-ID | Pris-ID |
|------|---------------|------------------|-----------|------------|---------|
| Liten | 1–5 | 2 000 kr/år | Årlig | `prod_UdXPHWJCoR3TPd` | `price_1TeGuN8T0fEZM9GZzIgh3VMC` |
| Mellom | 6–15 | 4 000 kr/år | Årlig | `prod_UdXPInt5vsJpED` | `price_1TeGuO8T0fEZM9GZ3j6bSGaH` |
| Stor | 16+ | 8 000 kr/år | Årlig | `prod_UdXPQQxl9YiXgC` | `price_1TeGuP8T0fEZM9GZ0XYPe41u` |

Beløp er i NOK. I Stripe lagres de i øre (minste enhet): 200000 / 400000 / 800000.

> De opprinnelige prisene (5 000 / 7 000 / 10 000 kr) er deaktivert i Stripe
> (`active: false`) — Stripe-priser kan ikke endres, så nye priser ble opprettet
> og de gamle satt inaktive. Produkt-ID-ene er uendret.

## Foreslåtte miljøvariabler (Netlify)

Følger samme mønster som de eksisterende `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`
i `netlify/functions/stripe-checkout.js`:

```
STRIPE_PRICE_SKOLE_LITEN=price_1TeGuN8T0fEZM9GZzIgh3VMC
STRIPE_PRICE_SKOLE_MELLOM=price_1TeGuO8T0fEZM9GZ3j6bSGaH
STRIPE_PRICE_SKOLE_STOR=price_1TeGuP8T0fEZM9GZ0XYPe41u
```

## Merknad om skoleflyt

Skoler håndteres i dag via kontaktskjema (`netlify/functions/school-inquiry.js`) og
manuell fakturering med 30 dagers betalingsfrist, jf. `skoleavtale.html`. Disse
betalingstierene gjør det mulig å:

- opprette abonnement/faktura direkte mot riktig pris-ID når en skoleavtale signeres, eller
- senere tilby selvbetjent Checkout for skoler ved å utvide `stripe-checkout.js`
  med `skole_liten` / `skole_mellom` / `skole_stor` på samme måte som premium-planene.

## Fornyelse og oppsigelse

Skolelisensen løper i **12 måneder** og **fornyes automatisk** for ett år av gangen,
med mindre den sies opp skriftlig senest **30 dager** før utløp. Dette er samkjørt
mellom `skoleavtale.html` (punkt om varighet) og `vilkar.html` (punkt 6 Oppsigelse).

### Standardtekst på faktura

Legg alltid inn følgende fornyelses-/oppsigelsesnote når fornyelsesfaktura sendes
ut (manuelt via Fiken/Tripletex e.l.), slik at oppsigelsesfristen er tydelig:

> Denne lisensen fornyes automatisk for 12 nye måneder ved utløp. Ønsker dere ikke
> å fornye, gi skriftlig beskjed til kontakt@glosemester.no senest 30 dager før
> utløpsdato [DD.MM.ÅÅÅÅ].

Admin-varselet fra `school-inquiry.js` minner om å inkludere denne teksten.
