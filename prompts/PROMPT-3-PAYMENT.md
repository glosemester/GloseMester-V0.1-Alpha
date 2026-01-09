# 💳 PROMPT: Integrer Betalingsløsning i GloseMester

**Dato:** 9. januar 2025  
**Versjon:** v0.7.6-BETA  
**Mål:** Implementere Vipps, Faktura og Feide

---

## 🎯 BETALINGSFLYT OVERSIKT

### Betalingsmetoder:

#### 1. **Vipps ePay** (Premium: 99 kr/mnd eller 800 kr/år)
- For enkeltstående lærere
- Automatisk månedlig/årlig fakturering
- Umiddelbar aktivering
- Webhook for status-oppdateringer

#### 2. **Faktura** (Skolepakke: 5000-10000 kr/år)
- For skoler (organisasjonskunder)
- 30 dagers betalingsfrist
- Manuell fakturautsendelse via e-post
- Manuell aktivering etter betaling

#### 3. **Feide** (Valgfri elevpålogging)
- Ikke betaling, men autentisering
- For skoler som ønsker pålogging for elever
- SSO (Single Sign-On) via Feide
- Koble elev til skole/klasse

---

## 📦 BE OM DISSE FILENE/INFORMASJONEN (MAKS 10)

**Eksisterende kode og struktur:**

1. ✅ **auth.js** (autentiseringskode)
2. ✅ **teacher.js** (lærer-funksjoner inkl. upgrade-sjekk)
3. ✅ **index.html** (nåværende UI for oppgradering)
4. ✅ **Firebase config** (hvilken Firebase-plan bruker du?)
5. ✅ **Organisasjonsnummer** (for Vipps registrering)
6. ✅ **Eksisterende Vipps-avtale** (hvis du har)
7. ✅ **Logo** (for Vipps checkout)
8. ✅ **Privacy policy URL** (kreves av Vipps)
9. ✅ **Feide-tilgang** (er du registrert hos Feide?)
10. ✅ **Budsjett** for transaksjonsgebyr (Vipps tar 1.8% + 0 kr per transaksjon)

---

## 💰 IMPLEMENTERINGSPLAN

### Del 1: Vipps ePay (Premium)

#### 1.1 Registrering og setup

