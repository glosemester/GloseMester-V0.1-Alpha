// ============================================
// BRUKERADMINISTRASJON v1.2
// Håndterer "null" e-post og direkte admin
// ✅ OPPDATERT: Bruker rolle-basert admin-sjekk
// ============================================

import { db, collection, query, getDocs, doc, updateDoc, orderBy } from './firebase.js';
import { erAdmin as erAdminHelper } from '../core/auth-helpers.js';

// ✅ FJERNET HARDKODET ADMIN_UID
let alleBrukere = [];
let gjeldendeSide = 1;
const BRUKERE_PER_SIDE = 25;

async function erAdmin(user) { return await erAdminHelper(); }

export async function lastInnBrukere() {
    const container = document.getElementById('brukeradmin-liste');
    if (!container) return;
    container.innerHTML = '<p class="loading">⏳ Laster brukere...</p>';
    
    try {
        const user = window.currentUser;
        if (!await erAdmin(user)) { container.innerHTML = '<p class="error">⛔ Kun admin.</p>'; return; }
        
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        
        alleBrukere = [];
        snapshot.forEach(doc => alleBrukere.push({ id: doc.id, ...doc.data() }));
        
        // Sortering
        alleBrukere.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
        
        visStatistikk();
        visBrukerliste(alleBrukere);
    } catch (e) {
        container.innerHTML = `<p class="error">Feil: ${e.message}</p>`;
    }
}

function visStatistikk() {
    const div = document.getElementById('brukeradmin-stats');
    if (!div) return;
    let free=0, vipps=0, skole=0;
    alleBrukere.forEach(u => {
        if (u.subscription?.status === 'premium') vipps++;
        else if (u.abonnement?.status === 'active') skole++;
        else free++;
    });
    div.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:20px;">
            <span class="badge" style="background:#e3f2fd;">${alleBrukere.length} Totalt</span>
            <span class="badge" style="background:#e8f5e9; color:green;">${vipps} Vipps</span>
            <span class="badge" style="background:#fff3e0; color:orange;">${skole} Skole</span>
        </div>`;
}

function visBrukerliste(brukere) {
    const div = document.getElementById('brukeradmin-liste');

    const totalSider = Math.max(1, Math.ceil(brukere.length / BRUKERE_PER_SIDE));
    if (gjeldendeSide > totalSider) gjeldendeSide = totalSider;
    const start = (gjeldendeSide - 1) * BRUKERE_PER_SIDE;
    const sideBrukere = brukere.slice(start, start + BRUKERE_PER_SIDE);

    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
        <span style="font-size:0.9em; color:#666;">Viser ${start+1}–${Math.min(start+BRUKERE_PER_SIDE, brukere.length)} av ${brukere.length} brukere</span>
        <div style="display:flex; gap:6px; align-items:center;">
            <button onclick="window.brukeradminSide(-1)" style="padding:6px 12px; border:1px solid #ccc; border-radius:6px; background:white; cursor:pointer;" ${gjeldendeSide<=1?'disabled':''}>◀ Forrige</button>
            <span style="font-size:0.9em;">Side ${gjeldendeSide} / ${totalSider}</span>
            <button onclick="window.brukeradminSide(1)" style="padding:6px 12px; border:1px solid #ccc; border-radius:6px; background:white; cursor:pointer;" ${gjeldendeSide>=totalSider?'disabled':''}>Neste ▶</button>
        </div>
    </div>`;

    html += `<table style="width:100%; border-collapse:collapse; background:white;">
        <tr style="background:#f5f5f5; text-align:left;"><th style="padding:10px;">Bruker</th><th style="padding:10px;">Kilde</th><th style="padding:10px;">Abonnement</th><th style="padding:10px;">Utløper</th></tr>`;

    sideBrukere.forEach(u => {
        // --- FEIDE NULL FIX ---
        // Sjekker om e-post mangler eller er strengen "null"
        let visning = "";
        let stil = "font-weight:bold;";
        
        if (!u.email || u.email === "null") {
            visning = `<span style="color:#999; font-style:italic;">Ingen e-post (ID: ${u.id.substring(0,5)}...)</span>`;
        } else {
            visning = u.email;
        }
        
        let navn = u.navn || "Ukjent Bruker";

        // Dropdown valg
        let val = 'free';
        let utlop = '-';
        if (u.subscription?.status === 'premium') { 
            val = u.subscription.plan; 
            utlop = dato(u.subscription.expiresAt); 
        }
        else if (u.abonnement?.status === 'active') { 
            val = 'skolepakke'; 
            utlop = dato(u.abonnement.utloper); 
        }

        html += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">
                    <div style="${stil}">${visning}</div>
                    <div style="font-size:0.85em; color:#666;">${navn}</div>
                </td>
                <td style="padding:10px;"><span style="background:#eee; padding:2px 5px; border-radius:3px; font-size:0.8em;">${u.kilde||'email'}</span></td>
                <td style="padding:10px;">
                    <select onchange="window.endreAbonnement('${u.id}', this.value)" style="padding:5px; border:1px solid #ccc; background:${farge(val)};">
                        <option value="free" ${val==='free'?'selected':''}>Gratis</option>
                        <option value="premium_monthly" ${val==='premium_monthly'?'selected':''}>Vipps Mnd</option>
                        <option value="premium_yearly" ${val==='premium_yearly'?'selected':''}>Vipps År</option>
                        <option value="skolepakke" ${val==='skolepakke'?'selected':''}>Skolepakke</option>
                    </select>
                </td>
                <td style="padding:10px; font-size:0.9em;">${utlop}</td>
            </tr>`;
    });
    div.innerHTML = html + "</table>";
}

function dato(t) { return t ? new Date(t.toDate()).toLocaleDateString() : 'Ubegrenset'; }
function farge(t) { return t.includes('premium') ? '#d4edda' : (t==='skolepakke' ? '#fff3cd' : '#fff'); }

window.brukeradminSide = function(retning) {
    gjeldendeSide += retning;
    visBrukerliste(alleBrukere);
};

window.endreAbonnement = async function(uid, type) {
    if(!confirm("Endre abonnement?")) { lastInnBrukere(); return; }
    try {
        const ref = doc(db, "users", uid);
        let up = {};
        const now = new Date();
        
        if(type==='free') {
            up = {'subscription.status':'free', 'abonnement.status':'inactive'};
        } else if(type.includes('premium')) {
            const days = type.includes('monthly') ? 30 : 365;
            const exp = new Date(); exp.setDate(now.getDate()+days);
            up = {'subscription.status':'premium', 'subscription.plan':type, 'subscription.expiresAt':exp, 'abonnement.status':'inactive'};
        } else if(type==='skolepakke') {
            const exp = new Date(); exp.setDate(now.getDate()+365);
            up = {'abonnement.status':'active', 'abonnement.type':'skolepakke', 'abonnement.utloper':exp, 'subscription.status':'free'};
        }
        await updateDoc(ref, up);
        await lastInnBrukere();
        // NB: Brukeren må refreshe siden sin selv for å se endringen
    } catch(e) { alert("Feil: " + e.message); }
};