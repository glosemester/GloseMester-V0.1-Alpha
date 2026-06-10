/**
 * Kortdata — portet 1:1 fra v2 (src/core/kort/kort-data.js).
 * 4 kategorier × 38 kort = 152 samlekort. ID og sjeldenhet utledes fra
 * posisjon (samme formel som v2 getRarity), så listene holdes kompakte.
 */

import type { CSSProperties } from 'react';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Category = 'biler' | 'dinosaurer' | 'dyr' | 'guder' | 'romvesener' | 'planeter' | 'skapninger';

export interface KortDef {
  id: string;
  name: string;
  image: string;
  category: Category;
  rarity: Rarity;
  fag: 'gloser';
}

export interface RarityConfig {
  tekst: string;
  farge: string;
  /** Radius (px) for animert glød — sterkere jo sjeldnere kortet er. */
  glodRadius: number;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: { tekst: 'Vanlig', farge: '#a1a1a1', glodRadius: 5 },
  rare: { tekst: 'Sjelden', farge: '#0071e3', glodRadius: 8 },
  epic: { tekst: 'Episk', farge: '#8e44ad', glodRadius: 12 },
  legendary: { tekst: 'Legendarisk', farge: '#f1c40f', glodRadius: 16 },
};

/** Inline CSS-variabler for `.kort-glod` (base.css) — animert glød i sjeldenhetsfargen. */
export function glodStil(rarity: Rarity): CSSProperties {
  const cfg = RARITY_CONFIG[rarity];
  return {
    '--glod-farge': cfg.farge,
    '--glod-radius': `${cfg.glodRadius}px`,
  } as CSSProperties;
}

/** Sjeldenhet ut fra kortnummer 1–38 (jf. v2 getRarity). */
function getRarity(num: number): Rarity {
  if (num >= 36) return 'legendary'; // 36–38 (3)
  if (num >= 31) return 'epic'; // 31–35 (5)
  if (num >= 21) return 'rare'; // 21–30 (10)
  return 'common'; // 1–20 (20)
}

type Rad = [fil: string, navn: string];

function bygg(prefix: string, mappe: Category, rader: Rad[]): KortDef[] {
  return rader.map(([f, n], i) => ({
    id: `${prefix}_${String(i + 1).padStart(3, '0')}`,
    name: n,
    // Bildene er optimalisert til WebP (320px) — radene beholder .png-navn.
    image: `images/${mappe}/${f.replace(/\.png$/, '.webp')}`,
    category: mappe,
    rarity: getRarity(i + 1),
    fag: 'gloser' as const,
  }));
}

const biler: Rad[] = [
  ['001-vw-golf.png', 'VW Golf'], ['002-toyota-corolla.png', 'Toyota Corolla'],
  ['003-ford-focus.png', 'Ford Focus'], ['004-honda-civic.png', 'Honda Civic'],
  ['005-nissan-leaf.png', 'Nissan Leaf'], ['006-mazda-3.png', 'Mazda 3'],
  ['007-volvo-v70.png', 'Volvo V70'], ['008-audi-a4sedan.png', 'Audi A4'],
  ['009-bmw-3serie.png', 'BMW 3-serie'], ['010-mercedes-benz-c-class.png', 'Mercedes C-Class'],
  ['011-skoda-octavia.png', 'Skoda Octavia'], ['012-peugeot-308-hatchback.png', 'Peugeot 308'],
  ['013-renault-megane-hatchback.png', 'Renault Megane'], ['014-opel-astra.png', 'Opel Astra'],
  ['015-kia-ceed.png', 'Kia Ceed'], ['016-hyundai-i30.png', 'Hyundai i30'],
  ['017-tesla-model3.png', 'Tesla Model 3'], ['018-subaru-outback.png', 'Subaru Outback'],
  ['019-citroen-c4.png', 'Citroën C4'], ['020-seat-leon.png', 'Seat Leon'],
  ['021-porsche-911.png', 'Porsche 911'], ['022-ferrari-488gtb.png', 'Ferrari 488 GTB'],
  ['023-laborghini-huracan.png', 'Lamborghini Huracán'], ['024-aston-martin-db11.png', 'Aston Martin DB11'],
  ['025-mclaren-720s.png', 'McLaren 720S'], ['026-chevrolet-corvette-stingray.png', 'Corvette Stingray'],
  ['027-nissan-gtr.png', 'Nissan GT-R'], ['028-audi-r8v10.png', 'Audi R8 V10'],
  ['029-bmw-m4.png', 'BMW M4'], ['030-mercedes-amg-gt.png', 'Mercedes AMG GT'],
  ['031-bugatti-chiron.png', 'Bugatti Chiron'], ['032-koenigsegg-jesko.png', 'Koenigsegg Jesko'],
  ['033-pagani-huayra.png', 'Pagani Huayra'], ['034-rimac-nevera.png', 'Rimac Nevera'],
  ['035-lotus-evija.png', 'Lotus Evija'], ['036-ferrari-laferrari.png', 'LaFerrari'],
  ['037-mclaren-p1.png', 'McLaren P1'], ['038-porsche-918spyder.png', 'Porsche 918 Spyder'],
];

