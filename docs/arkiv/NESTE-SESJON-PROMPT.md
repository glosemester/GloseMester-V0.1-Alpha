# 🚀 GLOSEMESTER FORTSETTELSE - PROMPT FOR CLAUDE

## 📋 PROSJEKTOVERSIKT

**Prosjekt:** GloseMester - Gamifisert språklæring PWA  
**Utvikler:** Øyvind Nilsen Oksvold  
**Nettside:** https://glosemester.no  
**Versjon:** v0.6.0-BETA (Januar 2025)  
**GitHub:** (Private repository)

**Stack:**
- Frontend: Vanilla JavaScript (ES6 modules)
- Backend: Firebase (Firestore, Auth)
- Hosting: Netlify (auto-deploy fra main branch)
- PWA: Service Worker caching

---

## ✅ FULLFØRT STATUS (v0.6.0-BETA)

### **GloseBank - Steg 1 & 2 FERDIG:**

1. ✅ **Auto-lagring til GloseBank**
   - Alle nye engelske prøver lagres automatisk til Firestore "glosebank"
   - Status: "pending", synlig_for_kunder: false
   - Metadata: fag, nivå, trinn, emne, LK20, vanskelighetsgrad
   - Statistikk: nedlastninger, ratings

2. ✅ **Admin-side for kuratoring**
   - Admin-panel kun tilgjengelig for Øyvind (hardkodet UID)
   - Filter: Alle / Pending / Godkjent
   - Godkjenn prøve med kategorisering
   - Rediger metadata
   - Skjul/Slett prøver

**Filer oppdatert:**
- `js/features/glosebank-admin.js` - Komplett admin-modul
- `css/glosebank-admin.css` - Admin-styling
- `js/features/teacher.js` - Auto-lagring til glosebank
- `js/app.js` - Import og window exposure
- `js/features/auth.js` - Admin-meny trigger
- `js/core/navigation.js` - Auto-load glosebank-admin
- `sw.js` - Versjon v0.6.0-BETA
- `index.html` - Admin-side HTML

**Firestore Collections:**
- `glosebank` - Alle prøver (pending/approved)
- `glosebank_ratings` - Lærer-ratings

---

## 🎯 NESTE OPPGAVE: STEG 3 - SØKESIDE FOR LÆRERE

### **Mål:**
Lage en søkeside hvor lærere med **skolepakke** kan:
- Browse godkjente prøver fra GloseBank
- Søke og filtrere på: Fag, Nivå, Emne, LK20-kompetansemål
- Se metadata og ratings
- Last ned prøve til egne lagrede prøver
- Rate prøve (1-5 stjerner) etter bruk

### **Tilgangskontroll:**
- **Kun** lærere med `abonnement.type === "skolepakke"` skal se GloseBank-siden
- Premium-lærere (500 kr/år) skal **ikke** ha tilgang
- Gratis tier skal **ikke** ha tilgang

### **Teknisk Implementering:**

**Ny fil:** `js/features/glosebank-browse.js`
- Funksjon: `lastInnGlosebankSok()`
- Funksjon: `sokOgFilterProver()`
- Funksjon: `lastNedFraGlosebank(proveId)`
- Funksjon: `visRatingModal(proveId)`

**Firestore Query:**
```javascript
const q = query(
  collection(db, "glosebank"),
  where("synlig_for_kunder", "==", true),
  orderBy("nedlastninger", "desc") // eller rating_snitt
);
```

**Last ned prøve:**
```javascript
// 1. Hent prøve fra glosebank
const gbDoc = await getDoc(doc(db, "glosebank", glosebankId));
const gbData = gbDoc.data();

// 2. Kopier til lærerens "prover"
await addDoc(collection(db, "prover"), {
  tittel: gbData.tittel + " (fra GloseBank)",
  ordliste: gbData.ordliste,
  opprettet_av: currentUser.uid,
  opprettet_dato: serverTimestamp(),
  kilde: "glosebank",
  original_id: glosebankId
});

// 3. Øk nedlastnings-teller
await updateDoc(doc(db, "glosebank", glosebankId), {
  nedlastninger: increment(1)
});
```

