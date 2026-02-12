/* ============================================
   NORSKDATA.JS - NorskMester Oppgavedata
   Norskfaglige øvelser tilpasset LK20
   6 nivåer med ulike oppgavetyper
   ============================================ */

export const norskVokabular = {

    // =============================================
    // NIVÅ 1: Høyfrekvente ord - Enkel (1.-2. trinn)
    // Diktat-modus: Ordet leses opp, eleven skriver det
    // =============================================
    niva1: [
        { s: "jeg", e: "jeg", kategori: "hford", diktat: true },
        { s: "er", e: "er", kategori: "hford", diktat: true },
        { s: "det", e: "det", kategori: "hford", diktat: true },
        { s: "og", e: "og", kategori: "hford", diktat: true },
        { s: "på", e: "på", kategori: "hford", diktat: true },
        { s: "en", e: "en", kategori: "hford", diktat: true },
        { s: "har", e: "har", kategori: "hford", diktat: true },
        { s: "til", e: "til", kategori: "hford", diktat: true },
        { s: "kan", e: "kan", kategori: "hford", diktat: true },
        { s: "han", e: "han", kategori: "hford", diktat: true },
        { s: "hun", e: "hun", kategori: "hford", diktat: true },
        { s: "den", e: "den", kategori: "hford", diktat: true },
        { s: "med", e: "med", kategori: "hford", diktat: true },
        { s: "var", e: "var", kategori: "hford", diktat: true },
        { s: "som", e: "som", kategori: "hford", diktat: true },
        { s: "vil", e: "vil", kategori: "hford", diktat: true },
        { s: "men", e: "men", kategori: "hford", diktat: true },
        { s: "her", e: "her", kategori: "hford", diktat: true },
        { s: "fra", e: "fra", kategori: "hford", diktat: true },
        { s: "dag", e: "dag", kategori: "hford", diktat: true },
        { s: "hva", e: "hva", kategori: "hford", diktat: true },
        { s: "meg", e: "meg", kategori: "hford", diktat: true },
        { s: "deg", e: "deg", kategori: "hford", diktat: true },
        { s: "mor", e: "mor", kategori: "hford", diktat: true },
        { s: "far", e: "far", kategori: "hford", diktat: true },
        { s: "hus", e: "hus", kategori: "hford", diktat: true },
        { s: "mat", e: "mat", kategori: "hford", diktat: true },
        { s: "sol", e: "sol", kategori: "hford", diktat: true },
        { s: "bil", e: "bil", kategori: "hford", diktat: true },
        { s: "bok", e: "bok", kategori: "hford", diktat: true }
    ],

    // =============================================
    // NIVÅ 2: Høyfrekvente ord - Medium (3.-4. trinn)
    // Diktat-modus med lengre og vanskeligere ord
    // =============================================
    niva2: [
        { s: "skole", e: "skole", kategori: "hford", diktat: true },
        { s: "mange", e: "mange", kategori: "hford", diktat: true },
        { s: "andre", e: "andre", kategori: "hford", diktat: true },
        { s: "dette", e: "dette", kategori: "hford", diktat: true },
        { s: "etter", e: "etter", kategori: "hford", diktat: true },
        { s: "ville", e: "ville", kategori: "hford", diktat: true },
        { s: "skulle", e: "skulle", kategori: "hford", diktat: true },
        { s: "kunne", e: "kunne", kategori: "hford", diktat: true },
        { s: "noen", e: "noen", kategori: "hford", diktat: true },
        { s: "eller", e: "eller", kategori: "hford", diktat: true },
        { s: "fordi", e: "fordi", kategori: "hford", diktat: true },
        { s: "alltid", e: "alltid", kategori: "hford", diktat: true },
        { s: "veldig", e: "veldig", kategori: "hford", diktat: true },
        { s: "kanskje", e: "kanskje", kategori: "hford", diktat: true },
        { s: "plutselig", e: "plutselig", kategori: "hford", diktat: true },
        { s: "egentlig", e: "egentlig", kategori: "hford", diktat: true },
        { s: "vanskelig", e: "vanskelig", kategori: "hford", diktat: true },
        { s: "forskjellig", e: "forskjellig", kategori: "hford", diktat: true },
        { s: "spesielt", e: "spesielt", kategori: "hford", diktat: true },
        { s: "samtidig", e: "samtidig", kategori: "hford", diktat: true },
        { s: "lekser", e: "lekser", kategori: "hford", diktat: true },
        { s: "ferdig", e: "ferdig", kategori: "hford", diktat: true },
        { s: "kjempe", e: "kjempe", kategori: "hford", diktat: true },
        { s: "venner", e: "venner", kategori: "hford", diktat: true },
        { s: "hyggelig", e: "hyggelig", kategori: "hford", diktat: true }
    ],

    // =============================================
    // NIVÅ 3: Ordklasser & Bøyning (3.-5. trinn)
    // Flervalg-modus
    // =============================================
    niva3: [
        { s: "Hva er et substantiv?", e: "Et navneord", kategori: "ordklasser" },
        { s: "Hvilket ord er et verb?", e: "løpe", kategori: "ordklasser" },
        { s: "Hva er et adjektiv?", e: "Et ord som beskriver", kategori: "ordklasser" },
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
        { s: "Hva slags ord er 'jeg'?", e: "pronomen", kategori: "ordklasser" },
        { s: "Hva slags ord er 'under'?", e: "preposisjon", kategori: "ordklasser" },
        { s: "Hva slags ord er 'og'?", e: "konjunksjon", kategori: "ordklasser" },
        { s: "Flertall av 'mann'", e: "menn", kategori: "bøyning" },
        { s: "Fortid av 'å løpe'", e: "løp", kategori: "bøyning" }
    ],

    // =============================================
    // NIVÅ 4: Rettskriving (4.-7. trinn)
    // Skriving-modus (fyll inn riktig)
    // =============================================
    niva4: [
        { s: "Riktig: 'Og' eller 'å'? Han gikk for ___ handle.", e: "å", kategori: "rettskriving" },
        { s: "Riktig: 'Da' eller 'når'? ___ jeg var liten, lekte vi ute.", e: "Da", kategori: "rettskriving" },
        { s: "Riktig: 'Dem' eller 'de'? ___ spiste lunsj.", e: "De", kategori: "rettskriving" },
        { s: "Riktig skrivemåte: 'idag' eller 'i dag'?", e: "i dag", kategori: "rettskriving" },
        { s: "Riktig skrivemåte: 'tilbake' eller 'til bake'?", e: "tilbake", kategori: "rettskriving" },
        { s: "Riktig: 'Har' eller 'er'? Han ___ gått hjem.", e: "har", kategori: "rettskriving" },
        { s: "Riktig: 'mye' eller 'mange'? Det er ___ elever her.", e: "mange", kategori: "rettskriving" },
        { s: "Riktig: 'mye' eller 'mange'? Det er ___ vann i glasset.", e: "mye", kategori: "rettskriving" },
        { s: "Riktig: 'en' eller 'et'? ___ hus", e: "et", kategori: "rettskriving" },
        { s: "Riktig: 'en' eller 'et'? ___ bord", e: "et", kategori: "rettskriving" },
        { s: "Riktig: 'noe' eller 'noen'? Er det ___ her?", e: "noen", kategori: "rettskriving" },
        { s: "Riktig: 'noe' eller 'noen'? Vil du ha ___ å drikke?", e: "noe", kategori: "rettskriving" },
        { s: "Riktig: 'alene' eller 'a lene'?", e: "alene", kategori: "rettskriving" },
        { s: "Riktig: 'imorgen' eller 'i morgen'?", e: "i morgen", kategori: "rettskriving" },
        { s: "Riktig: 'ikkveld' eller 'i kveld'?", e: "i kveld", kategori: "rettskriving" },
        { s: "Riktig: 'selvfølgelig' eller 'sjølvfølgelig'?", e: "selvfølgelig", kategori: "rettskriving" },
        { s: "Riktig: 'igjen' eller 'i gjen'?", e: "igjen", kategori: "rettskriving" },
        { s: "Riktig: 'ihvertfall' eller 'i hvert fall'?", e: "i hvert fall", kategori: "rettskriving" },
        { s: "Riktig: 'imellom' eller 'i mellom'?", e: "imellom", kategori: "rettskriving" },
        { s: "Riktig: 'for eksempel' eller 'foreksempel'?", e: "for eksempel", kategori: "rettskriving" }
    ],

    // =============================================
    // NIVÅ 5: Synonymer & Ordforståelse (5.-8. trinn)
    // Flervalg-modus
    // =============================================
    niva5: [
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

    // =============================================
    // NIVÅ 6: Bokmål ↔ Nynorsk (6.-10. trinn)
    // Skriving-modus
    // =============================================
    niva6: [
        { s: "Nynorsk for 'ikke'", e: "ikkje", kategori: "nynorsk" },
        { s: "Nynorsk for 'begynte'", e: "byrja", kategori: "nynorsk" },
        { s: "Nynorsk for 'noe'", e: "noko", kategori: "nynorsk" },
        { s: "Nynorsk for 'noen'", e: "nokon", kategori: "nynorsk" },
        { s: "Nynorsk for 'også'", e: "òg", kategori: "nynorsk" },
        { s: "Nynorsk for 'hvilken'", e: "kva for ein", kategori: "nynorsk" },
        { s: "Nynorsk for 'boken'", e: "boka", kategori: "nynorsk" },
        { s: "Nynorsk for 'gutten'", e: "guten", kategori: "nynorsk" },
        { s: "Nynorsk for 'skolen'", e: "skulen", kategori: "nynorsk" },
        { s: "Nynorsk for 'meget'", e: "mykje", kategori: "nynorsk" },
        { s: "Nynorsk for 'henne'", e: "ho", kategori: "nynorsk" },
        { s: "Nynorsk for 'hvordan'", e: "korleis", kategori: "nynorsk" },
        { s: "Nynorsk for 'fikk'", e: "fekk", kategori: "nynorsk" },
        { s: "Bokmål for 'ikkje'", e: "ikke", kategori: "bokmål" },
        { s: "Bokmål for 'noko'", e: "noe", kategori: "bokmål" },
        { s: "Bokmål for 'skulen'", e: "skolen", kategori: "bokmål" },
        { s: "Bokmål for 'guten'", e: "gutten", kategori: "bokmål" },
        { s: "Bokmål for 'mykje'", e: "meget", kategori: "bokmål" },
        { s: "Bokmål for 'korleis'", e: "hvordan", kategori: "bokmål" },
        { s: "Bokmål for 'fekk'", e: "fikk", kategori: "bokmål" }
    ]
};

// Gjør tilgjengelig globalt
if (typeof window !== 'undefined') {
    window.norskVokabular = norskVokabular;
}

