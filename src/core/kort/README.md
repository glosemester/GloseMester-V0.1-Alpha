# 🎴 Kort-System v2.0

Felles kort-system for alle fag i Mester Suite (GloseMester, MatteMester, NorskMester).

---

## 📋 OVERSIKT

Dette kort-systemet håndterer:
- ✅ Kort-data for alle fag (152+ kort)
- ✅ Belønningslogikk (rarity-basert)
- ✅ Galleri UI (visning og sortering)
- ✅ localStorage sync
- 🔄 Firestore sync (TODO)

---

## 📁 FILSTRUKTUR

```
src/core/kort/
├── kort-system.js      # Main entry point (eksporterer alt)
├── kort-data.js        # Alle kort (GloseMester + MatteMester)
├── kort-reward.js      # Belønningssystem
└── kort-display.js     # UI og galleri
```

---

## 🚀 BRUK

### **Basic Usage:**

```javascript
import { kortSystem } from './src/core/kort/kort-system.js';

// Initialize (kjøres automatisk)
kortSystem.init();

// Award kort after quiz
const kort = await kortSystem.handleQuizCompletion(8, 10, 'gloser');
// -> Returns kort object if won, null if not

// Create gallery
const gallery = kortSystem.createGallery('galleri-container');

// Get user stats
const stats = kortSystem.getUserStats();
console.log(stats);
// -> { total: 42, unique: 15, completionRate: 9, ... }
```

---

## 📊 KORT-DATA

### **Format:**

```javascript
{
    id: 'bil_001',
    name: 'VW Golf',
    image: 'images/biler/001-vw-golf.png',
    category: 'biler',
    rarity: 'common',
    fag: 'gloser'
}
```

### **Kort per fag:**

| Fag | Kategorier | Antall | Status |
|-----|-----------|--------|--------|
| GloseMester | Biler, Dinosaurer, Dyr, Guder | 152 | ✅ Ferdig |
| MatteMester | Romvesen, Raketter, Planeter, Roboter | 152 | 🔄 TODO |
| NorskMester | TBD | TBD | 🔄 TODO |

---

## 🎁 BELØNNINGSSYSTEM

### **Win Condition:**
- Minimum 80% score på quiz/prøve

### **Rarity Odds:**

#### **Perfect Score (100%):**
- 🌟 Legendary: 5%
- 💎 Epic: 15%
- ✨ Rare: 30%
- 📦 Common: 50%

#### **Excellent Score (90-99%):**
- 🌟 Legendary: 3%
- 💎 Epic: 10%
- ✨ Rare: 22%
- 📦 Common: 65%

#### **Good Score (80-89%):**
- 🌟 Legendary: 1%
- 💎 Epic: 3%
- ✨ Rare: 11%
- 📦 Common: 85%

---

## 🎨 GALLERI UI

### **Features:**
- ✅ Responsive grid layout
- ✅ Sortering (Nyeste, Sjeldenhet, Navn)
- ✅ Statistikk (Total, Unike, Per rarity)
- ✅ Duplicate counting
- ✅ Click for details
- ✅ Empty state handling

### **Usage:**

```javascript
import { KortGalleri } from './kort-display.js';

// Create gallery instance
const gallery = new KortGalleri('my-gallery-container');

// Render
gallery.render();

// Change sort mode
gallery.setSortMode('sjeldenhet');
gallery.render();
```

---

## 🔧 API REFERENCE

### **KortSystem (Main Class)**

```javascript
// Initialize
kortSystem.init()

// Handle quiz completion
kortSystem.handleQuizCompletion(correctCount, totalQuestions, fagType, nivå)
// -> Returns kort object or null

// Create gallery
kortSystem.createGallery(containerId, options)
// -> Returns KortGalleri instance

// Get user stats
kortSystem.getUserStats()
// -> Returns { total, unique, completionRate, byRarity, byFag, ... }

// Check if ready
kortSystem.isReady()
// -> Returns boolean
```

