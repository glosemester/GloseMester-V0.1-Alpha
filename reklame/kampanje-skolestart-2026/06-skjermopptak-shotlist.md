# Skjermopptak & skjermbilder — shotlist

Dette er listen over **ekte app-media** kampanjen bygger på. Hver kode (`[SKJERM-xx]`)
refereres fra innleggene. Ta opp i appen (gjerne en testklasse uten ekte
elevnavn). Lagre filene med kode-navn så de er enkle å gjenfinne.

> **Personvern:** Bruk anonyme/testnavn. Ikke vis ekte elev- eller skolenavn,
> e-post eller Feide-detaljer i opptak som publiseres.

| Kode | Hva | Hvor i appen | Format(er) |
|---|---|---|---|
| `SKJERM-01a` | Lag prøve: skrive inn ordpar (norsk↔engelsk) | Lærer › «Lag prøve» (`TeacherCreateTest`) | 16:9 + 9:16 |
| `SKJERM-01b` | Generert 6-tegns kode + QR-kode | Lærer › prøvedetaljer (`TeacherTestDetails`) | 16:9 + 9:16 + 1:1 |
| `SKJERM-02` | Elev svarer riktig → samlekort dukker opp | Elev › prøve/øving (`Quiz`/`Practice`) | 9:16 (viktigst) |
| `SKJERM-03` | Elev skanner/skriver kode for å starte | Elev › `/prove` | 9:16 |
| `SKJERM-04` | Kortgalleri med rariteter (Common→Legendary) | Elev › Galleri (`Galleri`) | 4:5 + 9:16 |
| `SKJERM-05` | Nivå-opp-feiring (overlay) | Elev › etter riktige svar | 9:16 |
| `SKJERM-06` | Øvemodus med flervalg + lyd-ikon | Elev › øving (`GlosemesterPractice`) | 9:16 |
| `SKJERM-07` | Resultatliste per elev + klassesnitt | Lærer › prøvedetaljer/resultater (`ResultatListe`) | 16:9 + 4:5 |
| `SKJERM-08` | Ordanalyse: vanskeligste ord + vanligste feilsvar | Lærer › ordanalyse (`OrdAnalyse`) | 16:9 + 4:5 |
| `SKJERM-09` | Klassestatus: hvem har gjennomført (fremgangslinje) | Lærer › prøvedetaljer | 16:9 |
| `SKJERM-10` | «Mine prøver» hos Feide-elev | Elev › `MineProver` | 9:16 |

## Status (oppdatert 2026-06-15)

Fanget så langt (ligger i [`media/`](./media/)):

- ✅ `SKJERM-01a` — video `video-laerer_feide-lag-prove.webm` (Feide-innlogging + lag prøve)
- ✅ `SKJERM-02` + `SKJERM-06` — video `video-elev_oving-vinne-kort.webm` (øving + vinne kort)
- ✅ `SKJERM-04` — skjermbilde kortgalleri («20 av 228 samlet»)
- ✅ `SKJERM-07` — skjermbilde resultater («Snitt 76 %»)
- ✅ `SKJERM-08` — skjermbilde ordanalyse («bare → just»)
- ✅ Nivåoversikt (støtter `SKJERM-05`) + bonus hero/«Hva er gratis?»-grafikk

Mangler fortsatt: `SKJERM-01b` (kode + QR), `SKJERM-03` (elev skriver kode),
`SKJERM-09` (klassestatus), `SKJERM-10` (mine prøver), og selve
nivå-opp-feiringen i `SKJERM-05`.

> Skjermbildene over kom limt inn i chat (ikke som filer). For å bruke dem i
> grafikk/repo må de lastes opp som **filer** til `media/` eller Drive-mappa.

## Bruksoversikt (hvilket innlegg trenger hva)

- **Instagram:** 01a/01b/02/04/05/06/07/08
- **Facebook:** 01b/02/04/07/08
- **TikTok/Reels:** 01a/01b/02/04/05/07/08 (alle 9:16)
- **Google Ads (Pmax):** 01b/04/07 (stillbilder, beskår til 1200×628 / 1:1 / 4:5)
- **E-post:** 01a/01b/02/07/08

## Opptaks-/eksportkrav

- **9:16** (TikTok/Reels/Stories): 1080×1920, mp4, 24–30 fps.
- **4:5** (IG-feed): 1080×1350, png/jpg.
- **1:1**: 1080×1080. **16:9**: 1920×1080 (skjermbilder fra PC).
- **Google**: lever 1200×628, 1200×1200, 1200×1500 (beskåret fra 16:9/4:5).
- Hold klipp korte (2–6 sek pr. handling) og vis ferdig resultat tydelig.

## Når opptakene er klare

Si fra, så kan jeg (i en oppfølging) generere ferdige karuseller/grafikk i
Canva/Gamma og evt. videoklipp i Higgsfield basert på disse opptakene, og lage
e-postutkast i Gmail.