**Vipps Portal:**
1. Registrer bedrift hos [portal.vipps.no](https://portal.vipps.no)
2. Opprett "ePay" API keys:
   - Client ID
   - Client Secret
   - Subscription Key (Ocp-Apim-Subscription-Key)
3. Sett opp webhook URL: `https://glosemester.no/api/vipps-webhook`

**Priser å opprette:**
```javascript
const VIPPS_PRODUCTS = {
  premium_monthly: {
    price: 9900, // øre (99 kr)
    name: "GloseMester Premium - Månedlig",
    description: "Ubegrenset prøver + 16 standardprøver",
    interval: "MONTH"
  },
  premium_yearly: {
    price: 80000, // øre (800 kr)
    name: "GloseMester Premium - Årlig",
    description: "Ubegrenset prøver + 16 standardprøver (spar 388 kr)",
    interval: "YEAR"
  }
};
```

#### 1.2 Backend (Firebase Functions)

**Fil:** `functions/vipps.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Vipps config
const VIPPS_CONFIG = {
  clientId: functions.config().vipps.client_id,
  clientSecret: functions.config().vipps.client_secret,
  subscriptionKey: functions.config().vipps.subscription_key,
  merchantSerialNumber: functions.config().vipps.merchant_serial,
  baseUrl: 'https://api.vipps.no' // Prod, bruk apitest for test
};

// Hent access token
async function getVippsAccessToken() {
  const response = await axios.post(`${VIPPS_CONFIG.baseUrl}/accesstoken/get`, null, {
    headers: {
      'client_id': VIPPS_CONFIG.clientId,
      'client_secret': VIPPS_CONFIG.clientSecret,
      'Ocp-Apim-Subscription-Key': VIPPS_CONFIG.subscriptionKey
    }
  });
  return response.data.access_token;
}

// Opprett betaling
exports.createVippsPayment = functions.https.onCall(async (data, context) => {
  // Sjekk auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Må være logget inn');
  }

  const { plan } = data; // 'monthly' eller 'yearly'
  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  // Hent product info
  const product = plan === 'monthly' 
    ? VIPPS_PRODUCTS.premium_monthly 
    : VIPPS_PRODUCTS.premium_yearly;

  // Generer unik order ID
  const orderId = `glosemester-${Date.now()}`;

  // Hent access token
  const accessToken = await getVippsAccessToken();

  // Opprett betaling
  const response = await axios.post(
    `${VIPPS_CONFIG.baseUrl}/ecomm/v2/payments`,
    {
      customerInfo: {
        mobileNumber: null // Vipps henter fra app
      },
      merchantInfo: {
        merchantSerialNumber: VIPPS_CONFIG.merchantSerialNumber,
        callbackPrefix: 'https://glosemester.no/api/vipps-webhook',
        fallBack: 'https://glosemester.no/betaling-fullfort',
        isApp: false
      },
      transaction: {
        orderId: orderId,
        amount: product.price,
        transactionText: product.name,
        timeStamp: new Date().toISOString()
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_CONFIG.subscriptionKey,
        'Content-Type': 'application/json'
      }
    }
  );

  // Lagre order i Firestore
  await admin.firestore().collection('orders').doc(orderId).set({
    userId,
    userEmail,
    plan,
    amount: product.price,
    status: 'INITIATED',
    vippsUrl: response.data.url,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Returner Vipps URL
  return {
    orderId,
    vippsUrl: response.data.url
  };
});

// Webhook for statusoppdateringer
exports.vippsWebhook = functions.https.onRequest(async (req, res) => {
  const { orderId, transactionInfo } = req.body;

  if (!orderId || !transactionInfo) {
    return res.status(400).send('Invalid payload');
  }

  // Hent order fra Firestore
  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const order = await orderRef.get();

  if (!order.exists) {
    return res.status(404).send('Order not found');
  }

  const orderData = order.data();

  // Oppdater order status
  await orderRef.update({
    status: transactionInfo.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Hvis betaling OK → Oppgrader bruker
  if (transactionInfo.status === 'RESERVED' || transactionInfo.status === 'SALE') {
    const userRef = admin.firestore().collection('users').doc(orderData.userId);
    
    const expiryDate = new Date();
    if (orderData.plan === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    await userRef.update({
      premium: true,
      premiumExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
      premiumPlan: orderData.plan,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send kvitteringsmail
    await sendReceiptEmail(orderData.userEmail, orderData);
  }

  res.status(200).send('OK');
});

// Send kvittering
async function sendReceiptEmail(email, order) {
  // Bruk SendGrid, Mailgun eller Firebase Extensions
  // Implementeres basert på dine preferanser
}
```

#### 1.3 Frontend (app.js)

**Legg til i app.js:**

```javascript
// Oppgrader til Premium
async function oppgraderTilPremium(plan) {
  try {
    const lasterPopup = visLasterPopup('Oppretter betaling...');
    
    // Kall Firebase Function
    const createPayment = firebase.functions().httpsCallable('createVippsPayment');
    const result = await createPayment({ plan });
    
    lukkPopup(lasterPopup);
    
    // Redirect til Vipps
    window.location.href = result.data.vippsUrl;
  } catch (error) {
    console.error('Feil ved oppgradering:', error);
    visPopup('Noe gikk galt', 'Kunne ikke opprette betaling. Prøv igjen senere.');
  }
}

// Eksponer til window
window.oppgraderTilPremium = oppgraderTilPremium;
```

#### 1.4 UI for valg av plan

**Legg til i index.html (eller egen oppgrader-side):**

```html
<div id="oppgrader-popup" class="popup-overlay">
  <div class="popup-content" style="max-width: 600px;">
    <button class="popup-close" onclick="lukkPopup('oppgrader-popup')">×</button>
    <h2>Oppgrader til Premium</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
      <!-- Månedlig -->
      <div class="pricing-card">
        <h3>Månedlig</h3>
        <div class="price">99 kr/mnd</div>
        <ul>
          <li>✅ Ubegrenset prøver</li>
          <li>✅ 16 standardprøver</li>
          <li>✅ Excel-eksport</li>
          <li>✅ Fleksibel betaling</li>
        </ul>
        <button class="btn-primary" onclick="oppgraderTilPremium('monthly')">
          Velg månedlig
        </button>
      </div>
      
      <!-- Årlig -->
      <div class="pricing-card recommended">
        <div class="badge">Anbefalt</div>
        <h3>Årlig</h3>
        <div class="price">800 kr/år</div>
        <div class="savings">Spar 388 kr!</div>
        <ul>
          <li>✅ Ubegrenset prøver</li>
          <li>✅ 16 standardprøver</li>
          <li>✅ Excel-eksport</li>
          <li>✅ Ingen månedsgebyr</li>
        </ul>
        <button class="btn-primary" onclick="oppgraderTilPremium('yearly')">
          Velg årlig
        </button>
      </div>
    </div>
    
    <p style="text-align: center; color: #666; font-size: 0.9rem;">
      Sikker betaling med Vipps. Kan kanselleres når som helst.
    </p>
  </div>
</div>
```

---

### Del 2: Faktura (Skolepakke)

#### 2.1 Kontaktskjema for skoler

**Legg til i index.html:**

```html
<div id="skolepakke-popup" class="popup-overlay">
  <div class="popup-content">
    <h2>Skolepakke - Kontakt oss</h2>
    <p>Fyll ut skjemaet så tar vi kontakt for avtale og fakturering.</p>
    
    <form id="skolepakke-form">
      <label>
        Skolenavn *
        <input type="text" id="school-name" required>
      </label>
      
      <label>
        Organisasjonsnummer *
        <input type="text" id="org-number" required pattern="[0-9]{9}">
      </label>
      
      <label>
        Kontaktperson *
        <input type="text" id="contact-person" required>
      </label>
      
      <label>
        E-post *
        <input type="email" id="contact-email" required>
      </label>
      
      <label>
        Telefon *
        <input type="tel" id="contact-phone" required>
      </label>
      
      <label>
        Antall lærere *
        <select id="teacher-count" required>
          <option value="">Velg...</option>
          <option value="1-5">1-5 lærere (5000 kr/år)</option>
          <option value="6-15">6-15 lærere (7000 kr/år)</option>
          <option value="16+">16+ lærere (10000 kr/år)</option>
        </select>
      </label>
      
      <label>
        Melding (valgfritt)
        <textarea id="message" rows="4"></textarea>
      </label>
      
      <button type="submit" class="btn-primary">Send forespørsel</button>
    </form>
  </div>
</div>
```

#### 2.2 Backend for faktura-forespørsel

**Firebase Function:**

```javascript
exports.sendSchoolInquiry = functions.https.onCall(async (data, context) => {
  const { schoolName, orgNumber, contactPerson, contactEmail, contactPhone, teacherCount, message } = data;
  
  // Valider input
  if (!schoolName || !orgNumber || !contactPerson || !contactEmail || !contactPhone || !teacherCount) {
    throw new functions.https.HttpsError('invalid-argument', 'Alle felt må fylles ut');
  }
  
  // Lagre forespørsel
  await admin.firestore().collection('school_inquiries').add({
    schoolName,
    orgNumber,
    contactPerson,
    contactEmail,
    contactPhone,
    teacherCount,
    message,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Send e-post til deg (admin)
  await sendAdminNotification({
    subject: `Ny skolepakke-forespørsel: ${schoolName}`,
    body: `
      Skole: ${schoolName}
      Org.nr: ${orgNumber}
      Kontakt: ${contactPerson}
      E-post: ${contactEmail}
      Telefon: ${contactPhone}
      Antall lærere: ${teacherCount}
      Melding: ${message || 'Ingen'}
    `
  });
  
  // Send automatisk svar til skolen
  await sendAutoReply(contactEmail, contactPerson);
  
  return { success: true };
});
```

#### 2.3 Fakturautsendelse

**Manuell prosess (kan automatiseres senere):**

1. Motta forespørsel i Firebase
2. Kontakt skole for avtale
3. Generer faktura (bruk fakturatjeneste som Fiken, Tripletex, Visma)
4. Send faktura på e-post (30 dagers betalingsfrist)
5. Ved betaling → Manuelt aktiver skolepakke i Firebase:

```javascript
// Aktiver skolepakke for skole
const schoolDoc = await admin.firestore().collection('schools').add({
  name: "Skolenavn ungdomsskole",
  orgNumber: "123456789",
  teacherCount: "1-5",
  activatedAt: admin.firestore.FieldValue.serverTimestamp(),
  expiryDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // +1 år
  status: 'active'
});

// Gi alle lærerne på skolen tilgang
const teacherEmails = ['lærer1@skole.no', 'lærer2@skole.no'];
for (const email of teacherEmails) {
  const userQuery = await admin.firestore().collection('users').where('email', '==', email).get();
  if (!userQuery.empty) {
    await userQuery.docs[0].ref.update({
      skolepakke: true,
      schoolId: schoolDoc.id
    });
  }
}
```

---

### Del 3: Feide (Elevpålogging)

#### 3.1 Registrering hos Feide

**Forutsetninger:**
1. Bedrift må være registrert hos Feide
2. Anskaffe Feide OAuth2 credentials (Client ID, Client Secret)
3. Redirect URL: `https://glosemester.no/auth/feide/callback`

**Kontakt:** [https://www.feide.no/tjenester](https://www.feide.no/tjenester)

#### 3.2 Firebase Authentication med Feide

**Backend (Firebase Functions):**

```javascript
exports.feideLogin = functions.https.onRequest(async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.redirect('https://glosemester.no/login?error=no_code');
  }
  
  // Exchange code for token
  const tokenResponse = await axios.post('https://auth.dataporten.no/oauth/token', {
    grant_type: 'authorization_code',
    code,
    client_id: functions.config().feide.client_id,
    client_secret: functions.config().feide.client_secret,
    redirect_uri: 'https://glosemester.no/auth/feide/callback'
  });
  
  const { access_token } = tokenResponse.data;
  
  // Hent brukerinfo fra Feide
  const userInfoResponse = await axios.get('https://auth.dataporten.no/userinfo', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  const feideUser = userInfoResponse.data;
  
  // Opprett/oppdater bruker i Firebase
  const customToken = await admin.auth().createCustomToken(feideUser.sub, {
    feideId: feideUser.sub,
    email: feideUser.email,
    name: feideUser.name
  });
  
  // Redirect til app med token
  res.redirect(`https://glosemester.no/login?token=${customToken}`);
});
```

#### 3.3 Frontend (Feide-knapp)

**I index.html:**

```html
<button class="btn-feide" onclick="loggInnMedFeide()">
  <img src="img/feide-logo.svg" alt="Feide">
  Logg inn med Feide