const dinosaurer: Rad[] = [
  ['001-compsognathus.png', 'Compsognathus'], ['002-protoceratops.png', 'Protoceratops'],
  ['003-pachycephalosaurus.png', 'Pachycephalosaurus'], ['004-gallimimus.png', 'Gallimimus'],
  ['005-oviraptor.png', 'Oviraptor'], ['006-deinonychus.png', 'Deinonychus'],
  ['007-parasaurolophus.png', 'Parasaurolophus'], ['008-iguanodon.png', 'Iguanodon'],
  ['009-kentrosaurus.png', 'Kentrosaurus'], ['010-dilophosaurus.png', 'Dilophosaurus'],
  ['011-corythosaurus.png', 'Corythosaurus'], ['012-styracosaurus.png', 'Styracosaurus'],
  ['013-maiasaura.png', 'Maiasaura'], ['014-edmontosaurus.png', 'Edmontosaurus'],
  ['015-psittacosaurus.png', 'Psittacosaurus'], ['016-microraptor.png', 'Microraptor'],
  ['017-sauropelta.png', 'Sauropelta'], ['018-therizinosaurus.png', 'Therizinosaurus'],
  ['019-carnotaurus.png', 'Carnotaurus'], ['020-baryonyx.png', 'Baryonyx'],
  ['021-triceratops.png', 'Triceratops'], ['022-stegosaurus.png', 'Stegosaurus'],
  ['023-ankylosaurus.png', 'Ankylosaurus'], ['024-allosaurus.png', 'Allosaurus'],
  ['025-brachiosaurus.png', 'Brachiosaurus'], ['026-diplodocus.png', 'Diplodocus'],
  ['027-pteranodon.png', 'Pteranodon'], ['028-plesiosaur.png', 'Plesiosaur'],
  ['029-mosasaurus.png', 'Mosasaurus'], ['030-archaeopteryx.png', 'Archaeopteryx'],
  ['031-tyrannosaurus.png', 'Tyrannosaurus Rex'], ['032-velociraptor.png', 'Velociraptor'],
  ['033-spinosaurus.png', 'Spinosaurus'], ['034-giganotosaurus.png', 'Giganotosaurus'],
  ['035-argentinosaurus.png', 'Argentinosaurus'], ['036-indominus.png', 'Indominus Rex'],
  ['037-indoraptor.png', 'Indoraptor'], ['038-quetzalcoatlus.png', 'Quetzalcoatlus'],
];

