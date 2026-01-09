/* ============================================
   SAVED-TESTS.JS - Lærerens Lagrede Prøver
   v0.7.4-BETA - Lagt til dupliseringsfunksjon
   ============================================ */

import { 
    db, 
    collection, 
    query, 
    where, 
    getDocs, 
    deleteDoc, 
    doc,
    orderBy,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp
} from './firebase.js';

// ============================================
// HOVEDFUNKSJON: Vis lagrede prøver
// ============================================
export async function visSavedTests() {
    const container = document.getElementById('prover-liste');
    if (!container) {
        console.error("❌ Container 'prover-liste' ikke funnet!");
        return;
    }

    container.style.display = 'block';
    container.innerHTML = '<p class="loading">⏳ Laster inn lagrede prøver...</p>';

    try {
        const user = window.currentUser;
        if (!user) {
            container.innerHTML = '<p class="error">❌ Du må være innlogget for å se lagrede prøver.</p>';
            return;
        }

        const q = query(
            collection(db, "prover"),
            where("opprettet_av", "==", user.uid),
            orderBy("opprettet_dato", "desc")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📝 Du har ingen lagrede prøver ennå.</p>
                    <p>Gå til <strong>Lag Prøve</strong> for å lage din første!</p>
                </div>
            `;
            return;
        }

        let html = '<div class="saved-tests-grid">';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const proveId = docSnap.id;
            const tittel = data.tittel || 'Uten tittel';
            const antallOrd = data.ordliste ? data.ordliste.length : 0;
            const dato = data.opprettet_dato ? new Date(data.opprettet_dato.toDate()).toLocaleDateString('nb-NO') : 'Ukjent dato';
            const antallGjennomforinger = data.antall_gjennomforinger || 0;

            html += `
                <div class="saved-test-card">
                    <div class="test-header">
                        <h3>${tittel}</h3>
                        <span class="test-date">📅 ${dato}</span>
                    </div>
                    <div class="test-info">
                        <p>📚 <strong>${antallOrd}</strong> ord</p>
                        <p>✅ <strong>${antallGjennomforinger}</strong> gjennomføringer</p>
                        <p class="test-code">🔑 Prøvekode: <code>${proveId}</code></p>
                    </div>
                    <div class="test-actions">
                        <button class="btn-primary" onclick="window.visProveDetaljer('${proveId}')">
                            👁️ Detaljer
                        </button>
                        <button class="btn-warning" onclick="window.redigerProve('${proveId}')">
                            ✏️ Rediger
                        </button>
                        <button class="btn-info" onclick="window.dupliserProve('${proveId}')">
                            📋 Dupliser
                        </button>
                        <button class="btn-secondary" onclick="window.genererQRKode('${proveId}', '${tittel.replace(/'/g, "\\'")}')">
                            📱 QR-kode
                        </button>
                        <button class="btn-success" onclick="window.visResultater('${proveId}', '${tittel.replace(/'/g, "\\'")}')">
                            📊 Resultater
                        </button>
                        <button class="btn-danger" onclick="window.slettProve('${proveId}')">
                            🗑️ Slett
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
        console.log(`✅ Lastet ${querySnapshot.size} prøver`);

    } catch (error) {
        console.error("Feil ved lasting av prøver:", error);
        container.innerHTML = `<p class="error">❌ Kunne ikke laste prøver: ${error.message}</p>`;
    }
}

// ============================================
// NYTT: REDIGER PRØVE
// ============================================

let redigeringOrdliste = [];

/**
 * Åpner redigeringsmodal for en prøve
 */
