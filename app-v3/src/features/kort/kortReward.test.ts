import { describe, it, expect } from 'vitest';
import {
  calculateRarity,
  getCategoriesForLevel,
  getRandomKort,
  checkWinCondition,
} from './kortReward';
import { kortData, getTotalKortCount, aktiveKortpakker } from './kortData';
import { ALLE_KORTPAKKER, GRATIS_KORTPAKKER } from '../../lib/tilgang';

describe('kortData', () => {
  it('har 38 kort per aktiv pakke', () => {
    expect(getTotalKortCount()).toBe(aktiveKortpakker.length * 38);
  });
  it('har unike ID-er', () => {
    expect(new Set(kortData.map((k) => k.id)).size).toBe(getTotalKortCount());
  });
  it('utleder sjeldenhet fra posisjon (38 = legendary)', () => {
    const bil38 = kortData.find((k) => k.id === 'bil_038');
    expect(bil38?.rarity).toBe('legendary');
    const bil001 = kortData.find((k) => k.id === 'bil_001');
    expect(bil001?.rarity).toBe('common');
  });
});

describe('getCategoriesForLevel', () => {
  it('utelater guder på nivå 1–2', () => {
    expect(getCategoriesForLevel('niva1')).not.toContain('guder');
    expect(getCategoriesForLevel(2)).not.toContain('guder');
  });
  it('inkluderer guder på nivå 3–4', () => {
    expect(getCategoriesForLevel('niva3')).toContain('guder');
    expect(getCategoriesForLevel(4)).toContain('guder');
  });
});

describe('calculateRarity', () => {
  it('100% med høy rng gir legendary', () => {
    expect(calculateRarity(100, () => 0.99)).toBe('legendary');
  });
  it('lav score med lav rng gir common', () => {
    expect(calculateRarity(80, () => 0)).toBe('common');
  });
});

describe('checkWinCondition', () => {
  it('under 80% gir null', () => {
    expect(checkWinCondition(3, 5)).toBeNull(); // 60%
  });
  it('80%+ gir et kort', () => {
    const kort = checkWinCondition(9, 10, 'niva3', () => 0.1);
    expect(kort).not.toBeNull();
    expect(kort?.fag).toBe('gloser');
  });
  it('0 spørsmål gir null', () => {
    expect(checkWinCondition(0, 0)).toBeNull();
  });
});

describe('getRandomKort', () => {
  it('respekterer nivåfilter (ingen guder på niva1)', () => {
    for (let i = 0; i < 20; i++) {
      const kort = getRandomKort('common', 'niva1', Math.random);
      expect(kort.category).not.toBe('guder');
    }
  });

  it('elevnivå 1: episke/legendariske trekk lander alltid i gratis-pakkene', () => {
    for (let i = 0; i < 20; i++) {
      const episk = getRandomKort('epic', null, Math.random, ALLE_KORTPAKKER, 1);
      expect(GRATIS_KORTPAKKER as readonly string[]).toContain(episk.category);
      expect(episk.rarity).toBe('epic');
      const legendarisk = getRandomKort('legendary', null, Math.random, ALLE_KORTPAKKER, 1);
      expect(GRATIS_KORTPAKKER as readonly string[]).toContain(legendarisk.category);
      expect(legendarisk.rarity).toBe('legendary');
    }
  });

  it('elevnivå 10: episke trekk kan også komme fra Feide-pakkene', () => {
    const kategorier = new Set<string>();
    for (let i = 0; i < 20; i++) {
      kategorier.add(getRandomKort('epic', null, () => i / 20, ALLE_KORTPAKKER, 10).category);
    }
    const utenforGratis = [...kategorier].filter((c) => !(GRATIS_KORTPAKKER as readonly string[]).includes(c));
    expect(utenforGratis.length).toBeGreaterThan(0);
  });

  it('elevNiva null (gjest): uendret oppførsel — alle kategorier mulig', () => {
    const kategorier = new Set<string>();
    for (let i = 0; i < 20; i++) {
      kategorier.add(getRandomKort('epic', null, () => i / 20, ALLE_KORTPAKKER, null).category);
    }
    expect(kategorier.size).toBeGreaterThan(2);
  });
});
