# 🔧 HURTIGFIKS - Feilsøking

## ❌ Feil du fikk:

```
app.js:58 Uncaught SyntaxError: Invalid or unexpected token
(index):64 Uncaught ReferenceError: velgRolle is not defined
```

## ✅ LØSNING:

Erstatt **app.js** med den nye versjonen jeg nettopp ga deg.

---

## 📋 STEG-FOR-STEG LØSNING:

### 1. Erstatt app.js

**Lokasjon:** `js/app.js`

**Gjør dette:**
1. Åpne `js/app.js`
2. **SLETT ALT** (Ctrl+A, Delete)
3. **KOPIER** fra min nye `app.js` 
4. **LIM INN**
5. **LAGRE**

### 2. Verifiser

**Sjekk at første linje er:**
```javascript
/* ============================================
   APP.JS - Hovedkontroller v2.0.1 FIXED
```

✅ Hvis du ser "v2.0.1 FIXED" = RIKTIG  
❌ Hvis du ser gammel versjon = Feil fil

### 3. Hard refresh

**VIKTIG:** Nettleseren cacher JavaScript!

**Windows/Linux:**
```
Ctrl + Shift + R
```

**Mac:**
```
Cmd + Shift + R
```

**Eller:**
- Høyreklikk på refresh-knappen
- Velg "Empty Cache and Hard Reload"

### 4. Test

1. Åpne http://localhost:8000
2. Åpne Console (F12)
3. Se etter: `✅ GloseMester v2.0.1 (FIXED) kjører...`
4. Klikk på "Lærer" eller "Øv Selv"
5. ✅ Skal fungere uten feil!

---

## 🐛 ANDRE VANLIGE FEIL

### Feil: "Cannot find module './core/navigation.js'"

**Årsak:** Feil filstruktur

**Løsning:**
```
js/
  ├── app.js           ✅
  ├── core/
  │   └── navigation.js ✅
  ├── features/
  │   ├── teacher.js    ✅
  │   └── saved-tests.js ✅
  └── ui/
      └── helpers.js    ✅
```

Sjekk at alle mapper og filer finnes!

---

### Feil: "initTeacherFeatures is not a function"

**Årsak:** teacher.js ikke lastet

**Løsning:**
1. Sjekk at `js/features/teacher.js` finnes
2. Åpne filen
3. Sjekk at den har:
```javascript
export function initTeacherFeatures() {
```

---

### Feil: "Firebase is not defined"

**Årsak:** firebase.js mangler eller feil

**Løsning:**
1. Sjekk at `js/features/firebase.js` finnes
2. Åpne den og sjekk at den starter med:
```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
```

---

### Feil: Fortsatt får "velgRolle is not defined"

**Årsak:** Cache eller ikke oppdatert

**Løsning:**
1. **Hard refresh** (Ctrl+Shift+R)
2. Åpne DevTools (F12)
3. Gå til **Application** tab
4. Klikk **Clear storage**
5. Klikk **Clear site data**
6. Refresh siden

---

## 🎯 ENDRINGENE I app.js:

### Før (FEIL):
```javascript
console.warn(⚠️ Ukjent rolle ved retur fra galleri, går til start.");
//           ^ Mangler " her!
```

### Etter (RIKTIG):
```javascript
console.warn("⚠️ Ukjent rolle ved retur fra galleri, går til start.");
//           ^ Fikset med anførselstegn
```

---

## ✅ SUKSESSKRITERIER

**Alt OK når:**
- [ ] Ingen røde feil i Console (F12)
- [ ] Kan klikke "Lærer" uten feil
- [ ] Kan klikke "Øv Selv" uten feil
- [ ] Console viser: `✅ GloseMester v2.0.1 (FIXED) kjører...`
- [ ] Console viser: `✅ App fullstendig initialisert!`

---

## 💡 TIPS: Unngå cache-problemer

**Utviklingsmodus i Chrome:**
1. Åpne DevTools (F12)
2. Høyreklikk på refresh-knappen
3. Velg "Empty Cache and Hard Reload"

**Eller:**
1. DevTools (F12)
2. **Network** tab
3. Kryss av "Disable cache"
4. Hold DevTools åpen mens du utvikler

---

## 📞 FORTSATT PROBLEMER?

**Sjekk dette:**

1. **Riktig filstruktur?**
   ```bash
   ls -R js/
   ```

2. **Riktig versjon av app.js?**
   ```bash
   head -n 5 js/app.js
   ```
   Skal vise: `v2.0.1 FIXED`

3. **Alle filer oppdatert?**
   - index.html (v2.0.0-REFACTORED)
   - app.js (v2.0.1 FIXED)
   - teacher.js (v2.0 REFACTORED)
   - saved-tests.js (v2.0 REFACTORED)

4. **Cache tømt?**
   - Hard refresh (Ctrl+Shift+R)
   - Clear site data

---

## 🚀 NÅR DET FUNGERER:

Du skal se dette i Console:
```
🚀 GloseMester v2.0.1 (FIXED) kjører...
✅ SW Registrert
Navigasjon lastet.
🎓 Lærer-modul lastet (v2.0 - Refactored).
✅ Teacher features initialisert
✅ App fullstendig initialisert!
```

**Da er alt OK!** 🎉

---

**Du fikser dette! Bare erstatt app.js og refresh! 💪**