window.redigerProve = async function(proveId) {
    try {
        // Hent prøve fra Firestore
        const docRef = doc(db, "prover", proveId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("❌ Kunne ikke finne prøven!");
            return;
        }

        const data = docSnap.data();
        const tittel = data.tittel || 'Uten tittel';
        redigeringOrdliste = [...(data.ordliste || [])]; // Kopier ordliste

        // Bygg modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="rediger-modal" onclick="lukkRedigerModal(event)">
                <div class="modal-content modal-large" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="lukkRedigerModal()">✖</button>
                    <h2>✏️ Rediger prøve</h2>
                    
                    <!-- Tittel -->
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label for="rediger-tittel" style="font-size: 16px; font-weight: 600; display: block; margin-bottom: 8px;"><strong>Tittel:</strong></label>
                        <input 
                            type="text" 
                            id="rediger-tittel" 
                            value="${tittel}" 
                            placeholder="Navn på prøven"
                            style="width: 100%; padding: 14px 16px; font-size: 17px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; box-sizing: border-box;"
                        >
                    </div>

                    <!-- Legg til nytt ord -->
                    <div class="form-group" style="margin-bottom: 20px; padding: 20px; background: #f0f8ff; border-radius: 8px;">
                        <h3 style="margin-top: 0;">➕ Legg til nytt ord</h3>
                        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <input 
                                type="text" 
                                id="rediger-norsk-input" 
                                placeholder="Norsk ord"
                                style="flex: 1; min-width: 200px; padding: 14px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit;"
                            >
                            <span style="font-size: 24px; color: #999; flex-shrink: 0;">→</span>
                            <input 
                                type="text" 
                                id="rediger-engelsk-input" 
                                placeholder="English word"
                                style="flex: 1; min-width: 200px; padding: 14px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit;"
                            >
                            <button 
                                onclick="leggTilOrdIRediger()" 
                                class="btn-primary"
                                style="padding: 14px 24px; font-size: 16px; white-space: nowrap; flex-shrink: 0;">
                                ➕ Legg til
                            </button>
                        </div>
                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
                            💡 Tips: Trykk Enter i engelsk-feltet for å legge til raskt
                        </p>
                    </div>

                    <!-- Ordliste -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <h3>📚 Ordliste (<span id="rediger-antall">${redigeringOrdliste.length}</span> ord)</h3>
                        <ul id="rediger-ordliste" style="list-style: none; padding: 0; max-height: 400px; overflow-y: auto;">
                            <!-- Fylles dynamisk -->
                        </ul>
                    </div>

                    <!-- Handlingsknapper -->
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button class="btn-secondary" onclick="lukkRedigerModal()">
                            ❌ Avbryt
                        </button>
                        <button id="lagre-endringer-btn" class="btn-success" onclick="lagreEndringer('${proveId}')">
                            💾 Lagre endringer
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Legg til modal i DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Oppdater ordlisten visuelt
        oppdaterRedigerOrdliste();

        // Legg til Enter-funksjonalitet
        const engelskInput = document.getElementById('rediger-engelsk-input');
        if (engelskInput) {
            engelskInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    leggTilOrdIRediger();
                }
            });
        }

    } catch (error) {
        console.error("Feil ved åpning av redigeringsmodal:", error);
        alert("❌ Kunne ikke åpne redigeringsmodus: " + error.message);
    }
};

/**
 * Oppdater visuell ordliste i redigeringsmodalen
 */
function oppdaterRedigerOrdliste() {
    const listeEl = document.getElementById('rediger-ordliste');
    if (!listeEl) return;

    listeEl.innerHTML = '';

    if (redigeringOrdliste.length === 0) {
        listeEl.innerHTML = `
            <li style="color:#999; text-align:center; padding:30px;">
                <p>Ingen ord i listen ennå...</p>
            </li>
        `;
        return;
    }

    redigeringOrdliste.forEach((ord, index) => {
        const li = document.createElement('li');
        li.style.cssText = `
            display:flex; 
            justify-content:space-between; 
            align-items:center; 
            padding:12px 15px; 
            background:#f9f9f9; 
            border-radius:8px; 
            margin-bottom:8px;
            border-left: 3px solid #0071e3;
        `;

        li.innerHTML = `
            <span style="flex:1;">
                <strong style="color:#0071e3;">${ord.s}</strong> 
                <span style="color:#999; margin:0 10px;">→</span> 
                <span style="color:#333;">${ord.e}</span>
            </span> 
            <button 
                onclick="slettOrdIRediger(${index})" 
                class="btn-danger btn-small" 
                title="Slett ord"
                style="padding:5px 10px; font-size:12px;">
                🗑️ Slett
            </button>
        `;

        listeEl.appendChild(li);
    });

    // Oppdater telling
    const antallEl = document.getElementById('rediger-antall');
    if (antallEl) {
        antallEl.innerText = redigeringOrdliste.length;
    }

    // Oppdater lagreknapp-status
    const lagreBtn = document.getElementById('lagre-endringer-btn');
    if (lagreBtn) {
        if (redigeringOrdliste.length >= 3) {
            lagreBtn.disabled = false;
            lagreBtn.style.opacity = '1';
        } else {
            lagreBtn.disabled = true;
            lagreBtn.style.opacity = '0.5';
            lagreBtn.title = 'Minimum 3 ord kreves';
        }
    }
}

