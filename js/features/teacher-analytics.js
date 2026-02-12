/* ============================================
   TEACHER-ANALYTICS.JS - Lærer Dashboard & Statistikk
   Versjon: 1.0.0
   Dato: 16. januar 2026

   SALGBART! Dette er hovedgrunnen til å kjøpe Premium.
   ============================================ */

import { db, auth } from './firebase.js';
import { collection, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { visToast } from '../ui/helpers.js';

// ============================================
// HOVEDFUNKSJON - LAST DASHBOARD DATA
// ============================================

/**
 * Laster all dashboard-data for innlogget lærer
 * @returns {Promise<Object>} Dashboard-data
 */
export async function lastDashboardData() {
    const user = auth.currentUser;

    if (!user) {
        console.error('Ingen bruker innlogget');
        return null;
    }

    try {
        // 1. Hent alle lærerens prøver
        const proverQuery = query(
            collection(db, "prover"),
            where("opprettet_av", "==", user.uid),
            orderBy("opprettet_dato", "desc")
        );

        const proverSnapshot = await getDocs(proverQuery);
        const prover = proverSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 2. Hent statistikk for hver prøve (parallelt for ytelse)
        const statsPromises = prover.map(prove => hentProveStatistikk(prove.id));
        const stats = await Promise.all(statsPromises);

        // 3. Aggreger total statistikk
        const totaltGjennomforinger = stats.reduce((sum, s) => sum + s.antall, 0);
        const gjennomsnittScore = stats.length > 0
            ? stats.reduce((sum, s) => sum + s.gjennomsnitt, 0) / stats.length
            : 0;

        // 4. Hent aktivitet siste 7 dager
        const aktivitet = await hentAktivitetGraf(user.uid, 7);

        // 5. Bygg dashboard-objekt
        const dashboard = {
            totaltProver: prover.length,
            totaltGjennomforinger: totaltGjennomforinger,
            gjennomsnittScore: Math.round(gjennomsnittScore),
            topProver: prover.slice(0, 5).map((p, i) => ({
                ...p,
                stats: stats[i]
            })),
            aktivitetSisteUke: aktivitet,
            sistOppdatert: new Date().toISOString()
        };

        return dashboard;

    } catch (error) {
        console.error('❌ Feil ved lasting av dashboard:', error);
        visToast('Kunne ikke laste statistikk. Prøv igjen.', 'error');
        return null;
    }
}

// ============================================
// HENT STATISTIKK FOR EN PRØVE
// ============================================

/**
 * Henter statistikk for en spesifikk prøve
 * @param {string} proveId - Prøve-ID
 * @returns {Promise<Object>} Statistikk
 */
async function hentProveStatistikk(proveId) {
    try {
        const resultaterQuery = query(
            collection(db, "resultater"),
            where("prove_id", "==", proveId)
        );

        const snapshot = await getDocs(resultaterQuery);

        if (snapshot.empty) {
            return {
                antall: 0,
                gjennomsnitt: 0,
                siste24t: 0,
                unikeElever: 0
            };
        }

        const resultater = snapshot.docs.map(d => d.data());

        // Beregn statistikk
        const totalScore = resultater.reduce((sum, r) => sum + (r.prosent || r.score || 0), 0);
        const gjennomsnitt = resultater.length > 0 ? totalScore / resultater.length : 0;

        // Aktivitet siste 24 timer
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const siste24t = resultater.filter(r => {
            const timestamp = r.opprettet?.toMillis ? r.opprettet.toMillis() : 0;
            return (now - timestamp) < dayMs;
        }).length;

        // ✅ FIX: Unike elever basert på elev_id (anonyme IDer)
        const unikeElever = new Set();
        resultater.forEach(r => {
            if (r.elev_id) {
                unikeElever.add(r.elev_id);
            } else if (r.resultat_av && Array.isArray(r.resultat_av)) {
                r.resultat_av.forEach(uid => unikeElever.add(uid));
            } else if (r.bruker_id) {
                unikeElever.add(r.bruker_id);
            }
        });

        return {
            antall: resultater.length,
            gjennomsnitt: Math.round(gjennomsnitt),
            siste24t: siste24t,
            unikeElever: unikeElever.size
        };

    } catch (error) {
        console.error(`Feil ved henting av statistikk for prøve ${proveId}:`, error);
        return {
            antall: 0,
            gjennomsnitt: 0,
            siste24t: 0,
            unikeElever: 0
        };
    }
}

// ============================================
// AKTIVITETS-GRAF (SISTE 7 DAGER)
// ============================================

/**
 * Henter aktivitetsdata for de siste N dagene
 * @param {string} userId - Lærer-ID
 * @param {number} dager - Antall dager bakover
 * @returns {Promise<Array>} Aktivitetsdata per dag
 */
async function hentAktivitetGraf(userId, dager) {
    const resultat = [];

    try {
        // Hent alle resultater for lærerens prøver
        const resultaterQuery = query(
            collection(db, "resultater"),
            where("prove_eier", "==", userId)
        );

        const snapshot = await getDocs(resultaterQuery);
        const alleResultater = snapshot.docs.map(d => ({
            ...d.data(),
            timestamp: d.data().opprettet?.toMillis ? d.data().opprettet.toMillis() : 0
        }));

        // Bruk Intl for korrekt norsk tidssone (håndterer sommer/vintertid automatisk)
        const now = new Date();

        // Hjelpefunksjon: finn midnatt i norsk tidssone for en gitt dato
        function getNorwegianMidnight(date) {
            // Formater datoen i norsk tidssone for å få riktig dag
            const norskDato = new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'Europe/Oslo',
                year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(date);
            // Parse YYYY-MM-DD
            const [y, m, d] = norskDato.split('-').map(Number);
            // Start med UTC midnatt, deretter juster for Oslo-offset
            const utcMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
            // Finn faktisk Oslo-time ved UTC midnatt for å beregne offset
            const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Oslo', hour: 'numeric', hour12: false });
            const osloHour = parseInt(formatter.format(utcMidnight));
            // Juster slik at klokken er 00:00 i Oslo (ikke UTC)
            utcMidnight.setTime(utcMidnight.getTime() - osloHour * 60 * 60 * 1000);
            return utcMidnight.getTime();
        }

        // Bygg daglig statistikk
        for (let i = dager - 1; i >= 0; i--) {
            const dag = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const startOfDay = getNorwegianMidnight(dag);
            const endOfDay = startOfDay + (24 * 60 * 60 * 1000);

            const dagenResultater = alleResultater.filter(r =>
                r.timestamp >= startOfDay && r.timestamp < endOfDay
            );

            const dagNavn = new Intl.DateTimeFormat('no-NO', {
                weekday: 'short',
                timeZone: 'Europe/Oslo'
            }).format(dag);

            resultat.push({
                dato: dagNavn,
                antall: dagenResultater.length,
                timestamp: startOfDay
            });
        }

        return resultat;

    } catch (error) {
        console.error('Feil ved henting av aktivitetsdata:', error);
        const now = new Date();
        for (let i = dager - 1; i >= 0; i--) {
            const dag = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dagNavn = new Intl.DateTimeFormat('no-NO', {
                weekday: 'short',
                timeZone: 'Europe/Oslo'
            }).format(dag);
            resultat.push({ dato: dagNavn, antall: 0, timestamp: dag.getTime() });
        }
        return resultat;
    }
}

// ============================================
// VIS DASHBOARD (RENDER UI)
// ============================================

/**
 * Viser dashboard-data i UI
 * @param {Object} data - Dashboard-data fra lastDashboardData()
 */
export function visDashboard(data) {
    if (!data) {
        console.error('Ingen data å vise');
        return;
    }

    const container = document.getElementById('dashboard-stats');
    if (!container) {
        console.error('Dashboard-container ikke funnet');
        return;
    }

    container.innerHTML = `
        <!-- STAT-KORT GRID -->
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div class="stat-card">
                <div class="stat-value">${data.totaltProver}</div>
                <div class="stat-label">Prøver opprettet</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.totaltGjennomforinger}</div>
                <div class="stat-label">Gjennomføringer</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.gjennomsnittScore}%</div>
                <div class="stat-label">Gj.snitt score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.aktivitetSisteUke.reduce((s, d) => s + d.antall, 0)}</div>
                <div class="stat-label">Aktive siste uke</div>
            </div>
        </div>

        <!-- AKTIVITETS-GRAF -->
        <div class="chart-container" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">📈 Aktivitet siste 7 dager</h3>
            <canvas id="aktivitet-graf" width="600" height="200" style="max-width: 100%;"></canvas>
        </div>

        <!-- MEST BRUKTE PRØVER -->
        <div class="top-prover" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">🏆 Mest brukte prøver</h3>
            ${data.topProver.length > 0 ? data.topProver.map(p => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='white'">
                    <div style="flex: 1;">
                        <strong style="color: #0071e3;">${p.tittel || 'Uten tittel'}</strong>
                        <div style="font-size: 13px; color: #666; margin-top: 3px;">
                            ${p.stats.unikeElever} elever • Gj.snitt: ${p.stats.gjennomsnitt}%
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: bold; color: #0071e3;">${p.stats.antall}</div>
                        <div style="font-size: 11px; color: #999;">gjennomføringer</div>
                    </div>
                </div>
            `).join('') : '<p style="color: #999; text-align: center; padding: 20px;">Ingen data ennå. Lag din første prøve!</p>'}
        </div>
    `;

    // Tegn graf
    setTimeout(() => tegnAktivitetsGraf(data.aktivitetSisteUke), 100);
}

// ============================================
// TEGN AKTIVITETS-GRAF (CANVAS)
// ============================================

/**
 * Tegner et søylediagram for aktivitet
 * @param {Array} data - Array med {dato, antall}
 */
function tegnAktivitetsGraf(data) {
    const canvas = document.getElementById('aktivitet-graf');
    if (!canvas) {
        console.warn('Canvas ikke funnet');
        return;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Finn maks verdi
    const maxValue = Math.max(...data.map(d => d.antall), 1);
    const barWidth = graphWidth / data.length;

    // Tegn bakgrunnslinjer
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (graphHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Tegn søyler
    data.forEach((punkt, index) => {
        const barHeight = (punkt.antall / maxValue) * graphHeight;
        const x = padding + (index * barWidth);
        const y = padding + graphHeight - barHeight;

        // Søyle
        ctx.fillStyle = '#0071e3';
        ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

        // Verdi på toppen (hvis > 0)
        if (punkt.antall > 0) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(punkt.antall, x + barWidth / 2, y - 5);
        }

        // Dag-label
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(punkt.dato, x + barWidth / 2, height - 10);
    });

    // Y-akse labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round((maxValue / 5) * (5 - i));
        const y = padding + (graphHeight / 5) * i;
        ctx.fillText(value, padding - 10, y + 5);
    }

    // Tittel på y-aksen (rotert)
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Antall gjennomføringer', 0, 0);
    ctx.restore();
}

// ============================================
// EKSPORTER STATISTIKK TIL CSV
// ============================================

/**
 * Eksporterer dashboard-data til CSV
 * @param {Object} data - Dashboard-data
 */
export function eksporterTilCSV(data) {
    if (!data) {
        visToast('Ingen data å eksportere', 'warning');
        return;
    }

    // Bygg CSV-innhold
    let csv = 'Prøve,Gjennomføringer,Gj.snitt Score,Unike Elever\n';

    data.topProver.forEach(p => {
        csv += `"${p.tittel}",${p.stats.antall},${p.stats.gjennomsnitt}%,${p.stats.unikeElever}\n`;
    });

    // Last ned som fil
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glosemester_statistikk_${Date.now()}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    visToast('✅ Statistikk eksportert!', 'success');
}

// ============================================
// INITIALISER DASHBOARD
// ============================================

/**
 * Initialiserer og viser dashboard
 */
export async function initDashboard() {
    const container = document.getElementById('dashboard-stats');
    if (!container) {
        console.warn('Dashboard-container ikke funnet i DOM');
        return;
    }

    // Vis laste-melding
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
            <div style="font-size: 18px;">Laster statistikk...</div>
        </div>
    `;

    // Last og vis data
    const data = await lastDashboardData();

    if (data) {
        // ✅ Lagre globalt for eksport-knapp
        window.lastLoadedDashboardData = data;
        visDashboard(data);
    } else {
        window.lastLoadedDashboardData = null;
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
                <div style="font-size: 18px; margin-bottom: 10px;">Ingen data ennå</div>
                <div style="font-size: 14px;">Lag din første prøve for å se statistikk!</div>
            </div>
        `;
    }
}

// Eksponer globalt for HTML onclick
window.initDashboard = initDashboard;
window.eksporterTilCSV = eksporterTilCSV;
window.lastLoadedDashboardData = null;

// Eksporter
export default {
    lastDashboardData,
    visDashboard,
    initDashboard,
    eksporterTilCSV
};
