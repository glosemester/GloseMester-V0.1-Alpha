// ============================================
// ADMIN-VERKTØY v0.8.0-BETA
// Legg til standardprøver (Oppdatert med LK20 og setDoc fix)
// ============================================

// VIKTIG: La til setDoc i importen for å kunne bestemme ID på dokumentene
import { db, collection, doc, setDoc, getDoc, serverTimestamp } from './firebase.js';
import { erAdmin } from '../core/auth-helpers.js';

// ✅ FJERNET HARDKODET ADMIN_UID - Bruker nå Firestore-basert sjekk

// ============================================
// ALLE STANDARDPRØVER (21 stk)
// ============================================
const ALLE_STANDARDPROVER = [
  // --- BARNESKOLE (Eksisterende) ---
  {
    id: "std_familie_barn",
    tittel: "Familie - Engelsk",
    beskrivelse: "Grunnleggende familieord",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "1-3. trinn",
    emne: "familie",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "mor", e: "mother" },
      { s: "far", e: "father" },
      { s: "søster", e: "sister" },
      { s: "bror", e: "brother" },
      { s: "bestemor", e: "grandmother" },
      { s: "bestefar", e: "grandfather" },
      { s: "tante", e: "aunt" },
      { s: "onkel", e: "uncle" },
      { s: "kusine", e: "cousin (female)" },
      { s: "fetter", e: "cousin (male)" },
      { s: "baby", e: "baby" },
      { s: "barn", e: "child" },
      { s: "voksen", e: "adult" },
      { s: "familie", e: "family" },
      { s: "foreldre", e: "parents" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 1,
    antall_kopier: 0
  },
  {
    id: "std_dyr_barn",
    tittel: "Dyr - Engelsk",
    beskrivelse: "Vanlige dyr",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "1-4. trinn",
    emne: "dyr",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "hund", e: "dog" },
      { s: "katt", e: "cat" },
      { s: "hest", e: "horse" },
      { s: "ku", e: "cow" },
      { s: "gris", e: "pig" },
      { s: "sau", e: "sheep" },
      { s: "mus", e: "mouse" },
      { s: "fugl", e: "bird" },
      { s: "fisk", e: "fish" },
      { s: "kanin", e: "rabbit" },
      { s: "elefant", e: "elephant" },
      { s: "løve", e: "lion" },
      { s: "tiger", e: "tiger" },
      { s: "bjørn", e: "bear" },
      { s: "slange", e: "snake" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 2,
    antall_kopier: 0
  },
  {
    id: "std_farger_barn",
    tittel: "Farger - Engelsk",
    beskrivelse: "Grunnleggende farger",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "1-3. trinn",
    emne: "farger",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "rød", e: "red" },
      { s: "blå", e: "blue" },
      { s: "gul", e: "yellow" },
      { s: "grønn", e: "green" },
      { s: "oransje", e: "orange" },
      { s: "lilla", e: "purple" },
      { s: "rosa", e: "pink" },
      { s: "brun", e: "brown" },
      { s: "svart", e: "black" },
      { s: "hvit", e: "white" },
      { s: "grå", e: "gray" },
      { s: "lyserød", e: "light pink" },
      { s: "mørkeblå", e: "dark blue" },
      { s: "lysegrønn", e: "light green" },
      { s: "sølv", e: "silver" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 3,
    antall_kopier: 0
  },
  {
    id: "std_mat_barn",
    tittel: "Mat - Engelsk",
    beskrivelse: "Vanlig mat",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "2-4. trinn",
    emne: "mat",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "brød", e: "bread" },
      { s: "melk", e: "milk" },
      { s: "egg", e: "egg" },
      { s: "ost", e: "cheese" },
      { s: "kjøtt", e: "meat" },
      { s: "eple", e: "apple" },
      { s: "banan", e: "banana" },
      { s: "appelsin", e: "orange" },
      { s: "tomat", e: "tomato" },
      { s: "gulrot", e: "carrot" },
      { s: "potet", e: "potato" },
      { s: "pasta", e: "pasta" },
      { s: "ris", e: "rice" },
      { s: "kake", e: "cake" },
      { s: "vann", e: "water" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 4,
    antall_kopier: 0
  },
  {
    id: "std_kropp_barn",
    tittel: "Kropp - Engelsk",
    beskrivelse: "Kroppsdeler",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "2-4. trinn",
    emne: "kropp",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "hode", e: "head" },
      { s: "hånd", e: "hand" },
      { s: "fot", e: "foot" },
      { s: "arm", e: "arm" },
      { s: "ben", e: "leg" },
      { s: "øye", e: "eye" },
      { s: "øre", e: "ear" },
      { s: "nese", e: "nose" },
      { s: "munn", e: "mouth" },
      { s: "tann", e: "tooth" },
      { s: "finger", e: "finger" },
      { s: "tå", e: "toe" },
      { s: "mage", e: "stomach" },
      { s: "rygg", e: "back" },
      { s: "nakke", e: "neck" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 5,
    antall_kopier: 0
  },
  {
    id: "std_tall_barn",
    tittel: "Tall 1-20 - Engelsk",
    beskrivelse: "Tall fra 1 til 20",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "1-3. trinn",
    emne: "tall",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "en", e: "one" },
      { s: "to", e: "two" },
      { s: "tre", e: "three" },
      { s: "fire", e: "four" },
      { s: "fem", e: "five" },
      { s: "seks", e: "six" },
      { s: "sju", e: "seven" },
      { s: "åtte", e: "eight" },
      { s: "ni", e: "nine" },
      { s: "ti", e: "ten" },
      { s: "elleve", e: "eleven" },
      { s: "tolv", e: "twelve" },
      { s: "tretten", e: "thirteen" },
      { s: "fjorten", e: "fourteen" },
      { s: "femten", e: "fifteen" },
      { s: "seksten", e: "sixteen" },
      { s: "sytten", e: "seventeen" },
      { s: "atten", e: "eighteen" },
      { s: "nitten", e: "nineteen" },
      { s: "tjue", e: "twenty" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 6,
    antall_kopier: 0
  },
  {
    id: "std_klaer_barn",
    tittel: "Klær - Engelsk",
    beskrivelse: "Plagg og klær",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "2-4. trinn",
    emne: "klaer",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "bukse", e: "pants" },
      { s: "skjorte", e: "shirt" },
      { s: "genser", e: "sweater" },
      { s: "jakke", e: "jacket" },
      { s: "kjole", e: "dress" },
      { s: "skjørt", e: "skirt" },
      { s: "sko", e: "shoes" },
      { s: "sokker", e: "socks" },
      { s: "hatt", e: "hat" },
      { s: "lue", e: "cap" },
      { s: "votter", e: "mittens" },
      { s: "skjerf", e: "scarf" },
      { s: "belte", e: "belt" },
      { s: "t-skjorte", e: "t-shirt" },
      { s: "shorts", e: "shorts" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 7,
    antall_kopier: 0
  },
  {
    id: "std_vaer_barn",
    tittel: "Vær og årstider - Engelsk",
    beskrivelse: "Vær og årstider",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "2-4. trinn",
    emne: "vaer",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "sol", e: "sun" },
      { s: "regn", e: "rain" },
      { s: "snø", e: "snow" },
      { s: "vind", e: "wind" },
      { s: "torden", e: "thunder" },
      { s: "lyn", e: "lightning" },
      { s: "sky", e: "cloud" },
      { s: "vår", e: "spring" },
      { s: "sommer", e: "summer" },
      { s: "høst", e: "autumn" },
      { s: "vinter", e: "winter" },
      { s: "varmt", e: "hot" },
      { s: "kaldt", e: "cold" },
      { s: "vått", e: "wet" },
      { s: "tørt", e: "dry" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 8,
    antall_kopier: 0
  },
  {
    id: "std_skole_barn",
    tittel: "Skole - Engelsk",
    beskrivelse: "Skole og klasserom",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "5-7. trinn",
    emne: "skole",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "lærer", e: "teacher" },
      { s: "elev", e: "student" },
      { s: "bok", e: "book" },
      { s: "penn", e: "pen" },
      { s: "blyant", e: "pencil" },
      { s: "viskelær", e: "eraser" },
      { s: "tavle", e: "board" },
      { s: "pult", e: "desk" },
      { s: "stol", e: "chair" },
      { s: "sekk", e: "backpack" },
      { s: "linjal", e: "ruler" },
      { s: "klasserom", e: "classroom" },
      { s: "skole", e: "school" },
      { s: "pause", e: "break" },
      { s: "lekse", e: "homework" },
      { s: "test", e: "test" },
      { s: "karakter", e: "grade" },
      { s: "fag", e: "subject" },
      { s: "datamaskin", e: "computer" },
      { s: "papir", e: "paper" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 9,
    antall_kopier: 0
  },
  {
    id: "std_fritid_barn",
    tittel: "Fritid og hobbyer - Engelsk",
    beskrivelse: "Aktiviteter og hobbyer",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "5-7. trinn",
    emne: "fritid",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "fotball", e: "football" },
      { s: "basketball", e: "basketball" },
      { s: "svømming", e: "swimming" },
      { s: "sykling", e: "cycling" },
      { s: "løping", e: "running" },
      { s: "dans", e: "dance" },
      { s: "musikk", e: "music" },
      { s: "sang", e: "singing" },
      { s: "maling", e: "painting" },
      { s: "tegning", e: "drawing" },
      { s: "lesing", e: "reading" },
      { s: "gaming", e: "gaming" },
      { s: "film", e: "movie" },
      { s: "hobby", e: "hobby" },
      { s: "venn", e: "friend" },
      { s: "fest", e: "party" },
      { s: "park", e: "park" },
      { s: "strand", e: "beach" },
      { s: "tur", e: "trip" },
      { s: "lek", e: "play" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 10,
    antall_kopier: 0
  },
  {
    id: "std_transport_barn",
    tittel: "Transport - Engelsk",
    beskrivelse: "Transportmidler",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "5-7. trinn",
    emne: "transport",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "bil", e: "car" },
      { s: "buss", e: "bus" },
      { s: "tog", e: "train" },
      { s: "fly", e: "airplane" },
      { s: "båt", e: "boat" },
      { s: "sykkel", e: "bicycle" },
      { s: "sparkesykkel", e: "scooter" },
      { s: "motorsykkel", e: "motorcycle" },
      { s: "lastebil", e: "truck" },
      { s: "drosje", e: "taxi" },
      { s: "trikk", e: "tram" },
      { s: "helikopter", e: "helicopter" },
      { s: "ubåt", e: "submarine" },
      { s: "rakett", e: "rocket" },
      { s: "vei", e: "road" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 11,
    antall_kopier: 0
  },
  {
    id: "std_hus_barn",
    tittel: "Hus og hjem - Engelsk",
    beskrivelse: "Rom og gjenstander i huset",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "5-7. trinn",
    emne: "hus",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "hus", e: "house" },
      { s: "leilighet", e: "apartment" },
      { s: "rom", e: "room" },
      { s: "stue", e: "living room" },
      { s: "kjøkken", e: "kitchen" },
      { s: "soverom", e: "bedroom" },
      { s: "bad", e: "bathroom" },
      { s: "toalett", e: "toilet" },
      { s: "gang", e: "hallway" },
      { s: "sofa", e: "sofa" },
      { s: "bord", e: "table" },
      { s: "seng", e: "bed" },
      { s: "gardin", e: "curtain" },
      { s: "dør", e: "door" },
      { s: "vindu", e: "window" },
      { s: "lampe", e: "lamp" },
      { s: "TV", e: "TV" },
      { s: "komfyr", e: "stove" },
      { s: "kjøleskap", e: "refrigerator" },
      { s: "hage", e: "garden" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 12,
    antall_kopier: 0
  },
  
  // --- BARNESKOLE (Nye) ---
  {
    id: "std_tid_barn",
    tittel: "Tid og Kalender - Engelsk",
    beskrivelse: "Ukedager, måneder og tidsuttrykk",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "3-5. trinn",
    emne: "hverdag",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "mandag", e: "Monday" },
      { s: "tirsdag", e: "Tuesday" },
      { s: "onsdag", e: "Wednesday" },
      { s: "torsdag", e: "Thursday" },
      { s: "fredag", e: "Friday" },
      { s: "lørdag", e: "Saturday" },
      { s: "søndag", e: "Sunday" },
      { s: "januar", e: "January" },
      { s: "mai", e: "May" },
      { s: "desember", e: "December" },
      { s: "dag", e: "day" },
      { s: "uke", e: "week" },
      { s: "måned", e: "month" },
      { s: "år", e: "year" },
      { s: "helg", e: "weekend" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 12.5, // Settes inn mellom
    antall_kopier: 0
  },
  {
    id: "std_adj_barn",
    tittel: "Motsetninger - Engelsk",
    beskrivelse: "Adjektiver med motsatt betydning",
    fag: "engelsk",
    nivaa: "barneskole",
    trinn: "3-5. trinn",
    emne: "grammatikk",
    LK20_kompetansemaal: ["K1"],
    vanskelighetsgrad: "lett",
    ordliste: [
      { s: "stor", e: "big" },
      { s: "liten", e: "small" },
      { s: "varm", e: "hot" },
      { s: "kald", e: "cold" },
      { s: "glad", e: "happy" },
      { s: "trist", e: "sad" },
      { s: "rask", e: "fast" },
      { s: "sakte", e: "slow" },
      { s: "ung", e: "young" },
      { s: "gammel", e: "old" },
      { s: "høy", e: "tall" },
      { s: "lav", e: "short" },
      { s: "god", e: "good" },
      { s: "dårlig", e: "bad" },
      { s: "ny", e: "new" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 12.6,
    antall_kopier: 0
  },

  // --- UNGDOMSSKOLE (Eksisterende) ---
  {
    id: "std_verb_ung_1",
    tittel: "Verb - Uregelmessige Del 1",
    beskrivelse: "Vanlige uregelmessige verb (infinitiv-preteritum-perfektum)",
    fag: "engelsk",
    nivaa: "ungdomsskole",
    trinn: "8-10. trinn",
    emne: "grammatikk",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "middels",
    ordliste: [
      { s: "å være (be-was-been)", e: "to be" },
      { s: "å ha (have-had-had)", e: "to have" },
      { s: "å gjøre (do-did-done)", e: "to do" },
      { s: "å si (say-said-said)", e: "to say" },
      { s: "å gå (go-went-gone)", e: "to go" },
      { s: "å få (get-got-got)", e: "to get" },
      { s: "å lage (make-made-made)", e: "to make" },
      { s: "å se (see-saw-seen)", e: "to see" },
      { s: "å vite (know-knew-known)", e: "to know" },
      { s: "å ta (take-took-taken)", e: "to take" },
      { s: "å komme (come-came-come)", e: "to come" },
      { s: "å tenke (think-thought-thought)", e: "to think" },
      { s: "å se ut (look-looked-looked)", e: "to look" },
      { s: "å ville (want-wanted-wanted)", e: "to want" },
      { s: "å gi (give-gave-given)", e: "to give" },
      { s: "å bruke (use-used-used)", e: "to use" },
      { s: "å finne (find-found-found)", e: "to find" },
      { s: "å fortelle (tell-told-told)", e: "to tell" },
      { s: "å spørre (ask-asked-asked)", e: "to ask" },
      { s: "å jobbe (work-worked-worked)", e: "to work" },
      { s: "å virke (seem-seemed-seemed)", e: "to seem" },
      { s: "å føle (feel-felt-felt)", e: "to feel" },
      { s: "å prøve (try-tried-tried)", e: "to try" },
      { s: "å forlate (leave-left-left)", e: "to leave" },
      { s: "å ringe (call-called-called)", e: "to call" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 13,
    antall_kopier: 0
  },
  {
    id: "std_verb_ung_2",
    tittel: "Verb - Uregelmessige Del 2",
    beskrivelse: "Flere uregelmessige verb",
    fag: "engelsk",
    nivaa: "ungdomsskole",
    trinn: "8-10. trinn",
    emne: "grammatikk",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "middels",
    ordliste: [
      { s: "å skrive (write-wrote-written)", e: "to write" },
      { s: "å lese (read-read-read)", e: "to read" },
      { s: "å spise (eat-ate-eaten)", e: "to eat" },
      { s: "å drikke (drink-drank-drunk)", e: "to drink" },
      { s: "å kjøpe (buy-bought-bought)", e: "to buy" },
      { s: "å selge (sell-sold-sold)", e: "to sell" },
      { s: "å begynne (begin-began-begun)", e: "to begin" },
      { s: "å bringe (bring-brought-brought)", e: "to bring" },
      { s: "å bygge (build-built-built)", e: "to build" },
      { s: "å velge (choose-chose-chosen)", e: "to choose" },
      { s: "å kjøre (drive-drove-driven)", e: "to drive" },
      { s: "å falle (fall-fell-fallen)", e: "to fall" },
      { s: "å fly (fly-flew-flown)", e: "to fly" },
      { s: "å glemme (forget-forgot-forgotten)", e: "to forget" },
      { s: "å bli (become-became-become)", e: "to become" },
      { s: "å holde (hold-held-held)", e: "to hold" },
      { s: "å møte (meet-met-met)", e: "to meet" },
      { s: "å sitte (sit-sat-sat)", e: "to sit" },
      { s: "å snakke (speak-spoke-spoken)", e: "to speak" },
      { s: "å stå (stand-stood-stood)", e: "to stand" },
      { s: "å synge (sing-sang-sung)", e: "to sing" },
      { s: "å svømme (swim-swam-swum)", e: "to swim" },
      { s: "å lære (teach-taught-taught)", e: "to teach" },
      { s: "å forstå (understand-understood-understood)", e: "to understand" },
      { s: "å vinne (win-won-won)", e: "to win" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 14,
    antall_kopier: 0
  },
  {
    id: "std_adjektiv_ung",
    tittel: "Adjektiver - Engelsk",
    beskrivelse: "Vanlige adjektiv",
    fag: "engelsk",
    nivaa: "ungdomsskole",
    trinn: "8-10. trinn",
    emne: "grammatikk",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "middels",
    ordliste: [
      { s: "stor", e: "big" },
      { s: "liten", e: "small" },
      { s: "lang", e: "long" },
      { s: "kort", e: "short" },
      { s: "høy", e: "tall" },
      { s: "lav", e: "low" },
      { s: "god", e: "good" },
      { s: "dårlig", e: "bad" },
      { s: "rask", e: "fast" },
      { s: "langsom", e: "slow" },
      { s: "ny", e: "new" },
      { s: "gammel", e: "old" },
      { s: "ung", e: "young" },
      { s: "vakker", e: "beautiful" },
      { s: "stygg", e: "ugly" },
      { s: "sterk", e: "strong" },
      { s: "svak", e: "weak" },
      { s: "glad", e: "happy" },
      { s: "trist", e: "sad" },
      { s: "interessant", e: "interesting" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 15,
    antall_kopier: 0
  },
  {
    id: "std_teknologi_ung",
    tittel: "Teknologi - Engelsk",
    beskrivelse: "Teknologi og digitale ord",
    fag: "engelsk",
    nivaa: "ungdomsskole",
    trinn: "8-10. trinn",
    emne: "teknologi",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "middels",
    ordliste: [
      { s: "datamaskin", e: "computer" },
      { s: "mobiltelefon", e: "mobile phone" },
      { s: "nettbrett", e: "tablet" },
      { s: "tastatur", e: "keyboard" },
      { s: "mus", e: "mouse" },
      { s: "skjerm", e: "screen" },
      { s: "høyttaler", e: "speaker" },
      { s: "hodetelefoner", e: "headphones" },
      { s: "internett", e: "internet" },
      { s: "nettside", e: "website" },
      { s: "app", e: "app" },
      { s: "programvare", e: "software" },
      { s: "maskinvare", e: "hardware" },
      { s: "kamera", e: "camera" },
      { s: "video", e: "video" },
      { s: "sosiale medier", e: "social media" },
      { s: "spill", e: "game" },
      { s: "nedlasting", e: "download" },
      { s: "opplasting", e: "upload" },
      { s: "passord", e: "password" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 16,
    antall_kopier: 0
  },

  // --- UNGDOMSSKOLE (Nye) ---
  {
    id: "std_samfunn_ung",
    tittel: "Samfunn og Demokrati",
    beskrivelse: "Ord om samfunn, valg og demokrati",
    fag: "engelsk",
    nivaa: "ungdomsskole",
    trinn: "8-10. trinn",
    emne: "samfunn",
    LK20_kompetansemaal: ["K1", "K3"],
    vanskelighetsgrad: "middels",
    ordliste: [
      { s: "samfunn", e: "society" },
      { s: "demokrati", e: "democracy" },
      { s: "valg", e: "election" },
      { s: "stemme", e: "vote" },
      { s: "regjering", e: "government" },
      { s: "lov", e: "law" },
      { s: "rettighet", e: "right" },
      { s: "frihet", e: "freedom" },
      { s: "ytringsfrihet", e: "freedom of speech" },
      { s: "politiker", e: "politician" },
      { s: "parti", e: "party" },
      { s: "borger", e: "citizen" },
      { s: "likestilling", e: "equality" },
      { s: "fred", e: "peace" },
      { s: "konflikt", e: "conflict" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 17,
    antall_kopier: 0
  },
  {
    id: "std_miljo_ung",
    tittel: "Miljø og Bærekraft",
    beskrivelse: "Klima, miljøvern og naturen",
    fag: "engelsk",
    nivaa: "ungdomsskole",
    trinn: "8-10. trinn",
    emne: "samfunn",
    LK20_kompetansemaal: ["K1", "K3"],
    vanskelighetsgrad: "middels",
    ordliste: [
      { s: "miljø", e: "environment" },
      { s: "klima", e: "climate" },
      { s: "bærekraftig", e: "sustainable" },
      { s: "forurensning", e: "pollution" },
      { s: "resirkulering", e: "recycling" },
      { s: "plast", e: "plastic" },
      { s: "global oppvarming", e: "global warming" },
      { s: "energi", e: "energy" },
      { s: "fornybar", e: "renewable" },
      { s: "natur", e: "nature" },
      { s: "beskytte", e: "protect" },
      { s: "ødelegge", e: "destroy" },
      { s: "avfall", e: "waste" },
      { s: "løsning", e: "solution" },
      { s: "framtid", e: "future" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 18,
    antall_kopier: 0
  },
  {
    id: "std_jobb_ung",
    tittel: "Jobb og Karriere",
    beskrivelse: "Yrker, arbeid og utdanning",
    fag: "engelsk",
    nivaa: "ungdomsskole",
    trinn: "8-10. trinn",
    emne: "arbeidsliv",
    LK20_kompetansemaal: ["K1", "K2"],
    vanskelighetsgrad: "middels",
    ordliste: [
      { s: "jobb", e: "job" },
      { s: "karriere", e: "career" },
      { s: "arbeid", e: "work" },
      { s: "utdanning", e: "education" },
      { s: "søknad", e: "application" },
      { s: "intervju", e: "interview" },
      { s: "sjef", e: "boss" },
      { s: "kollega", e: "colleague" },
      { s: "lønn", e: "salary" },
      { s: "lege", e: "doctor" },
      { s: "ingeniør", e: "engineer" },
      { s: "lærer", e: "teacher" },
      { s: "advokat", e: "lawyer" },
      { s: "sykepleier", e: "nurse" },
      { s: "erfaring", e: "experience" }
    ],
    opprettet_av: "SYSTEM",
    synlig: true,
    rekkefolge: 19,
    antall_kopier: 0
  }
];

/**
 * Legg til manglende standardprøver
 * BRUKER setDoc FOR Å SIKRE RIKTIG ID (hindrer duplikater)
 */
async function leggTilMangledeStandardprover() {
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const prove of ALLE_STANDARDPROVER) {
    try {
      const docRef = doc(db, "standardprover", prove.id);
      const docSnap = await getDoc(docRef);

      // Sjekk om dokumentet finnes
      if (docSnap.exists()) {
        skipped++;
        continue;
      }

      // BRUK setDoc I STEDET FOR addDoc
      // Dette tvinger dokumentet til å bruke 'prove.id' som nøkkel (f.eks 'std_familie_barn')
      await setDoc(docRef, {
        ...prove,
        opprettet_dato: serverTimestamp()
      });

      success++;

    } catch (error) {
      console.error(`❌ Feil ved ${prove.tittel}:`, error);
      failed++;
    }
  }

  return {
    success,
    skipped,
    failed,
    total: ALLE_STANDARDPROVER.length,
    processed: success + skipped + failed
  };
}

/**
 * Vis admin-verktøy i verktøy-fanen
 */
export function visAdminVerktoy() {
  const container = document.getElementById('admin-verktoy-container');
  if (!container) {
    console.warn('❌ admin-verktoy-container ikke funnet');
    return;
  }

  if (document.getElementById('admin-verktoey')) return;

  const verktoeyHTML = `
    <div id="admin-verktoey" style="margin-top: 0; padding: 25px; background: linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%); border: 2px solid #0071e3; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,113,227,0.1);">
      <h3 style="margin-top: 0; color: #0071e3;">🛠️ Admin-verktøy</h3>
      <p style="margin: 15px 0; line-height: 1.6;">Legg til alle 21 standardprøver (ca. 360 ord). Prøver som allerede finnes hoppes over automatisk.</p>
      
      <div style="margin: 20px 0; padding: 15px; background: white; border: 2px solid #ffc107; border-radius: 8px; box-shadow: 0 2px 8px rgba(255,193,7,0.1);">
        <strong style="color: #f57c00;">📚 Standardprøver som legges til:</strong><br>
        <div style="margin-top: 10px; line-height: 1.8; color: #555;">
          <strong>Barneskole (1-7. trinn):</strong><br>
          • Familie, Dyr, Farger, Mat, Kropp<br>
          • Tall 1-20, Klær, Vær, Skole, Fritid<br>
          • Transport, Hus, Tid & Kalender (NY), Motsetninger (NY)<br><br>
          <strong>Ungdomsskole (8-10. trinn):</strong><br>
          • Verb 1 & 2, Adjektiver, Teknologi<br>
          • Samfunn & Demokrati (NY), Miljø (NY), Karriere (NY)
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <button id="btn-legg-til-standardprover" class="btn-primary" style="padding: 12px 24px; font-size: 16px;">
          ➕ Legg til manglende standardprøver
        </button>
        <span id="verktoey-status" style="font-weight: 600; font-size: 15px;"></span>
      </div>
    </div>
  `;

  container.innerHTML = verktoeyHTML;

  const btn = document.getElementById('btn-legg-til-standardprover');
  if (btn) {
    btn.addEventListener('click', async () => {
      const status = document.getElementById('verktoey-status');
      
      btn.disabled = true;
      btn.textContent = '⏳ Sjekker og legger til...';
      status.textContent = '';
      status.style.color = '#666';
      
      try {
        const resultat = await leggTilMangledeStandardprover();
        
        btn.disabled = false;
        btn.textContent = '➕ Legg til manglende standardprøver';
        
        if (resultat.success > 0) {
          status.innerHTML = `✅ <strong>${resultat.success} nye</strong> prøver lagt til! ${resultat.skipped > 0 ? `(${resultat.skipped} fantes fra før)` : ''}`;
          status.style.color = '#4caf50';
        } else if (resultat.skipped > 0) {
          status.innerHTML = `✅ Alle ${resultat.skipped} prøver finnes allerede!`;
          status.style.color = '#0071e3';
        } else {
          status.innerHTML = `⚠️ Ingen prøver ble lagt til`;
          status.style.color = '#ff9800';
        }
        
        if (resultat.failed > 0) {
          status.innerHTML += ` <span style="color: #f44336;">(${resultat.failed} feilet)</span>`;
        }
        
      } catch (error) {
        console.error('Feil ved lasting:', error);
        btn.disabled = false;
        btn.textContent = '➕ Legg til manglende standardprøver';
        status.innerHTML = `❌ Feil: ${error.message}`;
        status.style.color = '#f44336';
      }
    });
  }

}