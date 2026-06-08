# Spec: Øvemodus på storskjerm (≥10 tommer)

> **Status:** Ønske / ikke implementert ennå
> **Notert:** 2026-06-06 (lagret før PC-formatering så det overlever)
> **Plattform:** Storskjerm — nettbrett og desktop, **10 tommer og oppover**
> **Mobil:** Skal være **uendret** (samme som i dag)

---

## Mål

Skrive om **øvemodus** slik at den utnytter storskjerm bedre, med en
mer engasjerende «samle kort»-opplevelse. Layouten deles i to:
venstre = fremdrift, høyre = belønning (kortbunke).

## Ønsket oppførsel (storskjerm ≥10")

### Høyre side — kortbunke (belønning)
- En **bunke** med kortene eleven har vunnet.
- **Sist vunnet kort ligger øverst** i bunken.
- Når et nytt kort vinnes, **åpnes/avsløres det øverst i bunken** (animasjon).

### Venstre side — nedtellings-/teller-animasjonshjul (fremdrift)
- Et **animasjonshjul** med **10 ruter** (rute 1 → rute 10).
- For **hvert riktige svar** teller hjulet **+1** og beveger seg én rute.
- Når man kommer **rundt til rute 10**, **vinner man et kort**.
- Etter gevinst nullstilles hjulet og runden starter på nytt mot neste kort.

### Sekvens ved gevinst
1. Riktig svar nr. 10 lander på rute 10.
2. Hjulet markerer «full runde» (gevinst-animasjon).
3. Nytt kort **åpnes øverst i kortbunken til høyre**.
4. Hjulet nullstilles til rute 1 for neste runde.

## Mobil
- **Ingen endring** — behold dagens øvemodus-layout og -flyt på mobil.
- Den nye to-spalte-layouten (hjul venstre / bunke høyre) gjelder **kun**
  for skjermer ≥ ~10 tommer.

---

## Tekniske notater / startpunkter
- Aktiv øvemodus (v3 / React):
  - `app-v3/src/pages/GlosemesterPractice.tsx`
  - `app-v3/src/features/glosemester/practiceEngine.ts`
    (+ `practiceEngine.test.ts`)
- Vurder et **breakpoint** rundt 768–1024px (≥10") for å bytte til
  to-spalte-layout; under det = dagens mobil-layout.
- «Vinn kort hver 10. riktige» bør samkjøres med eksisterende
  kort-/gevinstlogikk (sjekk hvordan kort tildeles i dag før ny terskel settes).
- Animasjonshjulet: 10 segmenter, fyll-/rotasjons-animasjon per riktige svar,
  «full runde»-tilstand ved rute 10.

## Åpne spørsmål (avklares før implementering)
- Eksakt breakpoint for «storskjerm» (10" → hvilken px-grense?).
- Skal hjulet være en sirkel (rotasjon) eller en 10-stegs bane?
- Hva skjer ved feil svar — står hjulet stille, eller går det tilbake?
- Skal kortbunken vise hele samlingen eller bare øktens vunne kort?
