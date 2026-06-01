import { describe, it, expect } from 'vitest';
import { terskelForSjetong, tjenteSjetonger, sjetongFremgang } from './byttesjetonger';

// Rene formel-tester (ingen localStorage): sjetongFremgang kalles med eksplisitte
// argumenter, så modulen trenger ikke DOM-miljø.

describe('terskelForSjetong', () => {
  it('kumulative XP-grenser: 35, 75, 120, så +50', () => {
    expect(terskelForSjetong(0)).toBe(0);
    expect(terskelForSjetong(1)).toBe(35);
    expect(terskelForSjetong(2)).toBe(75); // 35+40
    expect(terskelForSjetong(3)).toBe(120); // 35+40+45
    expect(terskelForSjetong(4)).toBe(170); // +50
    expect(terskelForSjetong(5)).toBe(220); // +50
  });
});

describe('tjenteSjetonger', () => {
  it('0 XP gir 0 sjetonger', () => {
    expect(tjenteSjetonger(0)).toBe(0);
  });
  it('rett under terskel gir ikke sjetong', () => {
    expect(tjenteSjetonger(34)).toBe(0);
    expect(tjenteSjetonger(74)).toBe(1);
    expect(tjenteSjetonger(119)).toBe(2);
  });
  it('på terskel gir sjetongen', () => {
    expect(tjenteSjetonger(35)).toBe(1);
    expect(tjenteSjetonger(75)).toBe(2);
    expect(tjenteSjetonger(120)).toBe(3);
    expect(tjenteSjetonger(170)).toBe(4);
  });
  it('skalerer med +50 langt ute', () => {
    expect(tjenteSjetonger(220)).toBe(5);
    expect(tjenteSjetonger(520)).toBe(11); // 170 + 7*50 = 520
  });
});

describe('sjetongFremgang', () => {
  it('tilgjengelig = tjent − brukt, gulvet på 0', () => {
    expect(sjetongFremgang(75, 0).tilgjengelig).toBe(2);
    expect(sjetongFremgang(75, 1).tilgjengelig).toBe(1);
    expect(sjetongFremgang(75, 5).tilgjengelig).toBe(0); // ikke negativt
  });

  it('fremgang mot neste sjetong', () => {
    // 90 XP: tjent=2 (terskel 75), neste ved 120, intervall 45, samlet 15.
    const f = sjetongFremgang(90, 0);
    expect(f.tjent).toBe(2);
    expect(f.nesteIntervall).toBe(45);
    expect(f.xpSidenForrige).toBe(15);
    expect(f.manglerXP).toBe(30);
    expect(f.pct).toBeCloseTo(15 / 45, 5);
  });

  it('akkurat på terskel: ny sjetong tjent, fremgang nullstilt', () => {
    const f = sjetongFremgang(120, 0);
    expect(f.tjent).toBe(3);
    expect(f.xpSidenForrige).toBe(0);
    expect(f.nesteIntervall).toBe(50);
    expect(f.manglerXP).toBe(50);
  });
});