/**
 * Legg til nytt ord i redigeringsmodus
 */
window.leggTilOrdIRediger = function() {
    const norskInput = document.getElementById('rediger-norsk-input');
    const engelskInput = document.getElementById('rediger-engelsk-input');

    if (!norskInput || !engelskInput) return;

    const norsk = norskInput.value.trim();
    const engelsk = engelskInput.value.trim();

    // Validering
    if (!norsk || !engelsk) {
        alert("⚠️ Skriv både norsk og engelsk ord.");
        return;
    }

    // Sjekk for duplikater
    if (redigeringOrdliste.some(ord => 
        ord.s.toLowerCase() === norsk.toLowerCase() || 
        ord.e.toLowerCase() === engelsk.toLowerCase()
    )) {
        alert("⚠️ Dette ordet finnes allerede i listen.");
        return;
    }

    // Legg til ord
    redigeringOrdliste.push({ s: norsk, e: engelsk });
    oppdaterRedigerOrdliste();

    // Reset inputs
    norskInput.value = '';
    engelskInput.value = '';
    norskInput.focus();
};

/**
 * Slett ord fra redigeringslisten
 */
window.slettOrdIRediger = function(index) {
    if (index < 0 || index >= redigeringOrdliste.length) return;

    const slettetOrd = redigeringOrdliste[index];
    
    if (confirm(`Vil du fjerne "${slettetOrd.s}" fra listen?`)) {
        redigeringOrdliste.splice(index, 1);
        oppdaterRedigerOrdliste();
    }
};

/**
 * Lagre endringer til Firestore
 */
window.lagreEndringer = async function(proveId) {
    try {
        const tittelInput = document.getElementById('rediger-tittel');
        if (!tittelInput) {
            alert("❌ Kunne ikke finne tittel-felt!");
            return;
        }

        const nyTittel = tittelInput.value.trim();

        // Validering
        if (!nyTittel) {
            alert("⚠️ Prøven må ha en tittel!");
            tittelInput.focus();
            return;
        }

        if (redigeringOrdliste.length < 3) {
            alert("⚠️ Prøven må ha minst 3 ord!");
            return;
        }

        // Bekreft endringer
        const bekreft = confirm(
            `Lagre endringer til prøven?\n\n` +
            `Tittel: ${nyTittel}\n` +
            `Antall ord: ${redigeringOrdliste.length}`
        );

        if (!bekreft) return;

        // Vis loading
        const lagreBtn = document.getElementById('lagre-endringer-btn');
        if (lagreBtn) {
            lagreBtn.disabled = true;
            lagreBtn.textContent = '💾 Lagrer...';
        }

        // Oppdater i Firestore
        const docRef = doc(db, "prover", proveId);
        await updateDoc(docRef, {
            tittel: nyTittel,
            ordliste: redigeringOrdliste
        });

        // Suksess!
        alert("✅ Prøven er oppdatert!");
        lukkRedigerModal();

        // Oppdater listen
        visSavedTests();

    } catch (error) {
        console.error("Feil ved lagring av endringer:", error);
        alert("❌ Kunne ikke lagre endringer: " + error.message);

        // Reset knapp
        const lagreBtn = document.getElementById('lagre-endringer-btn');
        if (lagreBtn) {
            lagreBtn.disabled = false;
            lagreBtn.textContent = '💾 Lagre endringer';
        }
    }
};

/**
 * Lukk redigeringsmodal
 */
window.lukkRedigerModal = function(event) {
    // Hvis klikk på overlay (ikke på innhold)
    if (event && event.target.id !== 'rediger-modal') return;

    const modal = document.getElementById('rediger-modal');
    if (modal) {
        // Bekreft hvis det er gjort endringer
        const bekreft = confirm("Vil du lukke redigeringsmodus? Ulagrede endringer går tapt.");
        if (bekreft) {
            modal.remove();
            redigeringOrdliste = [];
        }
    }
};