</button>
```

**I app.js:**

```javascript
function loggInnMedFeide() {
  const feideAuthUrl = `https://auth.dataporten.no/oauth/authorization?` +
    `client_id=${FEIDE_CLIENT_ID}&` +
    `redirect_uri=https://glosemester.no/auth/feide/callback&` +
    `response_type=code&` +
    `scope=openid email profile`;
  
  window.location.href = feideAuthUrl;
}

// Håndter callback
const urlParams = new URLSearchParams(window.location.search);
const customToken = urlParams.get('token');

if (customToken) {
  firebase.auth().signInWithCustomToken(customToken)
    .then(() => {
      console.log('✅ Logget inn med Feide');
      window.location.href = '/';
    })
    .catch(error => {
      console.error('Feil ved Feide-pålogging:', error);
    });
}
```

---

## 📊 TESTING

### Vipps Test Environment

**Setup:**
1. Bruk `https://apitest.vipps.no` i stedet for `https://api.vipps.no`
2. Last ned Vipps test-app
3. Bruk test-telefonnummer: `12345678`
4. Test-konto: BankID på mobil med test-bruker

**Test-flow:**
1. Klikk "Oppgrader til Premium"
2. Velg plan (månedlig/årlig)
3. Redirect til Vipps
4. Bekreft betaling i test-app
5. Verifiser at bruker oppgraderes i Firebase

