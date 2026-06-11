# Generering av kortbilder — komplett guide

To metoder:

- **Metode A — Midjourney + import (ANBEFALT for stil).** Midjourney gir den
  stiliserte samlekort-kunsten vi vil ha. OpenAI gpt-image gir en seig, malerisk
  realisme som ikke lar seg styre mot tegneserie-/TCG-stil uansett prompt — så
  for figurer (skapninger, romvesener osv.) bruker vi Midjourney.
- **Metode B — OpenAI gpt-image (helautomatisk).** Greit til ikke-figurmotiver
  (landemerker, kjøretøy) der malerisk realisme er ok, og når du vil ha alt
  automatisk uten manuell nedlasting.

---

## Metode A — Midjourney + automatisk import (anbefalt)

Midjourney lager bildene; et script tar seg av omdøping + WebP-nedskalering.

### 1 — Manifest (samme fil som metode B)

Lag/bruk `app-v3/kort-manifest-<kategori>.json` (se malen lenger ned). Promptene
og navnene gjenbrukes til Midjourney.

### 2 — Få ferdige Midjourney-prompts

```powershell
cd C:\Users\<ditt-navn>\GloseMester-V0.1-Alpha\app-v3
node scripts/midjourney-prompts.mjs kort-manifest-<kategori>.json > prompts.txt
```

`prompts.txt` får én nummerert prompt per kort, med felles stil, raritetsbakgrunn
og `--ar 2:3` (kortformat) allerede påført. Lim dem inn i Midjourney.

### 3 — Generer og last ned

For hvert kort: generer i Midjourney, oppskaler det beste (U1–U4), last ned det
enkelte bildet. **Gi filen kortnummeret som navn:** `1.png`, `2.png`, … `38.png`
(ledende nuller valgfritt; png/jpg/webp godtas).

Legg alle i: `midjourney-innboks/<mappe>/` (i repo-roten — mappen er git-ignorert).

### 4 — Importer (omdøping + WebP i ett)

```powershell
node scripts/import-midjourney-images.mjs kort-manifest-<kategori>.json
```

Scriptet leser manifestet, skalerer hvert bilde til 320px WebP og skriver
`images/<mappe>/001-navn.webp` … Til slutt sier det hvilke numre som mangler, så
du kan ta resten senere (kjør på nytt — det er trygt å gjenta).

### 5 — Commit, push, aktiver

```powershell
cd ..
git checkout -b <kategori>-bilder
git add images/<kategori>
git commit -m "<Kategori>-kortbilder: 38 WebP fra Midjourney"
git push -u origin <kategori>-bilder
```

Be så Claude aktivere pakken i `kortData.ts` (`aktiv: true`) og opprette PR.

---

## Metode B — OpenAI gpt-image (helautomatisk)

Motor: **gpt-image-2** (portrait 1024×1536, ~$0.005–0.165/bilde).

---

## Forutsetninger (én gang per maskin)

### Node.js og avhengigheter

```powershell
node --version   # må være v18 eller nyere
cd C:\Users\<ditt-navn>\GloseMester-V0.1-Alpha\app-v3
npm install      # installerer sharp og alt annet
```

### Git-identitet

Uten dette feiler `git commit`:

```powershell
git config --global user.email "din@epost.no"
git config --global user.name "Ditt Navn"
```

### OpenAI API-nøkkel

Sett nøkkelen i PowerShell-sesjonen (aldri lagre den i koden eller repoet):

```powershell
$env:OPENAI_API_KEY = "sk-..."
```

Vil du at den skal huskes mellom sesjoner:

```powershell
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-...", "User")
```

---

## Steg for steg: ny kategori

### 1 — Lag manifest (JSON)

Opprett `app-v3/kort-manifest-<kategori>.json`. Bruk `kort-manifest-planeter.json` som mal:

```json
{
  "mappe": "romvesener",
  "kategoriStil": "digital trading card art style, detailed digital illustration, single centered subject, vibrant colors, kid-friendly",
  "variasjoner": [
    "full view centered, facing forward",
    "three-quarter view, dynamic pose",
    "close-up with rich detail filling the frame",
    "side profile view",
    "dramatic low-angle view"
  ],
  "kort": [
    { "fil": "001-navn.png", "navn": "Navn", "prompt": "beskrivelse av motivet" },
    { "fil": "002-navn2.png", "navn": "Navn 2", "prompt": "..." }
  ]
}
```

