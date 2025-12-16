// ============================================
// KORT-DISPLAY.JS - GloseMester v1.0 (Module)
// ============================================

import { hentTilfeldigKort } from './practice.js';

const BILDE_STI = 'kort/'; // OBS: Sjekk at mappen din heter dette
const FILTYPE = '.jpg'; 

export function visSamling() {
    initKategoriValg();
    const samling = typeof getSamling === 'function' ? getSamling() : [];
    visKortGrid('samling-liste', samling, true);
}

export function visKortGrid(containerId, liste, showTrade) {
    const con = document.getElementById(containerId);
    if (!con) return;
    con.innerHTML = "";

    let filtrerteKort = [...liste];
    if (window.valgtKategori && window.valgtKategori !== 'alle') {
        filtrerteKort = liste.filter(k => k.kategori === window.valgtKategori);
    }

    oppdaterKategoriTellere(liste);

    if (!filtrerteKort.length) {
        visTomSamlingMelding(con);
        return;
    }

    // Stacking
    const unikeKortMap = new Map();
    filtrerteKort.forEach(kort => {
        if (unikeKortMap.has(kort.id)) {
            unikeKortMap.get(kort.id).antall++;
        } else {
            unikeKortMap.set(kort.id, { ...kort, antall: 1 });
        }
    });

    let visningsListe = Array.from(unikeKortMap.values());

    if (window.valgtSortering === 'id') visningsListe.sort((a, b) => a.id - b.id);
    else if (window.valgtSortering === 'navn') visningsListe.sort((a, b) => a.navn.localeCompare(b.navn));
    else visningsListe.reverse(); 
    
    visningsListe.forEach(k => {
        let tradeBtn = showTrade ? `<button class="trade-btn" onclick="event.stopPropagation(); byttKort(${k.id})">🔄 Bytt</button>` : "";
        const antallBadge = k.antall > 1 ? `<div class="antall-badge">x${k.antall}</div>` : '';
        const bildeUrl = `${BILDE_STI}${k.id}${FILTYPE}`;

        con.innerHTML += `
        <div class="poke-card rarity-${k.rarity.type}" 
             style="border-color:${k.rarity.farge}" 
             onclick="visStortKort('${k.id}', '${k.navn}', '${k.rarity.farge}', '${k.rarity.tekst}', '${k.kategori}')">
            ${antallBadge}
            <div class="kort-bilde-wrapper" style="position: relative; min-height: 90px; display: flex; justify-content: center;">
                 <div class="kort-bilde-placeholder" data-kategori="${k.kategori}" style="display: flex;">${getKategoriEmoji(k.kategori)}</div>
            </div>
            <div class="poke-name">${k.navn}</div>
            <div class="rarity-badge" style="color:${k.rarity.farge}">${k.rarity.tekst}</div>
            ${tradeBtn}
        </div>`;
    });
}

function visTomSamlingMelding(container) {
    const kategoriNavn = window.valgtKategori === 'alle' ? 'samlingen' : window.valgtKategori;
    container.innerHTML = `<div class="tom-samling"><h3>Ingen kort i ${kategoriNavn}</h3></div>`;
}

function getKategoriEmoji(kategori) {
    const emojis = {'biler':'🚗', 'guder':'⚡', 'dinosaurer':'🦖', 'dyr':'🐾', 'alle':'🎴'};
    return emojis[kategori] || '🎴';
}

export function byttSortering(valg) {
    window.valgtSortering = valg;
    if (window.aktivRolle === 'elev' || window.aktivRolle === 'kode') visSamling();
    if (window.aktivRolle === 'oving') typeof window.visOvingSamling === 'function' && window.visOvingSamling();
}

export function visStortKort(id, navn, farge, rarityTekst, kategori) {
    const popup = document.getElementById('kort-popup');
    // Her kan vi sette inn bilde URL hvis bildene eksisterer
    document.getElementById('stort-id').innerText = "#" + id;
    document.getElementById('stort-navn').innerText = navn;
    document.getElementById('stort-rarity').innerText = rarityTekst;
    document.getElementById('stort-rarity').style.color = farge;
    popup.style.display = 'flex';
}

export function lukkKort(e) {
    if (e === null || e.target.id === 'kort-popup') {
        document.getElementById('kort-popup').style.display = 'none';
    }
}

export function visGevinstPopup(kort) {
    const popup = document.getElementById('gevinst-popup');
    // Sett inn bilde logic her om nødvendig
    popup.style.display = 'flex';
    setTimeout(() => { popup.style.display = 'none'; }, 2000);
}

// Merk: Denne funksjonen må kalles fra HTML (onclick), så vi eksponerer den globalt i app.js, 
// MEN her inni modulen må vi kalle hentTilfeldigKort som vi importerte.
window.byttKort = async function(kortId) {
    if (window.credits < 1) { alert("Mangler byttepoeng!"); return; }
    if (!confirm("Bruke 1 poeng for å bytte?")) return;
    if (typeof useCredits === 'function' && !useCredits(1)) return;

    let samling = getSamling();
    const index = samling.findIndex(k => k.id == kortId);
    if (index > -1) {
        samling.splice(index, 1);
        setSamling(samling);
    }
    
    // Her bruker vi den importerte funksjonen
    await hentTilfeldigKort();
    setTimeout(() => visSamling(), 1000);
}

function oppdaterKategoriTellere(samling) {
    const teller = { alle: samling.length, biler: 0, guder: 0, dinosaurer: 0, dyr: 0 };
    samling.forEach(k => { if (teller[k.kategori] !== undefined) teller[k.kategori]++; });
    Object.keys(teller).forEach(kat => {
        document.querySelectorAll(`.count-${kat}`).forEach(el => el.innerText = `(${teller[kat]})`);
    });
}

function initKategoriValg() {
    // Enkel logikk for å sette aktiv knapp
    const cat = window.valgtKategori || 'alle';
    document.querySelectorAll(`.kategori-btn[data-kategori="${cat}"]`).forEach(btn => btn.classList.add('active'));
}

// Eksporter en feilmelding-viser for andre moduler
export function visFeilMelding(fasit) {
    const popup = document.getElementById('feedback-popup');
    document.getElementById('feedback-correct-word').innerText = fasit;
    popup.style.display = 'flex';
    setTimeout(() => { popup.style.display = 'none'; }, 3000);
}