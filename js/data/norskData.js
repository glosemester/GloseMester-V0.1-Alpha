/* ============================================
   NORSKDATA.JS - NorskMester Oppgavedata
   Norskfaglige øvelser tilpasset LK20
   4 nivåer med ulike oppgavetyper
   ============================================ */

export const norskVokabular = {
    niva1: [
        // Ordklasser - Substantiv, verb, adjektiv (flervalg-vennlig)
        { s: "Hva er et substantiv?", e: "Et navneord", kategori: "ordklasser" },
        { s: "Hvilket ord er et verb?", e: "løpe", kategori: "ordklasser" },
        { s: "Hva er et adjektiv?", e: "Et ord som beskriver", kategori: "ordklasser" },
        { s: "Er 'hund' et substantiv?", e: "Ja", kategori: "ordklasser" },
        { s: "Hva slags ord er 'stor'?", e: "adjektiv", kategori: "ordklasser" },
        { s: "Hva slags ord er 'spiser'?", e: "verb", kategori: "ordklasser" },
        { s: "Flertall av 'bil'", e: "biler", kategori: "bøyning" },
        { s: "Flertall av 'hus'", e: "hus", kategori: "bøyning" },
        { s: "Flertall av 'bok'", e: "bøker", kategori: "bøyning" },
        { s: "Flertall av 'barn'", e: "barn", kategori: "bøyning" },
        { s: "Bestemt form av 'gutt'", e: "gutten", kategori: "bøyning" },
        { s: "Bestemt form av 'jente'", e: "jenta", kategori: "bøyning" },
        { s: "Bestemt form av 'eple'", e: "eplet", kategori: "bøyning" },
        { s: "Fortid av 'å spise'", e: "spiste", kategori: "bøyning" },
        { s: "Fortid av 'å lese'", e: "leste", kategori: "bøyning" },
        { s: "Fortid av 'å skrive'", e: "skrev", kategori: "bøyning" },
        { s: "Hva er et pronomen?", e: "Ord som erstatter substantiv", kategori: "ordklasser" },
        { s: "Hva slags ord er 'jeg'?", e: "pronomen", kategori: "ordklasser" },
        { s: "Hva slags ord er 'under'?", e: "preposisjon", kategori: "ordklasser" },
        { s: "Hva slags ord er 'og'?", e: "konjunksjon", kategori: "ordklasser" }
    ],

    niva2: [
        // Rettskriving - Vanlige feil og korrekt skrivemåte
        { s: "Riktig: 'Og' eller 'å'? Han gikk for ___ handle.", e: "å", kategori: "rettskriving" },
        { s: "Riktig: 'Da' eller 'når'? ___ jeg var liten, lekte vi ute.", e: "Da", kategori: "rettskriving" },
        { s: "Riktig: 'Dem' eller 'de'? ___ spiste lunsj.", e: "De", kategori: "rettskriving" },
        { s: "Riktig skrivemåte: 'idag' eller 'i dag'?", e: "i dag", kategori: "rettskriving" },
        { s: "Riktig skrivemåte: 'tilbake' eller 'til bake'?", e: "tilbake", kategori: "rettskriving" },
        { s: "Riktig: 'sine' eller 'deres'? Elevene tok ___ bøker.", e: "sine", kategori: "rettskriving" },
        { s: "Riktig: 'Har' eller 'er'? Han ___ gått hjem.", e: "har", kategori: "rettskriving" },
        { s: "Riktig: 'mye' eller 'mange'? Det er ___ elever her.", e: "mange", kategori: "rettskriving" },
        { s: "Riktig: 'mye' eller 'mange'? Det er ___ vann i glasset.", e: "mye", kategori: "rettskriving" },
        { s: "Riktig: 'en' eller 'et'? ___ hus", e: "et", kategori: "rettskriving" },
        { s: "Riktig: 'en' eller 'ei'? ___ jente", e: "ei", kategori: "rettskriving" },
        { s: "Riktig: 'en' eller 'et'? ___ bord", e: "et", kategori: "rettskriving" },
        { s: "Riktig: 'sammen' eller 'til sammen'? Vi er 20 ___.", e: "til sammen", kategori: "rettskriving" },
        { s: "Hva er forskjellen på 'og' og 'å'?", e: "Og binder sammen, å står foran verb", kategori: "rettskriving" },
        { s: "Riktig: 'noe' eller 'noen'? Er det ___ her?", e: "noen", kategori: "rettskriving" },
        { s: "Riktig: 'noe' eller 'noen'? Vil du ha ___ å drikke?", e: "noe", kategori: "rettskriving" },
        { s: "Riktig tegnsetting: Hva setter vi etter et spørsmål?", e: "spørsmålstegn", kategori: "tegnsetting" },
        { s: "Hvor setter vi komma? Ja ___ det stemmer.", e: "Ja, det stemmer", kategori: "tegnsetting" },
        { s: "Riktig: 'alene' eller 'a lene'?", e: "alene", kategori: "rettskriving" },
        { s: "Riktig: 'imorgen' eller 'i morgen'?", e: "i morgen", kategori: "rettskriving" }
    ],

    niva3: [
        // Synonymer og antonymer
        { s: "Synonym til 'glad'", e: "lykkelig", kategori: "synonym" },
        { s: "Synonym til 'stor'", e: "enorm", kategori: "synonym" },
        { s: "Synonym til 'rask'", e: "hurtig", kategori: "synonym" },
        { s: "Synonym til 'pen'", e: "vakker", kategori: "synonym" },
        { s: "Synonym til 'sint'", e: "rasende", kategori: "synonym" },
        { s: "Synonym til 'gammel'", e: "eldgammel", kategori: "synonym" },
        { s: "Antonym til 'glad'", e: "trist", kategori: "antonym" },
        { s: "Antonym til 'stor'", e: "liten", kategori: "antonym" },
        { s: "Antonym til 'rask'", e: "treg", kategori: "antonym" },
        { s: "Antonym til 'varm'", e: "kald", kategori: "antonym" },
        { s: "Antonym til 'lett'", e: "tung", kategori: "antonym" },
        { s: "Antonym til 'ny'", e: "gammel", kategori: "antonym" },
        { s: "Hva betyr 'formidabel'?", e: "Imponerende", kategori: "ordforståelse" },
        { s: "Hva betyr 'hesitere'?", e: "Å nøle", kategori: "ordforståelse" },
        { s: "Hva betyr 'eminent'?", e: "Fremragende", kategori: "ordforståelse" },
        { s: "Hva betyr 'konsis'?", e: "Kort og presis", kategori: "ordforståelse" },
        { s: "Hva betyr 'redundant'?", e: "Overflødig", kategori: "ordforståelse" },
        { s: "Hva betyr 'ambivalent'?", e: "Tvetydig", kategori: "ordforståelse" },
        { s: "Hva er en metafor?", e: "Et billedlig uttrykk", kategori: "litteratur" },
        { s: "Hva er en simile?", e: "En sammenligning med som eller lik", kategori: "litteratur" }
    ],

    niva4: [
        // Bokmål ↔ Nynorsk oversettelse
        { s: "Nynorsk for 'ikke'", e: "ikkje", kategori: "nynorsk" },
        { s: "Nynorsk for 'språk'", e: "språk", kategori: "nynorsk" },
        { s: "Nynorsk for 'etter'", e: "etter", kategori: "nynorsk" },
        { s: "Nynorsk for 'begynte'", e: "byrja", kategori: "nynorsk" },
        { s: "Nynorsk for 'noe'", e: "noko", kategori: "nynorsk" },
        { s: "Nynorsk for 'noen'", e: "nokon", kategori: "nynorsk" },
        { s: "Nynorsk for 'også'", e: "òg", kategori: "nynorsk" },
        { s: "Nynorsk for 'hvilken'", e: "kva for ein", kategori: "nynorsk" },
        { s: "Nynorsk for 'boken'", e: "boka", kategori: "nynorsk" },
        { s: "Nynorsk for 'jenta'", e: "jenta", kategori: "nynorsk" },
        { s: "Nynorsk for 'gutten'", e: "guten", kategori: "nynorsk" },
        { s: "Nynorsk for 'skolen'", e: "skulen", kategori: "nynorsk" },
        { s: "Nynorsk for 'meget'", e: "mykje", kategori: "nynorsk" },
        { s: "Nynorsk for 'brukte'", e: "brukte", kategori: "nynorsk" },
        { s: "Nynorsk for 'spørsmål'", e: "spørsmål", kategori: "nynorsk" },
        { s: "Bokmål for 'ikkje'", e: "ikke", kategori: "bokmål" },
        { s: "Bokmål for 'noko'", e: "noe", kategori: "bokmål" },
        { s: "Bokmål for 'skulen'", e: "skolen", kategori: "bokmål" },
        { s: "Bokmål for 'guten'", e: "gutten", kategori: "bokmål" },
        { s: "Bokmål for 'mykje'", e: "meget", kategori: "bokmål" }
    ]
};

// Gjør tilgjengelig globalt
if (typeof window !== 'undefined') {
    window.norskVokabular = norskVokabular;
}

console.log('📖 NorskMester data lastet:', {
    niva1: norskVokabular.niva1.length,
    niva2: norskVokabular.niva2.length,
    niva3: norskVokabular.niva3.length,
    niva4: norskVokabular.niva4.length
});