**Viktige regler for promptene:**
- Beskriv **kun motivet** — ikke bakgrunn eller setting (f.eks. ikke «floating in space»)
- Bakgrunnen legges til automatisk og koder sjeldenhet (se under)
- `"variasjoner"` fordeles jevnt på kortene og gir mangfold i komposisjon
- Per-kort `"stil"` overstyrer `"kategoriStil"` for enkeltbilder
- Rekkefølge styrer sjeldenhet: 1–20 vanlig, 21–30 sjelden, 31–35 episk, 36–38 legendarisk

**Automatisk raritetsbakgrunn:**
| Posisjon | Sjeldenhet | Bakgrunn |
|---|---|---|
| 1–20 | Vanlig | Hvit/lysegrå gradient |
| 21–30 | Sjelden | Lyseblå → blå gradient |
| 31–35 | Episk | Lilla → mørklilla gradient |
| 36–38 | Legendarisk | Gyllen glow → gul gradient |

### 2 — Test med 2–3 kort

Alltid test før du kjører alle 38:

```powershell
cd C:\Users\<ditt-navn>\GloseMester-V0.1-Alpha\app-v3
node scripts/generate-card-images.mjs kort-manifest-<kategori>.json --kun 001,002,003
```

Sjekk bildene i `images/<kategori>/` og juster promptene ved behov.

### 3 — Generer alle 38 kort

```powershell
node scripts/generate-card-images.mjs kort-manifest-<kategori>.json
```

Skriptet er **idempotent** — filer som allerede finnes hoppes over. Vil du regenerere ett kort:

```powershell
# Slett filen, kjør så:
node scripts/generate-card-images.mjs kort-manifest-<kategori>.json --kun 007

# Full kvalitet for legendariske kort (koster mer):
node scripts/generate-card-images.mjs kort-manifest-<kategori>.json --kun 036,037,038 --model gpt-image-1.5
```

### 4 — Optimaliser til WebP 320px

```powershell
node scripts/optimize-card-images.mjs <kategori>
```

Reduserer ~71 MB PNG → ~0.5 MB WebP. Bildene lander i `images/<kategori>/` som `.webp`.

### 5 — Commit og push

```powershell
cd C:\Users\<ditt-navn>\GloseMester-V0.1-Alpha

git checkout -b <kategori>-bilder
git add images/<kategori>
git commit -m "<Kategori>-kortbilder: 38 WebP generert med gpt-image-1-mini"
git push -u origin <kategori>-bilder
```

### 6 — Aktiver pakken i kortData.ts

Åpne `app-v3/src/features/kort/kortData.ts`.

Pakken er allerede lagt inn med `aktiv: false` som en del av kodebasen. Sett den til `true`:

```typescript
{ prefix: 'rom', mappe: 'romvesener', navn: 'Romvesener', aktiv: true, rader: romvesener },
```

Commit til samme branch:

```powershell
git add app-v3/src/features/kort/kortData.ts
git commit -m "Aktiver <kategori>-pakken"
git push
```

### 7 — Opprett PR og merge

Gå til GitHub → opprett PR fra branchen → vent på grønn CI → merge.
Netlify publiserer automatisk når `main` oppdateres.

---

## Kategoristatus

| Kategori | Manifest | Bilder | Aktivert |
|---|---|---|---|
| Romvesener | `kort-manifest-romvesener.json` | ✅ 38 WebP | ✅ (PR #94) |
| Planeter | `kort-manifest-planeter.json` | genereres | staget (`aktiv: false`) |
| Mytiske skapninger | `kort-manifest-skapninger.json` | — | staget (`aktiv: false`) |

---

## Kostnader (juni 2026)

**Viktig:** prisen avhenger av `quality`-parameteren — uten den velger API-et
«auto» (i praksis high), som er ~7× dyrere enn nødvendig. Skriptet sender
derfor `medium` som standard (overstyr med `--quality low|medium|high`).

| Modell + kvalitet | Pris/bilde (1024×1024) | 38-korts kategori |
|---|---|---|
| gpt-image-1-mini, low | ~$0.005 | ~$0.19 |
| **gpt-image-1-mini, medium (standard)** | ~$0.011–0.02 | ~$0.40–0.75 |
| gpt-image-1-mini, high | ~$0.036 | ~$1.40 |
| gpt-image-1.5, high | ~$0.17+ | ~$6.50+ |

Husk at regenereringer (stil-iterasjoner, avkuttede hoder osv.) fort dobler
eller tredobler antall bilder — budsjettér deretter.