// ============================================
// VIS DETALJER - Eksisterende funksjon
// ============================================
window.visProveDetaljer = async function(proveId) {
    try {
        const docRef = doc(db, "prover", proveId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("❌ Kunne ikke finne prøven!");
            return;
        }

        const data = docSnap.data();
        const ordliste = data.ordliste || [];

        let ordlisteHTML = '<ol class="ordliste">';
        ordliste.forEach(ord => {
            ordlisteHTML += `<li><strong>${ord.s}</strong> → ${ord.e}</li>`;
        });
        ordlisteHTML += '</ol>';

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                    <h2>📋 ${data.tittel || 'Uten tittel'}</h2>
                    <p><strong>Antall ord:</strong> ${ordliste.length}</p>
                    <p><strong>Opprettet:</strong> ${data.opprettet_dato ? new Date(data.opprettet_dato.toDate()).toLocaleDateString('nb-NO') : 'Ukjent'}</p>
                    <h3>Ordliste:</h3>
                    ${ordlisteHTML}
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Lukk</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (error) {
        console.error("Feil ved visning av detaljer:", error);
        alert("❌ Kunne ikke vise detaljer: " + error.message);
    }
};

// ============================================
// VIS RESULTATER - Eksisterende funksjon
// ============================================
window.visResultater = async function(proveId, tittel) {
    try {
        // Vis loading-modal først
        const loadingModal = `
            <div class="modal-overlay" id="resultat-modal">
                <div class="modal-content modal-large" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                    <h2>📊 Resultater: ${tittel}</h2>
                    <p class="loading">⏳ Henter resultater fra Firebase...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingModal);

        // Hent resultater fra Firestore
        const q = query(
            collection(db, "resultater"),
            where("prove_id", "==", proveId)
        );

        const querySnapshot = await getDocs(q);

        // Hvis ingen resultater
        if (querySnapshot.empty) {
            const modalContent = document.querySelector('#resultat-modal .modal-content');
            modalContent.innerHTML = `
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                <h2>📊 Resultater: ${tittel}</h2>
                <div class="empty-state">
                    <p>📭 Ingen elever har gjennomført denne prøven ennå.</p>
                    <p>Del prøvekoden eller QR-koden med elevene dine!</p>
                </div>
                <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Lukk</button>
            `;
            return;
        }

        // Samle data
        const resultater = [];
        querySnapshot.forEach((docSnap) => {
            resultater.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // Sorter (nyeste først)
        resultater.sort((a, b) => {
            const timeA = a.tidspunkt ? a.tidspunkt.toMillis() : 0;
            const timeB = b.tidspunkt ? b.tidspunkt.toMillis() : 0;
            return timeB - timeA;
        });

        // Beregn statistikk
        const statistikk = beregnStatistikk(resultater);

        // Bygg resultat-tabell HTML
        const resultatHTML = byggResultatTabell(resultater, statistikk, tittel, proveId);

        // Oppdater modal
        const modalContent = document.querySelector('#resultat-modal .modal-content');
        modalContent.innerHTML = resultatHTML;

    } catch (error) {
        console.error("Feil ved henting av resultater:", error);
        const modalContent = document.querySelector('#resultat-modal .modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                <h2>📊 Resultater</h2>
                <p class="error">❌ Kunne ikke laste resultater: ${error.message}</p>
                <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Lukk</button>
            `;
        }
    }
};

// ============================================
// HJELPEFUNKSJONER FOR RESULTATER
// ============================================

