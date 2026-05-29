# GloseMester — Brand Guidelines
> Versjon 1.0 | Referansedokument for design og kommunikasjon

---

## ⚡ Hurtigreferanse

| Element | Verdi |
|---|---|
| Primærfarge | `#FF6B47` (Korall) |
| Sekundærfarge | `#4BAED4` (Himmelblå) |
| Aksent | `#FFB347` (Amber) |
| Bakgrunn lys | `#FAFAF8` |
| Bakgrunn mørk | `#1A1D2E` |
| Tekstfarge lys | `#1E1E2E` |
| Tekstfarge mørk | `#F0EEE9` |
| Primærfont | Nunito |
| Displayfont | Nunito |
| Bordradius | 12px (standard), 20px (kort), 999px (pille) |
| Tone | Varm, uformell, du/deg |

---

## 1. Merkevareidentitet

### Hvem er GloseMester?
GloseMester er en gamifisert læringsplattform for glosepraksis, primært brukt av **lærere og pedagoger** i norske skoler. Plattformen hjelper lærere med å opprette, dele og følge opp gloseprøver — og motiverer elever gjennom mestring og fremgang.

### Misjon
> *Gjøre ordlæring til noe elevene faktisk gleder seg til.*

### Verdier
- **Mestring** — Alle skal oppleve fremgang, uansett nivå
- **Trygghet** — Enkelt å bruke, lite friksjon, ingen frykt for å feile
- **Lek** — Læring skjer best når det er morsomt

### Personlighet
GloseMester er som den entusiastiske og varme læreren som alltid heier på deg. Aldri belærende, aldri kjedelig. Motiverer uten å mase, feirer fremgang uten å overdrive.

---

## 2. Fargepalett

### Primærfarger

```
Korall (Primær)       #FF6B47    rgb(255, 107, 71)
Himmelblå (Sekundær)  #4BAED4    rgb(75, 174, 212)
Amber (Aksent)        #FFB347    rgb(255, 179, 71)
```

### Nøytrale farger

```
Bakgrunn lys          #FAFAF8    rgb(250, 250, 248)
Overflate lys         #FFFFFF    rgb(255, 255, 255)
Border lys            #E8E5E0    rgb(232, 229, 224)
Tekst primær lys      #1E1E2E    rgb(30, 30, 46)
Tekst sekundær lys    #6B7280    rgb(107, 114, 128)
```

### Mørkt tema

```
Bakgrunn mørk         #1A1D2E    rgb(26, 29, 46)
Overflate mørk        #242840    rgb(36, 40, 64)
Border mørk           #363A52    rgb(54, 58, 82)
Tekst primær mørk     #F0EEE9    rgb(240, 238, 233)
Tekst sekundær mørk   #A0A8C0    rgb(160, 168, 192)
```

### Semantiske farger

```
Suksess               #4CAF82    rgb(76, 175, 130)
Feil                  #F45C5C    rgb(244, 92, 92)
Advarsel              #FFB347    rgb(255, 179, 71)  (= Amber)
Info                  #4BAED4    rgb(75, 174, 212)  (= Himmelblå)
```

### Bruksregler
- **Korall** brukes på primærknapper, aktive tilstander, call-to-action
- **Himmelblå** brukes på lenker, sekundærknapper, informasjonselementer
- **Amber** brukes sparsomt — kun til fremhevinger, badges, poeng
- Unngå å kombinere korall og amber direkte uten nøytral buffersone
- Mørkt tema bruker de samme aksentfargene, kun bakgrunn/overflate endres

---

## 3. CSS-variabler

```css
:root {
  /* Primærfarger */
  --color-primary:        #FF6B47;
  --color-primary-hover:  #E85A38;
  --color-primary-light:  #FFE8E3;
  --color-secondary:      #4BAED4;
  --color-secondary-hover:#3A9BBF;
  --color-secondary-light:#E3F4FB;
  --color-accent:         #FFB347;
  --color-accent-light:   #FFF3E0;

  /* Semantiske */
  --color-success:        #4CAF82;
  --color-error:          #F45C5C;
  --color-warning:        #FFB347;
  --color-info:           #4BAED4;

  /* Lyst tema (default) */
  --color-bg:             #FAFAF8;
  --color-surface:        #FFFFFF;
  --color-border:         #E8E5E0;
  --color-text:           #1E1E2E;
  --color-text-muted:     #6B7280;

  /* Typografi */
  --font-primary:         'Nunito', 'Arial Rounded MT Bold', sans-serif;
  --font-size-xs:         12px;
  --font-size-sm:         14px;
  --font-size-md:         16px;
  --font-size-lg:         20px;
  --font-size-xl:         24px;
  --font-size-2xl:        32px;
  --font-size-3xl:        40px;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Border radius */
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-xl:   28px;
  --radius-full: 999px;

  /* Skygger */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.08);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
  --shadow-card: 0 2px 8px rgba(30,30,46,0.08);
}

[data-theme="dark"] {
  --color-bg:          #1A1D2E;
  --color-surface:     #242840;
  --color-border:      #363A52;
  --color-text:        #F0EEE9;
  --color-text-muted:  #A0A8C0;
  --shadow-card:       0 2px 8px rgba(0,0,0,0.30);
}
```

