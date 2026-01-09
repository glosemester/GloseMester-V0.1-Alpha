# 🐛 PROMPT: Debug GloseMester Hamburger-meny

**Dato:** 9. januar 2025  
**Versjon:** v0.7.6-BETA  
**Kritisk problem:** Hamburger-meny vises som horisonal rad i stedet for vertikal drawer

---

## 📋 PROBLEMBESKRIVELSE

### Forventet oppførsel:
```
Desktop OG Mobil:
┌────────────────────────────────────────┐
│ Øyvind  [☰ Meny]           [🏠 Hjem]  │
└────────────────────────────────────────┘

Klikk [☰ Meny]:
┌──────────────────┐
│ Øyvind           │
│ ─────────────────│
│ 📊 Dashboard     │
│ 📝 Lagrede       │
│ 📚 Standardprøver│
│ 📚 GloseBank     │
│ 🔧 Admin         │
│ ─────────────────│
│ 🚪 Logg ut       │
└──────────────────┘
Drawer slides inn fra venstre (280px bred)
```

### Faktisk oppførsel:
```
Menyknappene vises som horisonal rad nederst på siden:
[Dashboard] [Lagrede] [Standard] [GloseBank] [Admin] [Logg ut]
```

---

## 🔍 TING JEG HAR PRØVD

### Forsøk 1: Fjernet gammel CSS-definisjon ❌
- Fjernet desktop-styling for `.nav-items` (linje 1544-1574)
- Resultat: Ingen forskjell

### Forsøk 2: Lagt til `display: flex` ❌
- Lagt til `display: flex` i `.nav-items`
- Resultat: Ingen forskjell

### Forsøk 3: Cache-clearing ❌
- Hard refresh (Ctrl+Shift+R)
- Incognito mode
- Service Worker unregister
- Resultat: Ingen forskjell

### Forsøk 4: Event listeners i stedet for onclick ✅
- Fjernet `onclick` fra HTML
- Lagt til `addEventListener` i JavaScript
- Resultat: Event listeners fungerer (ser i console), men layout feil

---

## 📦 BE OM DISSE FILENE (MAKS 10)

**Filer jeg trenger for å analysere:**

1. ✅ **index.html** (komplett fil)
2. ✅ **main.css** (komplett fil)
3. ✅ **app.js** (komplett fil)
4. ✅ **Skjermbilde** av hvordan det ser ut nå
5. ✅ **Console-logg** (F12 → Console, kopier alt)
6. ⚠️ **Computed styles** for `.nav-items` (F12 → Elements → velg `<div id="nav-items">` → Computed tab → screenshot)
7. ⚠️ **glosebank-admin.css** (hvis relevant)
8. ⚠️ **glosebank-browse.css** (hvis relevant)
9. ⚠️ **standardprover.css** (hvis relevant)
10. ⚠️ **sw.js** (service worker - kan påvirke caching)

---

## 🎯 SPESIFIKKE SPØRSMÅL

### CSS-relatert:
1. Finnes det noen inline `<style>` tags i HTML som overstyrer?
2. Finnes det andre CSS-filer som definerer `.nav-items` eller `.laerer-nav`?
3. Hva viser "Computed" styles for `.nav-items` i DevTools?
4. Er `flex-direction: column` faktisk applisert? (sjekk Computed)
5. Er `position: fixed` faktisk applisert?

### HTML-struktur:
1. Er `<div id="nav-items" class="nav-items">` faktisk i DOM?
2. Har elementet noen inline styles?
3. Ligger det innenfor `.laerer-nav` som har `display:none`?

### JavaScript:
1. Endrer noe JavaScript inline styles på `.nav-items`?
2. Fungerer `toggleHamburger()` funksjonen? (console logs vises?)
3. Legges `open` class til når du klikker? (sjekk i Elements tab)

---

## 🔧 DEBUGGING-STEG

