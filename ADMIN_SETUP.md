# 🔐 Admin-oppsett for GloseMester

## Oversikt

Fra versjon 0.9.9+ bruker GloseMester **rolle-basert admin-tilgang** i stedet for hardkodet bruker-ID. Dette gjør det enkelt å legge til/fjerne administratorer.

## Hvordan admin-systemet fungerer

Admin-status lagres nå i Firestore, i brukerens dokument:

```javascript
// Firestore: users/{userId}
{
  uid: "abc123...",
  email: "oyvin@example.no",
  navn: "Øyvind Nilsen Oksvold",
  rolle: "admin",  // ← Dette feltet bestemmer admin-tilgang
  abonnement: { ... },
  // ... resten av brukerdata
}
```

## Sette opp første admin

### Metode 1: Via Firebase Console (Anbefalt)

1. **Gå til Firebase Console**
   - https://console.firebase.google.com/
   - Velg prosjektet: `glosemester-1e67e`
   - Gå til **Firestore Database**

2. **Naviger til brukerdokumentet**
   - Collection: `users`
   - Dokument-ID: Din bruker-UID (finn via Authentication → Users)

3. **Legg til rolle-feltet**
   - Klikk "Add field" eller rediger eksisterende dokument
   - Feltnavn: `rolle`
   - Felttype: `string`
   - Verdi: `admin`
   - Klikk "Update"

4. **Logg ut og inn igjen**
   - Admin-tilgang aktiveres ved neste innlogging

### Metode 2: Via Firebase CLI (For utviklere)

```bash
# Installer Firebase CLI hvis ikke allerede gjort
npm install -g firebase-tools

# Logg inn
firebase login

# Opprett script: set-admin.js
cat > set-admin.js << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdmin(uid) {
  try {
    await db.collection('users').doc(uid).update({
      rolle: 'admin'
    });
    console.log(`✅ Admin-tilgang gitt til bruker: ${uid}`);
  } catch (error) {
    console.error('❌ Feil:', error);
  }
}

// Erstatt med din bruker-UID
setAdmin('DIN_BRUKER_UID_HER');
EOF

# Kjør scriptet
node set-admin.js
```

### Metode 3: Via Netlify Function (Sikrest)

Opprett en beskyttet Netlify Function som kun kan kjøres av deg:

```javascript
// netlify/functions/set-admin.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

exports.handler = async (event) => {
  // ⚠️ VIKTIG: Legg til autorisasjon her!
  const SECRET_TOKEN = process.env.ADMIN_SETUP_TOKEN;

  if (event.headers['authorization'] !== `Bearer ${SECRET_TOKEN}`) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const { uid } = JSON.parse(event.body);

  try {
    await admin.firestore().collection('users').doc(uid).update({
      rolle: 'admin'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: `Admin-tilgang gitt til ${uid}` })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

Kjør med:
```bash
curl -X POST https://glosemester.no/.netlify/functions/set-admin \
  -H "Authorization: Bearer DIN_HEMMELIGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"BRUKER_UID_HER"}'
```

## Finne din bruker-UID

### Via Firebase Console:
1. Gå til **Authentication → Users**
2. Finn din e-post
3. Kopier "User UID"-kolonnen

### Via Browser Console (når innlogget):
```javascript
// Åpne DevTools (F12)
// Gå til Console
firebase.auth().currentUser.uid
```

## Legge til flere admins

Når du er admin kan du:

1. **Via Admin-panelet** (Kommer i fremtidig versjon)
   - Gå til Admin-panel → Brukeradministrasjon
   - Finn bruker → Sett rolle til "admin"

2. **Manuelt via Firestore Console**
   - Samme prosess som "Sette opp første admin"

## Fjerne admin-tilgang

### Via Firebase Console:
1. Gå til Firestore → `users/{userId}`
2. Endre `rolle`-feltet fra `admin` til `laerer`
3. Eller slett `rolle`-feltet helt

### Viktig:
- Sørg for at det alltid er minst én admin
- Admin-endringer trer i kraft ved neste innlogging

## Firestore Security Rules

Admin-sjekken i `firestore.rules`:

```javascript
function isAdmin() {
  return request.auth != null &&
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.rolle == 'admin';
}
```

## Verifisere admin-tilgang

### I browser console:
```javascript
// Importer auth-helpers
import { erAdmin } from './js/core/auth-helpers.js';

// Sjekk admin-status
await erAdmin(); // true eller false
```

### I kode:
```javascript
import { erAdmin, kreverAdmin } from './js/core/auth-helpers.js';

// Enkel sjekk
if (await erAdmin()) {
  console.log('Bruker er admin');
}

// Beskytt en funksjon
await kreverAdmin(async () => {
  // Denne koden kjører kun hvis bruker er admin
  console.log('Admin-funksjonalitet');
});
```

## Roller i GloseMester

| Rolle | Beskrivelse | Tilgang |
|-------|-------------|---------|
| `admin` | Full tilgang | Alt (GloseBank moderering, brukeradmin, standardprøver) |
| `laerer` | Standard lærer | Lag prøver, se statistikk (avhengig av abonnement) |
| `elev` | Elev (blokkert fra lærer-modus) | Kun prøvegjennomføring via kode |

## Feilsøking

### Admin-knappen vises ikke

**Problem:** Innlogget som admin, men ser ikke admin-panelet.

**Løsning:**
1. Sjekk Firestore: `users/{uid}` → Har `rolle: "admin"`?
2. Logg ut og inn igjen
3. Sjekk browser console for feil
4. Verifiser at Firestore rules er deployet

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### "Permission denied" feil

**Problem:** Får tilgangsfeil i Firestore.

**Løsning:**
1. Sjekk at `rolle`-feltet eksisterer i Firestore
2. Sjekk at verdi er nøyaktig `"admin"` (ikke `"Admin"` eller `"administrator"`)
3. Redeploy Firestore rules

## Sikkerhet

⚠️ **VIKTIG:**
- Gi aldri admin-tilgang til ukjente
- Bruk sterke passord for admin-kontoer
- Logg regelmessig hvem som har admin-tilgang
- Vurder 2-faktor autentisering (Firebase Auth 2FA)

## Backup av admins

Før du endrer admin-tilganger, ta backup:

```bash
# Firebase CLI
firebase firestore:export gs://glosemester-backup/admin-backup-$(date +%Y%m%d)
```

## Support

Spørsmål om admin-oppsett?
- E-post: kontakt@glosemester.no
- GitHub Issues: https://github.com/oyvindoksvold/glosemester/issues

---

**Sist oppdatert:** 16. januar 2026
**Versjon:** GloseMester v0.9.9-BETA+