const dyr: Rad[] = [
  ['001-hamster.png', 'Hamster'], ['002-kanin.png', 'Kanin'], ['003-pinnsvin.png', 'Pinnsvin'],
  ['004-ekorn.png', 'Ekorn'], ['005-marsvin.png', 'Marsvin'], ['006-kattunge.png', 'Kattunge'],
  ['007-valp.png', 'Valp'], ['008-and.png', 'And'], ['009-mus.png', 'Mus'], ['010-rotte.png', 'Rotte'],
  ['011-chinchilla.png', 'Chinchilla'], ['012-gerbil.png', 'Gerbil'], ['013-frett.png', 'Frett'],
  ['014-kylling.png', 'Kylling'], ['015-lam.png', 'Lam'], ['016-gris.png', 'Gris'],
  ['017-pafugl.png', 'Påfugl'], ['018-flamingo.png', 'Flamingo'], ['019-svan.png', 'Svane'],
  ['020-gas.png', 'Gås'], ['021-rodrev.png', 'Rødrev'], ['022-panda.png', 'Panda'],
  ['023-koala.png', 'Koala'], ['024-oter.png', 'Oter'], ['025-sel.png', 'Sel'],
  ['026-pingvin.png', 'Pingvin'], ['027-dovendyr.png', 'Dovendyr'], ['028-lemur.png', 'Lemur'],
  ['029-alpakka.png', 'Alpakka'], ['030-capybara.png', 'Capybara'], ['031-rodpanda.png', 'Rød Panda'],
  ['032-meerkat.png', 'Meerkat'], ['033-fennec.png', 'Fennec'], ['034-axolotl.png', 'Axolotl'],
  ['035-quokka.png', 'Quokka'], ['036-unicorn.png', 'Enhjørning'], ['037-drage.png', 'Drage'],
  ['038-feniks.png', 'Føniks'],
];

const guder: Rad[] = [
  ['001-heimdall.png', 'Heimdall'], ['002-vidar.png', 'Vidar'], ['003-vali.png', 'Vali'],
  ['004-forseti.png', 'Forseti'], ['005-idunn.png', 'Idun'], ['006-sif.png', 'Sif'],
  ['007-skadi.png', 'Skade'], ['008-njord.png', 'Njord'], ['009-hermes.png', 'Hermes'],
  ['010-hades.png', 'Hades'], ['011-demeter.png', 'Demeter'], ['012-hestia.png', 'Hestia'],
  ['013-hephaestus.png', 'Hefaistos'], ['014-ares.png', 'Ares'], ['015-artemis.png', 'Artemis'],
  ['016-apollo.png', 'Apollo'], ['017-dionysus.png', 'Dionysos'], ['018-pan.png', 'Pan'],
  ['019-eros.png', 'Eros'], ['020-nike.png', 'Nike'], ['021-thor.png', 'Tor'],
  ['022-freyja.png', 'Frøya'], ['023-freyr.png', 'Frey'], ['024-baldur.png', 'Balder'],
  ['025-tyr.png', 'Tyr'], ['026-athena.png', 'Athene'], ['027-aphrodite.png', 'Afrodite'],
  ['028-poseidon.png', 'Poseidon'], ['029-hera.png', 'Hera'], ['030-persephone.png', 'Persefone'],
  ['031-odin.png', 'Odin'], ['032-loki.png', 'Loke'], ['033-hel.png', 'Hel'],
  ['034-zeus.png', 'Zevs'], ['035-kronos.png', 'Kronos'], ['036-yggdrasil.png', 'Yggdrasil'],
  ['037-fenrir.png', 'Fenrisulven'], ['038-jormungandr.png', 'Midgardsormen'],
];

