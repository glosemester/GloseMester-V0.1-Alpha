// ============================================
// GLOSEBANK ADMIN v0.7.3-BETA
// Kun tilgjengelig for admin (Øyvind)
// ============================================

import { 
    db, 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc,
    updateDoc, 
    deleteDoc,
    orderBy,
    serverTimestamp 
} from './firebase.js';

import { visAdminVerktoy } from './admin-verktoey.js';
import { lastInnBrukere } from './brukeradmin.js';

// Eksponer til window
window.lastInnBrukere = lastInnBrukere;

// Admin bruker-ID (Øyvind)
const ADMIN_UID = "QrFRB6xQDnVQsiSd0bzE6rH8z4x2";

// Globale variabler
let currentFilter = 'pending'; // 'all', 'pending', 'approved'
let allProver = []; // Cache av alle prøver

// ============================================
// SJEKK OM BRUKER ER ADMIN
// ============================================
export function erAdmin(user) {
    return user && user.uid === ADMIN_UID;
}

// ============================================
// VIS ADMIN-MENY (kun for admin)
// ============================================
export function visAdminMenyHvisAdmin(user) {
    if (!erAdmin(user)) {
        console.log('❌ Ikke admin-bruker');
        return;
    }
    
    console.log('✅ Admin-bruker detektert:', user.email);
    
    // Vis admin-knappen (oppdatert ID)
    setTimeout(() => {
        const adminBtn = document.getElementById('btn-admin-panel');
        if (adminBtn) {
            adminBtn.style.display = 'inline-block';
            console.log('✅ Admin-knapp aktivert');
        } else {
            console.warn('⚠️ Admin-knapp ikke funnet i HTML');
        }
        
        // Vis også GloseBank-knappen
        const glosebankBtn = document.getElementById('btn-glosebank-browse');
        if (glosebankBtn) {
            glosebankBtn.style.display = 'inline-block';
            console.log('✅ GloseBank-knapp aktivert');
        }
    }, 150);
}

