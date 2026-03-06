# Testplan – GloseMester V0.1-Alpha

**Dato:** 2026-03-06
**Branch:** `claude/simplify-glosemester-only-5wb7N`
**Ansvarlig:** Manuell QA + utvikler

---

## 1. Innlasting og navigasjon

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 1.1 | Åpne `index.html` i nettleser | `glosemester-start` vises, header viser «GloseMester» | ⬜ |
| 1.2 | Ingen `fag-velger` div er aktiv | Kun én `.page.active` i DOM ved oppstart | ⬜ |
| 1.3 | Klikk «Tilbake» i nettleseren fra en underside | Returnerer til `glosemester-start` | ⬜ |
| 1.4 | Lyd-toggle-knapp øverst til høyre er synlig | 🔇-knapp vises på alle sider | ⬜ |

---

## 2. Landingssiden – rollevalg

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 2.1 | Klikk **Øv Selv** | Navigerer til `oving-start` med nivåvalg | ⬜ |
| 2.2 | Klikk **GlosePrøve** | Navigerer til `elev-dashboard` med prøvekode-felt | ⬜ |
| 2.3 | Klikk **Lærer** | Viser lærer-login-popup | ⬜ |

---

## 3. Elev – GlosePrøve (kode-flyt)

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 3.1 | Skriv inn ugyldig prøvekode og klikk «Start Prøve» | Feilmelding vises, prøven starter ikke | ⬜ |
| 3.2 | Skriv inn gyldig prøvekode | Prøven lastes og første spørsmål vises | ⬜ |
| 3.3 | Svar riktig | Neste spørsmål vises, poengsum øker | ⬜ |
| 3.4 | Svar feil | `feil-svar-popup` vises med riktig svar | ⬜ |
| 3.5 | Fullfør prøve | Resultatside vises med samlet poengsum | ⬜ |
| 3.6 | Klikk 🔊 «Les opp» | Talesyntese leser opp spørsmålet | ⬜ |
| 3.7 | Klikk «Skann QR» | Kamera-popup åpnes | ⬜ |

---

## 4. Elev – Øv Selv (øving-flyt)

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 4.1 | Klikk «Øv Selv» → velg Nivå 1 | Øvingsspørsmål vises | ⬜ |
| 4.2 | Svar riktig 3 ganger på rad | Streak-teller øker, «🔥»-indikator oppdateres | ⬜ |
| 4.3 | Svar feil | Feil-feedback vises, poeng øker ikke | ⬜ |
| 4.4 | Vinn et kort | `gevinst-popup` vises med kortinformasjon | ⬜ |
| 4.5 | Klikk «Samling» i øvingsmenyen | `oving-samling` vises med opptjente kort | ⬜ |
| 4.6 | Klikk «Pant dublett» | Kort byttes mot diamant hvis dublett finnes | ⬜ |
| 4.7 | Klikk 🏆 «Galleri» | `galleri-visning` vises med alle tilgjengelige kort | ⬜ |
| 4.8 | Klikk «Avslutt» | Returnerer til `glosemester-start` | ⬜ |

---

## 5. Lærer – innlogging og dashboard

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 5.1 | Klikk **Lærer** på landingssiden | `laerer-login-popup` vises | ⬜ |
| 5.2 | Logg inn med gyldig e-post/passord | Popup lukkes, `laerer-dashboard` vises | ⬜ |
| 5.3 | Logg inn med ugyldig passord | Feilmelding vises i popup | ⬜ |
| 5.4 | Dashboard: antall prøver og gjennomføringer vises | Mini-stats-rad har tall (ikke «–») | ⬜ |
| 5.5 | Klikk «Logg ut» | Returnerer til `glosemester-start` | ⬜ |

---

## 6. Lærer – lag og administrer prøver

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 6.1 | Klikk «Lag Prøve» | `lag-prove`-siden vises | ⬜ |
| 6.2 | Fyll inn tittel + legg til 3 ord-par → «Lagre» | Prøve lagres, QR-kode genereres | ⬜ |
| 6.3 | Lagre uten tittel | Feilmelding: tittel kreves | ⬜ |
| 6.4 | Lagre uten ord | Feilmelding: minst ett ord-par kreves | ⬜ |
| 6.5 | Klikk «Mine Prøver» | `lagrede-prover` viser lagrede prøver | ⬜ |
| 6.6 | Søk i prøveliste | Filtrerer riktig på tittel | ⬜ |
| 6.7 | Klikk på prøve → vis QR-kode | QR genereres og er synlig | ⬜ |

---

## 7. Lærer – statistikk

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 7.1 | Klikk «Statistikk» | `laerer-statistikk` lastes med elevdata | ⬜ |
| 7.2 | Klikk «Eksporter (CSV)» | CSV-fil lastes ned | ⬜ |

---

## 8. Standardprøver

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 8.1 | Klikk «Standardprøver» | `standardprover`-siden lastes | ⬜ |
| 8.2 | Filtrer på «Barneskole» | Kun barneskoleprøver vises | ⬜ |
| 8.3 | Gratis-bruker forsøker å åpne premiumprøve | Upgrade-modal vises | ⬜ |

---

## 9. Hamburgermeny (lærer-meny)

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 9.1 | Klikk hamburger-ikon | Navmeny åpnes fra siden | ⬜ |
| 9.2 | Klikk utenfor menyen (overlay) | Menyen lukkes | ⬜ |
| 9.3 | Klikk menyvalg | Riktig side vises, menyen lukkes | ⬜ |

---

## 10. PWA og teknisk

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 10.1 | Åpne i Chrome → «Legg til på startskjerm» | PWA installeres uten feil | ⬜ |
| 10.2 | Sjekk console for JS-feil ved oppstart | Ingen feil eller ubehandlede promises | ⬜ |
| 10.3 | Skru av nett → refresh | App lastes fra service worker cache | ⬜ |
| 10.4 | Åpne på mobilbredde (375px) | Layout tilpasses, ingen overflow | ⬜ |
| 10.5 | Trykk «Tilbake» fra enhver underside | `glosemester-start` vises korrekt | ⬜ |

---

## 11. GDPR og personvern

| # | Test | Forventet resultat | Status |
|---|------|--------------------|--------|
| 11.1 | Lærer-registrering: personvern-popup vises | `personvern-popup` vises før dashboardet | ⬜ |
| 11.2 | Klikk «Jeg godtar» | Samtykke lagres, dashboard vises | ⬜ |
| 11.3 | Klikk «Avvis» | Returnerer til `glosemester-start` | ⬜ |

---

## Feilstatuser

| Symbol | Betydning |
|--------|-----------|
| ⬜ | Ikke testet |
| ✅ | Bestått |
| ❌ | Feil funnet |
| ⚠️ | Delvis OK / merknad |

---

*Testplanen dekker V0.1-Alpha scope: kun GloseMester-modulen. MatteMester og NorskMester er ikke inkludert.*
