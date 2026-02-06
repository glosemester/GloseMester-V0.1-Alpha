/* ============================================
   INDEX.JS - GloseMester Module Entry Point
   Mester Suite v2.0
   ============================================ */

// Export main module
export { GloseMester, glosemester } from './glosemester.js';

// Export vocabulary data
export {
    vocabularyData,
    getTotalWordCount,
    getWordCountForLevel,
    getLevelMetadata,
    getWordsForLevel,
    getAvailableLevels,
    searchWords
} from './vocabulary-data.js';

console.log('📚 GloseMester module exports ready');
