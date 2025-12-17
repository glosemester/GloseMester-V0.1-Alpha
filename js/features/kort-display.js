// ============================================
// KORT-DISPLAY.JS - GloseMester v1.1
// ============================================

import { getSamling, lagreBrukerKort, setSamling } from '../core/storage.js';
import { spillLyd, visToast, vibrer, lagConfetti } from '../ui/helpers.js';

// --- HOVEDFUNKSJONER ---

export async function hentTilfeldigKort() {
    const kategorier = ['biler', 'guder', 'dinosaurer', 'dyr'];
    const kat = kategorier[Math.floor(Math.random() * kategorier.length)];
    
    if (!window.kortSamling) {
        console.error("Mangler window.kortSamling!");
        return;
    }

    const liste = window.kortSamling[kat];
    const r = Math.random() * 100;
    let rarity = 'vanlig';
    if(r > 98) rarity = 'legendary';
    else if(r > 85) rarity = 'episk';
    else if(r > 60) rarity = 'sjelden';
    
    const mulige = liste.filter(k => k.rarity.type === rarity);
    const kort = mulige.length > 0 
        ? mulige[Math.floor(Math.random() * mulige.length)]
        : liste[Math.floor(Math.random() * liste.length)];
    
    lagreBrukerKort(kort);
    visGevinstPopup(kort);
}

// OPPGRADERT FUNKSJON: Fyller ALLE lister (både elev og øving)
export function visSamling() {
    const samling = getSamling();
    
    // Vi finner ALLE containere med klassen .samling-grid for å unngå ID-trøbbel
    const containere = document.querySelectorAll('.samling-grid');
    
    containere.forEach(container => {
        container.innerHTML = '';
        
        if(samling.length === 0) {
            container.innerHTML = '<p class="tom-tekst">Du har ingen kort ennå. Øv mer!</p>';
            return;
        }
        
        // Sortering
        let sortertSamling = [...samling];
        if (window.valgtSortering === 'nyeste') sortertSamling.reverse(); 
        else if (window.valgtSortering === 'sjeldenhet') {
            const verdi = { 'legendary': 4, 'episk': 3, 'sjelden': 2, 'vanlig': 1 };
            sortertSamling.sort((a, b) => verdi[b.rarity.type] - verdi[a.rarity.type]);
        } else if (window.valgtSortering === 'navn') sortertSamling.sort((a, b) => a.navn.localeCompare(b.navn));

        // Gruppering
        const grupper = {};
        sortertSamling.forEach(k => {
            if(!grupper[k.id]) grupper[k.id] = { ...k, antall: 0 };
            grupper[k.id].antall++;
        });
        
        // Tegn kort
        Object.values(grupper).forEach(kort => {
            const el = document.createElement('div');
            el.className = `poke-card rarity-${kort.rarity.type}`;
            
            let byttKnapp = '';
            if(kort.antall > 1) {
                byttKnapp = `<button class="btn-resirkuler" onclick="event.stopPropagation(); resirkulerKort(${kort.id})">♻️ Bytt 2 mot 1</button>`;
            }
            
            el.innerHTML = `
                <div class="kort-bilde-placeholder">${getEmoji(kort.kategori)}</div>
                <div class="kort-navn">${kort.navn}</div>
                <div class="kort-antall">x${kort.antall}</div>
                ${byttKnapp}
            `;
            el.onclick = () => visStortKort(kort);
            container.appendChild(el);
        });
    });
}

// --- HJELPERE ---

export function visStortKort(kort) {
    visGevinstPopup(kort, false); 
}

export function lukkKort() {
    const popup = document.getElementById('gevinst-popup');
    if(popup) popup.style.display = 'none';
}

export function byttSortering() {
    if (window.valgtSortering === 'nyeste') window.valgtSortering = 'sjeldenhet';
    else if (window.valgtSortering === 'sjeldenhet') window.valgtSortering = 'navn';
    else window.valgtSortering = 'nyeste';
    
    visToast(`Sorterer etter: ${window.valgtSortering}`, 'info');
    visSamling();
}

export function visFeilMelding(melding) {
    visToast(melding, 'error');
    vibrer([50, 50, 50]);
}

function getEmoji(k) {
    const map = { biler:'🚗', guder:'🏛️', dinosaurer:'🦖', dyr:'🐾' };
    return map[k] || '🎴';
}

function visGevinstPopup(kort, spillFanfare = true) {
    const popup = document.getElementById('gevinst-popup');
    if(!popup) return;

    document.getElementById('gevinst-navn').innerText = kort.navn;
    
    const rarityEl = document.getElementById('gevinst-rarity');
    if(rarityEl) {
        rarityEl.innerText = kort.rarity.tekst;
        rarityEl.className = `rarity-badge ${kort.rarity.type}`;
    }
    
    popup.style.display = 'flex';
    
    if (spillFanfare) {
        if(kort.rarity.type === 'legendary') spillLyd('fanfare');
        else spillLyd('vinn');
        lagConfetti();
    }
}

// Koble til window
window.resirkulerKort = async function(kortId) {
    if(!confirm("Vil du bytte inn 2 av dette kortet mot 1 helt nytt?")) return;
    let samling = getSamling();
    let fjernet = 0;
    samling = samling.filter(k => {
        if(k.id === kortId && fjernet < 2) { fjernet++; return false; }
        return true;
    });
    
    if(fjernet < 2) { visToast("Ikke nok kort.", 'error'); return; }
    
    setSamling(samling);
    spillLyd('klikk');
    visToast('Resirkulerer...', 'info');
    setTimeout(async () => {
        await hentTilfeldigKort();
        visSamling(); 
    }, 1000);
};