function beregnStatistikk(resultater) {
    if (resultater.length === 0) {
        return {
            totalt: 0,
            gjennomsnittPoeng: 0,
            gjennomsnittProsent: 0,
            beste: 0,
            verste: 100,
            vanskeligsteOrd: []
        };
    }

    let sumPoeng = 0;
    let sumMaksPoeng = 0;
    let beste = 0;
    let verste = 100;
    const ordFeil = {};

    resultater.forEach(r => {
        const poengsum = r.poengsum || 0;
        const maksPoeng = r.maks_poeng || 0;

        sumPoeng += poengsum;
        sumMaksPoeng += maksPoeng;

        if (maksPoeng > 0) {
            const prosent = Math.round((poengsum / maksPoeng) * 100);
            beste = Math.max(beste, prosent);
            verste = Math.min(verste, prosent);
        }

        // Tell feilsvar
        if (r.svar && Array.isArray(r.svar)) {
            r.svar.forEach(s => {
                if (!s.riktig) {
                    const ord = s.ord_norsk || 'Ukjent';
                    ordFeil[ord] = (ordFeil[ord] || 0) + 1;
                }
            });
        }
    });

    // Sorter vanskeligste ord
    const vanskeligsteOrd = Object.entries(ordFeil)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ord, antall]) => ({ ord, antall }));

    return {
        totalt: resultater.length,
        gjennomsnittPoeng: sumPoeng / resultater.length,
        gjennomsnittMaksPoeng: sumMaksPoeng / resultater.length,
        gjennomsnittProsent: sumMaksPoeng > 0 ? Math.round((sumPoeng / sumMaksPoeng) * 100) : 0,
        beste,
        verste: verste === 100 ? 0 : verste,
        vanskeligsteOrd
    };
}

