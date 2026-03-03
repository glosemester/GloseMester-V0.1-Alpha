# 🎫 GLOSEMESTER KAMPANJEKODER - OVERSIKT

**Versjon:** v0.6.1-BETA  
**Oppdatert:** Januar 2025  
**Fil:** `js/features/teacher.js` (linje ~547-560)

---

## 📋 ALLE AKTIVE KAMPANJEKODER

### 🌟 PREMIUM-KODER (Ubegrenset prøver)

| Kode | Varighet | Beskrivelse | Bruksområde |
|------|----------|-------------|-------------|
| `BETA2026` | 90 dager | Beta-tester bonus | Beta-testere, early adopters |
| `LANSERING` | 30 dager | Lanseringstilbud | Lanserings-kampanje |
| `TEST30` | 30 dager | Premium test | Testing/demo for lærere |
| `TEST7` | 7 dager | Premium test | Kort testing |

**Hva får man med Premium:**
- ✅ Ubegrenset antall prøver
- ✅ QR-kode generering
- ✅ Resultat-tracking
- ✅ Excel-eksport
- ❌ **Ikke** tilgang til GloseBank

---

### 🏫 SKOLEPAKKE-KODER (GloseBank + Alt)

| Kode | Varighet | Beskrivelse | Bruksområde |
|------|----------|-------------|-------------|
| `SKOLE2026` | 365 dager (1 år) | Skolepakke full | Skoler som kjøper årspakke |
| `SKOLEPILOT` | 180 dager (6 mnd) | Skolepakke pilot | Pilot-skoler, testperiode |
| `SKOLETEST` | 30 dager (1 mnd) | Skolepakke test | Demo/testing for skoler |

**Hva får man med Skolepakke:**
- ✅ Alt fra Premium
- ✅ **Tilgang til GloseBank** (søk og last ned prøver)
- ✅ Rating-system for prøver
- ✅ Filter på fag, nivå, emne, LK20
- ✅ Forhåndsvisning av ordlister
- ✅ Kvalitetssikret innhold

---

## 🔐 AKTIVERING AV KAMPANJEKODE

### For lærere:
1. Logg inn på glosemester.no
2. Gå til "Oppgrader"-siden
3. Skriv inn kampanjekoden
4. Klikk "Aktiver"
5. Siden laster på nytt med ny tilgang

### For admin (manuell aktivering):
1. Gå til Firebase Console
2. Firestore Database → `users` → Finn bruker
3. Rediger `abonnement` feltet:

**Premium:**
```javascript
abonnement: {
  type: "premium",
  status: "active",
  start_dato: [dagens dato],
  utloper: [dato + varighet],
  kampanjekode: "BETA2026",
  beskrivelse: "Beta-tester bonus (3 mnd gratis)"
}
```

**Skolepakke:**
```javascript
abonnement: {
  type: "skolepakke",
  status: "active",
  start_dato: [dagens dato],
  utloper: [dato + varighet],
  kampanjekode: "SKOLETEST",
  beskrivelse: "Skolepakke test (1 mnd)"
}
```

---

## 📊 KODE-STATISTIKK OG SPORING

For å se hvem som har brukt koder:

### Firebase Query:
```javascript
// Finn alle med en spesifikk kode
db.collection('users')
  .where('abonnement.kampanjekode', '==', 'SKOLETEST')
  .get()
  .then(snapshot => {
    console.log(`${snapshot.size} brukere har brukt SKOLETEST`);
  });

// Finn alle skolepakke-brukere
db.collection('users')
  .where('abonnement.type', '==', 'skolepakke')
  .get()
  .then(snapshot => {
    console.log(`${snapshot.size} skolepakke-brukere totalt`);
  });
```

---

## ➕ LEGGE TIL NYE KODER

### 1. Rediger teacher.js

**Finn:** `const gyldigeKoder = {` (linje ~548)

**Legg til ny kode:**
```javascript
const gyldigeKoder = {
    // ... eksisterende koder ...
    
    'NYKODE2025': { 
        dager: 60, 
        type: 'skolepakke',  // eller 'premium'
        beskrivelse: 'Beskrivelse her' 
    },
};
```

### 2. Test koden
```javascript
// Aktivér koden i test-miljø
1. Logg inn som test-lærer
2. Skriv inn koden
3. Verifiser at type settes riktig
4. Verifiser at GloseBank vises (hvis skolepakke)
```

### 3. Deploy
```bash
git add js/features/teacher.js
git commit -m "feat: Legg til kampanjekode NYKODE2025"
git push origin main
```

---

## 🎯 STRATEGI FOR KODE-BRUK

### Beta-fase (nå):
- Del `BETA2026` til early adopters (90 dager premium)
- Del `SKOLETEST` til skoler som vil teste GloseBank (30 dager)

### Lansering:
- Bruk `LANSERING` i sosiale medier (30 dager premium)
- Del `SKOLEPILOT` til pilot-skoler (180 dager)

