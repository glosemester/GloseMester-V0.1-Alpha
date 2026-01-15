// js/features/payment.js

// 1. Vi fester funksjonen til 'window' slik at HTML-knappen finner den
window.startVippsBetaling = async function(plan) {
    
    // 2. Vi henter 'auth' fra window (som vi skal legge ut i neste steg)
    const auth = window.auth;

    if (!auth) {
        console.error("Auth mangler. Sjekk at auth.js kjører.");
        alert("Systemfeil: Kan ikke verifisere bruker.");
        return;
    }

    const user = auth.currentUser;

  if (!user) {
        alert("Du må være logget inn for å kjøpe abonnement.\n\nDu blir nå sendt til forsiden. Logg inn som lærer der, og trykk på 'Oppgrader' på nytt.");
        // Endret fra "/login.html" til "/" (forsiden) siden login-modulen ligger der
        window.location.href = "/";
        return;
    }

    // 3. Finn knappen og vis "Laster..."
    const button = document.querySelector(`button[onclick*="${plan}"]`);
    const originalText = button ? button.innerText : "Kjøp";
    
    if (button) {
        button.innerText = "Starter Vipps...";
        button.disabled = true;
        button.style.cursor = "wait";
    }

    try {
        console.log(`Starter betaling for plan: ${plan}`);

        const response = await fetch('/.netlify/functions/vipps-initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan: plan,
                userId: user.uid,
                userEmail: user.email || "Ingen e-post"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Noe gikk galt med betalingen.");
        }

        console.log("Ordre opprettet! Sender til Vipps:", data.vippsUrl);
        window.location.href = data.vippsUrl;

    } catch (error) {
        console.error("Betalingsfeil:", error);
        alert(`Beklager, kunne ikke starte betalingen:\n${error.message}`);
        
        if (button) {
            button.innerText = originalText;
            button.disabled = false;
            button.style.cursor = "pointer";
        }
    }
};

// 4. Sjekk om vi kom tilbake fra Vipps (Callback)
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const orderId = urlParams.get('orderId');

    if (status === 'success' && orderId) {
        window.history.replaceState({}, document.title, window.location.pathname);
        alert("🎉 Takk for betalingen!\nAbonnementet ditt aktiveres straks.");
        setTimeout(() => { window.location.href = "/"; }, 1000);
    } 
    else if (status === 'error') {
        alert("Betalingen ble avbrutt eller feilet.");
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});