**Rating:**
```javascript
// Lagre rating
await addDoc(collection(db, "glosebank_ratings"), {
  glosebank_id: proveId,
  laerer_id: currentUser.uid,
  rating: 5, // 1-5
  kommentar: "Veldig bra!",
  dato: serverTimestamp()
});

// Oppdater gjennomsnitt
await updateDoc(doc(db, "glosebank", proveId), {
  rating_sum: increment(rating),
  rating_count: increment(1),
  rating_snitt: (rating_sum + rating) / (rating_count + 1)
});
```

**UI Mock:**
```
┌─────────────────────────────────────────────────────────┐
│ 📚 GloseBank - Delte prøver fra lærere                 │
├─────────────────────────────────────────────────────────┤
│ 🔍 [Søk i prøver...]                                    │
│                                                          │
│ Filter:                                                  │
│ [Fag ▼] [Nivå ▼] [Emne ▼]                              │
│                                                          │
│ Sorter: [Mest populære ▼]                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📚 Familie - Engelsk (15 ord)                          │
│ └─ Barneskole • 2-4. trinn • LK20: K1                  │
│    ⭐ 4.8 (24 vurderinger) • 📥 156 nedlastninger      │
│    [📥 Last ned] [👁️ Forhåndsvis]                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 UTVIKLINGSMETODIKK

### **Arbeidsflyt:**
1. **Planlegging:** Diskuter løsning med Øyvind
2. **Implementering:** Lag komplette filer klare for copy/paste
3. **Instruksjoner:** Lag steg-for-steg guide (Markdown)
4. **Testing:** Test lokalt før deploy
5. **Deploy:** Git push til main → Netlify auto-deploy
6. **Dokumentasjon:** Oppdater README.md

### **Fil-levering:**
- **ALLTID** lever komplette filer klare for copy/paste
- **ALDRI** kun snippets eller deler av filer
- Bruk `present_files` for å levere filer til Øyvind
- Lag separate instruksjonsfiler (Markdown) for endringer i eksisterende filer

### **Testing:**
1. Test lokalt: `python -m http.server 8000`
2. Sjekk Console for feil (F12)
3. Verifiser Firebase data
4. Deploy til produksjon
5. Test i Incognito (fresh cache)

### **Feilsøking:**
- **Duplikat exports:** Sjekk at funksjoner kun eksporteres én gang
- **Module errors:** Verifiser imports i app.js
- **Firebase permissions:** Sjekk at rules er publisert
- **Cache issues:** Bump sw.js versjon etter deploy

---

## 📁 VIKTIGE FILER

### **Hovedfiler:**
- `index.html` - HTML struktur
- `sw.js` - Service Worker (versjon: v0.6.0-BETA)
- `js/app.js` - Hovedkontroller, imports, window exports
- `js/init.js` - Initialisering

### **Firebase:**
- `js/features/firebase.js` - Firebase config
- `js/features/auth.js` - Autentisering
- `firestore.rules` - Database sikkerhet

### **GloseBank (v0.6.0):**
- `js/features/glosebank-admin.js` - Admin-modul
- `css/glosebank-admin.css` - Admin-styling
- `js/features/teacher.js` - Auto-lagring til glosebank

### **Stil:**
- `css/main.css` - Hovedstyling
- `css/popups.css` - Modal/popup styling
- `css/glosebank-admin.css` - Admin-styling

---

## 🔥 FIREBASE STRUKTUR

### **Collections:**

**users/**
```javascript
{
  email: "lærer@skole.no",
  navn: "Ola Nordmann",
  rolle: "laerer",
  proverOpprettet: 3,
  abonnement: {
    type: "skolepakke", // "free", "premium", "skolepakke"
    status: "active",
    utloper: timestamp,
    kampanjekode: "BETA2026"
  }
}
```

**prover/**
```javascript
{
  tittel: "Familie - Engelsk",
  ordliste: [{ s: "mor", e: "mother" }, ...],
  opprettet_av: "user_uid",
  opprettet_dato: timestamp,
  antall_gjennomforinger: 5,
  aktiv: true
}
```

**glosebank/**
```javascript
{
  tittel: "Familie - Engelsk",
  ordliste: [...],
  opprettet_av: "user_uid",
  opprettet_av_epost: "lærer@skole.no",
  
  // Kategorisering
  fag: "engelsk",
  nivå: "barneskole",
  trinn: "2-4",
  emne: "familie",
  LK20_kompetansemål: ["K1"],
  vanskelighetsgrad: "lett",
  
  // Status
  status: "approved",
  synlig_for_kunder: true,
  
  // Statistikk
  nedlastninger: 45,
  rating_sum: 225,
  rating_count: 50,
  rating_snitt: 4.5,
  
  tags: ["engelsk", "familie"],
  original_prove_id: "ABC123..."
}
```

**glosebank_ratings/**
```javascript
{
  glosebank_id: "gb_abc123",
  laerer_id: "user_xyz",
  rating: 5,
  kommentar: "Veldig bra!",
  dato: timestamp
}
```

**resultater/**
```javascript
{
  prove_id: "ABC123...",
  elev_id: "elev_xyz123",
  tidspunkt: timestamp,
  poengsum: 18,
  maks_poeng: 20,
  prosent: 90,
  svar: [...],
  varighet_sekunder: 145
}
```

---

## 🎨 DESIGNSYSTEM

### **Farger:**
- Primær: `#667eea` (lilla/blå)
- Suksess: `#10b981` (grønn)
- Feil: `#ef4444` (rød)
- Advarsel: `#f59e0b` (oransje)