### **KortReward (Belønning)**

```javascript
import { KortReward } from './kort-reward.js';

// Check win condition
KortReward.checkWinCondition(correctCount, totalQuestions, fagType)
// -> Returns kort or null

// Calculate rarity
KortReward.calculateRarity(percentage)
// -> Returns 'common', 'rare', 'epic', or 'legendary'

// Get random kort
KortReward.getRandomKort(rarity, fagType, nivå)
// -> Returns kort object

// Award kort to user
KortReward.awardKort(kort, userId)
// -> Returns boolean (success)

// Get user collection
KortReward.getUserCollection()
// -> Returns array of kort

// Get stats
KortReward.getCollectionStats()
// -> Returns { total, unique, byRarity, byCategory, byFag }

// Check if user has kort
KortReward.hasKort(kortId)
// -> Returns boolean

// Get kort count
KortReward.getKortCount(kortId)
// -> Returns number

// Clear collection (testing)
KortReward.clearCollection()
// -> Returns boolean
```

### **KortGalleri (UI)**

```javascript
import { KortGalleri } from './kort-display.js';

const gallery = new KortGalleri('container-id');

// Render gallery
gallery.render(options)

// Set sort mode
gallery.setSortMode('nyeste' | 'sjeldenhet' | 'navn')

// Get sort mode
gallery.getSortMode()
// -> Returns string
```

### **Kort-Data Utilities**

```javascript
import {
    kortData,
    getKortById,
    getKortByCategory,
    getKortByFag,
    getKortByRarity,
    getTotalKortCount,
    getKortStats
} from './kort-data.js';

// Get kort by ID
const kort = getKortById('bil_001');

// Get kort by category
const biler = getKortByCategory('biler');

// Get kort by fag
const gloserKort = getKortByFag('gloser');

// Get kort by rarity
const legendaryKort = getKortByRarity('legendary');

// Get total count
const total = getTotalKortCount();

// Get full stats
const stats = getKortStats();
```

---

## 🎯 CONVENIENCE FUNCTIONS

```javascript
import {
    awardKortAfterQuiz,
    createKortGallery,
    getUserKortStats
} from './kort-system.js';

// Award kort after quiz (shorthand)
const kort = await awardKortAfterQuiz(8, 10, 'gloser');

// Create gallery (shorthand)
const gallery = createKortGallery('container-id');

// Get stats (shorthand)
const stats = getUserKortStats();
```

---

## 🔄 MIGRATION FROM OLD SYSTEM

### **Old Code:**
```javascript
import { cardsData } from '../data/cardsData.js';
import { hentTilfeldigKort, visSamling } from '../features/kort-display.js';

// Get random kort
hentTilfeldigKort();

// Show collection
visSamling();
```

### **New Code:**
```javascript
import { kortSystem, KortReward, KortGalleri } from './src/core/kort/kort-system.js';

// Award kort after quiz
kortSystem.handleQuizCompletion(8, 10, 'gloser');

// Create and render gallery
const gallery = new KortGalleri('samling-grid');
gallery.render();
```

---

## ✅ TESTING

```javascript
// Clear collection (for testing)
KortReward.clearCollection();

// Award test kort
const testKort = getKortById('bil_001');
KortReward.awardKort(testKort);

// Check stats
console.log(KortReward.getCollectionStats());

// Test win condition
const kort = KortReward.checkWinCondition(10, 10, 'gloser');
console.log('Won:', kort);
```

---

## 🚀 TODO

- [ ] Implement Firestore sync
- [ ] Add kort modal (detailed view)
- [ ] Add kort animations
- [ ] Add kort trading (future feature)
- [ ] Add MatteMester kort (152 kort)
- [ ] Add NorskMester kort (TBD)

---

**Version:** 2.0.0-ALPHA
**Last Updated:** 2026-02-06
