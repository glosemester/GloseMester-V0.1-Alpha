/* ============================================
   KORT-DATA.JS - GloseMester
   Master database for alle kort
   ============================================ */

// ==================== KONSTANTER ====================

export const CATEGORIES = {
    // GloseMester
    BILER: 'biler',
    DINOSAURER: 'dinosaurer',
    DYR: 'dyr',
    GUDER: 'guder'
};

export const RARITIES = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

export const RARITY_CONFIG = {
    'common': {
        tekst: 'Vanlig',
        farge: '#a1a1a1',
        class: 'vanlig',
        emoji: '📦'
    },
    'rare': {
        tekst: 'Sjelden',
        farge: '#0071e3',
        class: 'sjelden',
        emoji: '✨'
    },
    'epic': {
        tekst: 'Episk',
        farge: '#8e44ad',
        class: 'episk',
        emoji: '💎'
    },
    'legendary': {
        tekst: 'Legendarisk',
        farge: '#f1c40f',
        class: 'legendary',
        emoji: '🌟'
    }
};

// ==================== HJELPEFUNKSJON ====================

/**
 * Bestemmer rarity basert på ID-nummer
 * @param {number} num - Kort nummer (1-38)
 * @returns {string} - Rarity type
 */
function getRarity(num) {
    if (num >= 36) return RARITIES.LEGENDARY;  // 36-38: Legendary (3 kort)
    if (num >= 31) return RARITIES.EPIC;       // 31-35: Epic (5 kort)
    if (num >= 21) return RARITIES.RARE;       // 21-30: Rare (10 kort)
    return RARITIES.COMMON;                     // 1-20: Common (20 kort)
}

// ==================== GLOSEMESTER KORT ====================

const biler = [
    { f: "001-vw-golf.png", n: "VW Golf" },
    { f: "002-toyota-corolla.png", n: "Toyota Corolla" },
    { f: "003-ford-focus.png", n: "Ford Focus" },
    { f: "004-honda-civic.png", n: "Honda Civic" },
    { f: "005-nissan-leaf.png", n: "Nissan Leaf" },
    { f: "006-mazda-3.png", n: "Mazda 3" },
    { f: "007-volvo-v70.png", n: "Volvo V70" },
    { f: "008-audi-a4sedan.png", n: "Audi A4" },
    { f: "009-bmw-3serie.png", n: "BMW 3-serie" },
    { f: "010-mercedes-benz-c-class.png", n: "Mercedes C-Class" },
    { f: "011-skoda-octavia.png", n: "Skoda Octavia" },
    { f: "012-peugeot-308-hatchback.png", n: "Peugeot 308" },
    { f: "013-renault-megane-hatchback.png", n: "Renault Megane" },
    { f: "014-opel-astra.png", n: "Opel Astra" },
    { f: "015-kia-ceed.png", n: "Kia Ceed" },
    { f: "016-hyundai-i30.png", n: "Hyundai i30" },
    { f: "017-tesla-model3.png", n: "Tesla Model 3" },
    { f: "018-subaru-outback.png", n: "Subaru Outback" },
    { f: "019-citroen-c4.png", n: "Citroën C4" },
    { f: "020-seat-leon.png", n: "Seat Leon" },
    { f: "021-porsche-911.png", n: "Porsche 911" },
    { f: "022-ferrari-488gtb.png", n: "Ferrari 488 GTB" },
    { f: "023-laborghini-huracan.png", n: "Lamborghini Huracán" },
    { f: "024-aston-martin-db11.png", n: "Aston Martin DB11" },
    { f: "025-mclaren-720s.png", n: "McLaren 720S" },
    { f: "026-chevrolet-corvette-stingray.png", n: "Corvette Stingray" },
    { f: "027-nissan-gtr.png", n: "Nissan GT-R" },
    { f: "028-audi-r8v10.png", n: "Audi R8 V10" },
    { f: "029-bmw-m4.png", n: "BMW M4" },
    { f: "030-mercedes-amg-gt.png", n: "Mercedes AMG GT" },
    { f: "031-bugatti-chiron.png", n: "Bugatti Chiron" },
    { f: "032-koenigsegg-jesko.png", n: "Koenigsegg Jesko" },
    { f: "033-pagani-huayra.png", n: "Pagani Huayra" },
    { f: "034-rimac-nevera.png", n: "Rimac Nevera" },
    { f: "035-lotus-evija.png", n: "Lotus Evija" },
    { f: "036-ferrari-laferrari.png", n: "LaFerrari" },
    { f: "037-mclaren-p1.png", n: "McLaren P1" },
    { f: "038-porsche-918spyder.png", n: "Porsche 918 Spyder" }
].map((k, i) => ({
    id: `bil_${String(i + 1).padStart(3, '0')}`,
    name: k.n,
    image: `images/biler/${k.f}`,
    category: CATEGORIES.BILER,
    rarity: getRarity(i + 1),
    fag: 'gloser'
}));