### **Knapper:**
- `.btn-primary` - Hovedknapp (lilla)
- `.btn-secondary` - Sekundær (grå)
- `.btn-success` - Suksess (grønn)
- `.btn-danger` - Slett (rød)
- `.btn-small` - Mindre knapp

### **Modaler:**
```html
<div class="modal-overlay" onclick="if(event.target===this) this.remove()">
  <div class="modal-content">
    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
    <h2>Tittel</h2>
    <!-- Innhold -->
  </div>
</div>
```

---

## 🔐 ADMIN UID

**Øyvind sin UID (hardkodet):**
```javascript
const ADMIN_UID = "QrFRB6xQDnVQsiSd0bzE6rH8z4x2";
```

Bruk denne for å sjekke admin-tilgang:
```javascript
function erAdmin(user) {
  return user && user.uid === ADMIN_UID;
}
```

---

## 📝 KOMMUNIKASJONSSTIL

**Med Øyvind:**
- Teknisk, men forståelig
- Konkrete eksempler
- Emojis for visuell struktur
- Steg-for-steg instruksjoner
- Copy/paste-klare filer

**Responser:**
- Start med oppsummering (kort)
- Lever komplette filer
- Instruksjoner i Markdown
- Testing-guide
- Neste steg

---

## 🚀 START PÅ NESTE SESJON

**Første melding fra Øyvind:**
"Hei Claude! Vi skal fortsette med GloseMester. Nå skal vi lage søkesiden for GloseBank (Steg 3)."

**Din respons:**
1. Bekreft at du har lest denne promten
2. Oppsummer status (v0.6.0-BETA ferdig)
3. Forklar hva Steg 3 innebærer
4. Spør om Øyvind vil starte direkte eller diskutere løsning først

---

## 📚 VIKTIGE NOTATER

### **GloseBank Roadmap:**
- ✅ **Steg 1:** Auto-lagring (FERDIG)
- ✅ **Steg 2:** Admin-side (FERDIG)
- 🎯 **Steg 3:** Søkeside for lærere (NESTE)
- 📋 **Steg 4:** Standardprøver (LK20)
- 📋 **Steg 5:** Feide for elever

### **Testing:**
- Test alltid lokalt først
- Sjekk Console for feil
- Verifiser Firebase data
- Deploy, test i Incognito

### **Versjonering:**
- Bump sw.js etter hver feature
- Oppdater README.md
- Commit message: "feat: [beskrivelse]"

---

## 🎯 FORVENTET OUTPUT

Når Øyvind ber om Steg 3, skal du levere:

1. **glosebank-browse.js** - Komplett søke/browse modul
2. **glosebank-browse.css** - Styling (hvis nødvendig)
3. **Instruksjoner** - For index.html, app.js, navigation.js endringer
4. **Firestore Rules** - Oppdaterte rules (hvis nødvendig)
5. **Testing Guide** - Steg-for-steg testing
6. **README oppdatering** - Ny seksjoner for Steg 3

**Alle filer skal være copy/paste klare!**

---

**VIKTIG:** Les denne promten nøye før du starter. Bekreft at du har forstått ved å oppsummere status og neste steg når Øyvind starter ny sesjon.
