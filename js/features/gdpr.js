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

    console.log('✅ Cookie consent saved:', consent);
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
        console.log('🗑️ Starter sletting av brukerdata for:', user.uid);

        // 1. Slett bruker-dokument i Firestore
        const userDocRef = doc(db, "users", user.uid);
        await deleteDoc(userDocRef);
        console.log('✅ Bruker-dokument slettet');

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
        console.log(`✅ ${deletionPromises.length} prøver slettet`);

        // 3. Slett resultater (hvis de er koblet til bruker)
        try {
            const resultaterQuery = query(
                collection(db, "resultater"),
                where("bruker_id", "==", user.uid)
            );
            const resultaterSnapshot = await getDocs(resultaterQuery);

            const resultaterPromises = [];
            resultaterSnapshot.forEach((docSnapshot) => {
                resultaterPromises.push(deleteDoc(docSnapshot.ref));
            });

            await Promise.all(resultaterPromises);
            console.log(`✅ ${resultaterPromises.length} resultater slettet`);
        } catch (e) {
            console.warn('⚠️ Kunne ikke slette resultater (kanskje ikke eksisterer):', e.message);
        }

        // 4. Rens localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('glosemester_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`✅ ${keysToRemove.length} localStorage items slettet`);

        // 5. Rens sessionStorage
        sessionStorage.clear();

        // 6. Slett Firebase Auth bruker (må være sist)
        await user.delete();
        console.log('✅ Firebase Auth bruker slettet');

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

        // 3. Hent localStorage data
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

        // 4. Bygg dataeksport
        const dataExport = {
            metadata: {
                eksportert: new Date().toISOString(),
                bruker_id: user.uid,
                format_versjon: "1.0.0",
                beskrivelse: "GloseMester brukerdata eksport (GDPR Artikkel 20)"
            },
            brukerprofil: {
                uid: user.uid,
                email: user.email,
                navn: brukerData?.navn || null,
                opprettet: brukerData?.createdAt?.toDate?.()?.toISOString() || null,
                abonnement: brukerData?.abonnement || null,
                subscription: brukerData?.subscription || null,
                proverOpprettet: brukerData?.proverOpprettet || 0
            },
            prover: prover,
            statistikk: {
                totalt_prover: prover.length,
                totalt_ord: prover.reduce((sum, p) => sum + (p.ordliste?.length || 0), 0)
            },
            lokal_lagring: localStorageData
        };

        // 5. Last ned som JSON
        const blob = new Blob([JSON.stringify(dataExport, null, 2)], {
            type: 'application/json;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glosemester_data_${user.uid}_${Date.now()}.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        visToast("✅ Data eksportert! Filen er lastet ned.", "success");

        console.log('✅ Dataeksport fullført:', {
            prover: prover.length,
            storrelse: (blob.size / 1024).toFixed(2) + ' KB'
        });

    } catch (error) {
        console.error("❌ Feil ved eksport:", error);
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
    console.log('🛡️ GDPR-modul lastet');

    // Vis cookie-banner hvis nødvendig
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
