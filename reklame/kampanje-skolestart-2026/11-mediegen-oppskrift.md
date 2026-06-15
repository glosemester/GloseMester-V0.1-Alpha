# media-gen — ferdige prompter for kampanjegrafikk

Kjør disse lokalt (der `media-gen`-skillen og `FAL_KEY` finnes). Lim inn én blokk
av gangen i Claude Code. All grafikk lagres i `reklame/kampanje-skolestart-2026/media/`.

> **Regel (jf. `00-kampanjeplan.md` §8):** media-gen lager **kun** cover, bakgrunner
> og dekor — aldri falske app-skjermbilder/mockups. Ekte app-skjerm limes inn manuelt
> på innholds-slidene. Kun sanne påstander; ikke dikt opp tall eller funksjoner.

## Merkevare (gjelder alle prompter)

- **Farger:** korall `#FF6B47` (primær), himmelblå `#4BAED4`, amber `#FFB347`. Lys, varm bakgrunn.
- **Stil:** vennlig, leken, moderne; for norske barneskolelærere. Avrundede former, mykt lys, god luft.
- **Titler:** kraftig vennlig sans-serif (Nunito-aktig, 800/900). All tekst på **norsk bokmål**, ingen stavefeil.

---

## 1. Cover — karusell «3 grunner» (4:5, 1080×1350)

```
Bruk media-gen: lag cover_3-grunner.png (4:5, 1080×1350) for GloseMester.
Korall-bakgrunn #FF6B47 med amber-aksent #FFB347, lekent samlekort-/skattejakt-tema.
Stor Nunito-tittel: «3 grunner til at elevene faktisk vil øve på gloser 👇».
Undertittel: «GloseMester — fra glose til mester». Lagre i kampanjens media/-mappe.
```

## 2. Cover — karusell «Lag en prøve» (4:5)

```
Bruk media-gen: lag cover_lag-prove.png (4:5, 1080×1350). Lærer-vennlig, rolig,
ryddig, palett korall/himmelblå/amber. Nunito-tittel: «Slik lager du en
gloseprøve — uten styr ✍️». Lagre i media/.
```

## 3. Innholds-slide-bakgrunner (4:5) — med plass til ekte skjermbilde

```
Bruk media-gen: lag 3 nøytrale merkevarebakgrunner (4:5, 1080×1350) med en STOR
ren, tom flate i midten der jeg senere limer inn et ekte app-skjermbilde.
Variant A korall-kant, B himmelblå-kant, C amber-kant. Mykt lys, avrundet ramme.
Filnavn: bakgrunn_innhold_korall.png / _himmelbla.png / _amber.png. Lagre i media/.
```

## 4. Instagram/Facebook Story-bakgrunn (9:16, 1080×1920)

```
Bruk media-gen: lag ig-story_bakgrunn_9x16.png (1080×1920). Varm merkevarebakgrunn
(korall/amber), god plass øverst til titteltekst og nederst til en CTA-knapp.
Lagre i media/.
```

## 5. Google Ads — hero-bakgrunner (Performance Max)

Tre størrelser (jf. `04-google-ads.md`). Hold midten ren for tekst/CTA i annonseverktøyet.

```
Bruk media-gen: lag tre Google Ads-bakgrunner for GloseMester i merkevarepaletten
(korall #FF6B47 / amber #FFB347 / himmelblå #4BAED4), lekent men ryddig, plass til
overlay-tekst:
- ads_landskap_1200x628.png (1200×628)
- ads_kvadrat_1200x1200.png (1200×1200)
- ads_portrett_1200x1500.png (1200×1500)
Ingen tekst brent inn i bildet (tekst legges på i annonseverktøyet). Lagre i media/.
```

## 6. (Valgfritt) Logo-outro til video (9:16)

```
Bruk media-gen: lag video_outro_9x16.png (1080×1920) — korall bakgrunn, sentrert
plass til GloseMester-logo og teksten «Prøv gratis på glosemester.no». Lagre i media/.
```

---

## Etter generering

1. Se over hver fil — be om ny variant hvis fargen/stemningen ikke treffer.
2. Bygg karusellene: legg cover + innholdsbakgrunn i Canva/Gamma, dropp inn de
   **ekte** app-skjermbildene (`SKJERM-04/05/06/07/08`) på innholds-slidene.
3. Commit ferdige filer til `media/` og push.
