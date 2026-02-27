# GloseMester 2.0 - Redesign Specification

Basert på referansebildet ("Playwize"), skal GloseMester redesignes for å fremstå mer lekent, moderne og engasjerende.

## 1. Visuell Identitet
Vi går bort fra det "strene" dashboard-utseendet til et mer organisk og flytende design.

### Fargepalett (Branding)
*   **LæreMester (Main):** Gradient Blue/Purple (`#667eea` -> `#764ba2`)
*   **MatteMester:** Gradient Purple/Pink (`#af52de` -> `#ff2d55`)
*   **NorskMester:** Gradient Red/Orange (`#e74c3c` -> `#f39c12`)
*   **GloseMester:** Gradient Blue/Cyan (`#0071e3` -> `#00c6fb`)

### Logo & Branding (CSS)
Vi bruker nå CSS-klassen `.logo-branding` i stedet for bilder.
*   **Struktur:**
    ```html
    <div class="logo-branding brand-navn">
        <div class="logo-icon">IKON<div class="logo-star">⭐</div></div>
        <h1 class="logo-text">Navn</h1>
    </div>
    ```
*   **Fonter:** `Outfit` (Headings) og system-fonts som fallback.


## 2. Layout & Komponenter

### Header / Hero Seksjon
*   **Sentrent overskrift:** "Lær språk på en morsom måte" (eller lignende).
*   **Visuelt:** En stor hovedillustrasjon som kombinerer 3D-elementer eller utklipte personer med grafiske elementer (stjerner, spiraler).
*   **Call to Action (CTA):** Tydelige pille-formede knapper med ikoner.

### Kort (Cards)
*   I stedet for kun hvite kort på grå bakgrunn:
    *   **Fargede kort:** Noen kort har fullfarget bakgrunn (lilla, oransje, gul) med hvit tekst for variasjon.
    *   **Dybde:** Subtile skygger, men mer "flat" grafikk oppå.
    *   **Ikoner (Oppdatert etter feedback):**
        *   **Øv Selv:** Bruk et "Hjerne"-ikon eller "Flashcards" (i stedet for muskel).
        *   **Lærer:** Bruk en "Graduation Cap" (studentlue) eller "Presentation Screen" (i stedet for eple).
        *   **GlosePrøve:** Behold "Checklist" eller "Trophy".

### Ikoner & Dekor
*   Bruk av "doodles" (håndtegnede piler, kruseduller) for å bryte opp stivheten.
*   Store, enkle ikoner for funksjonalitet.

## 3. Implementeringsplan
1.  **Mockup:** Generere en visuell mockup for å bekrefte retningen.
2.  **CSS Framework:** Oppdatere variabel-systemet i `main.css`.
3.  **HTML Struktur:** Endre `index.html` til å støtte mer "free-flow" layout (mindre grid-låst).

Dette dokumentet fungerer som "blueprint" for redesignet.