---

## 4. Typografi

### Fonter
| Bruk | Font | Fallback |
|---|---|---|
| Alt (display + brødtekst) | **Nunito** | Arial Rounded MT Bold, sans-serif |
| Monospace (kode) | **JetBrains Mono** | Courier New, monospace |

**Hvorfor Nunito?** Runde bokstavformer kommuniserer vennlighet og tilgjengelighet — perfekt for en plattform som skal føles ufarlig og motiverende. Fonten er lesbar i alle størrelser og fungerer like godt på mobil som desktop.

### Google Fonts import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Typografisk hierarki

| Nivå | Størrelse | Vekt | Bruk |
|---|---|---|---|
| Display | 40px | 900 | Splash, hero, seiersskjermer |
| H1 | 32px | 800 | Sideoverskrifter |
| H2 | 24px | 700 | Seksjonsoverskrifter |
| H3 | 20px | 700 | Kortoverskrifter |
| Body large | 18px | 500 | Innledende tekst |
| Body | 16px | 400 | Standard brødtekst |
| Body small | 14px | 400 | Hjelpetekst, labels |
| Caption | 12px | 500 | Badges, timestamps |

### Linjehøyde
- Overskrifter: `line-height: 1.2`
- Brødtekst: `line-height: 1.6`
- UI-elementer (knapper, labels): `line-height: 1.0`

---

## 5. Komponenter

### Knapper

**Primær (Korall)**
```css
background: var(--color-primary);
color: #FFFFFF;
border-radius: var(--radius-full);
padding: 12px 24px;
font-weight: 700;
font-size: 16px;
```

**Sekundær (Blå kontur)**
```css
background: transparent;
color: var(--color-secondary);
border: 2px solid var(--color-secondary);
border-radius: var(--radius-full);
```

**Ghost (Nøytral)**
```css
background: transparent;
color: var(--color-text-muted);
border: 2px solid var(--color-border);
border-radius: var(--radius-full);
```

**Knappehierarki:** En side skal aldri ha mer enn én primærknapp synlig om gangen. Bruk sekundær og ghost for støttehandlinger.

### Kort (Cards)
```css
background: var(--color-surface);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-card);
border: 1px solid var(--color-border);
padding: var(--space-6);
```

### Badges / Tags
```css
border-radius: var(--radius-full);
padding: 4px 12px;
font-size: 12px;
font-weight: 700;
```
Bruk bakgrunnsfarger fra `--color-primary-light`, `--color-secondary-light`, `--color-accent-light`.

### Skjema-elementer
```css
/* Input */
border: 2px solid var(--color-border);
border-radius: var(--radius-md);
padding: 10px 16px;
font-size: 16px;
transition: border-color 0.15s;

/* Focus state */
border-color: var(--color-primary);
outline: none;
box-shadow: 0 0 0 3px rgba(255, 107, 71, 0.15);
```

- Feilmeldinger vises alltid under feltet i `--color-error`
- Suksessvalideringer vises med `--color-success` border + ikon

### Navigasjon
- **Desktop:** Toppbar med logo til venstre, navigasjonslenker midtstilt, brukerikon høyre
- **Mobil:** Hamburgermeny → slide-in drawer fra venstre, mørk overlay bak
- Aktiv side markeres med korall-understrek (2px) eller korall-bakgrunn på ikon

---

## 6. Ikoner & illustrasjoner

### Ikonstil
Bruk **Lucide Icons** (React) eller **Heroicons** — begge har konsistent rund stil som passer GloseMesters uttrykk.

- Standardstørrelse: 20px (inline), 24px (navigasjon), 32px (feature-ikoner)
- Ikonfarge følger teksten de tilhører, eller bruker aksentfarge ved fremheving

### Illustrasjoner
- Stil: Flat, fargerikt, karakterbasert — inspirert av Duolingo men mer "norsk og pedagogisk"
- Karakterer skal fremstå inkluderende og aldersnøytrale
- Bruk illustrasjoner til: tom-tilstander, seirsskjermer, onboarding
- Aldri bruk stock-foto — hold deg til illustrasjoner og ikoner

