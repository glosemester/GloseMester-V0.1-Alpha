// js/features/payment.js

// Vipps functionality has been removed as per the new requirement to switch to Stripe.
// This file is currently a placeholder for future payment integrations.

window.startVippsBetaling = async function (plan) {
    console.log("Vipps payment is disabled. Future Stripe integration pending for plan:", plan);
    alert("Betaling er midlertidig utilgjengelig mens vi bytter betalingsløsning.");
};