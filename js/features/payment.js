// js/features/payment.js
// Stripe Payment Integration for GloseMester Premium

import { auth } from './firebase.js';

/**
 * Start Stripe Checkout for Premium subscription
 * @param {string} plan - Either 'premium_monthly' or 'premium_yearly'
 */
window.startStripeBetaling = async function (plan) {
    try {
        // Check if user is logged in
        const user = auth.currentUser;

        if (!user) {
            alert("Du må være logget inn for å kjøpe Premium.\n\nLogg inn først og prøv igjen.");
            window.location.href = '/';
            return;
        }

        // Show loading state
        const buttons = document.querySelectorAll('.btn-primary');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Laster...';
        });

        console.log(`Starting Stripe checkout for plan: ${plan}, user: ${user.uid}`);

        // Call Netlify function to create Stripe Checkout Session
        const response = await fetch('/.netlify/functions/stripe-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plan: plan,
                userId: user.uid,
                userEmail: user.email
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Kunne ikke opprette betalingssesjon');
        }

        const { url, orderId } = await response.json();

        console.log(`Redirecting to Stripe Checkout, orderId: ${orderId}`);

        // Redirect to Stripe Checkout
        window.location.href = url;

    } catch (error) {
        console.error('Payment error:', error);
        alert(`Noe gikk galt: ${error.message}\n\nPrøv igjen eller kontakt support.`);

        // Reset button states
        const buttons = document.querySelectorAll('.btn-primary');
        buttons.forEach(btn => {
            btn.disabled = false;
            // Restore original text based on plan
            if (btn.onclick && btn.onclick.toString().includes('monthly')) {
                btn.textContent = 'Velg månedlig';
            } else {
                btn.textContent = 'Velg årlig (spar 388 kr)';
            }
        });
    }
};

// Legacy function name for backward compatibility
window.startVippsBetaling = window.startStripeBetaling;

/**
 * Check URL params for payment status and show appropriate message
 */
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status === 'success') {
        // Verifiser at betaling faktisk gikk gjennom ved å sjekke Firestore
        setTimeout(async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                    const { db } = await import('./firebase.js');
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const data = userDoc.data();
                    if (data?.subscription?.status === 'premium') {
                        alert('🎉 Takk for ditt kjøp!\n\nDin Premium-tilgang er nå aktivert. Du kan nå bruke alle funksjoner i GloseMester.');
                    } else {
                        alert('⏳ Betaling mottas...\n\nDet kan ta noen sekunder. Oppdater siden om litt for å se Premium-tilgangen din.');
                    }
                } else {
                    alert('🎉 Takk for ditt kjøp!\n\nLogg inn for å aktivere Premium-tilgangen din.');
                }
            } catch (e) {
                alert('🎉 Takk for ditt kjøp!\n\nDet kan ta noen sekunder å aktivere. Oppdater siden om litt.');
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 1500);
    } else if (status === 'cancelled') {
        setTimeout(() => {
            alert('Betalingen ble avbrutt.\n\nDu kan prøve igjen når du er klar.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }
});