// ============================================
// KORT-DISPLAY.JS - GloseMester v1.1
// ============================================

import { getSamling, lagreBrukerKort, setSamling, getCredits, getByttepoeng, brukByttepoeng } from '../core/storage.js';
import { spillLyd, visToast, vibrer, lagConfetti } from '../ui/helpers.js';

// --- HOVEDFUNKSJONER ---

export async function hentTilfeldigKort(options = {}) {
    const excludeIds = Array.isArray(options.excludeIds) ? options.excludeIds : (options.excludeIds != null ? [options.excludeIds] : []);

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
    
    const mulige = liste.filter(k => k.rarity.type === rarity && !excludeIds.includes(k.id));
    const fallbackListe = liste.filter(k => !excludeIds.includes(k.id));

    // Hvis vi har ekskludert alt (f.eks. ved veldig liten pool), fall tilbake til original liste.
    const endeligMulige = mulige.length > 0 ? mulige : fallbackListe;

    const kort = endeligMulige.length > 0
        ? endeligMulige[Math.floor(Math.random() * endeligMulige.length)]
        : liste[Math.floor(Math.random() * liste.length)];
    
    lagreBrukerKort(kort);
    visGevinstPopup(kort);
}

// OPPGRADERT FUNKSJON: Fyller ALLE lister (både elev og øving)
export function visSamling() {
    // Oppdater progresjonsvisning i samling-oversikten (hvor langt igjen til belønninger)
    oppdaterSamlingProgresjon();

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
            const byttepoeng = (typeof window.byttepoeng !== "undefined") ? window.byttepoeng : getByttepoeng();
            const harDuplikat = kort.antall >= 2;
            const kanResirkulere = harDuplikat && byttepoeng >= 1;

            // Visuell indikasjon i samlingen for kort som har duplikater
            if (harDuplikat) el.classList.add('duplikat');

            if (harDuplikat) {
                if (kanResirkulere) {
                    byttKnapp = `
                        <button class="btn-resirkuler" onclick="event.stopPropagation(); event.preventDefault(); resirkulerKort(${kort.id})" title="Bytt 2× ${kort.navn} mot 1 (koster 1 byttepoeng)">
                            ♻️ Bytt 2× ${kort.navn} mot 1
                        </button>
                    `;
                } else {
                    byttKnapp = `
                        <button class="btn-resirkuler" disabled title="Du trenger 1 byttepoeng for å resirkulere" title="Bytt 2× ${kort.navn} mot 1 (koster 1 byttepoeng)">
                            ♻️ Bytt 2× ${kort.navn} mot 1
                        </button>
                        <div class="bytte-hint">Trenger 1 byttepoeng</div>
                    `;
                }
            }

            const antallBadge = kort.antall > 1 ? `<div class="antall-badge">${kort.antall}×</div>` : '';
            const duplikatBadge = harDuplikat ? `<div class="trade-btn">♻️ Duplikat</div>` : '';

            el.innerHTML = `
                ${antallBadge}
                ${duplikatBadge}
                <div class="kort-bilde-placeholder" data-kategori="${kort.kategori}">${getEmoji(kort.kategori)}</div>
                <div class="poke-name">${kort.navn}</div>
                <div class="rarity-badge">${kort.rarity.tekst}</div>
                ${byttKnapp}
            `;
            el.onclick = () => visStortKort(kort);
            container.appendChild(el);
        });
    });
}

// --- HJELPERE ---

function oppdaterSamlingProgresjon() {
    // Finn en dedikert container hvis den finnes, ellers lag en enkel blok...
    let holder = document.getElementById('samling-progresjon');

    // Hvis index.html ikke har denne ennå, prøv å ...
    if (!holder) {
        const header = document.querySelector('#oving-samling .samling-header');
        if (header) {
            holder = document.createElement('div');
            holder.id = 'samling-progresjon';
            holder.className = 'samling-progresjon';
            header.insertAdjacentElement('afterend', holder);
        }
    }
    if (!holder) return;

    const credits = (typeof window.credits !== 'undefined') ? window.credits : getCredits();
    const byttepoeng = (typeof window.byttepoeng !== 'undefined') ? window.byttepoeng : getByttepoeng();

    const tilNesteKort = credits % 10 === 0 ? 10 : (10 - (credits % 10));
    // 10 byttepoeng gis per 100 riktige totalt
    const tilNesteBytte = credits % 100 === 0 ? 100 : (100 - (credits % 100));

    holder.innerHTML = `
        <div class="samling-prog-row">🎴 Neste kort om <b>${tilNesteKort}</b> riktige</div>
        <div class="samling-prog-row">♻️ Neste byttepoeng-pakke (10) om <b>${tilNesteBytte}</b> riktige</div>
        <div class="samling-prog-row">Du har <b>${byttepoeng}</b> byttepoeng (1 bytte = 1 poeng)</div>
        <details class="samling-help">
            <summary>Hva er byttepoeng?</summary>
            <div>
                Du får <b>10 byttepoeng</b> for hver <b>100 riktige</b>. Byttepoeng brukes i samlingen for å
                bytte inn <b>2 like kort</b> mot <b>1 nytt</b>.
            </div>
        </details>
        <div class="samling-prog-actions">
            <button class="btn-danger btn-small" onclick="nullstillElevdata()">Nullstill elevdata</button>
        </div>
    `;
}

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