### Faktura Testing

**Test-flow:**
1. Fyll ut skolepakke-skjema
2. Verifiser at forespørsel lagres i Firestore
3. Verifiser at admin får e-post
4. Verifiser at skole får automatisk svar
5. Manuelt aktiver skolepakke
6. Verifiser at lærere får tilgang

### Feide Testing

**Setup:**
1. Kontakt Feide for test-miljø
2. Bruk test-bruker fra Feide
3. Test pålogging-flow

---

## 🚀 DEPLOYMENT CHECKLIST

### Før produksjon:

**Vipps:**
- [ ] Registrert hos Vipps Portal
- [ ] Produksjons-API keys hentet
- [ ] Webhook URL konfigurert
- [ ] Logo og branding lastet opp
- [ ] Test-betaling gjennomført
- [ ] Kvitteringsmail fungerer

**Faktura:**
- [ ] Faktura-template designet
- [ ] E-post-integrasjon satt opp
- [ ] Admin-notifikasjoner fungerer
- [ ] Manuell aktivering testet

**Feide:**
- [ ] Registrert hos Feide
- [ ] OAuth credentials hentet
- [ ] Redirect URLs konfigurert
- [ ] Test-pålogging gjennomført

**Firebase:**
- [ ] Functions deployet
- [ ] Firestore-regler oppdatert
- [ ] Environment variables satt (Vipps, Feide)
- [ ] Backup-rutiner på plass

---

## 💰 KOSTNADER

### Vipps ePay:
- **Etablering:** Gratis
- **Transaksjonsgebyr:** 1.8% + 0 kr per transaksjon
- **Eksempel:** 99 kr betaling → 1.78 kr gebyr → 97.22 kr til deg

### Faktura (manuell):
- **Etablering:** Gratis (hvis du sender selv)
- **Med fakturatjeneste (Fiken/Tripletex):** ~200 kr/mnd

### Feide:
- **Etablering:** Gratis for utdanningsinstitusjoner
- **Drift:** Gratis

---

## 📝 NESTE STEG

**Med filene/informasjonen over kan jeg:**
1. Sette opp Vipps-integrasjon
2. Implementere faktura-flow
3. Integrere Feide-pålogging
4. Lage komplett test-miljø
5. Skrive deployment-guide

**Vennligst gi meg:**
- auth.js (autentiseringskode)
- teacher.js (oppgraderingslogikk)
- index.html (nåværende UI)
- Firebase config
- Organisasjonsnummer (for Vipps)
- Feide-tilgang (hvis du har)

**Jeg vil da gi deg:**
- Komplett Firebase Functions-kode
- Frontend-integrasjon
- Test-instruksjoner
- Deployment-guide
- Kostnadsestimater

---

**Status:** Klar for implementering! 💳