const romvesener: Rad[] = [
  ['001-zorg.png', 'Zorg'], ['002-beep.png', 'Beep'],
  ['003-glorp.png', 'Glorp'], ['004-pip.png', 'Pip'],
  ['005-nova.png', 'Nova'], ['006-spark.png', 'Spark'],
  ['007-flip.png', 'Flip'], ['008-dusty.png', 'Dusty'],
  ['009-frosty.png', 'Frosty'], ['010-bubbles.png', 'Bubbles'],
  ['011-echo.png', 'Echo'], ['012-glow.png', 'Glow'],
  ['013-zoom.png', 'Zoom'], ['014-patches.png', 'Patches'],
  ['015-orbit.png', 'Orbit'], ['016-spike.png', 'Spike'],
  ['017-wisp.png', 'Wisp'], ['018-byte.png', 'Byte'],
  ['019-sprout.png', 'Sprout'], ['020-marble.png', 'Marble'],
  ['021-prism.png', 'Prism'], ['022-twirl.png', 'Twirl'],
  ['023-pixel.png', 'Pixel'], ['024-shimmer.png', 'Shimmer'],
  ['025-fluff.png', 'Fluff'], ['026-tide.png', 'Tide'],
  ['027-ember.png', 'Ember'], ['028-breeze.png', 'Breeze'],
  ['029-terra.png', 'Terra'], ['030-zenith.png', 'Zenith'],
  ['031-aurora.png', 'Aurora'], ['032-cosmos.png', 'Cosmos'],
  ['033-quantum.png', 'Quantum'], ['034-stardust.png', 'Stardust'],
  ['035-eclipse.png', 'Eclipse'], ['036-supernova.png', 'Supernova'],
  ['037-nebula.png', 'Nebula'], ['038-galaxia.png', 'Galaxia'],
];

const planeter: Rad[] = [
  ['001-merkur.png', 'Merkur'], ['002-venus.png', 'Venus'],
  ['003-jorden.png', 'Jorden'], ['004-mars.png', 'Mars'],
  ['005-jupiter.png', 'Jupiter'], ['006-saturn.png', 'Saturn'],
  ['007-uranus.png', 'Uranus'], ['008-neptun.png', 'Neptun'],
  ['009-manen.png', 'Månen'], ['010-pluto.png', 'Pluto'],
  ['011-ceres.png', 'Ceres'], ['012-europa.png', 'Europa'],
  ['013-titan.png', 'Titan'], ['014-io.png', 'Io'],
  ['015-enceladus.png', 'Enceladus'], ['016-ganymedes.png', 'Ganymedes'],
  ['017-callisto.png', 'Callisto'], ['018-triton.png', 'Triton'],
  ['019-fobos.png', 'Fobos'], ['020-halley.png', 'Halleys komet'],
  ['021-eris.png', 'Eris'], ['022-haumea.png', 'Haumea'],
  ['023-makemake.png', 'Makemake'], ['024-sedna.png', 'Sedna'],
  ['025-vesta.png', 'Vesta'], ['026-proxima-b.png', 'Proxima b'],
  ['027-trappist-1e.png', 'TRAPPIST-1e'], ['028-kepler-452b.png', 'Kepler-452b'],
  ['029-diamantplaneten.png', 'Diamantplaneten'], ['030-glassregnplaneten.png', 'Glassregn-planeten'],
  ['031-sola.png', 'Sola'], ['032-betelgeuse.png', 'Betelgeuse'],
  ['033-sirius.png', 'Sirius'], ['034-oriontaken.png', 'Oriontåken'],
  ['035-krabbetaken.png', 'Krabbetåken'], ['036-melkeveien.png', 'Melkeveien'],
  ['037-andromeda.png', 'Andromedagalaksen'], ['038-sort-hull.png', 'Sort hull'],
];