// --- RESIRKULERING: BEKREFTELSESMODAL ---
function visResirkulerBekreftelse(kort, cost = 1) {
    return new Promise((resolve) => {
        // Fjern evt. eksisterende modal
        const eksisterende = document.getElementById('resirkuler-popup');
        if (eksisterende) eksisterende.remove();

        const overlay = document.createElement('div');
        overlay.id = 'resirkuler-popup';
        overlay.className = 'popup-overlay';
        overlay.style.display = 'flex';

        const emoji = kort?.kategori ? getEmoji(kort.kategori) : '🎴';
        const navn = kort?.navn || 'kort';

        overlay.innerHTML = `
            <div class="popup-content">
                <h2>Bekreft bytte</h2>
                <div style="font-size:44px; line-height:1; margin: 8px 0 6px;">${emoji}</div>
                <p>Du bytter inn <b>2 × ${navn}</b> mot <b>1 nytt kort</b>.</p>
                <p style="margin-top:6px; opacity:0.9;">Koster <b>${cost}</b> byttepoeng.</p>
                <div style="display:flex; gap:12px; justify-content:center; margin-top:18px;">
                    <button id="resirkuler-avbryt" class="btn">Avbryt</button>
                    <button id="resirkuler-bekreft" class="btn primary">Bekreft bytte</button>
                </div>
            </div>
        `;

        // Klikk utenfor = avbryt
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });

        document.body.appendChild(overlay);

        const avbrytBtn = overlay.querySelector('#resirkuler-avbryt');
        const bekreftBtn = overlay.querySelector('#resirkuler-bekreft');

        avbrytBtn?.addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
        bekreftBtn?.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
    });
}

window.resirkulerKort = async function(kortId) {
    const byttepoeng = (typeof window.byttepoeng !== "undefined") ? window.byttepoeng : getByttepoeng();
    if (byttepoeng < 1) {
        visToast("Du trenger 1 byttepoeng for å resirkulere.", "error");
        return;
    }

    const samling = getSamling();
    const antall = samling.filter(k => k.id === kortId).length;
    if (antall < 2) {
        visToast("Du må ha 2 like kort for å resirkulere.", "error");
        return;
    }

    const kort = samling.find(k => k.id === kortId);
    const bekreftet = await visResirkulerBekreftelse(kort, 1);
    if (!bekreftet) return;

    // Fjern 2 av valgt kort
    let fjernet = 0;
    const nySamling = samling.filter(k => {
        if (k.id === kortId && fjernet < 2) { fjernet++; return false; }
        return true;
    });

    if (fjernet < 2) {
        visToast("Ikke nok kort.", "error");
        return;
    }

    setSamling(nySamling);
    brukByttepoeng(1);
    spillLyd('klikk');
    visToast('Resirkulerer...', 'info');

    // Resirkulering: nytt kort skal være tilfeldig, men aldri samme som kortet du ofret
    await hentTilfeldigKort({ excludeIds: [kortId] });
    visSamling();
};

// Nullstill elevdata lokalt (samling, credits, byttepoeng)
window.nullstillElevdata = function() {
    const ok = confirm('Vil du nullstille elevdata på denne enheten? Dette sletter samling, credits og byttepoeng for aktiv bruker.');
    if (!ok) return;

    const navn = window.brukerNavn || 'Spiller';
    try {
        localStorage.removeItem('samling_' + navn);
        localStorage.removeItem('credits_' + navn);
        localStorage.removeItem('byttepoeng_' + navn);
    } catch (e) {
        // ignore
    }

    // Oppdater runtime-state
    window.credits = 0;
    window.byttepoeng = 0;

    visToast('Elevdata er nullstilt.', 'success');
    visSamling();
};
