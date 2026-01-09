// ============================================
// BRUKERADMINISTRASJON
// v0.7.3-BETA
// Kun tilgjengelig for admin
// ============================================

import { 
    db, 
    collection, 
    query, 
    getDocs, 
    doc, 
    getDoc,
    updateDoc,
    orderBy,
    serverTimestamp 
} from './firebase.js';

// Admin bruker-ID
const ADMIN_UID = "QrFRB6xQDnVQsiSd0bzE6rH8z4x2";

// Cache
let alleBrukere = [];

// ============================================
// SJEKK ADMIN
// ============================================
function erAdmin(user) {
    return user && user.uid === ADMIN_UID;
}

// ============================================
// LAST INN BRUKERE
// ============================================
export async function lastInnBrukere() {
    const container = document.getElementById('brukeradmin-liste');
    if (!container) {
        console.error('❌ brukeradmin-liste ikke funnet');
        return;
    }
    
    container.innerHTML = '<p class="loading">⏳ Laster brukere...</p>';
    
    try {
        const user = window.currentUser;
        if (!erAdmin(user)) {
            container.innerHTML = '<p class="error">❌ Kun admin har tilgang</p>';
            return;
        }
        
        // Hent alle brukere
        const q = query(
            collection(db, "users"),
            orderBy("email", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="empty-state">📭 Ingen brukere funnet.</p>';
            return;
        }
        
        // Samle data
        alleBrukere = [];
        querySnapshot.forEach((docSnap) => {
            alleBrukere.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        
        console.log(`✅ Lastet ${alleBrukere.length} brukere`);
        
        // Vis statistikk
        visStatistikk();
        
        // Vis brukerliste
        visBrukerliste(alleBrukere);
        
    } catch (error) {
        console.error('❌ Feil ved lasting av brukere:', error);
        container.innerHTML = `<p class="error">❌ Kunne ikke laste brukere: ${error.message}</p>`;
    }
}

// ============================================
// VIS STATISTIKK
// ============================================
function visStatistikk() {
    const statsContainer = document.getElementById('brukeradmin-stats');
    if (!statsContainer) return;
    
    // Beregn statistikk
    const totalt = alleBrukere.length;
    const free = alleBrukere.filter(u => !u.abonnement || u.abonnement.type === 'free').length;
    const premium = alleBrukere.filter(u => u.abonnement?.type === 'premium' && u.abonnement?.status === 'active').length;
    const skolepakke = alleBrukere.filter(u => u.abonnement?.type === 'skolepakke' && u.abonnement?.status === 'active').length;
    
    // Utløper snart (neste 30 dager)
    const now = Date.now();
    const tredageFrem = now + (30 * 24 * 60 * 60 * 1000);
    const utloperSnart = alleBrukere.filter(u => {
        if (!u.abonnement?.utloper) return false;
        const utloper = u.abonnement.utloper.toMillis();
        return utloper > now && utloper < tredageFrem;
    }).length;
    
    statsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div class="stat-box" style="background: #e3f2fd; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #1976d2;">${totalt}</div>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">Totalt brukere</div>
            </div>
            <div class="stat-box" style="background: #f3e5f5; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #7b1fa2;">${free}</div>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">Gratis</div>
            </div>
            <div class="stat-box" style="background: #e8f5e9; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #388e3c;">${premium}</div>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">Premium</div>
            </div>
            <div class="stat-box" style="background: #fff3e0; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #f57c00;">${skolepakke}</div>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">Skolepakke</div>
            </div>
            <div class="stat-box" style="background: #ffebee; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #c62828;">${utloperSnart}</div>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">Utløper snart</div>
            </div>
        </div>
    `;
}

// ============================================
// VIS BRUKERLISTE
// ============================================
function visBrukerliste(brukere) {
    const container = document.getElementById('brukeradmin-liste');
    if (!container) return;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <input 
                type="text" 
                id="bruker-sok" 
                placeholder="🔍 Søk etter e-post eller navn..."
                style="width: 100%; max-width: 400px; padding: 12px 16px; font-size: 15px; border: 2px solid #ddd; border-radius: 8px;"
                oninput="window.sokBrukere(this.value)"
            >
        </div>
        
        <div style="overflow-x: auto;">
            <table class="bruker-tabell" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                        <th style="padding: 15px; text-align: left; font-weight: 600;">E-post</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600;">Navn</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Rolle</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Abonnement</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Status</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Utløper</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Handlinger</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    brukere.forEach((bruker) => {
        const email = bruker.email || 'Ukjent';
        const navn = bruker.navn || '-';
        const rolle = bruker.rolle || 'lærer';
        const abonnement = bruker.abonnement || { type: 'free', status: 'active' };
        const abonnementType = abonnement.type || 'free';
        const status = abonnement.status || 'active';
        
        // Utløpsdato
        let utloperTekst = '-';
        if (abonnement.utloper) {
            const utloperDato = new Date(abonnement.utloper.toDate());
            utloperTekst = utloperDato.toLocaleDateString('nb-NO');
            
            // Sjekk om utløpt
            if (utloperDato < new Date()) {
                utloperTekst += ' ⚠️';
            }
        }
        
        // Farge for abonnement
        let abonnementFarge = '#9c27b0'; // free (lilla)
        if (abonnementType === 'premium') abonnementFarge = '#4caf50'; // grønn
        if (abonnementType === 'skolepakke') abonnementFarge = '#ff9800'; // oransje
        
        // Farge for status
        let statusFarge = status === 'active' ? '#4caf50' : '#f44336';
        
        html += `
            <tr style="border-bottom: 1px solid #eee;" id="bruker-rad-${bruker.id}">
                <td style="padding: 15px;">
                    <strong>${email}</strong>
                    ${bruker.id === ADMIN_UID ? '<span style="color: #f44336; font-weight: 600; margin-left: 8px;">👑 ADMIN</span>' : ''}
                </td>
                <td style="padding: 15px;">${navn}</td>
                <td style="padding: 15px; text-align: center;">
                    <span style="background: #e0e0e0; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${rolle}
                    </span>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <span style="background: ${abonnementFarge}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${abonnementType}
                    </span>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <span style="color: ${statusFarge}; font-weight: 600;">
                        ${status === 'active' ? '✅' : '❌'} ${status}
                    </span>
                </td>
                <td style="padding: 15px; text-align: center; font-size: 13px;">
                    ${utloperTekst}
                </td>
                <td style="padding: 15px; text-align: center;">
                    ${bruker.id !== ADMIN_UID ? `
                        <button 
                            class="btn-primary btn-small" 
                            onclick="window.redigerBruker('${bruker.id}')"
                            style="padding: 6px 12px; font-size: 13px;">
                            ✏️ Rediger
                        </button>
                    ` : `
                        <span style="color: #999; font-size: 12px;">Kan ikke redigeres</span>
                    `}
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================
// SØK I BRUKERE
// ============================================
window.sokBrukere = function(sokeTekst) {
    if (!sokeTekst || sokeTekst.trim() === '') {
        visBrukerliste(alleBrukere);
        return;
    }
    
    const sok = sokeTekst.toLowerCase();
    const filtrert = alleBrukere.filter(bruker => {
        const email = (bruker.email || '').toLowerCase();
        const navn = (bruker.navn || '').toLowerCase();
        return email.includes(sok) || navn.includes(sok);
    });
    
    visBrukerliste(filtrert);
};

// ============================================
// REDIGER BRUKER
// ============================================
window.redigerBruker = async function(brukerId) {
    try {
        // Hent bruker fra Firestore
        const docRef = doc(db, "users", brukerId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert("❌ Kunne ikke finne bruker!");
            return;
        }
        
        const bruker = docSnap.data();
        const email = bruker.email || 'Ukjent';
        const navn = bruker.navn || '';
        const rolle = bruker.rolle || 'lærer';
        const abonnement = bruker.abonnement || { type: 'free', status: 'active' };
        
        // Beregn utløpsdato
        let utloperVerdi = '';
        if (abonnement.utloper) {
            const dato = new Date(abonnement.utloper.toDate());
            utloperVerdi = dato.toISOString().split('T')[0];
        }
        
        // Bygg modal
        const modalHTML = `
            <div class="modal-overlay" id="rediger-bruker-modal">
                <div class="modal-content modal-large" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="lukkBrukerModal()">✖</button>
                    <h2>✏️ Rediger bruker</h2>
                    
                    <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <strong>E-post:</strong> ${email}
                    </div>
                    
                    <form id="rediger-bruker-form" onsubmit="event.preventDefault(); lagreBrukerEndringer('${brukerId}');">
                        
                        <!-- Navn -->
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="bruker-navn" style="font-weight: 600; display: block; margin-bottom: 8px;">
                                Navn:
                            </label>
                            <input 
                                type="text" 
                                id="bruker-navn" 
                                value="${navn}"
                                placeholder="Brukerens navn"
                                style="width: 100%; padding: 12px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; box-sizing: border-box;"
                            >
                        </div>
                        
                        <!-- Rolle -->
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="bruker-rolle" style="font-weight: 600; display: block; margin-bottom: 8px;">
                                Rolle:
                            </label>
                            <select 
                                id="bruker-rolle" 
                                style="width: 100%; padding: 12px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; box-sizing: border-box;"
                            >
                                <option value="lærer" ${rolle === 'lærer' ? 'selected' : ''}>Lærer</option>
                                <option value="admin" ${rolle === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        
                        <!-- Abonnement Type -->
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="bruker-abonnement-type" style="font-weight: 600; display: block; margin-bottom: 8px;">
                                Abonnement:
                            </label>
                            <select 
                                id="bruker-abonnement-type" 
                                style="width: 100%; padding: 12px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; box-sizing: border-box;"
                            >
                                <option value="free" ${abonnement.type === 'free' ? 'selected' : ''}>Gratis</option>
                                <option value="premium" ${abonnement.type === 'premium' ? 'selected' : ''}>Premium (500 kr/år)</option>
                                <option value="skolepakke" ${abonnement.type === 'skolepakke' ? 'selected' : ''}>Skolepakke</option>
                            </select>
                        </div>
                        
                        <!-- Status -->
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="bruker-status" style="font-weight: 600; display: block; margin-bottom: 8px;">
                                Status:
                            </label>
                            <select 
                                id="bruker-status" 
                                style="width: 100%; padding: 12px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; box-sizing: border-box;"
                            >
                                <option value="active" ${abonnement.status === 'active' ? 'selected' : ''}>✅ Aktiv</option>
                                <option value="inactive" ${abonnement.status === 'inactive' ? 'selected' : ''}>❌ Inaktiv</option>
                            </select>
                        </div>
                        
                        <!-- Utløpsdato -->
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="bruker-utloper" style="font-weight: 600; display: block; margin-bottom: 8px;">
                                Utløpsdato:
                            </label>
                            <input 
                                type="date" 
                                id="bruker-utloper" 
                                value="${utloperVerdi}"
                                style="width: 100%; padding: 12px 16px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; box-sizing: border-box;"
                            >
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
                                La stå tom for ubegrenset (gratis brukere)
                            </p>
                        </div>
                        
                        <!-- Handlingsknapper -->
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 30px;">
                            <button type="button" class="btn-secondary" onclick="lukkBrukerModal()">
                                ❌ Avbryt
                            </button>
                            <button type="submit" class="btn-success">
                                💾 Lagre endringer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('❌ Feil ved åpning av redigeringsmodal:', error);
        alert('❌ Kunne ikke åpne redigeringsmodus: ' + error.message);
    }
};

// ============================================
// LAGRE BRUKER-ENDRINGER
// ============================================
window.lagreBrukerEndringer = async function(brukerId) {
    try {
        const navn = document.getElementById('bruker-navn').value.trim();
        const rolle = document.getElementById('bruker-rolle').value;
        const abonnementType = document.getElementById('bruker-abonnement-type').value;
        const status = document.getElementById('bruker-status').value;
        const utloperInput = document.getElementById('bruker-utloper').value;
        
        // Bygg utløpsdato
        let utloper = null;
        if (utloperInput) {
            utloper = new Date(utloperInput + 'T23:59:59');
        }
        
        // Bekreft endringer
        const bekreft = confirm(
            `Lagre endringer for denne brukeren?\n\n` +
            `Rolle: ${rolle}\n` +
            `Abonnement: ${abonnementType}\n` +
            `Status: ${status}\n` +
            `Utløper: ${utloperInput || 'Ingen dato'}`
        );
        
        if (!bekreft) return;
        
        // Oppdater i Firestore
        const docRef = doc(db, "users", brukerId);
        await updateDoc(docRef, {
            navn: navn,
            rolle: rolle,
            abonnement: {
                type: abonnementType,
                status: status,
                utloper: utloper,
                sist_oppdatert: serverTimestamp()
            }
        });
        
        alert('✅ Bruker oppdatert!');
        lukkBrukerModal();
        
        // Last inn brukere på nytt
        lastInnBrukere();
        
    } catch (error) {
        console.error('❌ Feil ved lagring:', error);
        alert('❌ Kunne ikke lagre endringer: ' + error.message);
    }
};

// ============================================
// LUKK MODAL
// ============================================
window.lukkBrukerModal = function() {
    const modal = document.getElementById('rediger-bruker-modal');
    if (modal) {
        modal.remove();
    }
};