const dinosaurer = [
    { f: "001-compsognathus.png", n: "Compsognathus" },
    { f: "002-protoceratops.png", n: "Protoceratops" },
    { f: "003-pachycephalosaurus.png", n: "Pachycephalosaurus" },
    { f: "004-gallimimus.png", n: "Gallimimus" },
    { f: "005-oviraptor.png", n: "Oviraptor" },
    { f: "006-deinonychus.png", n: "Deinonychus" },
    { f: "007-parasaurolophus.png", n: "Parasaurolophus" },
    { f: "008-iguanodon.png", n: "Iguanodon" },
    { f: "009-kentrosaurus.png", n: "Kentrosaurus" },
    { f: "010-dilophosaurus.png", n: "Dilophosaurus" },
    { f: "011-corythosaurus.png", n: "Corythosaurus" },
    { f: "012-styracosaurus.png", n: "Styracosaurus" },
    { f: "013-maiasaura.png", n: "Maiasaura" },
    { f: "014-edmontosaurus.png", n: "Edmontosaurus" },
    { f: "015-psittacosaurus.png", n: "Psittacosaurus" },
    { f: "016-microraptor.png", n: "Microraptor" },
    { f: "017-sauropelta.png", n: "Sauropelta" },
    { f: "018-therizinosaurus.png", n: "Therizinosaurus" },
    { f: "019-carnotaurus.png", n: "Carnotaurus" },
    { f: "020-baryonyx.png", n: "Baryonyx" },
    { f: "021-triceratops.png", n: "Triceratops" },
    { f: "022-stegosaurus.png", n: "Stegosaurus" },
    { f: "023-ankylosaurus.png", n: "Ankylosaurus" },
    { f: "024-allosaurus.png", n: "Allosaurus" },
    { f: "025-brachiosaurus.png", n: "Brachiosaurus" },
    { f: "026-diplodocus.png", n: "Diplodocus" },
    { f: "027-pteranodon.png", n: "Pteranodon" },
    { f: "028-plesiosaur.png", n: "Plesiosaur" },
    { f: "029-mosasaurus.png", n: "Mosasaurus" },
    { f: "030-archaeopteryx.png", n: "Archaeopteryx" },
    { f: "031-tyrannosaurus.png", n: "Tyrannosaurus Rex" },
    { f: "032-velociraptor.png", n: "Velociraptor" },
    { f: "033-spinosaurus.png", n: "Spinosaurus" },
    { f: "034-giganotosaurus.png", n: "Giganotosaurus" },
    { f: "035-argentinosaurus.png", n: "Argentinosaurus" },
    { f: "036-indominus.png", n: "Indominus Rex" },
    { f: "037-indoraptor.png", n: "Indoraptor" },
    { f: "038-quetzalcoatlus.png", n: "Quetzalcoatlus" }
].map((k, i) => ({
    id: `dino_${String(i + 1).padStart(3, '0')}`,
    name: k.n,
    image: `images/dinosaurer/${k.f}`,
    category: CATEGORIES.DINOSAURER,
    rarity: getRarity(i + 1),
    fag: 'gloser'
}));

const dyr = [
    { f: "001-hamster.png", n: "Hamster" },
    { f: "002-kanin.png", n: "Kanin" },
    { f: "003-pinnsvin.png", n: "Pinnsvin" },
    { f: "004-ekorn.png", n: "Ekorn" },
    { f: "005-marsvin.png", n: "Marsvin" },
    { f: "006-kattunge.png", n: "Kattunge" },
    { f: "007-valp.png", n: "Valp" },
    { f: "008-and.png", n: "And" },
    { f: "009-mus.png", n: "Mus" },
    { f: "010-rotte.png", n: "Rotte" },
    { f: "011-chinchilla.png", n: "Chinchilla" },
    { f: "012-gerbil.png", n: "Gerbil" },
    { f: "013-frett.png", n: "Frett" },
    { f: "014-kylling.png", n: "Kylling" },
    { f: "015-lam.png", n: "Lam" },
    { f: "016-gris.png", n: "Gris" },
    { f: "017-pafugl.png", n: "Påfugl" },
    { f: "018-flamingo.png", n: "Flamingo" },
    { f: "019-svan.png", n: "Svane" },
    { f: "020-gas.png", n: "Gås" },
    { f: "021-rodrev.png", n: "Rødrev" },
    { f: "022-panda.png", n: "Panda" },
    { f: "023-koala.png", n: "Koala" },
    { f: "024-oter.png", n: "Oter" },
    { f: "025-sel.png", n: "Sel" },
    { f: "026-pingvin.png", n: "Pingvin" },
    { f: "027-dovendyr.png", n: "Dovendyr" },
    { f: "028-lemur.png", n: "Lemur" },
    { f: "029-alpakka.png", n: "Alpakka" },
    { f: "030-capybara.png", n: "Capybara" },
    { f: "031-rodpanda.png", n: "Rød Panda" },
    { f: "032-meerkat.png", n: "Meerkat" },
    { f: "033-fennec.png", n: "Fennec" },
    { f: "034-axolotl.png", n: "Axolotl" },
    { f: "035-quokka.png", n: "Quokka" },
    { f: "036-unicorn.png", n: "Enhjørning" },
    { f: "037-drage.png", n: "Drage" },
    { f: "038-feniks.png", n: "Føniks" }
].map((k, i) => ({
    id: `dyr_${String(i + 1).padStart(3, '0')}`,
    name: k.n,
    image: `images/dyr/${k.f}`,
    category: CATEGORIES.DYR,
    rarity: getRarity(i + 1),
    fag: 'gloser'
}));

