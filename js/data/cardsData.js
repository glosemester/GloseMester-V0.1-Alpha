// Denne filen fungerer som databasen vår.
// Her legger vi inn alle kortene. Når vi skal legge til Dyr/Guder,
// limer vi dem bare inn i listen under med category: 'dyr' osv.

export const cardsData = [
    // --- BILER (Common/Rare/Epic/Legendary fordeles her) ---
    { id: 'bil_001', name: 'VW Golf', category: 'biler', rarity: 'common', image: 'images/biler/001-vw-golf.png' },
    { id: 'bil_002', name: 'Toyota Corolla', category: 'biler', rarity: 'common', image: 'images/biler/002-toyota-corolla.png' },
    { id: 'bil_003', name: 'Ford Focus', category: 'biler', rarity: 'common', image: 'images/biler/003-ford-focus.png' },
    { id: 'bil_004', name: 'Honda Civic', category: 'biler', rarity: 'common', image: 'images/biler/004-honda-civic.png' },
    { id: 'bil_005', name: 'Nissan Leaf', category: 'biler', rarity: 'common', image: 'images/biler/005-nissan-leaf.png' },
    { id: 'bil_006', name: 'Mazda 3', category: 'biler', rarity: 'common', image: 'images/biler/006-mazda-3.png' },
    { id: 'bil_007', name: 'Volvo V70', category: 'biler', rarity: 'common', image: 'images/biler/007-volvo-v70.png' },
    { id: 'bil_008', name: 'Audi A4', category: 'biler', rarity: 'rare', image: 'images/biler/008-audi-a4sedan.png' },
    { id: 'bil_009', name: 'BMW 3-serie', category: 'biler', rarity: 'rare', image: 'images/biler/009-bmw-3serie.png' },
    { id: 'bil_010', name: 'Mercedes C-Class', category: 'biler', rarity: 'rare', image: 'images/biler/010-mercedes-benz-c-class.png' },
    { id: 'bil_011', name: 'Skoda Octavia', category: 'biler', rarity: 'common', image: 'images/biler/011-skoda-octavia.png' },
    { id: 'bil_012', name: 'Peugeot 308', category: 'biler', rarity: 'common', image: 'images/biler/012-peugeot-308-hatchback.png' },
    { id: 'bil_013', name: 'Renault Megane', category: 'biler', rarity: 'common', image: 'images/biler/013-renault-megane-hatchback.png' },
    { id: 'bil_014', name: 'Opel Astra', category: 'biler', rarity: 'common', image: 'images/biler/014-opel-astra.png' },
    { id: 'bil_015', name: 'Kia Ceed', category: 'biler', rarity: 'common', image: 'images/biler/015-kia-ceed.png' },
    { id: 'bil_016', name: 'Hyundai i30', category: 'biler', rarity: 'common', image: 'images/biler/016-hyundai-i30.png' },
    { id: 'bil_017', name: 'Tesla Model 3', category: 'biler', rarity: 'rare', image: 'images/biler/017-tesla-model3.png' },
    { id: 'bil_018', name: 'Subaru Outback', category: 'biler', rarity: 'rare', image: 'images/biler/018-subaru-outback.png' },
    { id: 'bil_019', name: 'Citroen C4', category: 'biler', rarity: 'common', image: 'images/biler/019-citroen-c4.png' },
    { id: 'bil_020', name: 'Seat Leon', category: 'biler', rarity: 'common', image: 'images/biler/020-seat-leon.png' },
    
    // Sportsbiler (Epic/Legendary)
    { id: 'bil_021', name: 'Porsche 911', category: 'biler', rarity: 'epic', image: 'images/biler/021-porsche-911.png' },
    { id: 'bil_022', name: 'Ferrari 488 GTB', category: 'biler', rarity: 'legendary', image: 'images/biler/022-ferrari-488gtb.png' },
    { id: 'bil_023', name: 'Lamborghini Huracán', category: 'biler', rarity: 'legendary', image: 'images/biler/023-laborghini-huracan.png' },
    { id: 'bil_024', name: 'Aston Martin DB11', category: 'biler', rarity: 'epic', image: 'images/biler/024-aston-martin-db11.png' },
    { id: 'bil_025', name: 'McLaren 720S', category: 'biler', rarity: 'legendary', image: 'images/biler/025-mclaren-720s.png' },
    { id: 'bil_026', name: 'Corvette Stingray', category: 'biler', rarity: 'epic', image: 'images/biler/026-chevrolet-corvette-stingray.png' },
    { id: 'bil_027', name: 'Nissan GT-R', category: 'biler', rarity: 'epic', image: 'images/biler/027-nissan-gtr.png' },
    { id: 'bil_028', name: 'Audi R8 V10', category: 'biler', rarity: 'epic', image: 'images/biler/028-audi-r8v10.png' },
    { id: 'bil_029', name: 'BMW M4', category: 'biler', rarity: 'epic', image: 'images/biler/029-bmw-m4.png' },
    { id: 'bil_030', name: 'Mercedes AMG GT', category: 'biler', rarity: 'epic', image: 'images/biler/030-mercedes-amg-gt.png' },
    
    // Hypercars (Legendary)
    { id: 'bil_031', name: 'Bugatti Chiron', category: 'biler', rarity: 'legendary', image: 'images/biler/031-bugatti-chiron.png' },
    { id: 'bil_032', name: 'Koenigsegg Jesko', category: 'biler', rarity: 'legendary', image: 'images/biler/032-koenigsegg-jesko.png' },
    { id: 'bil_033', name: 'Pagani Huayra', category: 'biler', rarity: 'legendary', image: 'images/biler/033-pagani-huayra.png' },
    { id: 'bil_034', name: 'Rimac Nevera', category: 'biler', rarity: 'legendary', image: 'images/biler/034-rimac-nevera.png' },
    { id: 'bil_035', name: 'Lotus Evija', category: 'biler', rarity: 'legendary', image: 'images/biler/035-lotus-evija.png' },
    { id: 'bil_036', name: 'Ferrari LaFerrari', category: 'biler', rarity: 'legendary', image: 'images/biler/036-ferrari-laferrari.png' },
    { id: 'bil_037', name: 'McLaren P1', category: 'biler', rarity: 'legendary', image: 'images/biler/037-mclaren-p1.png' },
    { id: 'bil_038', name: 'Porsche 918 Spyder', category: 'biler', rarity: 'legendary', image: 'images/biler/038-porsche-918spyder.png' },

    // ============================================
    // --- GUDER (Norse & Greek Mythology) ---
    // ============================================
    
    // Common Gods (20 kort)
    { id: 'gud_039', name: 'Heimdall', category: 'guder', rarity: 'common', image: 'images/guder/039-heimdall.png' },
    { id: 'gud_040', name: 'Vidar', category: 'guder', rarity: 'common', image: 'images/guder/040-vidar.png' },
    { id: 'gud_041', name: 'Váli', category: 'guder', rarity: 'common', image: 'images/guder/041-vali.png' },
    { id: 'gud_042', name: 'Forseti', category: 'guder', rarity: 'common', image: 'images/guder/042-forseti.png' },
    { id: 'gud_043', name: 'Idunn', category: 'guder', rarity: 'common', image: 'images/guder/043-idunn.png' },
    { id: 'gud_044', name: 'Sif', category: 'guder', rarity: 'common', image: 'images/guder/044-sif.png' },
    { id: 'gud_045', name: 'Skadi', category: 'guder', rarity: 'common', image: 'images/guder/045-skadi.png' },
    { id: 'gud_046', name: 'Njord', category: 'guder', rarity: 'common', image: 'images/guder/046-njord.png' },
    { id: 'gud_047', name: 'Hermes', category: 'guder', rarity: 'common', image: 'images/guder/047-hermes.png' },
    { id: 'gud_048', name: 'Hades', category: 'guder', rarity: 'common', image: 'images/guder/048-hades.png' },
    { id: 'gud_049', name: 'Demeter', category: 'guder', rarity: 'common', image: 'images/guder/049-demeter.png' },
    { id: 'gud_050', name: 'Hestia', category: 'guder', rarity: 'common', image: 'images/guder/050-hestia.png' },
    { id: 'gud_051', name: 'Hephaestus', category: 'guder', rarity: 'common', image: 'images/guder/051-hephaestus.png' },
    { id: 'gud_052', name: 'Ares', category: 'guder', rarity: 'common', image: 'images/guder/052-ares.png' },
    { id: 'gud_053', name: 'Artemis', category: 'guder', rarity: 'common', image: 'images/guder/053-artemis.png' },
    { id: 'gud_054', name: 'Apollo', category: 'guder', rarity: 'common', image: 'images/guder/054-apollo.png' },
    { id: 'gud_055', name: 'Dionysus', category: 'guder', rarity: 'common', image: 'images/guder/055-dionysus.png' },
    { id: 'gud_056', name: 'Pan', category: 'guder', rarity: 'common', image: 'images/guder/056-pan.png' },
    { id: 'gud_057', name: 'Eros', category: 'guder', rarity: 'common', image: 'images/guder/057-eros.png' },
    { id: 'gud_058', name: 'Nike', category: 'guder', rarity: 'common', image: 'images/guder/058-nike.png' },
    
    // Rare Gods (10 kort)
    { id: 'gud_059', name: 'Thor', category: 'guder', rarity: 'rare', image: 'images/guder/059-thor.png' },
    { id: 'gud_060', name: 'Freyja', category: 'guder', rarity: 'rare', image: 'images/guder/060-freyja.png' },
    { id: 'gud_061', name: 'Freyr', category: 'guder', rarity: 'rare', image: 'images/guder/061-freyr.png' },
    { id: 'gud_062', name: 'Baldur', category: 'guder', rarity: 'rare', image: 'images/guder/062-baldur.png' },
    { id: 'gud_063', name: 'Tyr', category: 'guder', rarity: 'rare', image: 'images/guder/063-tyr.png' },
    { id: 'gud_064', name: 'Athena', category: 'guder', rarity: 'rare', image: 'images/guder/064-athena.png' },
    { id: 'gud_065', name: 'Aphrodite', category: 'guder', rarity: 'rare', image: 'images/guder/065-aphrodite.png' },
    { id: 'gud_066', name: 'Poseidon', category: 'guder', rarity: 'rare', image: 'images/guder/066-poseidon.png' },
    { id: 'gud_067', name: 'Hera', category: 'guder', rarity: 'rare', image: 'images/guder/067-hera.png' },
    { id: 'gud_068', name: 'Persephone', category: 'guder', rarity: 'rare', image: 'images/guder/068-persephone.png' },
    
    // Epic Gods (5 kort)
    { id: 'gud_069', name: 'Odin', category: 'guder', rarity: 'epic', image: 'images/guder/069-odin.png' },
    { id: 'gud_070', name: 'Loki', category: 'guder', rarity: 'epic', image: 'images/guder/070-loki.png' },
    { id: 'gud_071', name: 'Hel', category: 'guder', rarity: 'epic', image: 'images/guder/071-hel.png' },
    { id: 'gud_072', name: 'Zeus', category: 'guder', rarity: 'epic', image: 'images/guder/072-zeus.png' },
    { id: 'gud_073', name: 'Kronos', category: 'guder', rarity: 'epic', image: 'images/guder/073-kronos.png' },
    
    // Legendary Gods (3 kort)
    { id: 'gud_074', name: 'Yggdrasil', category: 'guder', rarity: 'legendary', image: 'images/guder/074-yggdrasil.png' },
    { id: 'gud_075', name: 'Fenrir', category: 'guder', rarity: 'legendary', image: 'images/guder/075-fenrir.png' },
    { id: 'gud_076', name: 'Jörmungandr', category: 'guder', rarity: 'legendary', image: 'images/guder/076-jormungandr.png' }
];

// Hjelpefunksjon for å hente kort basert på kategori (Brukes senere i butikken)
export function getCardsByCategory(category) {
    return cardsData.filter(card => card.category === category);
}