### Steg 1: Inspiser elementet
```
1. F12 → Elements
2. Finn <div id="nav-items" class="nav-items">
3. Ta screenshot av:
   - Styles tab (alle CSS-regler)
   - Computed tab (faktiske verdier)
   - Layout tab (box model)
```

### Steg 2: Test CSS direkte
```javascript
// Paste i Console (F12):
const nav = document.getElementById('nav-items');
console.log('Current styles:', {
    display: getComputedStyle(nav).display,
    position: getComputedStyle(nav).position,
    flexDirection: getComputedStyle(nav).flexDirection,
    left: getComputedStyle(nav).left,
    width: getComputedStyle(nav).width,
    height: getComputedStyle(nav).height
});
```

### Steg 3: Force drawer styling
```javascript
// Paste i Console (F12):
const nav = document.getElementById('nav-items');
nav.style.cssText = `
    display: flex !important;
    position: fixed !important;
    top: 0 !important;
    left: -100% !important;
    width: 280px !important;
    height: 100vh !important;
    flex-direction: column !important;
    background: white !important;
    z-index: 3001 !important;
    padding: 80px 0 20px 0 !important;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.2) !important;
    transition: left 0.3s ease !important;
`;
console.log('✅ Drawer styling forced! Klikk hamburger nå.');
```

**Hvis Steg 3 fungerer → CSS-problem (feil specificity eller override)**  
**Hvis Steg 3 IKKE fungerer → Noe annet er galt (JavaScript? HTML-struktur?)**

---

## 💡 MULIGE ÅRSAKER

### Teori 1: CSS Specificity
- Noen mer spesifikk selector overstyrer `.nav-items`
- F.eks. `.laerer-nav .nav-items` eller `nav .nav-items`

### Teori 2: Inline styles
- HTML har inline `style=""` som overstyrer alt

### Teori 3: JavaScript overskriver
- Noe JavaScript setter inline styles som overstyrer CSS

### Teori 4: Parent element konflikter
- `.laerer-nav` har `display: flex` som påvirker children
- Noe annet parent element påvirker layout

### Teori 5: CSS load order
- main.css lastes ikke, eller lastes feil
- Andre CSS-filer overskriver main.css

### Teori 6: Cache (mindre sannsynlig nå)
- Fortsatt gammel CSS i cache
- Service Worker cachet gammel versjon

---

## 📝 TING SOM FUNGERER

✅ Event listeners (ser console logs)  
✅ Hamburger-knapp er synlig  
✅ Overlay vises (men drawer ikke)  
✅ Console viser: "✅ Hamburger-knapp event listener lagt til"  
✅ Console viser: "✅ Hamburger-overlay event listener lagt til"

---

## 🎯 FORVENTET CSS

**Dette skal være i main.css:**

```css
.nav-items {
    display: flex;
    position: fixed;
    top: 0;
    left: -100%;
    width: 280px;
    max-width: 85vw;
    height: 100vh;
    background: white;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 80px 0 20px 0;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.2);
    transition: left 0.3s ease;
    z-index: 3001;
    overflow-y: auto;
}

.nav-items.open {
    left: 0;
}

.nav-items button {
    width: 100%;
    text-align: left;
    padding: 15px 20px;
    border: none;
    background: white;
    cursor: pointer;
    font-size: 15px;
    transition: background 0.2s;
    border-left: 3px solid transparent;
}
```

---

## 🚀 NESTE STEG

**Med filene og informasjonen over kan jeg:**
1. Analysere faktisk CSS som blir applisert
2. Identifisere conflicting styles
3. Finne root cause
4. Gi deg eksakt fix

**Vennligst last opp:**
- index.html
- main.css  
- app.js
- Skjermbilde av problem
- Console-logg
- Computed styles screenshot (viktigst!)

**Jeg vil da gi deg:**
- Eksakt årsak til problemet
- Copy-paste fix
- Forklaring på hvorfor det skjedde
- Hvordan unngå lignende problemer fremover

---

**Status:** Klar for debugging! 🔍