### Emojier i UI
Emojier kan brukes **kontekstbevisst** i:
- Motivasjonsmeldinger: "Bra jobbet! 🎉"
- Badges og prestasjoner
- Tomme tilstander

Aldri i: feilmeldinger, tekniske varsler, navigasjonslenker

---

## 7. Tone of voice

### Stemme
GloseMester snakker som **en engasjert og støttende kollega** — ikke som en robot eller en autoritær institusjon.

### Regler
- Tiltale alltid med **du/deg**
- Vær kortfattet — én setning er bedre enn tre
- Bruk aktiv setningsform: "Lagre" ikke "Lagres"
- Feire fremgang, men ikke overdriv: "Bra jobbet! Du har lært 10 nye gloser." ✓
- Unngå teknisk sjargon overfor lærere

### Eksempler

| Situasjon | ❌ Ikke slik | ✅ Slik |
|---|---|---|
| Tomt resultat | "Ingen data funnet" | "Du har ikke lagt til gloser ennå 📚" |
| Feil | "En feil oppstod. Kode: 403" | "Noe gikk galt — prøv igjen?" |
| Suksess | "Operasjonen ble fullført" | "Lagret! 🎉" |
| Onboarding | "Velkommen til systemet" | "Hei! La oss lage din første gloseprøve." |

### Hva GloseMester IKKE er
- Klinisk eller byråkratisk
- Overentusiastisk ("FANTASTISK!! 🔥🔥🔥")
- Nedlatende overfor lærere
- Usikker eller unnskyldende

---

## 8. Native app (iOS/Android)

### Tilpasninger
- **iOS:** Følg Human Interface Guidelines for gestures, safe areas og sheet-presentasjoner. Bruk native navigasjonsmønstre (tab bar nederst).
- **Android:** Material Design-kompatibel struktur, men hold GloseMesters egne farger og radier.
- **Felles:** Bottom tab navigation med 4 ikoner maks, ingen hamburger på native.

### Størrelser (touch targets)
- Minimum tap-areal: **44×44px** (iOS) / **48×48dp** (Android)
- Aldri plasser interaktive elementer nærmere hverandre enn **8px**

---

## 9. Anti-mønstre

Disse tingene skal **aldri** brukes i GloseMester:

**Visuelt:**
- ❌ Skarpe hjørner (border-radius: 0) på brukervendte elementer
- ❌ Mer enn 3 primærfarger i én visning
- ❌ Lav kontrast (tekst på lys bakgrunn: minimum 4.5:1 WCAG AA)
- ❌ Skjermfylte modaler på mobil for enkle bekreftelser — bruk bottom sheet
- ❌ Animations over 300ms for UI-respons

**Kommunikasjon:**
- ❌ Tekniske feilkoder eksponert til sluttbruker
- ❌ "Klikk her"-lenker — vær beskrivende
- ❌ ALL CAPS tekst (unntatt knapper maks 2 ord)
- ❌ Passive formuleringer ("Det vil bli sendt en e-post")

---

## 10. Inspirasjon & referanser

| Kilde | Hva vi låner |
|---|---|
| **Duolingo** | Gamification-energi, feiring av fremgang, leken tone |
| **Notion** | Ren layout, luftig spacing, tydelig hierarki |
| **Linear** | Konsistent komponentspråk, mørkt tema-kvalitet |
| **Kahoot** | Fargeglede, tilgjengelighet for lærere |

---

## 11. Logo

### Konsept
**GloseMester** i stylisert Nunito 900 (Extra Black). Logoen er ordmerket alene — ingen ikon-avhengighet.

### Varianter
| Variant | Bruk |
|---|---|
| Horisontal farge | Standard — lys bakgrunn |
| Horisontal hvit | Mørk bakgrunn, mørkt tema |
| Kompakt (kun "GM") | App-ikon, favicon, 32px og under |

### Fargesetting
- **"Glose"** → `#FF6B47` (Korall)
- **"Mester"** → `#1E1E2E` (lys tema) / `#F0EEE9` (mørkt tema)

### Frikone (clearspace)
Minimum luft rundt logoen = høyden på stor-G i ordmerket.

### Aldri gjør dette med logoen
- ❌ Strekk eller komprimer
- ❌ Roter
- ❌ Legg på kompliserte bakgrunner uten kontrast
- ❌ Bruk andre farger enn definert over

---

*Sist oppdatert: Mai 2026 — GloseMester v1 Brand Identity*