### Salg til skoler:
- Gi `SKOLETEST` som demo (30 dager)
- Ved kjøp: Generer unik kode eller gi `SKOLE2026` (365 dager)

### Support/kompensasjon:
- `TEST7` for rask testing ved support-saker
- `TEST30` for kompensasjon ved bugs/issues

---

## ⚠️ SIKKERHET OG MISBRUK

### Forebygging av misbruk:
1. **En kode per bruker:** Samme kode kan brukes av flere, MEN én bruker kan ikke bruke samme kode to ganger
2. **Logg aktivering:** Kampanjekode lagres i brukerens abonnement
3. **Manuell overvåking:** Sjekk Firestore regelmessig for misbruk

### Hvis kode misbrukes:
1. **Kortsiktig:** Fjern koden fra `gyldigeKoder` i teacher.js
2. **Langsiktig:** Implementer server-side validering
3. **Umiddelbart:** Deaktiver brukere manuelt i Firebase

---

## 📈 FREMTIDIGE FORBEDRINGER

### Planlagte features:
- [ ] Unike engangskoder (genereres server-side)
- [ ] Bruks-limit per kode (f.eks. kun 50 brukere)
- [ ] Utløpsdato for selve koden
- [ ] Automatisk deaktivering ved utløp
- [ ] Admin-dashboard for kode-administrasjon
- [ ] Statistikk over kode-bruk

### Backend-løsning (fremtidig):
```javascript
// Firebase Cloud Function
exports.validateCampaignCode = functions.https.onCall(async (data, context) => {
  const { code, userId } = data;
  
  // Sjekk om kode er gyldig
  // Sjekk om bruker allerede har brukt koden
  // Sjekk om kode har utløpt
  // Sjekk om kode har nådd bruks-limit
  
  return { valid: true, details: { ... } };
});
```

---

## 🧪 TESTING AV KODER

### Test-sjekkliste:
- [ ] Premium-kode setter `type: "premium"`
- [ ] Skolepakke-kode setter `type: "skolepakke"`
- [ ] `status` settes til `"active"`
- [ ] `utloper` dato er riktig (start_dato + dager)
- [ ] Kampanjekode lagres i brukerens dokument
- [ ] GloseBank-knappen vises for skolepakke
- [ ] GloseBank-knappen IKKE vises for premium
- [ ] Admin-knappen vises kun for admin
- [ ] Siden laster på nytt etter aktivering

### Firebase Console-verifisering:
```
1. users/[uid]/abonnement:
   ✅ type: "skolepakke" (eller "premium")
   ✅ status: "active"
   ✅ utloper: [riktig dato]
   ✅ kampanjekode: [koden som ble brukt]

2. Test navigasjon:
   ✅ visSide('glosebank-browse') fungerer
   ✅ Prøver lastes fra GloseBank
   ✅ Søk og filter fungerer
```

---

## 📞 SUPPORT

### Vanlige spørsmål:

**Q: "Kampanjekoden fungerer ikke"**
A: Sjekk at koden er skrevet riktig (store bokstaver), og at brukeren er logget inn.

**Q: "GloseBank vises ikke etter aktivering"**
A: Sjekk at `abonnement.type === "skolepakke"` i Firebase Console.

**Q: "Kan jeg bruke flere koder?"**
A: Nei, kun én aktiv kode per bruker om gangen. Ny kode overskriver gammel.

**Q: "Hva skjer når koden utløper?"**
A: For øyeblikket ingenting automatisk. Implementer utløps-sjekk senere.

---

## 📝 ENDRINGER

### v0.6.1-BETA (Januar 2025)
- ✅ Lagt til `SKOLETEST` (30 dagers skolepakke)
- ✅ Lagt til `SKOLEPILOT` (180 dagers skolepakke)
- ✅ Endret `type: 'school'` til `type: 'skolepakke'`
- ✅ Fikset abonnement-struktur (`type` i stedet for `status`)
- ✅ Lagt til spesiell melding for skolepakke-aktivering

### v0.6.0-BETA
- ✅ Opprinnelige koder: BETA2026, LANSERING, SKOLE2026, TEST7, TEST30

---

**Viktig:** Hold denne filen oppdatert når nye koder legges til eller fjernes!

---

## 🎉 BRUK AV KODER

**For Øyvind (admin):**
- Bruk `SKOLETEST` for å teste GloseBank selv
- Del `SKOLETEST` til lærere som vil prøve
- Del `BETA2026` til venner/early adopters
- Gi `SKOLE2026` til skoler som kjøper

**For support:**
- `TEST7` - Rask testing ved bug-rapporter
- `TEST30` - Kompensasjon ved større issues
- `SKOLEPILOT` - Pilot-skoler som vil teste over tid

**For salg:**
- Gi `SKOLETEST` som 30-dagers prøveperiode
- Ved kjøp → `SKOLE2026` eller generer unik kode

---

**Sist oppdatert:** Januar 2025  
**Vedlikeholdes av:** Øyvind Nilsen Oksvold
