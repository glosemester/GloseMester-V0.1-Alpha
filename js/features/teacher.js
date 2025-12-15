/* ==========================================
   TEACHER DASHBOARD & AUTH MANAGER
   ========================================== */

const TeacherAuth = {
    // Sjekker "fake" login status fra localStorage
    isLoggedIn: function() {
        return localStorage.getItem('gm_teacher_logged_in') === 'true';
    },

    // Simulerer login (Her legger du inn Google Auth senere)
    login: function() {
        // 1. Her ville Google Auth koden kjørt
        // 2. Ved suksess:
        localStorage.setItem('gm_teacher_logged_in', 'true');
        this.render();
        console.log("Lærer logget inn");
    },

    // Logg ut funksjon
    logout: function() {
        if(confirm("Er du sikker på at du vil logge ut?")) {
            localStorage.removeItem('gm_teacher_logged_in');
            this.render();
        }
    },

    // Hovedfunksjon for å tegne opp UI
    render: function() {
        const container = document.getElementById('teacher-view-container');
        if (!container) return;

        container.innerHTML = ''; // Tøm container

        if (!this.isLoggedIn()) {
            this.renderLoginScreen(container);
        } else {
            this.renderDashboard(container);
        }
    },

    // HTML for IKKE logget inn
    renderLoginScreen: function(container) {
        container.innerHTML = `
            <div class="teacher-login-wrapper">
                <div class="teacher-login-card">
                    <span class="teacher-brand-icon">🍎</span>
                    <h2 style="margin-bottom: 10px;">Lærerportal</h2>
                    <p style="color: #666; font-size: 15px; line-height: 1.5;">
                        Logg inn for å opprette prøver, administrere biblioteket ditt og dele innhold med elevene.
                    </p>
                    
                    <button class="btn-google-login" onclick="TeacherAuth.login()">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="18" height="18">
                        Logg inn med Google
                    </button>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #999;">
                        GloseMester for Lærere v0.1
                    </p>
                </div>
            </div>
        `;
    },

    // HTML for LOGGET INN
    renderDashboard: function(container) {
        // Vi bygger opp dashboard-strukturen
        container.innerHTML = `
            <div class="card-container">
                <div class="dashboard-header">
                    <div>
                        <h2 style="margin:0;">Mitt Bibliotek</h2>
                        <p style="color:#86868b; font-size:13px; margin:5px 0 0 0;">Dine lagrede prøver</p>
                    </div>
                    <button class="user-profile-btn" onclick="TeacherAuth.logout()">
                        <span>👤 Lærer Profil</span>
                        <span class="pro-tag">PRO</span>
                    </button>
                </div>

                <div class="teacher-toolbar">
                     <button class="btn-primary btn-small" onclick="visSide('laerer-editor')" style="margin:0;">+ Ny Prøve</button>
                     <button class="btn-secondary btn-small" onclick="importerProveFraTekst()" style="margin:0;">📥 Importer</button>
                     <button class="btn-sound" onclick="startQRScanner('laerer')" title="Skann fra kollega" style="width: 36px; height: 36px; font-size: 18px; margin-left:auto;">📷</button>
                </div>

                <div id="bibliotek-innhold-wrapper">
                    <p id="ingen-prover-msg" style="color:#86868b; display:none; padding: 20px; text-align:center; background:#f9f9f9; border-radius:12px;">
                        Du har ingen prøver ennå. Trykk på <strong>+ Ny Prøve</strong> for å starte!
                    </p>
                    <ul id="bibliotek-liste" class="bibliotek-liste"></ul>
                </div>
            </div>
        `;

        // Kall eksisterende funksjon for å rendere listen over prøver
        // (Denne funksjonen antar jeg du har i teacher.js eller collection.js fra før)
        if (typeof oppdaterBibliotekVisning === 'function') {
            oppdaterBibliotekVisning();
        } else if (typeof renderTeacherLibrary === 'function') {
             renderTeacherLibrary(); // Bruk navnet på din eksisterende funksjon
        } else {
            // Fallback hvis funksjonen ikke finnes, bare for å vise at koden kjører
            console.log("Husk å kalle funksjonen som lister ut prøvene her.");
        }
    }
};

// Initialiser når siden lastes
document.addEventListener('DOMContentLoaded', () => {
    // Hvis vi er på lærersiden ved oppstart (reload), render:
    if(document.getElementById('laerer-dashboard').style.display === 'block') {
        TeacherAuth.render();
    }
});

// Hack: Vi må overstyre den globale navigasjonen litt for å trigge render når man trykker på menyen
// Legg til dette nederst i teacher.js
const originalVisSide = window.visSide;
window.visSide = function(sideId) {
    originalVisSide(sideId); // Kjør original navigasjon
    if (sideId === 'laerer-dashboard') {
        TeacherAuth.render();
    }
};