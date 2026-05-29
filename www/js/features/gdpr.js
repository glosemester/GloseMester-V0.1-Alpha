/* ============================================
   GDPR.JS - Personvernfunksjoner
   Versjon: 1.0.0
   Dato: 16. januar 2026
   GDPR-compliant funksjoner for GloseMester
   ============================================ */

import { auth, db } from './firebase.js';
import { doc, getDoc, deleteDoc, query, collection, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { visToast } from '../ui/helpers.js';

// ============================================
// 1. COOKIE CONSENT BANNER
// ============================================

/**
 * Viser cookie-samtykke banner hvis ikke allerede godtatt
 */
export function visCookieBanner() {
    // Sjekk om bruker allerede har gitt/avvist samtykke
    if (localStorage.getItem('glosemester_cookie_consent')) {
        return;
    }

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 20px;
        z-index: 99999;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
    `;

    banner.innerHTML = `
        <div style="flex: 1; min-width: 250px;">
            <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600;">
                🍪 Vi bruker informasjonskapsler
            </p>
            <p style="margin: 0; font-size: 13px; color: #d1d5db; line-height: 1.5;">
                Vi bruker cookies og lokal lagring for å forbedre opplevelsen din.
                Les mer i vår
                <a href="/personvern.html" style="color: #60a5fa; text-decoration: underline;">
                    personvernerklæring
                </a>.
            </p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="cookie-accept" class="btn-primary" style="margin: 0; white-space: nowrap;">
                ✓ Godta alle
            </button>
            <button id="cookie-reject" class="btn-secondary" style="margin: 0; white-space: nowrap;">
                Kun nødvendige
            </button>
        </div>
    `;

    document.body.appendChild(banner);

    // Event listeners
    document.getElementById('cookie-accept').addEventListener('click', () => {
        godtaCookies(true);
        banner.remove();
    });

    document.getElementById('cookie-reject').addEventListener('click', () => {
        godtaCookies(false);
        banner.remove();
    });
}

/**
 * Lagrer cookie-samtykke
 * @param {boolean} acceptAll - Om brukeren godtar alle cookies
 */
function godtaCookies(acceptAll) {
    const consent = {
        necessary: true,  // Alltid på (nødvendig for app-funksjonalitet)
        analytics: acceptAll,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('glosemester_cookie_consent', JSON.stringify(consent));

    if (acceptAll) {
        visToast("✅ Cookie-innstillinger lagret", "success");
        // Aktiver analytics hvis det finnes
        if (window.gtag) {
            window.gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    } else {
        visToast("ℹ️ Kun nødvendige cookies aktivert", "info");
        // Deaktiver analytics
        if (window.gtag) {
            window.gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
    }

}

/**
 * Henter cookie-samtykke status
 * @returns {Object|null}
 */
export function getCookieConsent() {
    try {
        const consent = localStorage.getItem('glosemester_cookie_consent');
        return consent ? JSON.parse(consent) : null;
    } catch (error) {
        console.error('Error parsing cookie consent:', error);
        return null;
    }
}

/**
 * Åpner cookie-innstillinger
 */
export function visCookieInnstillinger() {
    const consent = getCookieConsent();

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 100%;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">Cookie-innstillinger</h2>

            <div style="margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                <label style="display: flex; align-items: center; font-weight: 600;">
                    <input type="checkbox" checked disabled style="margin-right: 10px;">
                    Nødvendige cookies
                </label>
                <p style="margin: 8px 0 0 30px; font-size: 13px; color: #6b7280;">
                    Påkrevd for at nettstedet skal fungere. Kan ikke deaktiveres.
                </p>
            </div>

            <div style="margin-bottom: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                <label style="display: flex; align-items: center; font-weight: 600;">
                    <input type="checkbox" id="analytics-toggle" ${consent?.analytics ? 'checked' : ''} style="margin-right: 10px;">
                    Analytics cookies
                </label>
                <p style="margin: 8px 0 0 30px; font-size: 13px; color: #6b7280;">
                    Hjelper oss å forstå hvordan du bruker nettstedet for å forbedre opplevelsen.
                </p>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cookie-cancel" class="btn-secondary">Avbryt</button>
                <button id="cookie-save" class="btn-primary">Lagre valg</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cookie-cancel').addEventListener('click', () => modal.remove());
    document.getElementById('cookie-save').addEventListener('click', () => {
        const analyticsEnabled = document.getElementById('analytics-toggle').checked;
        godtaCookies(analyticsEnabled);
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ============================================
// 2. SLETT MIN DATA (GDPR ARTIKKEL 17)
// ============================================

/**
 * Sletter all brukerdata permanent (GDPR Right to Erasure)
 */
export async function slettMinData() {
    const user = auth.currentUser;

    if (!user) {
        visToast("❌ Du må være innlogget for å slette data.", "error");
        return;
    }

    // Bekreftelse med strengt vilkår
    const bekreft1 = confirm(
        '⚠️ ADVARSEL: Dette vil permanent slette ALL din data!\n\n' +
        'Dette inkluderer:\n' +
        '• Din brukerprofil\n' +
        '• Alle prøver du har laget\n' +
        '• Statistikk og historikk\n' +
        '• Lagrede kort og progresjon\n\n' +
        'Klikk OK for å fortsette.'
    );

    if (!bekreft1) {
        visToast("Sletting avbrutt.", "info");
        return;
    }

    const bekreft2 = prompt(
        'For å bekrefte, skriv inn: SLETT ALT\n\n' +
        '(Skriv nøyaktig som vist, med store bokstaver)'
    );

    if (bekreft2 !== 'SLETT ALT') {
        visToast("Sletting avbrutt - feil bekreftelsestekst.", "info");
        return;
    }

    // Vis laste-skjerm
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        color: white;
        font-size: 18px;
    `;
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
            <div>Sletter data...</div>
        </div>
    `;
    document.body.appendChild(loadingDiv);

    try {
        // 1. Slett bruker-dokument i Firestore
        const userDocRef = doc(db, "users", user.uid);
        await deleteDoc(userDocRef);

        // 2. Slett alle prøver opprettet av brukeren
        const proverQuery = query(
            collection(db, "prover"),
            where("opprettet_av", "==", user.uid)
        );
        const proverSnapshot = await getDocs(proverQuery);

        const deletionPromises = [];
        proverSnapshot.forEach((docSnapshot) => {
            deletionPromises.push(deleteDoc(docSnapshot.ref));
        });

        await Promise.all(deletionPromises);

        // 3. Slett resultater (sjekk både prove_eier og elev_id)
        try {
            // 3a. Resultater der brukeren er prøve-eier (lærer)
            const eierQuery = query(
                collection(db, "resultater"),
                where("prove_eier", "==", user.uid)
            );
            const eierSnapshot = await getDocs(eierQuery);

            // 3b. Resultater der brukeren er elev (anonymt ID)
            const elevQuery = query(
                collection(db, "resultater"),
                where("elev_id", "==", user.uid)
            );
            const elevSnapshot = await getDocs(elevQuery);

            // 3c. Legacy: resultater med bruker_id
            const brukerQuery = query(
                collection(db, "resultater"),
                where("bruker_id", "==", user.uid)
            );
            const brukerSnapshot = await getDocs(brukerQuery);

            const resultaterPromises = [];
            eierSnapshot.forEach((docSnapshot) => resultaterPromises.push(deleteDoc(docSnapshot.ref)));
            elevSnapshot.forEach((docSnapshot) => resultaterPromises.push(deleteDoc(docSnapshot.ref)));
            brukerSnapshot.forEach((docSnapshot) => resultaterPromises.push(deleteDoc(docSnapshot.ref)));

            await Promise.all(resultaterPromises);
        } catch (e) {
            console.warn('⚠️ Kunne ikke slette resultater:', e.message);
        }

        // 4. Slett diktat-sett fra Firestore og Storage
        try {
            const diktatQuery = query(
                collection(db, "diktat_sett"),
                where("laerer_id", "==", user.uid)
            );
            const diktatSnapshot = await getDocs(diktatQuery);

            const diktatPromises = [];
            diktatSnapshot.forEach((docSnapshot) => {
                diktatPromises.push(deleteDoc(docSnapshot.ref));
            });
            await Promise.all(diktatPromises);

            // Slett lydfiler fra Storage
            try {
                const { storage } = await import('./firebase.js');
                const { ref, listAll, deleteObject } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
                const diktatRef = ref(storage, `diktat/${user.uid}`);
                const fileList = await listAll(diktatRef);
                await Promise.all(fileList.items.map(item => deleteObject(item)));
                // Slett undermapper
                for (const prefix of fileList.prefixes) {
                    const subList = await listAll(prefix);
                    await Promise.all(subList.items.map(item => deleteObject(item)));
                }
            } catch (storageErr) {
                console.warn('⚠️ Kunne ikke slette Storage-filer:', storageErr.message);
            }

        } catch (e) {
            console.warn('⚠️ Kunne ikke slette diktat-sett:', e.message);
        }

        // 5. Slett GloseBank-oppføringer
        try {
            const glosebankQuery = query(
                collection(db, "glosebank"),
                where("opprettet_av", "==", user.uid)
            );
            const glosebankSnapshot = await getDocs(glosebankQuery);

            const gbPromises = [];
            glosebankSnapshot.forEach((docSnapshot) => gbPromises.push(deleteDoc(docSnapshot.ref)));
            await Promise.all(gbPromises);
        } catch (e) {
            console.warn('⚠️ Kunne ikke slette GloseBank-data:', e.message);
        }

        // 6. Rens localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('glosemester_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // 7. Rens sessionStorage
        sessionStorage.clear();

        // 8. Slett Firebase Auth bruker (må være sist)
        await user.delete();

        loadingDiv.remove();

        // Suksess-melding
        alert(
            '✅ All data er permanent slettet!\n\n' +
            'Du blir nå logget ut og sendt til forsiden.'
        );

        // Redirect til forsiden
        window.location.href = "/";

    } catch (error) {
        loadingDiv.remove();
        console.error("❌ Feil ved sletting av data:", error);

        if (error.code === 'auth/requires-recent-login') {
            alert(
                '⚠️ Sikkerhetskrav: Du må logge inn på nytt\n\n' +
                'For å slette kontoen din må du ha logget inn nylig. ' +
                'Vennligst logg ut, logg inn igjen, og prøv på nytt.'
            );
        } else {
            alert(
                '❌ Kunne ikke slette data\n\n' +
                'Feilmelding: ' + error.message + '\n\n' +
                'Vennligst kontakt support på kontakt@glosemester.no'
            );
        }
    }
}

// ============================================
// 3. EKSPORTER MIN DATA (GDPR ARTIKKEL 20)
// ============================================

/**
 * Eksporterer all brukerdata i maskinlesbart format (GDPR Right to Data Portability)
 */
export async function eksporterMinData() {
    const user = auth.currentUser;

    if (!user) {
        visToast("❌ Du må være innlogget for å eksportere data.", "error");
        return;
    }

    try {
        visToast("📥 Henter data...", "info");

        // 1. Hent brukerprofil
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        const brukerData = userSnap.exists() ? userSnap.data() : null;

        // 2. Hent alle prøver
        const proverQuery = query(
            collection(db, "prover"),
            where("opprettet_av", "==", user.uid)
        );
        const proverSnapshot = await getDocs(proverQuery);
        const prover = proverSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            opprettet_dato: doc.data().opprettet_dato?.toDate?.()?.toISOString() || null
        }));

        // 3. Hent resultater (som prøve-eier)
        let resultater = [];
        try {
            const resultaterQuery = query(
                collection(db, "resultater"),
                where("prove_eier", "==", user.uid)
            );
            const resultaterSnapshot = await getDocs(resultaterQuery);
            resultater = resultaterSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                opprettet: doc.data().opprettet?.toDate?.()?.toISOString() || null
            }));
        } catch (e) {
            console.warn('Kunne ikke hente resultater for eksport:', e.message);
        }

        // 4. Hent diktat-sett
        let diktatSett = [];
        try {
            const diktatQuery = query(
                collection(db, "diktat_sett"),
                where("laerer_id", "==", user.uid)
            );
            const diktatSnapshot = await getDocs(diktatQuery);
            diktatSett = diktatSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                opprettet_dato: doc.data().opprettet_dato?.toDate?.()?.toISOString() || null
            }));
        } catch (e) {
            console.warn('Kunne ikke hente diktat-sett for eksport:', e.message);
        }

        // 5. Hent GloseBank-oppføringer
        let glosebankData = [];
        try {
            const gbQuery = query(
                collection(db, "glosebank"),
                where("opprettet_av", "==", user.uid)
            );
            const gbSnapshot = await getDocs(gbQuery);
            glosebankData = gbSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                opprettet_dato: doc.data().opprettet_dato?.toDate?.()?.toISOString() || null
            }));
        } catch (e) {
            console.warn('Kunne ikke hente GloseBank-data for eksport:', e.message);
        }

        // 6. Hent localStorage data
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('glosemester_')) {
                try {
                    localStorageData[key] = JSON.parse(localStorage.getItem(key));
                } catch {
                    localStorageData[key] = localStorage.getItem(key);
                }
            }
        }

        // 4. Bygg lesbar HTML-eksport
        const datoNå = new Date();
        const datoFormatert = datoNå.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
        const datoFilnavn = datoNå.toISOString().slice(0, 10);

        const abType = brukerData?.abonnement?.type || brukerData?.subscription?.type || 'free';
        const abonnementTekst = { free: 'Gratis', premium: 'Premium', skolepakke: 'Skolepakke' }[abType] || abType;
        const rolleTekst = brukerData?.rolle === 'laerer' ? 'Lærer' : brukerData?.rolle === 'elev' ? 'Elev' : 'Ukjent';
        const kildeTekst = { google: 'Google', feide: 'Feide', email: 'E-post/passord' }[brukerData?.kilde] || 'Ukjent';

        function norskDato(isoStr) {
            if (!isoStr) return '—';
            try {
                return new Date(isoStr).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
            } catch { return isoStr; }
        }

        function lagProveHtml(prove) {
            const tittel = prove.tittel || prove.navn || 'Uten tittel';
            const dato = norskDato(prove.opprettet_dato);
            const ord = prove.ordliste || [];
            const radHtml = ord.map(o => {
                const norsk = o.norsk || o.ord || o.word || '';
                const fremmed = o.fremmedord || o.oversettelse || o.translation || o.engelsk || '';
                return `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;">${escHtml(norsk)}</td><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#7c3aed;">${escHtml(fremmed)}</td></tr>`;
            }).join('');
            return `
            <div style="margin-bottom:24px;background:#fafaff;border:1px solid #e9d8fd;border-radius:12px;overflow:hidden;">
                <div style="padding:14px 18px;background:#7c3aed;color:white;">
                    <strong>${escHtml(tittel)}</strong>
                    <span style="float:right;opacity:0.8;font-size:13px;">${dato}</span>
                </div>
                ${ord.length > 0 ? `
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead><tr>
                        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:12px;background:#f5f0ff;">Norsk</th>
                        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:12px;background:#f5f0ff;">Fremmedspråk</th>
                    </tr></thead>
                    <tbody>${radHtml}</tbody>
                </table>` : '<p style="padding:12px 18px;color:#9ca3af;font-size:14px;">Ingen ord registrert.</p>'}
            </div>`;
        }

        function escHtml(str) {
            return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        const proverHtml = prover.length > 0
            ? prover.map(lagProveHtml).join('')
            : '<p style="color:#9ca3af;">Du har ikke opprettet noen prøver ennå.</p>';

        const glosebankHtml = glosebankData.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead><tr>
                    <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:12px;background:#f5f0ff;">Norsk</th>
                    <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:12px;background:#f5f0ff;">Fremmedspråk</th>
                    <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:12px;background:#f5f0ff;">Emne</th>
                </tr></thead>
                <tbody>${glosebankData.map(g => `<tr>
                    <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;">${escHtml(g.norsk || g.ord || '')}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#7c3aed;">${escHtml(g.fremmedord || g.oversettelse || '')}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#9ca3af;">${escHtml(g.emne || g.kategori || '—')}</td>
                </tr>`).join('')}</tbody>
               </table>`
            : '<p style="color:#9ca3af;">Ingen ord i glosebanken.</p>';

        const diktatHtml = diktatSett.length > 0
            ? diktatSett.map(d => `<div style="margin-bottom:12px;padding:14px 18px;background:#fafaff;border:1px solid #e9d8fd;border-radius:10px;">
                <strong>${escHtml(d.tittel || 'Uten tittel')}</strong>
                <span style="float:right;color:#9ca3af;font-size:13px;">${norskDato(d.opprettet_dato)}</span>
              </div>`).join('')
            : '<p style="color:#9ca3af;">Ingen diktat-sett opprettet.</p>';

        const html = `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mine data fra GloseMester – ${datoFormatert}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 32px 20px; color: #1f2937; background: #fff; }
  h1 { color: #7c3aed; margin-bottom: 4px; }
  h2 { color: #374151; border-bottom: 2px solid #e9d8fd; padding-bottom: 8px; margin-top: 40px; }
  .info-boks { background: #f5f0ff; border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 8px; margin: 20px 0; }
  .profil-rad { display: flex; gap: 8px; margin-bottom: 8px; }
  .profil-label { font-weight: 600; min-width: 160px; color: #6b7280; }
  .stats { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
  .stat-kort { background: #f5f0ff; border-radius: 10px; padding: 16px 20px; text-align: center; min-width: 100px; }
  .stat-tall { font-size: 28px; font-weight: 800; color: #7c3aed; }
  .stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>

<h1>📚 Mine data fra GloseMester</h1>
<p style="color:#6b7280;">Lastet ned ${datoFormatert} · GDPR artikkel 20 – rett til dataportabilitet</p>

<div class="info-boks">
  <strong>Hva er denne filen?</strong><br>
  Dette dokumentet inneholder all informasjon GloseMester har lagret om deg. Du kan lagre filen trygt på din egen enhet, sende den til en annen tjeneste, eller bruke den som dokumentasjon. Ingen personopplysninger deles med uvedkommende.
</div>

<h2>👤 Min profil</h2>
<div class="profil-rad"><span class="profil-label">Navn:</span><span>${escHtml(brukerData?.displayName || brukerData?.navn || user.displayName || '—')}</span></div>
<div class="profil-rad"><span class="profil-label">E-postadresse:</span><span>${escHtml(user.email || brukerData?.email || '—')}</span></div>
<div class="profil-rad"><span class="profil-label">Brukertype:</span><span>${rolleTekst}</span></div>
<div class="profil-rad"><span class="profil-label">Abonnement:</span><span>${abonnementTekst}</span></div>
<div class="profil-rad"><span class="profil-label">Innloggingsmetode:</span><span>${kildeTekst}</span></div>
<div class="profil-rad"><span class="profil-label">Konto opprettet:</span><span>${norskDato(brukerData?.opprettetDato?.toDate?.()?.toISOString?.() || null)}</span></div>

<h2>📊 Statistikk</h2>
<div class="stats">
  <div class="stat-kort"><div class="stat-tall">${prover.length}</div><div class="stat-label">Prøver opprettet</div></div>
  <div class="stat-kort"><div class="stat-tall">${prover.reduce((s, p) => s + (p.ordliste?.length || 0), 0)}</div><div class="stat-label">Ord totalt</div></div>
  <div class="stat-kort"><div class="stat-tall">${resultater.length}</div><div class="stat-label">Resultater</div></div>
  <div class="stat-kort"><div class="stat-tall">${glosebankData.length}</div><div class="stat-label">Ord i glosebanken</div></div>
  <div class="stat-kort"><div class="stat-tall">${diktatSett.length}</div><div class="stat-label">Diktat-sett</div></div>
</div>

<h2>📝 Mine prøver (${prover.length})</h2>
${proverHtml}

<h2>📖 Min glosebank (${glosebankData.length} ord)</h2>
${glosebankHtml}

<h2>🎤 Mine diktat-sett (${diktatSett.length})</h2>
${diktatHtml}

<h2>ℹ️ Hva GloseMester lagrer – og hvorfor</h2>
<div class="info-boks">
  <p><strong>Vi lagrer kun det som er nødvendig for å gi deg tjenesten:</strong></p>
  <ul style="margin:8px 0;padding-left:20px;line-height:2;">
    <li><strong>Navn og e-post</strong> – for å identifisere kontoen din og sende deg informasjon</li>
    <li><strong>Prøver og ordlister</strong> – innholdet du har laget i GloseMester</li>
    <li><strong>Innloggingsmetode</strong> – om du bruker Google, Feide eller e-post</li>
    <li><strong>Abonnementsinformasjon</strong> – for å gi deg riktig tilgang</li>
  </ul>
  <p>Vi selger ikke data til tredjeparter. Du kan når som helst slette all data under «Innstillinger → Slett min konto».</p>
  <p style="margin-bottom:0;">Spørsmål? Kontakt oss på <a href="mailto:kontakt@glosemester.no" style="color:#7c3aed;">kontakt@glosemester.no</a></p>
</div>

<p style="color:#d1d5db;font-size:12px;margin-top:40px;text-align:center;">
  Generert automatisk av GloseMester · ${datoFormatert}
</p>

</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `minedata-glosemester-${datoFilnavn}.html`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        visToast("✅ Data eksportert! Filen er lastet ned.", "success");

    } catch (error) {
        console.error("Feil ved eksport:", error);
        visToast("❌ Kunne ikke eksportere data. Prøv igjen senere.", "error");
    }
}

// ============================================
// 4. INITIALISERING
// ============================================

/**
 * Initialiserer GDPR-funksjoner når siden lastes
 */
export function initGDPR() {
    visCookieBanner();

    // Eksponer funksjoner globalt for HTML onclick
    window.visCookieInnstillinger = visCookieInnstillinger;
    window.slettMinData = slettMinData;
    window.eksporterMinData = eksporterMinData;
}

// ============================================
// EKSPORTER
// ============================================

export default {
    visCookieBanner,
    visCookieInnstillinger,
    getCookieConsent,
    slettMinData,
    eksporterMinData,
    initGDPR
};