// ============================================
// LAST INN GLOSEBANK-PRØVER
// ============================================
export async function lastInnGlosebankProver() {
    const container = document.getElementById('glosebank-admin-liste');
    if (!container) {
        console.error('❌ glosebank-admin-liste ikke funnet');
        return;
    }
    
    container.innerHTML = '<p class="loading">⏳ Laster GloseBank-prøver...</p>';
    
    try {
        const user = window.currentUser;
        if (!erAdmin(user)) {
            container.innerHTML = '<p class="error">❌ Kun admin har tilgang</p>';
            return;
        }
        
        // Hent ALLE prøver fra glosebank (admin kan se alt)
        const q = query(
            collection(db, "glosebank"),
            orderBy("opprettet_dato", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="empty-state">📭 Ingen prøver i GloseBank ennå.</p>';
            return;
        }
        
        // Samle data
        allProver = [];
        querySnapshot.forEach((docSnap) => {
            allProver.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        
        console.log(`✅ Lastet ${allProver.length} GloseBank-prøver`);
        
        // Vis prøver basert på filter
        visFilterteProver();
        
    } catch (error) {
        console.error('❌ Feil ved lasting av GloseBank:', error);
        container.innerHTML = `<p class="error">❌ Kunne ikke laste: ${error.message}</p>`;
    }
}

// Eksponer til window
window.lastInnGlosebankProver = lastInnGlosebankProver;

// ============================================
// VIS FILTRERTE PRØVER
// ============================================
function visFilterteProver() {
    const container = document.getElementById('glosebank-admin-liste');
    if (!container) return;
    
    // Filtrer prøver
    let filtrert = allProver;
    if (currentFilter === 'pending') {
        filtrert = allProver.filter(p => p.status === 'pending');
    } else if (currentFilter === 'approved') {
        filtrert = allProver.filter(p => p.status === 'approved');
    }
    
    // Oppdater filter-tellere
    const pendingCount = allProver.filter(p => p.status === 'pending').length;
    const approvedCount = allProver.filter(p => p.status === 'approved').length;
    
    const countAll = document.getElementById('filter-count-all');
    const countPending = document.getElementById('filter-count-pending');
    const countApproved = document.getElementById('filter-count-approved');
    
    if (countAll) countAll.textContent = allProver.length;
    if (countPending) countPending.textContent = pendingCount;
    if (countApproved) countApproved.textContent = approvedCount;
    
    // Bygg HTML
    if (filtrert.length === 0) {
        container.innerHTML = '<p class="empty-state">📭 Ingen prøver i denne kategorien.</p>';
        return;
    }
    
    let html = '<div class="glosebank-admin-grid">';
    
    filtrert.forEach((prove) => {
        const tittel = prove.tittel || 'Uten tittel';
        const antallOrd = prove.ordliste ? prove.ordliste.length : 0;
        const dato = prove.opprettet_dato 
            ? new Date(prove.opprettet_dato.toDate()).toLocaleDateString('nb-NO')
            : 'Ukjent';
        const epost = prove.opprettet_av_epost || 'Ukjent';
        const status = prove.status || 'pending';
        const synlig = prove.synlig_for_kunder ? 'Ja' : 'Nei';
        
        // Metadata (kan være null)
        const nivå = prove.nivå || '—';
        const trinn = prove.trinn || '—';
        const emne = prove.emne || '—';
        const lk20 = prove.LK20_kompetansemål && prove.LK20_kompetansemål.length > 0 
            ? prove.LK20_kompetansemål.join(', ') 
            : '—';
        
        // Status badge
        let statusBadge = '';
        if (status === 'pending') {
            statusBadge = '<span class="badge badge-warning">⏳ Pending</span>';
        } else if (status === 'approved') {
            statusBadge = '<span class="badge badge-success">✅ Godkjent</span>';
        }
        
        html += `
            <div class="glosebank-admin-card">
                <div class="card-header">
                    <h3>${tittel}</h3>
                    ${statusBadge}
                </div>
                <div class="card-info">
                    <p><strong>📚 Antall ord:</strong> ${antallOrd}</p>
                    <p><strong>👤 Laget av:</strong> ${epost}</p>
                    <p><strong>📅 Dato:</strong> ${dato}</p>
                    <p><strong>🎓 Nivå:</strong> ${nivå}</p>
                    <p><strong>📖 Trinn:</strong> ${trinn}</p>
                    <p><strong>🏷️ Emne:</strong> ${emne}</p>
                    <p><strong>📋 LK20:</strong> ${lk20}</p>
                    <p><strong>👁️ Synlig:</strong> ${synlig}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-primary btn-small" onclick="window.visProveDetaljerAdmin('${prove.id}')">
                        👁️ Se detaljer
                    </button>
                    ${status === 'pending' ? `
                        <button class="btn-success btn-small" onclick="window.godkjennProve('${prove.id}')">
                            ✅ Godkjenn
                        </button>
                    ` : ''}
                    <button class="btn-secondary btn-small" onclick="window.redigerProveMetadata('${prove.id}')">
                        ✏️ Rediger
                    </button>
                    ${status === 'approved' ? `
                        <button class="btn-warning btn-small" onclick="window.skjulProve('${prove.id}')">
                            🔒 Skjul
                        </button>
                    ` : ''}
                    <button class="btn-danger btn-small" onclick="window.slettFraGlosebank('${prove.id}')">
                        🗑️ Slett
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// ENDRE FILTER
// ============================================
window.endreFilter = function(filter) {
    currentFilter = filter;
    
    // Oppdater knapp-stil
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${filter}`).classList.add('active');
    
    // Vis filtrerte prøver
    visFilterteProver();
};

// ============================================
// VIS PRØVE-DETALJER
// ============================================
window.visProveDetaljerAdmin = async function(proveId) {
    try {
        const docSnap = await getDoc(doc(db, "glosebank", proveId));
        if (!docSnap.exists()) {
            alert('❌ Prøve ikke funnet');
            return;
        }
        
        const data = docSnap.data();
        const ordliste = data.ordliste || [];
        
        let ordlisteHTML = '<ol class="ordliste-preview">';
        ordliste.forEach(ord => {
            ordlisteHTML += `<li><strong>${ord.s}</strong> → ${ord.e}</li>`;
        });
        ordlisteHTML += '</ol>';
        
        const modal = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                    <h2>📋 ${data.tittel || 'Uten tittel'}</h2>
                    <p><strong>Antall ord:</strong> ${ordliste.length}</p>
                    <p><strong>Opprettet av:</strong> ${data.opprettet_av_epost || 'Ukjent'}</p>
                    <p><strong>Status:</strong> ${data.status || 'pending'}</p>
                    <h3>Ordliste:</h3>
                    ${ordlisteHTML}
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Lukk</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        
    } catch (error) {
        console.error('❌ Feil ved visning:', error);
        alert('❌ Kunne ikke vise detaljer: ' + error.message);
    }
};

// ============================================
// GODKJENN PRØVE
// ============================================
window.godkjennProve = async function(proveId) {
    try {
        const docSnap = await getDoc(doc(db, "glosebank", proveId));
        if (!docSnap.exists()) {
            alert('❌ Prøve ikke funnet');
            return;
        }
        
        const data = docSnap.data();
        
        const modal = `
            <div class="modal-overlay">
                <div class="modal-content modal-medium">
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                    <h2>✅ Godkjenn prøve: ${data.tittel}</h2>
                    
                    <form id="godkjenn-form" onsubmit="window.lagreGodkjenning('${proveId}'); return false;">
                        <label>
                            Nivå:
                            <select id="godkjenn-nivå" required>
                                <option value="">Velg nivå</option>
                                <option value="barneskole">Barneskole</option>
                                <option value="ungdomsskole">Ungdomsskole</option>
                                <option value="vgs">VGS</option>
                            </select>
                        </label>
                        
                        <label>
                            Trinn:
                            <input type="text" id="godkjenn-trinn" placeholder="F.eks. 2-4" required>
                        </label>
                        
                        <label>
                            Emne:
                            <input type="text" id="godkjenn-emne" placeholder="F.eks. Familie" required>
                        </label>
                        
                        <label>
                            LK20 (kommaseparert):
                            <input type="text" id="godkjenn-lk20" placeholder="K1, K3">
                        </label>
                        
                        <label>
                            Vanskelighetsgrad:
                            <select id="godkjenn-vanskelighet" required>
                                <option value="">Velg vanskelighetsgrad</option>
                                <option value="lett">Lett</option>
                                <option value="middels">Middels</option>
                                <option value="vanskelig">Vanskelig</option>
                            </select>
                        </label>
                        
                        <label>
                            Admin-notat (valgfritt):
                            <textarea id="godkjenn-notat" rows="3" placeholder="Interne notater..."></textarea>
                        </label>
                        
                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button type="submit" class="btn-success">✅ Godkjenn og publiser</button>
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Avbryt</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        
    } catch (error) {
        console.error('❌ Feil ved godkjenning:', error);
        alert('❌ Kunne ikke godkjenne: ' + error.message);
    }
};

// ============================================
// LAGRE GODKJENNING
// ============================================
window.lagreGodkjenning = async function(proveId) {
    try {
        const nivå = document.getElementById('godkjenn-nivå').value;
        const trinn = document.getElementById('godkjenn-trinn').value;
        const emne = document.getElementById('godkjenn-emne').value;
        const lk20Input = document.getElementById('godkjenn-lk20').value;
        const vanskelighet = document.getElementById('godkjenn-vanskelighet').value;
        const notat = document.getElementById('godkjenn-notat').value;
        
        // Parse LK20 (kommaseparert)
        const lk20 = lk20Input 
            ? lk20Input.split(',').map(k => k.trim()).filter(k => k.length > 0)
            : [];
        
        // Generer tags
        const tags = ['engelsk', emne.toLowerCase(), nivå];
        
        // Oppdater i Firestore
        await updateDoc(doc(db, "glosebank", proveId), {
            nivå: nivå,
            trinn: trinn,
            emne: emne,
            LK20_kompetansemål: lk20,
            vanskelighetsgrad: vanskelighet,
            admin_notat: notat,
            tags: tags,
            status: 'approved',
            synlig_for_kunder: true,
            sist_redigert: serverTimestamp()
        });
        
        // Lukk modal
        document.querySelector('.modal-overlay').remove();
        
        // Reload liste
        await lastInnGlosebankProver();
        
        alert('✅ Prøve godkjent og publisert!');
        
    } catch (error) {
        console.error('❌ Feil ved lagring:', error);
        alert('❌ Kunne ikke lagre: ' + error.message);
    }
};

// ============================================
// REDIGER METADATA
// ============================================
window.redigerProveMetadata = async function(proveId) {
    try {
        const docSnap = await getDoc(doc(db, "glosebank", proveId));
        if (!docSnap.exists()) {
            alert('❌ Prøve ikke funnet');
            return;
        }
        
        const data = docSnap.data();
        
        const modal = `
            <div class="modal-overlay">
                <div class="modal-content modal-medium">
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
                    <h2>✏️ Rediger metadata</h2>
                    
                    <form id="rediger-form" onsubmit="window.lagreRedigering('${proveId}'); return false;">
                        <label>
                            Tittel:
                            <input type="text" id="rediger-tittel" value="${data.tittel || ''}" required>
                        </label>
                        
                        <label>
                            Nivå:
                            <select id="rediger-nivå">
                                <option value="">Ikke satt</option>
                                <option value="barneskole" ${data.nivå === 'barneskole' ? 'selected' : ''}>Barneskole</option>
                                <option value="ungdomsskole" ${data.nivå === 'ungdomsskole' ? 'selected' : ''}>Ungdomsskole</option>
                                <option value="vgs" ${data.nivå === 'vgs' ? 'selected' : ''}>VGS</option>
                            </select>
                        </label>
                        
                        <label>
                            Trinn:
                            <input type="text" id="rediger-trinn" value="${data.trinn || ''}" placeholder="F.eks. 2-4">
                        </label>
                        
                        <label>
                            Emne:
                            <input type="text" id="rediger-emne" value="${data.emne || ''}" placeholder="F.eks. Familie">
                        </label>
                        
                        <label>
                            LK20:
                            <input type="text" id="rediger-lk20" value="${data.LK20_kompetansemål ? data.LK20_kompetansemål.join(', ') : ''}" placeholder="K1, K3">
                        </label>
                        
                        <label>
                            Vanskelighetsgrad:
                            <select id="rediger-vanskelighet">
                                <option value="">Ikke satt</option>
                                <option value="lett" ${data.vanskelighetsgrad === 'lett' ? 'selected' : ''}>Lett</option>
                                <option value="middels" ${data.vanskelighetsgrad === 'middels' ? 'selected' : ''}>Middels</option>
                                <option value="vanskelig" ${data.vanskelighetsgrad === 'vanskelig' ? 'selected' : ''}>Vanskelig</option>
                            </select>
                        </label>
                        
                        <label>
                            Admin-notat:
                            <textarea id="rediger-notat" rows="3">${data.admin_notat || ''}</textarea>
                        </label>
                        
                        <div style="display:flex; gap:10px; margin-top:20px;">
                            <button type="submit" class="btn-primary">💾 Lagre endringer</button>
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Avbryt</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        
    } catch (error) {
        console.error('❌ Feil ved redigering:', error);
        alert('❌ Kunne ikke redigere: ' + error.message);
    }
};

// ============================================
// LAGRE REDIGERING
// ============================================
window.lagreRedigering = async function(proveId) {
    try {
        const tittel = document.getElementById('rediger-tittel').value;
        const nivå = document.getElementById('rediger-nivå').value || null;
        const trinn = document.getElementById('rediger-trinn').value || null;
        const emne = document.getElementById('rediger-emne').value || null;
        const lk20Input = document.getElementById('rediger-lk20').value;
        const vanskelighet = document.getElementById('rediger-vanskelighet').value || null;
        const notat = document.getElementById('rediger-notat').value;
        
        const lk20 = lk20Input 
            ? lk20Input.split(',').map(k => k.trim()).filter(k => k.length > 0)
            : [];
        
        await updateDoc(doc(db, "glosebank", proveId), {
            tittel: tittel,
            nivå: nivå,
            trinn: trinn,
            emne: emne,
            LK20_kompetansemål: lk20,
            vanskelighetsgrad: vanskelighet,
            admin_notat: notat,
            sist_redigert: serverTimestamp()
        });
        
        document.querySelector('.modal-overlay').remove();
        await lastInnGlosebankProver();
        alert('✅ Endringer lagret!');
        
    } catch (error) {
        console.error('❌ Feil ved lagring:', error);
        alert('❌ Kunne ikke lagre: ' + error.message);
    }
};

// ============================================
// SKJUL PRØVE (sett synlig_for_kunder = false)
// ============================================
window.skjulProve = async function(proveId) {
    if (!confirm('Er du sikker på at du vil skjule denne prøven? Den vil ikke lenger være synlig for lærere.')) {
        return;
    }
    
    try {
        await updateDoc(doc(db, "glosebank", proveId), {
            synlig_for_kunder: false,
            sist_redigert: serverTimestamp()
        });
        
        await lastInnGlosebankProver();
        alert('✅ Prøve skjult!');
        
    } catch (error) {
        console.error('❌ Feil ved skjuling:', error);
        alert('❌ Kunne ikke skjule: ' + error.message);
    }
};

// ============================================
// SLETT FRA GLOSEBANK (permanent)
// ============================================
window.slettFraGlosebank = async function(proveId) {
    if (!confirm('⚠️ Er du SIKKER på at du vil slette denne prøven PERMANENT fra GloseBank?\n\nDette kan ikke angres!')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, "glosebank", proveId));
        await lastInnGlosebankProver();
        alert('✅ Prøve slettet!');
        
    } catch (error) {
        console.error('❌ Feil ved sletting:', error);
        alert('❌ Kunne ikke slette: ' + error.message);
    }
};

// ============================================
// FANE-HÅNDTERING
// ============================================
window.visFane = function(faneNavn) {
    console.log('🔄 Bytter til fane:', faneNavn);
    
    // Skjul alle faner
    document.querySelectorAll('.admin-fane').forEach(fane => {
        fane.style.display = 'none';
    });
    
    // Fjern active fra alle tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.borderBottomColor = 'transparent';
        tab.style.color = '#666';
    });
    
    // Vis valgt fane
    const fane = document.getElementById(`fane-${faneNavn}`);
    if (fane) fane.style.display = 'block';
    
    // Sett active på valgt tab
    const tab = document.getElementById(`tab-${faneNavn}`);
    if (tab) {
        tab.classList.add('active');
        tab.style.borderBottomColor = '#0071e3';
        tab.style.color = '#0071e3';
    }
    
    // Last inn data
    switch(faneNavn) {
        case 'glosebank':
            lastInnGlosebankProver();
            break;
        case 'brukere':
            if (typeof window.lastInnBrukere === 'function') {
                window.lastInnBrukere();
            }
            break;
        case 'verktoy':
            // Alltid last admin-verktøy når fanen åpnes
            if (typeof visAdminVerktoy === 'function') {
                visAdminVerktoy();
            }
            break;
    }
};

// ============================================
// INITIALISER ADMIN-PANEL
// ============================================
export function initAdminPanel() {
    console.log('🔧 Initialiserer admin-panel...');
    setTimeout(() => window.visFane('glosebank'), 100);
}
