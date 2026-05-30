/**
 * Vokabulardata for GloseMester — portet 1:1 fra v2
 * (src/features/glosemester/vocabulary-data.js). LK20-tilpassede ordlister.
 *
 * Format: { k?: kategori, s: norsk, e: engelsk, image?: bildesti }
 */

export interface Word {
  /** Kategori (kun på niva1, brukes til å foretrekke distraktorer i samme tema). */
  k?: string;
  /** Norsk. */
  s: string;
  /** Engelsk. */
  e: string;
  /** Valgfri bildesti (kun niva1). */
  image?: string;
}

export type LevelId = 'niva1' | 'niva2' | 'niva3' | 'niva4';

export interface LevelMetadata {
  name: string;
  description: string;
  wordCount: number;
  hasImages: boolean;
}

export const vocabularyData: Record<LevelId, Word[]> = {
  niva1: [
    { k: 'dyr', s: 'Hund', e: 'Dog', image: 'images/dyr/007-valp.png' },
    { k: 'dyr', s: 'Katt', e: 'Cat', image: 'images/dyr/006-kattunge.png' },
    { k: 'dyr', s: 'Hest', e: 'Horse' }, { k: 'dyr', s: 'Ku', e: 'Cow' }, { k: 'dyr', s: 'Gris', e: 'Pig' },
    { k: 'dyr', s: 'Sau', e: 'Sheep' }, { k: 'dyr', s: 'Fugl', e: 'Bird' }, { k: 'dyr', s: 'Fisk', e: 'Fish' },
    { k: 'dyr', s: 'Mus', e: 'Mouse', image: 'images/dyr/009-mus.png' },
    { k: 'dyr', s: 'And', e: 'Duck', image: 'images/dyr/008-and.png' },
    { k: 'familie', s: 'Mor', e: 'Mother' }, { k: 'familie', s: 'Far', e: 'Father' }, { k: 'familie', s: 'Baby', e: 'Baby' },
    { k: 'familie', s: 'Gutt', e: 'Boy' }, { k: 'familie', s: 'Jente', e: 'Girl' },
    { k: 'farge', s: 'Rød', e: 'Red' }, { k: 'farge', s: 'Blå', e: 'Blue' }, { k: 'farge', s: 'Grønn', e: 'Green' },
    { k: 'farge', s: 'Gul', e: 'Yellow' }, { k: 'farge', s: 'Svart', e: 'Black' }, { k: 'farge', s: 'Hvit', e: 'White' },
    { k: 'farge', s: 'Rosa', e: 'Pink' }, { k: 'farge', s: 'Brun', e: 'Brown' },
    { k: 'tall', s: 'En', e: 'One' }, { k: 'tall', s: 'To', e: 'Two' }, { k: 'tall', s: 'Tre', e: 'Three' },
    { k: 'tall', s: 'Fire', e: 'Four' }, { k: 'tall', s: 'Fem', e: 'Five' }, { k: 'tall', s: 'Seks', e: 'Six' },
    { k: 'tall', s: 'Syv', e: 'Seven' }, { k: 'tall', s: 'Åtte', e: 'Eight' }, { k: 'tall', s: 'Ni', e: 'Nine' }, { k: 'tall', s: 'Ti', e: 'Ten' },
    { k: 'mat', s: 'Eple', e: 'Apple' }, { k: 'mat', s: 'Banan', e: 'Banana' }, { k: 'mat', s: 'Melk', e: 'Milk' }, { k: 'mat', s: 'Vann', e: 'Water' },
    { k: 'kropp', s: 'Hode', e: 'Head' }, { k: 'kropp', s: 'Hånd', e: 'Hand' }, { k: 'kropp', s: 'Fot', e: 'Foot' },
  ],
  niva2: [
    { s: 'Søster', e: 'Sister' }, { s: 'Bror', e: 'Brother' }, { s: 'Bestemor', e: 'Grandmother' },
    { s: 'Bestefar', e: 'Grandfather' }, { s: 'Venn', e: 'Friend' }, { s: 'Familie', e: 'Family' },
    { s: 'Mann', e: 'Man' }, { s: 'Kvinne', e: 'Woman' },
    { s: 'Bjørn', e: 'Bear' }, { s: 'Sol', e: 'Sun' }, { s: 'Måne', e: 'Moon' }, { s: 'Tre', e: 'Tree' },
    { s: 'Blomst', e: 'Flower' }, { s: 'Skog', e: 'Forest' }, { s: 'Fjell', e: 'Mountain' },
    { s: 'Snø', e: 'Snow' }, { s: 'Regn', e: 'Rain' }, { s: 'Elv', e: 'River' },
    { s: 'Skole', e: 'School' }, { s: 'Bok', e: 'Book' }, { s: 'Blyant', e: 'Pencil' }, { s: 'Lærer', e: 'Teacher' },
    { s: 'Elev', e: 'Pupil' }, { s: 'Sekk', e: 'Backpack' }, { s: 'Hus', e: 'House' }, { s: 'Bil', e: 'Car' },
    { s: 'Buss', e: 'Bus' }, { s: 'Sykkel', e: 'Bike' }, { s: 'Ball', e: 'Ball' }, { s: 'Vindu', e: 'Window' },
    { s: 'Øye', e: 'Eye' }, { s: 'Nese', e: 'Nose' }, { s: 'Munn', e: 'Mouth' }, { s: 'Brød', e: 'Bread' },
    { s: 'Is', e: 'Ice cream' }, { s: 'Kake', e: 'Cake' }, { s: 'Sjokolade', e: 'Chocolate' },
    { s: 'Pizza', e: 'Pizza' }, { s: 'Ost', e: 'Cheese' }, { s: 'Egg', e: 'Egg' },
    { s: 'Løpe', e: 'Run' }, { s: 'Hoppe', e: 'Jump' }, { s: 'Spise', e: 'Eat' }, { s: 'Sove', e: 'Sleep' },
    { s: 'Se', e: 'See' }, { s: 'Gå', e: 'Walk' }, { s: 'Leke', e: 'Play' }, { s: 'Lese', e: 'Read' },
    { s: 'Skrive', e: 'Write' }, { s: 'Snakke', e: 'Talk' },
  ],
  niva3: [
    { s: 'Jakke', e: 'Jacket' }, { s: 'Bukse', e: 'Trousers' }, { s: 'Genser', e: 'Sweater' },
    { s: 'T-skjorte', e: 'T-shirt' }, { s: 'Sko', e: 'Shoes' }, { s: 'Kjole', e: 'Dress' },
    { s: 'Lue', e: 'Hat' }, { s: 'Briller', e: 'Glasses' },
    { s: 'Vær', e: 'Weather' }, { s: 'Solrik', e: 'Sunny' }, { s: 'Regnfull', e: 'Rainy' },
    { s: 'Vind', e: 'Wind' }, { s: 'Storm', e: 'Storm' }, { s: 'Kald', e: 'Cold' },
    { s: 'Varm', e: 'Warm' }, { s: 'Vår', e: 'Spring' }, { s: 'Sommer', e: 'Summer' },
    { s: 'Høst', e: 'Autumn' },
    { s: 'Glad', e: 'Happy' }, { s: 'Trist', e: 'Sad' }, { s: 'Sint', e: 'Angry' },
    { s: 'Redd', e: 'Scared' }, { s: 'Sliten', e: 'Tired' }, { s: 'Sulten', e: 'Hungry' },
    { s: 'Tørst', e: 'Thirsty' }, { s: 'Syk', e: 'Sick' }, { s: 'Morsom', e: 'Funny' },
    { s: 'Kjedelig', e: 'Boring' }, { s: 'Rask', e: 'Fast' }, { s: 'Sakte', e: 'Slow' },
    { s: 'Kjøkken', e: 'Kitchen' }, { s: 'Stue', e: 'Living room' }, { s: 'Bad', e: 'Bathroom' },
    { s: 'Soverom', e: 'Bedroom' }, { s: 'Hage', e: 'Garden' }, { s: 'Gulv', e: 'Floor' },
    { s: 'Vegg', e: 'Wall' }, { s: 'Lys', e: 'Light' },
    { s: 'I dag', e: 'Today' }, { s: 'I morgen', e: 'Tomorrow' }, { s: 'I går', e: 'Yesterday' },
    { s: 'Uke', e: 'Week' }, { s: 'År', e: 'Year' }, { s: 'Tid', e: 'Time' },
    { s: 'Hvem', e: 'Who' }, { s: 'Hva', e: 'What' }, { s: 'Hvor', e: 'Where' },
    { s: 'Når', e: 'When' }, { s: 'Hvorfor', e: 'Why' }, { s: 'Hvordan', e: 'How' },
  ],
  niva4: [
    { s: 'Datamaskin', e: 'Computer' }, { s: 'Skjerm', e: 'Screen' }, { s: 'Tastatur', e: 'Keyboard' },
    { s: 'Mus', e: 'Mouse' }, { s: 'Passord', e: 'Password' }, { s: 'Brukernavn', e: 'Username' },
    { s: 'Nettverk', e: 'Network' }, { s: 'Strømme', e: 'Stream' }, { s: 'Ferdighet', e: 'Skill' },
    { s: 'Lag', e: 'Team' }, { s: 'Seier', e: 'Victory' }, { s: 'Tap', e: 'Defeat' },
    { s: 'Mening', e: 'Opinion' }, { s: 'Enig', e: 'Agree' }, { s: 'Uenig', e: 'Disagree' },
    { s: 'Argument', e: 'Argument' }, { s: 'Diskutere', e: 'Discuss' }, { s: 'Forklare', e: 'Explain' },
    { s: 'Beskrive', e: 'Describe' }, { s: 'Viktig', e: 'Important' }, { s: 'Interessant', e: 'Interesting' },
    { s: 'Sannhet', e: 'Truth' }, { s: 'Løgn', e: 'Lie' }, { s: 'Kanskje', e: 'Maybe' },
    { s: 'Faktisk', e: 'Actually' },
    { s: 'Samfunn', e: 'Society' }, { s: 'Demokrati', e: 'Democracy' }, { s: 'Valg', e: 'Election' },
    { s: 'Lov', e: 'Law' }, { s: 'Frihet', e: 'Freedom' }, { s: 'Fred', e: 'Peace' },
    { s: 'Krig', e: 'War' }, { s: 'Nyheter', e: 'News' }, { s: 'Miljø', e: 'Environment' },
    { s: 'Klima', e: 'Climate' }, { s: 'Forurensning', e: 'Pollution' }, { s: 'Gjenbruk', e: 'Recycle' },
    { s: 'Verden', e: 'World' },
    { s: 'Utdanning', e: 'Education' }, { s: 'Kunnskap', e: 'Knowledge' }, { s: 'Prøve', e: 'Test' },
    { s: 'Karakter', e: 'Grade' }, { s: 'Mål', e: 'Goal' }, { s: 'Drøm', e: 'Dream' },
    { s: 'Fremtid', e: 'Future' }, { s: 'Karriere', e: 'Career' }, { s: 'Jobb', e: 'Job' },
    { s: 'Erfaring', e: 'Experience' }, { s: 'Ansvar', e: 'Responsibility' }, { s: 'Respekt', e: 'Respect' },
  ],
};

export const levelMetadata: Record<LevelId, LevelMetadata> = {
  niva1: { name: 'Nivå 1 - Superenkle substantiv', description: 'Førskolenivå / 1. trinn', wordCount: 40, hasImages: true },
  niva2: { name: 'Nivå 2 - Det nære', description: '1.-4. trinn', wordCount: 50, hasImages: false },
  niva3: { name: 'Nivå 3 - Beskrivelser & Hverdag', description: '5.-7. trinn', wordCount: 50, hasImages: false },
  niva4: { name: 'Nivå 4 - Gaming, Samfunn & Meninger', description: '8.-10. trinn', wordCount: 50, hasImages: false },
};

export function getAvailableLevels(): LevelId[] {
  return Object.keys(vocabularyData) as LevelId[];
}

export function getWordsForLevel(level: LevelId): Word[] {
  return vocabularyData[level] ?? [];
}

export function getWordCountForLevel(level: LevelId): number {
  return vocabularyData[level]?.length ?? 0;
}
