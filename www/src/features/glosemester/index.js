/* ============================================
   INDEX.JS - GloseMester Module Entry Point
   GloseMester v2.6
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
