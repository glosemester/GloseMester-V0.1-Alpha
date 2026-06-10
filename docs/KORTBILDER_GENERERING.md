# Generering av kortbilder — komplett guide

Erstatter den manuelle Midjourney-flyten (`docs/arkiv/MIDJOURNEY_MATTEMESTER_KORT.md`).
Motor: **OpenAI gpt-image-1-mini** (~$0.005/bilde → en hel 38-korts kategori for ca. $0.19).

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
| Romvesener | `kort-manifest-romvesener.json` | ✅ 38 WebP | ✅ |
| Planeter | `kort-manifest-planeter.json` | — | — |
| Skandinaviske mytiske skapninger | — | — | — |

---

## Kostnader (juni 2026)

| Modell | Pris/bilde | 38-korts kategori |
|---|---|---|
| gpt-image-1-mini (standard) | ~$0.005 | ~$0.19 |
| gpt-image-1.5 (full kvalitet) | ~$0.08 | ~$3.00 |