function byggResultatTabell(resultater, statistikk, tittel, proveId) {
    let html = `
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
        <h2>📊 Resultater: ${tittel}</h2>
        
        <!-- Statistikk-bokser -->
        <div class="statistikk-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
            <div class="stat-box" style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${statistikk.totalt}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Gjennomføringer</div>
            </div>
            <div class="stat-box" style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${statistikk.gjennomsnittProsent}%</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Gjennomsnitt</div>
            </div>
            <div class="stat-box" style="background: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${statistikk.beste}%</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Beste</div>
            </div>
        </div>

        <!-- Excel-eksport knapp -->
        <div style="margin: 20px 0;">
            <button class="btn-success" onclick="window.eksporterTilExcel('${proveId}', '${tittel.replace(/'/g, "\\'")}')">
                📥 Eksporter til Excel
            </button>
        </div>
    `;

    // Vanskeligste ord
    if (statistikk.vanskeligsteOrd.length > 0) {
        html += `
            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px;">
                <h3 style="margin-top: 0;">⚠️ Vanskeligste ord:</h3>
                <ul style="margin: 10px 0;">
        `;
        statistikk.vanskeligsteOrd.forEach(({ ord, antall }) => {
            html += `<li><strong>${ord}</strong> - ${antall} feil</li>`;
        });
        html += `</ul></div>`;
    }

    // Resultat-tabell
    html += `
        <div style="overflow-x: auto; margin-top: 20px;">
            <table class="resultat-tabell" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Elev-ID</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Poeng</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Prosent</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Tid (sek)</th>
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Tidspunkt</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Detaljer</th>
                    </tr>
                </thead>
                <tbody>
    `;

    resultater.forEach((r) => {
        const elevId = r.elev_id || 'Ukjent';
        const poengsum = r.poengsum || 0;
        const maksPoeng = r.maks_poeng || 0;
        const prosent = maksPoeng > 0 ? Math.round((poengsum / maksPoeng) * 100) : 0;
        const varighet = r.varighet_sekunder || 'N/A';
        const tidspunkt = r.tidspunkt 
            ? new Date(r.tidspunkt.toDate()).toLocaleString('nb-NO')
            : 'Ukjent';

        // Farge basert på prosent
        let prosentFarge = '#4caf50';
        if (prosent < 50) prosentFarge = '#f44336';
        else if (prosent < 80) prosentFarge = '#ff9800';

        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${elevId}</td>
                <td style="padding: 10px; text-align: center;">${poengsum}/${maksPoeng}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: ${prosentFarge};">${prosent}%</td>
                <td style="padding: 10px; text-align: center;">${varighet}</td>
                <td style="padding: 10px; font-size: 12px;">${tidspunkt}</td>
                <td style="padding: 10px; text-align: center;">
                    <button 
                        class="btn-small btn-secondary" 
                        onclick="window.visDetaljerteSvar('${r.id}')"
                        style="padding: 5px 10px; font-size: 12px;">
                        👁️ Vis svar
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <div style="margin-top: 20px; text-align: right;">
            <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Lukk</button>
        </div>
    `;

    return html;
}

// ============================================
// VIS DETALJERTE SVAR
// ============================================
window.visDetaljerteSvar = async function(resultatId) {
    try {
        const docRef = doc(db, "resultater", resultatId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("❌ Kunne ikke finne resultat!");
            return;
        }

        const data = docSnap.data();
        const svar = data.svar || [];
        const elevId = data.elev_id || 'Ukjent';
        const poengsum = data.poengsum || 0;
        const maksPoeng = data.maks_poeng || 0;
        const prosent = maksPoeng > 0 ? Math.round((poengsum / maksPoeng) * 100) : 0;

        let svarHTML = '<div style="max-height: 400px; overflow-y: auto;">';

        if (svar.length === 0) {
            svarHTML += '<p>Ingen svar registrert.</p>';
        } else {
            svarHTML += '<ol>';
            svar.forEach((s, i) => {
                const riktigClass = s.riktig ? 'riktig' : 'feil';
                const ikon = s.riktig ? '✅' : '❌';
                const elevSvar = s.elevSvar || '(blank)';

                svarHTML += `
                    <li style="margin-bottom: 10px; padding: 10px; background: ${s.riktig ? '#e8f5e9' : '#ffebee'}; border-radius: 6px;">
                        <strong>${s.ord_norsk}</strong> → ${s.ord_engelsk}<br>
                        <span style="font-size: 13px; color: #666;">Elevens svar: <strong>${elevSvar}</strong> ${ikon}</span>
                    </li>
                `;
            });
            svarHTML += '</ol>';
        }

        svarHTML += '</div>';

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                    <h2>📝 Detaljerte svar</h2>
                    <p><strong>Elev-ID:</strong> ${elevId}</p>
                    <p><strong>Resultat:</strong> ${poengsum}/${maksPoeng} (${prosent}%)</p>
                    <h3>Alle svar:</h3>
                    ${svarHTML}
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Lukk</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (error) {
        console.error("Feil ved visning av detaljerte svar:", error);
        alert("❌ Kunne ikke vise detaljerte svar: " + error.message);
    }
};

// ============================================
// QR-KODE GENERERING
// ============================================
window.genererQRKode = async function(proveId, tittel) {
    const url = `https://glosemester.no/?prove=${proveId}`;
    
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

    const modalHTML = `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-content qr-modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                <h2>📱 QR-kode: ${tittel}</h2>
                <p class="qr-instruksjon">Elever kan skanne denne koden for å starte prøven direkte!</p>
                <div class="qr-container">
                    <img src="${qrApiUrl}" alt="QR-kode" class="qr-image" id="qr-image-${proveId}">
                </div>
                <p class="qr-kode-tekst">Prøvekode: <code>${proveId}</code></p>
                <div class="qr-actions">
                    <button class="btn-primary" onclick="window.lastNedQRKode('${proveId}', '${tittel.replace(/'/g, "\\'")}')">
                        💾 Last ned som PNG
                    </button>
                    <button class="btn-secondary" onclick="window.skrivUtQRKode()">
                        🖨️ Skriv ut
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.lastNedQRKode = async function(proveId, tittel) {
    const img = document.getElementById(`qr-image-${proveId}`);
    if (!img) return;

    try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR_${tittel.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ QR-kode lastet ned!');
    } catch (error) {
        console.error('Feil ved nedlasting:', error);
        alert('❌ Kunne ikke laste ned QR-kode. Prøv høyreklikk → Lagre bilde.');
    }
};

window.skrivUtQRKode = function() {
    window.print();
};

// ============================================
// EXCEL-EKSPORT
// ============================================
window.eksporterTilExcel = async function(proveId, tittel) {
    try {
        console.log('📥 Starter Excel-eksport for:', tittel);
        
        if (typeof XLSX === 'undefined') {
            alert('❌ Excel-biblioteket er ikke lastet. Last siden på nytt og prøv igjen.');
            return;
        }
        
        const q = query(
            collection(db, "resultater"),
            where("prove_id", "==", proveId)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            alert('📭 Ingen resultater å eksportere ennå.');
            return;
        }
        
        const resultater = [];
        querySnapshot.forEach((docSnap) => {
            resultater.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        
        resultater.sort((a, b) => {
            const timeA = a.tidspunkt ? a.tidspunkt.toMillis() : 0;
            const timeB = b.tidspunkt ? b.tidspunkt.toMillis() : 0;
            return timeB - timeA;
        });
        
        const excelData = [];
        
        excelData.push([
            'Elev-ID',
            'Poengsum',
            'Maks Poeng',
            'Prosent',
            'Varighet (sek)',
            'Tidspunkt',
            'Alle Svar (Detaljer)'
        ]);
        
        resultater.forEach((resultat) => {
            const elevId = resultat.elev_id || 'Ukjent';
            const poengsum = resultat.poengsum || 0;
            const maksPoeng = resultat.maks_poeng || 0;
            const prosent = maksPoeng > 0 ? Math.round((poengsum / maksPoeng) * 100) : 0;
            
            const varighet = resultat.varighet_sekunder || 'N/A';
            const tidspunkt = resultat.tidspunkt 
                ? new Date(resultat.tidspunkt.toDate()).toLocaleString('nb-NO')
                : 'Ukjent';
            
            let svarDetaljer = '';
            if (resultat.svar && Array.isArray(resultat.svar)) {
                svarDetaljer = resultat.svar.map((s, i) => {
                    const status = s.riktig ? '✓' : '✗';
                    return `${i+1}. ${s.ord_norsk} → ${s.ord_engelsk} (Svar: ${s.elevSvar || '(blank)'}) ${status}`;
                }).join(' | ');
            }
            
            excelData.push([
                elevId,
                poengsum,
                maksPoeng,
                prosent + '%',
                varighet,
                tidspunkt,
                svarDetaljer
            ]);
        });
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        ws['!cols'] = [
            { wch: 20 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
            { wch: 12 },
            { wch: 18 },
            { wch: 80 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Resultater');
        
        const safeTitle = tittel.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '_');
        const dato = new Date().toISOString().split('T')[0];
        const filnavn = `GloseMester_${safeTitle}_${dato}.xlsx`;
        
        XLSX.writeFile(wb, filnavn);
        
        console.log('✅ Excel-fil generert:', filnavn);
        alert(`✅ Excel-fil lastet ned!\n\nFilnavn: ${filnavn}\nAntall elever: ${resultater.length}`);
        
    } catch (error) {
        console.error('❌ Feil ved Excel-eksport:', error);
        alert('❌ Kunne ikke eksportere til Excel: ' + error.message);
    }
};

// ============================================
// SLETT PRØVE
// ============================================
window.slettProve = async function(proveId) {
    const bekreft = confirm("⚠️ Er du sikker på at du vil slette denne prøven?\n\nDette kan ikke angres!");
    if (!bekreft) return;

    try {
        await deleteDoc(doc(db, "prover", proveId));
        alert("✅ Prøven er slettet!");
        visSavedTests();
    } catch (error) {
        console.error("Feil ved sletting:", error);
        alert("❌ Kunne ikke slette prøven: " + error.message);
    }
};

// ============================================
// EKSPORTERT: Oppdater prøveliste (for auth.js)
// ============================================
export function oppdaterProveliste() {
    visSavedTests();
}
// ============================================
// DUPLISER PRØVE - v0.7.4-BETA
// Legg til i saved-tests.js (nederst i filen)
// ============================================

/**
 * Dupliser prøve - lager kopi med nytt ID
 * @param {string} proveId - ID på prøven som skal dupliseres
 */
window.dupliserProve = async function(proveId) {
    try {
        console.log('📋 Dupliserer prøve:', proveId);
        
        // 1. Hent original prøve fra Firestore
        const docRef = doc(db, "prover", proveId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert("❌ Kunne ikke finne prøven!");
            return;
        }
        
        const originalData = docSnap.data();
        const originalTittel = originalData.tittel || "Uten tittel";
        
        // 2. Vis modal for å gi nytt navn
        const modalHTML = `
            <div class="modal-overlay" id="dupliser-modal">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="lukkDupliserModal()">✖</button>
                    <h2>📋 Dupliser prøve</h2>
                    
                    <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <p style="margin: 0;"><strong>Original prøve:</strong> ${originalTittel}</p>
                        <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
                            ${originalData.ordliste ? originalData.ordliste.length : 0} ord
                        </p>
                    </div>
                    
                    <form id="dupliser-form" onsubmit="event.preventDefault(); bekreftDuplikat('${proveId}');">
                        <div class="form-group">
                            <label for="dupliser-tittel" style="font-weight: 600; display: block; margin-bottom: 8px;">
                                Nytt navn på kopien:
                            </label>
                            <input 
                                type="text" 
                                id="dupliser-tittel" 
                                value="Kopi av ${originalTittel}"
                                required
                                style="width: 100%; padding: 12px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; box-sizing: border-box;"
                            >
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
                                💡 Tips: Gi kopien et beskrivende navn, f.eks. "Familie Uke 43"
                            </p>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffc107;">
                            <p style="margin: 0; font-size: 14px; color: #856404;">
                                <strong>ℹ️ Hva kopieres?</strong><br>
                                ✅ Ordliste (alle ord)<br>
                                ✅ Innstillinger<br>
                                ❌ Antall gjennomføringer (starter på 0)<br>
                                ❌ Elevresultater (ny prøve = nye resultater)
                            </p>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                            <button type="button" class="btn-secondary" onclick="lukkDupliserModal()">
                                ❌ Avbryt
                            </button>
                            <button type="submit" class="btn-success">
                                📋 Opprett kopi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus på tittel-input
        setTimeout(() => {
            const input = document.getElementById('dupliser-tittel');
            if (input) {
                input.focus();
                input.select(); // Marker teksten
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Feil ved duplisering:', error);
        alert('❌ Kunne ikke duplisere prøven: ' + error.message);
    }
};

/**
 * Bekreft og utfør duplikering
 */
window.bekreftDuplikat = async function(originalProveId) {
    try {
        const nyTittel = document.getElementById('dupliser-tittel').value.trim();
        
        if (!nyTittel) {
            alert("❌ Du må gi kopien et navn!");
            return;
        }
        
        // Disable knapp mens vi jobber
        const submitBtn = document.querySelector('#dupliser-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Oppretter kopi...';
        }
        
        console.log('🔄 Oppretter kopi:', nyTittel);
        
        // 1. Hent original prøve
        const docRef = doc(db, "prover", originalProveId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error("Original prøve ikke funnet");
        }
        
        const originalData = docSnap.data();
        
        // 2. Generer nytt prøve-ID (20 tegn)
        const nyttProveId = genererProveKode(20);
        
        // 3. Lag kopi av data
        const kopiData = {
            prove_id: nyttProveId,
            tittel: nyTittel,
            ordliste: originalData.ordliste || [],
            opprettet_av: window.currentUser?.uid || originalData.opprettet_av,
            opprettet_av_epost: window.currentUser?.email || originalData.opprettet_av_epost,
            opprettet_dato: serverTimestamp(),
            antall_gjennomforinger: 0,
            // Behold innstillinger
            vise_norsk: originalData.vise_norsk !== undefined ? originalData.vise_norsk : true,
            vise_engelsk: originalData.vise_engelsk !== undefined ? originalData.vise_engelsk : true,
            // Metadata hvis det finnes
            kategori: originalData.kategori || null,
            fag: originalData.fag || null,
            // Marker som kopi (valgfritt, for debugging)
            kopiert_fra: originalProveId,
            kopiert_dato: serverTimestamp()
        };
        
        // 4. Lagre kopi til Firestore
        const nyttDocRef = doc(db, "prover", nyttProveId);
        await setDoc(nyttDocRef, kopiData);
        
        console.log('✅ Kopi opprettet med ID:', nyttProveId);
        
        // 5. Lukk modal
        lukkDupliserModal();
        
        // 6. Vis suksessmelding
        alert(`✅ Kopi opprettet!\n\nNytt navn: ${nyTittel}\nNy prøvekode: ${nyttProveId}\n\nKopien vises nå i listen.`);
        
        // 7. Last inn prøver på nytt for å vise den nye
        if (typeof window.visSavedTests === 'function') {
            window.visSavedTests();
        }
        
        // 8. Scroll til toppen for å se den nye prøven
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('❌ Feil ved lagring av kopi:', error);
        alert('❌ Kunne ikke opprette kopi: ' + error.message);
        
        // Re-enable knapp
        const submitBtn = document.querySelector('#dupliser-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '📋 Opprett kopi';
        }
    }
};

/**
 * Lukk dupliser-modal
 */
window.lukkDupliserModal = function() {
    const modal = document.getElementById('dupliser-modal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Generer prøvekode (20 tegn) - må finnes allerede i teacher.js
 * Hvis ikke, legg til denne funksjonen:
 */
function genererProveKode(lengde) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultat = '';
    for (let i = 0; i < lengde; i++) {
        resultat += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultat;
}