const guder = [
    { f: "001-heimdall.png", n: "Heimdall" },
    { f: "002-vidar.png", n: "Vidar" },
    { f: "003-vali.png", n: "Vali" },
    { f: "004-forseti.png", n: "Forseti" },
    { f: "005-idunn.png", n: "Idun" },
    { f: "006-sif.png", n: "Sif" },
    { f: "007-skadi.png", n: "Skade" },
    { f: "008-njord.png", n: "Njord" },
    { f: "009-hermes.png", n: "Hermes" },
    { f: "010-hades.png", n: "Hades" },
    { f: "011-demeter.png", n: "Demeter" },
    { f: "012-hestia.png", n: "Hestia" },
    { f: "013-hephaestus.png", n: "Hefaistos" },
    { f: "014-ares.png", n: "Ares" },
    { f: "015-artemis.png", n: "Artemis" },
    { f: "016-apollo.png", n: "Apollo" },
    { f: "017-dionysus.png", n: "Dionysos" },
    { f: "018-pan.png", n: "Pan" },
    { f: "019-eros.png", n: "Eros" },
    { f: "020-nike.png", n: "Nike" },
    { f: "021-thor.png", n: "Tor" },
    { f: "022-freyja.png", n: "Frøya" },
    { f: "023-freyr.png", n: "Frey" },
    { f: "024-baldur.png", n: "Balder" },
    { f: "025-tyr.png", n: "Tyr" },
    { f: "026-athena.png", n: "Athene" },
    { f: "027-aphrodite.png", n: "Afrodite" },
    { f: "028-poseidon.png", n: "Poseidon" },
    { f: "029-hera.png", n: "Hera" },
    { f: "030-persephone.png", n: "Persefone" },
    { f: "031-odin.png", n: "Odin" },
    { f: "032-loki.png", n: "Loke" },
    { f: "033-hel.png", n: "Hel" },
    { f: "034-zeus.png", n: "Zevs" },
    { f: "035-kronos.png", n: "Kronos" },
    { f: "036-yggdrasil.png", n: "Yggdrasil" },
    { f: "037-fenrir.png", n: "Fenrisulven" },
    { f: "038-jormungandr.png", n: "Midgardsormen" }
].map((k, i) => ({
    id: `gud_${String(i + 1).padStart(3, '0')}`,
    name: k.n,
    image: `images/guder/${k.f}`,
    category: CATEGORIES.GUDER,
    rarity: getRarity(i + 1),
    fag: 'gloser'
}));



// ==================== MASTER KORT-ARRAY ====================

/**
 * Master database: Alle kort for alle fag
 * @type {Array<Object>}
 */
export const kortData = [
    ...biler,
    ...dinosaurer,
    ...dyr,
    ...guder
];

// Compatibility export (for old code)
export const cardsData = kortData;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get kort by ID
 * @param {string} kortId - Kort ID
 * @returns {Object|null} - Kort object or null
 */
export function getKortById(kortId) {
    return kortData.find(kort => kort.id === kortId) || null;
}

/**
 * Get kort by category
 * @param {string} category - Category name
 * @returns {Array<Object>} - Array of kort
 */
export function getKortByCategory(category) {
    return kortData.filter(kort => kort.category === category);
}

/**
 * Get kort by fag
 * @param {string} fag - Fag name ('gloser', 'matte', 'norsk')
 * @returns {Array<Object>} - Array of kort
 */
export function getKortByFag(fag) {
    return kortData.filter(kort => kort.fag === fag);
}

/**
 * Get kort by rarity
 * @param {string} rarity - Rarity type
 * @returns {Array<Object>} - Array of kort
 */
export function getKortByRarity(rarity) {
    return kortData.filter(kort => kort.rarity === rarity);
}

/**
 * Get total kort count
 * @returns {number} - Total number of kort
 */
export function getTotalKortCount() {
    return kortData.length;
}

/**
 * Get kort statistics
 * @returns {Object} - Statistics object
 */
export function getKortStats() {
    const stats = {
        total: kortData.length,
        byFag: {},
        byCategory: {},
        byRarity: {}
    };

    kortData.forEach(kort => {
        // By fag
        stats.byFag[kort.fag] = (stats.byFag[kort.fag] || 0) + 1;

        // By category
        stats.byCategory[kort.category] = (stats.byCategory[kort.category] || 0) + 1;

        // By rarity
        stats.byRarity[kort.rarity] = (stats.byRarity[kort.rarity] || 0) + 1;
    });

    return stats;
}

// Log stats on load (development only)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('📊 Kort Statistics:', getKortStats());
}
