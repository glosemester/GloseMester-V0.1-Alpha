# GloseMester 2.0 - Redesign Specification

Basert på referansebildet ("Playwize"), skal GloseMester redesignes for å fremstå mer lekent, moderne og engasjerende.

## 1. Visuell Identitet
Vi går bort fra det "strene" dashboard-utseendet til et mer organisk og flytende design.

### Fargepalett
Originalen har allerede gode farger (Sunset Orange, Soft Lavender), men vi skal justere dem for å matche "Playwize"-estetikken som er mer mettet og "electric".
*   **Primary Purple:** `#7C3AED` (Dyp, energisk lilla)
*   **Vibrant Orange:** `#FB923C` (Leken oransje for handlinger)
*   **Sunny Yellow:** `#FBBF24` (For highlights og "fun" elementer)
*   **Background:** `#F5F3FF` (Veldig lys lilla/hvit tone for mykhet)

### Typografi
*   **Headings:** `Outfit` eller `Poppins` (Bold/ExtraBold). Runde, vennlige bokstaver.
*   **Body:** `Inter` eller `DM Sans` for lesbarhet.

### Formspråk
*   **Blobs & Waves:** Bakgrunner er ikke rette linjer, men buede former og "blobs".
*   **High-Radius:** Alt av kort og knapper har store radier (20px - 50px).
*   **Cut-out Imagery:** Bruk av frilagte bilder av mennesker (lærere/elever) kombinert med abstrakte doodle-elementer.

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