const skapninger: Rad[] = [
  ['001-nisse.png', 'Nisse'], ['002-fjosnisse.png', 'Fjøsnisse'],
  ['003-tusse.png', 'Tusse'], ['004-vette.png', 'Vette'],
  ['005-trollkatt.png', 'Trollkatt'], ['006-julebukk.png', 'Julebukk'],
  ['007-lyktemann.png', 'Lyktemann'], ['008-skogstroll.png', 'Skogstroll'],
  ['009-fjelltroll.png', 'Fjelltroll'], ['010-brotroll.png', 'Brotroll'],
  ['011-dverg.png', 'Dverg'], ['012-alv.png', 'Alv'],
  ['013-mare.png', 'Mare'], ['014-kirkegrim.png', 'Kirkegrim'],
  ['015-klabautermann.png', 'Klabautermann'], ['016-bekkahesten.png', 'Bekkahesten'],
  ['017-havfrue.png', 'Havfrue'], ['018-havmann.png', 'Havmann'],
  ['019-fossegrim.png', 'Fossegrim'], ['020-mosekall.png', 'Mosekall'],
  ['021-hulder.png', 'Hulder'], ['022-nokken.png', 'Nøkken'],
  ['023-draugen.png', 'Draugen'], ['024-sjoormen.png', 'Sjøormen'],
  ['025-lindormen.png', 'Lindormen'], ['026-ratatosk.png', 'Ratatosk'],
  ['027-hugin-og-munin.png', 'Hugin og Munin'], ['028-heidrun.png', 'Heidrun'],
  ['029-gullinbuste.png', 'Gullinbuste'], ['030-selkje.png', 'Selkje'],
  ['031-valkyrje.png', 'Valkyrje'], ['032-jotne.png', 'Jotne'],
  ['033-garm.png', 'Garm'], ['034-hresvelg.png', 'Hræsvelg'],
  ['035-sleipner.png', 'Sleipner'], ['036-dovregubben.png', 'Dovregubben'],
  ['037-kraken.png', 'Kraken'], ['038-nidhogg.png', 'Nidhogg'],
];

/**
 * Kortpakke. Sett `aktiv: false` for å STAGE en pakke i koden uten å rulle den
 * ut ennå (kortene vises ikke i galleri/belønning før den slås på).
 *
 * Slik ruller du ut en ny pakke:
 *   1. Legg kategorien til i `Category`-typen øverst.
 *   2. Legg 38 bilder i `images/<mappe>/` (001-…png … 038-…png).
 *   3. Definer radene og legg til en linje i PAKKER med `aktiv: false`.
 *   4. Når alt er klart: sett `aktiv: true` — ferdig.
 */
export interface Kortpakke {
  prefix: string;
  mappe: Category;
  navn: string;
  aktiv: boolean;
  rader: Rad[];
}

export const PAKKER: Kortpakke[] = [
  { prefix: 'bil', mappe: 'biler', navn: 'Biler', aktiv: true, rader: biler },
  { prefix: 'dino', mappe: 'dinosaurer', navn: 'Dinosaurer', aktiv: true, rader: dinosaurer },
  { prefix: 'dyr', mappe: 'dyr', navn: 'Dyr', aktiv: true, rader: dyr },
  { prefix: 'gud', mappe: 'guder', navn: 'Guder', aktiv: true, rader: guder },
  { prefix: 'rom', mappe: 'romvesener', navn: 'Romvesener', aktiv: true, rader: romvesener },
  // Staget: bilder genereres/optimaliseres — slå på når de er committet.
  { prefix: 'pla', mappe: 'planeter', navn: 'Planeter', aktiv: false, rader: planeter },
  { prefix: 'skap', mappe: 'skapninger', navn: 'Mytiske skapninger', aktiv: false, rader: skapninger },
  // Stage nye pakker her med aktiv:false, og slå på når bilder + navn er klare.
];

/** Pakker som faktisk er rullet ut (aktiv). */
export const aktiveKortpakker = PAKKER.filter((p) => p.aktiv);

export const kortData: KortDef[] = aktiveKortpakker.flatMap((p) => bygg(p.prefix, p.mappe, p.rader));

const kortMap = new Map(kortData.map((k) => [k.id, k]));

export function getKortById(id: string): KortDef | undefined {
  return kortMap.get(id);
}

export function getTotalKortCount(): number {
  return kortData.length;
}
