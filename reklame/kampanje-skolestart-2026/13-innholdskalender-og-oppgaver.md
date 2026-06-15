# Innholdskalender & gjenstående oppgaver

Kobler kampanjeplanen (`00-kampanjeplan.md`) og kanalfilene til **konkrete
mediefiler** i `media/`, og samler det som gjenstår før publisering.

> Skolestart 2026: ~17. august (uke 34). Organisk lærer-trykk rampes opp fra august
> (lærere har ferie i juli). Google Ads kan stå på i juli mot foreldre/elever.

---

## 1. Mediefiler vi har laget (status: klare)

| Fil i `media/` | Brukes til | Kanal/innlegg |
|---|---|---|
| `cover_3-grunner.png` | Cover, karusell «3 grunner» | IG innlegg 2 (uke 26) |
| `cover_lag-prove.png` | Cover, karusell «Lag en prøve» | IG innlegg 3 (uke 31) |
| `bakgrunn_innhold_korall/_himmelbla/_amber.png` | Bakgrunn bak ekte skjermbilde på innholds-slides | Alle karuseller |
| `ig-story_bakgrunn_9x16.png` | Story-bakgrunn (tittel topp, CTA bunn) | IG/FB Stories, løpende |
| `video_outro_9x16.png` | Outro-kort til Reels/TikTok | Video (`10-video-klippeliste.md`) |
| `ads_landskap_1200x628.png` | Google Ads landskap | Pmax (`04-google-ads.md`) |
| `ads_kvadrat_1200x1200.png` | Google Ads kvadrat | Pmax |
| `ads_portrett_1200x1500.png` | Google Ads portrett | Pmax |
| `app-skjermbilder/SKJERM-04..08 + BONUS_*` | Ekte app-skjerm til innholds-slides | Alle kanaler |
| `video-laerer_feide-lag-prove.webm` | Lærerflyt (Feide + lag prøve) | Reels/TikTok, e-post |
| `video-elev_oving-vinne-kort.webm` | Elev øver + vinner kort | Reels/TikTok |

Kortdekor på cover/story/ads er **ekte kortkunst** fra `app-v3/public/images/`
(McLaren, panda, axolotl, brachiosaurus, Saturn, Heimdall, Eiffeltårnet, boble-
romvesen, skogstroll) — variert på tvers av pakkene.

---

## 2. Redaksjonell kalender (per uke)

### Fase 1 — Mykstart (juni–juli, lav frekvens)

| Uke | Kanal | Innlegg | Media |
|---|---|---|---|
| 25 | IG/FB | Intro-Reel «Glosepugging? → skattejakt» | `video-elev_oving-vinne-kort.webm` + `video_outro` |
| 25 | LinkedIn | Founder-innlegg 1 «Hvorfor jeg bygde GloseMester» | (tekst) |
| 26 | IG/FB | Karusell «3 grunner elevene vil øve» | `cover_3-grunner` + `SKJERM-04/06` på `bakgrunn_*` |
| 28 | TikTok | «Se eleven vinne et kort» | `video-elev_oving-vinne-kort.webm` |
| 30 | IG/FB | Teaser «Klar for skolestart? 👀» | `ig-story_bakgrunn` |
| 30 | LinkedIn | Founder-innlegg 2 «Hvorfor gamifisering virker her» | (tekst) |

### Fase 2 — Hovedtrykk skolestart (august)

| Uke | Kanal | Innlegg | Media |
|---|---|---|---|
| 31 | IG/FB | Karusell «Slik lager du en gloseprøve» | `cover_lag-prove` + `SKJERM-01a/01b/07` |
| 31 | TikTok | Lærerflyt på 15 sek | `video-laerer_feide-lag-prove.webm` + `video_outro` |
| 32 | TikTok/Reels | «QR-kode i klasserommet» | `SKJERM-01b` (mangler) |
| 32 | E-post | «Slik fungerer det» | `05-epost.md` |
| 33 | IG/FB | «Ordanalyse: se hva klassen sliter med» | `SKJERM-08_ordanalyse` på `bakgrunn_himmelbla` |
| 33 | LinkedIn | Founder-innlegg 3 «Til deg som planlegger engelsktimene» | (tekst) |
| 34 | TikTok + Stories | Lærer-POV + avstemning | `ig-story_bakgrunn` |
| 35 | Alle | «Kom i gang gratis» + e-post-påminnelse | `video_outro`, `ads_*` |
| 35 | LinkedIn | Founder-innlegg 4 «Takk + invitasjon» | (tekst) |

Løpende hele perioden: Google Ads Pmax (`ads_*`-bakgrunner), Stories-stickere,
deling i Facebook-lærergrupper.

---

## 3. Gjenstående oppgaver (kampanjeøyemed)

### ✅ Avklart
- [x] **Kortantall verifisert i kode.** `app-v3/src/features/kort/kortData.ts` sier
  eksplisitt «10 aktive pakker × 38 = 380 samlekort», og det finnes 380 bildefiler.
  «228» i skjermbildet = 6 × 38 = den testkontoens *opplåste* delmengde, ikke totalen.
  **«380 samlekort» (fordelt på 10 pakker) er trygt å hevde.** Bruk gjerne det eksakte
  tallet i `01`/`12`. Merk i tekst at gratis-/uten-innlogging-nivået viser færre pakker.

### 🟠 Manglende ekte app-media (jf. `06-skjermopptak-shotlist.md`)
- [ ] `SKJERM-01a` stillbilde (lag prøve — har video, mangler still til karusell)
- [ ] `SKJERM-01b` (6-tegns kode + QR) — trengs uke 31–32
- [ ] `SKJERM-03` (elev skriver/scanner kode)
- [ ] `SKJERM-05` (selve nivå-opp-feiringen som overlay — har XP-oversikt, mangler feiring)
- [ ] `SKJERM-09` (klassestatus / hvem har gjennomført)
- [ ] `SKJERM-10` («Mine prøver» hos Feide-elev)

### 🟡 Produksjon
- [ ] Bygg ferdige karuseller i Canva/Gamma: cover + `bakgrunn_*` + ekte skjermbilde.
- [ ] Klipp Reels/TikTok fra de to .webm-ene (se `10-video-klippeliste.md`), legg på `video_outro`.
- [ ] (Valgfritt) Re-kjør `ads_portrett` med den nye trioen (panda/Eiffel/boble) når
  Fals opplastingsgrense er nullstilt — dagens versjon (axolotl/brachio/panda) er gyldig.
- [ ] Sett opp Google Ads Pmax-assets med `ads_*`-bakgrunnene; hent eksakte søkevolum
  i Keyword Planner (`07-markedsanalyse.md` §2).

### 🟢 Oppsett / nytt
- [ ] Opprett LinkedIn-tilstedeværelse (founder-profil + ev. bedriftsside) — ny kanal, se `12-linkedin.md`.
- [ ] Opprett/klargjør IG, FB-side, TikTok; sett **baseline for følgere** (KPI §7).
- [ ] Ferdigstill e-postsekvens (`05-epost.md`) i Resend/Gmail.
- [ ] Bekreft Facebook-lærergrupper for deling (f.eks. «Digitale lærere»), les
  gruppereglene før posting.

---

## 4. Faste elementer (ikke glem)

- Fast avslutning: **«Følg oss for flere tips — prøv gratis på glosemester.no».**
- IG maks ~5 hashtags; TikTok 8–12; LinkedIn 3–5 (lenke i første kommentar).
- Aldri mockup uten ekte innhold; aldri ekte elev-/skolenavn i publisert media.
