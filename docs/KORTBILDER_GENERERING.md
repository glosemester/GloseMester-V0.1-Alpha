# Automatisk generering av kortbilder

Erstatter den manuelle Midjourney-flyten (`docs/arkiv/MIDJOURNEY_MATTEMESTER_KORT.md`).
Motor: **OpenAI gpt-image-1-mini** (~$0.005/bilde → en hel 38-korts kategori for ca. $0.19).
Formatet er 1024×1024 (1:1, samme som eksisterende kort), stilen er malerisk
illustrasjon som matcher dagens samling, og sluttbildene blir uansett 320px WebP,
så mini-kvalitet holder. Enkeltkort kan regenereres med `--model gpt-image-1.5`.

## Slik lager du en ny kategori

1. **Lag manifest** (JSON), f.eks. `kort-manifest-romvesener.json`:

   ```json
   {
     "mappe": "romvesener",
     "kort": [
       { "fil": "001-zorg.png", "navn": "Zorg", "prompt": "friendly green alien with big eyes and antenna, smiling, wearing space suit, floating in space, colorful nebula background" },
       { "fil": "002-beep.png", "navn": "Beep", "prompt": "small blue alien with three eyes, cute expression, holding a glowing orb, asteroid field background" }
     ]
   }
   ```

   38 kort per kategori; rekkefølgen styrer sjeldenhet (1–20 common, 21–30 rare,
   31–35 epic, 36–38 legendary — jf. `getRarity` i `kortData.ts`). Bakgrunnen
   koder sjeldenheten automatisk (hvit/grå → blå → lilla → gyllen).

   **Mangfold:** legg gjerne inn `"variasjoner": [ … ]` (komposisjons-/positur-
   fraser som fordeles rundgang på kortene) og skriv per-kort-promptene med
   ulike detaljer — se `kort-manifest-planeter.json` som mal. Per-kort-felt
   `"stil"` overstyrer kategoristilen for enkeltkort.

2. **Generer** (API-nøkkelen settes i miljøet, aldri i repoet):

   ```bash
   export OPENAI_API_KEY=sk-…
   cd app-v3
   node scripts/generate-card-images.mjs kort-manifest-romvesener.json
   ```

   Skriptet er idempotent — eksisterende filer hoppes over. Vil du regenerere et
   kort: slett filen og kjør igjen (evt. `--kun 007 --model gpt-image-1.5`).
   Test gjerne med 2–3 kort i manifestet før du kjører alle 38.

3. **Optimaliser** til WebP 320px: legg mappen til i `KATEGORIER` i
   `scripts/optimize-card-images.mjs` og kjør `node scripts/optimize-card-images.mjs`.

4. **Stage pakken** i `app-v3/src/features/kort/kortData.ts` (oppskriften står i
   filen): ny `Category`, rader, `PAKKER`-innslag med `aktiv: false` → sett
   `aktiv: true` når bildene er godkjent.
