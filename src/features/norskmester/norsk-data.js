/* ============================================
   NORSK-DATA.JS - NorskMester v2.0
   Norskfaglige øvelser tilpasset LK20
   Portet fra js/data/norskData.js
   ============================================ */

export const norskVokabular = {

    // Nivå 1: Høyfrekvente ord — Diktat (1.-2. trinn)
    niva1: [
        'jeg', 'er', 'det', 'og', 'på', 'en', 'har', 'til', 'kan', 'han',
        'hun', 'den', 'med', 'var', 'som', 'vil', 'men', 'her', 'fra', 'dag',
        'hva', 'meg', 'deg', 'mor', 'far', 'hus', 'mat', 'sol', 'bil', 'bok'
    ],

    // Nivå 2: Vanlige skoleord — Diktat (3.-4. trinn)
    niva2: [
        'skole', 'mange', 'andre', 'dette', 'etter', 'ville', 'skulle', 'kunne',
        'noen', 'eller', 'første', 'siden', 'også', 'disse', 'begynte', 'alltid',
        'allerede', 'gjerne', 'kanskje', 'sikkert', 'virkelig', 'plutselig',
        'egentlig', 'likevel', 'dessuten', 'derimot', 'derfor', 'allikevel',
        'forresten', 'imidlertid'
    ],

    // Nivå 3: Ordklasser — flervalg (4.-6. trinn)
    niva3: [
        { ord: 'løper', ordklasse: 'verb', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'rask', ordklasse: 'adjektiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'hunden', ordklasse: 'substantiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'fort', ordklasse: 'adverb', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'spiser', ordklasse: 'verb', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'stor', ordklasse: 'adjektiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'katten', ordklasse: 'substantiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'langsomt', ordklasse: 'adverb', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'hopper', ordklasse: 'verb', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'søt', ordklasse: 'adjektiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'bilen', ordklasse: 'substantiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'aldri', ordklasse: 'adverb', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'synger', ordklasse: 'verb', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'morsom', ordklasse: 'adjektiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] },
        { ord: 'fuglen', ordklasse: 'substantiv', alternativer: ['verb', 'substantiv', 'adjektiv', 'adverb'] }
    ],

    // Nivå 4: Synonymer — flervalg (5.-7. trinn)
    niva4: [
        { ord: 'glad', synonym: 'fornøyd', alternativer: ['fornøyd', 'trist', 'sint', 'redd'] },
        { ord: 'stor', synonym: 'enorm', alternativer: ['enorm', 'liten', 'smal', 'flat'] },
        { ord: 'rask', synonym: 'rapp', alternativer: ['rapp', 'langsom', 'tung', 'stiv'] },
        { ord: 'vakker', synonym: 'pen', alternativer: ['pen', 'stygg', 'rar', 'kjedelig'] },
        { ord: 'snill', synonym: 'vennlig', alternativer: ['vennlig', 'slem', 'streng', 'kald'] },
        { ord: 'smart', synonym: 'klok', alternativer: ['klok', 'dum', 'lat', 'glem'] },
        { ord: 'trøtt', synonym: 'sliten', alternativer: ['sliten', 'energisk', 'sterk', 'frisk'] },
        { ord: 'morsom', synonym: 'artig', alternativer: ['artig', 'kjedelig', 'trist', 'skremmende'] },
        { ord: 'rar', synonym: 'merkelig', alternativer: ['merkelig', 'vanlig', 'normal', 'kjent'] },
        { ord: 'farlig', synonym: 'risikabelt', alternativer: ['risikabelt', 'trygt', 'rolig', 'fredelig'] }
    ],

    // Nivå 5: Rettskriving — flervalg (6.-8. trinn)
    niva5: [
        { feil: 'tilsynelatende', riktig: 'tilsynelatende', alternativer: ['tilsynelatende', 'tilsyneladende', 'tilsjenlatende', 'tilsynelåtende'] },
        { feil: 'sikkerhetsventil', riktig: 'sikkerhetsventil', alternativer: ['sikkerhetsventil', 'sikkerhetsvenntil', 'sikkerthetsventil', 'sikkerhedsventil'] },
        { feil: 'nødvendig', riktig: 'nødvendig', alternativer: ['nødvendig', 'nødvændig', 'nødvenndeg', 'nødvenddeg'] },
        { feil: 'interessant', riktig: 'interessant', alternativer: ['interessant', 'interessannt', 'interresant', 'interresannt'] },
        { feil: 'utfordring', riktig: 'utfordring', alternativer: ['utfordring', 'utfordrinng', 'utfodring', 'utfording'] },
        { feil: 'spesielt', riktig: 'spesielt', alternativer: ['spesielt', 'speciellt', 'spessielt', 'spesjeldt'] },
        { feil: 'videre', riktig: 'videre', alternativer: ['videre', 'viderre', 'viddere', 'viderre'] },
        { feil: 'hverdag', riktig: 'hverdag', alternativer: ['hverdag', 'hverddag', 'hverdag', 'hvær dag'] }
    ]
};

export const NIVA_KONFIG = {
    niva1: { navn: 'Nivå 1 — Diktat', beskrivelse: '1.-2. trinn · Høyfrekvente ord', type: 'diktat', emoji: '✏️' },
    niva2: { navn: 'Nivå 2 — Diktat', beskrivelse: '3.-4. trinn · Skoleord', type: 'diktat', emoji: '📝' },
    niva3: { navn: 'Nivå 3 — Ordklasser', beskrivelse: '4.-6. trinn · Identifiser ordklassen', type: 'flervalg', emoji: '🔤' },
    niva4: { navn: 'Nivå 4 — Synonymer', beskrivelse: '5.-7. trinn · Finn synonymet', type: 'flervalg', emoji: '💬' },
    niva5: { navn: 'Nivå 5 — Rettskriving', beskrivelse: '6.-8. trinn · Velg riktig stavemåte', type: 'flervalg', emoji: '🔍' }
};
