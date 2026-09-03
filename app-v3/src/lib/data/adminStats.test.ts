import { describe, it, expect } from 'vitest';
import { tellDistincteUider } from './adminStats';

describe('tellDistincteUider', () => {
  it('teller distincte uider på tvers av flere lister', () => {
    expect(tellDistincteUider(['a', 'b'], ['b', 'c'])).toBe(3);
  });

  it('ignorerer null/undefined/tomme verdier', () => {
    expect(tellDistincteUider(['a', null, undefined, ''], [])).toBe(1);
  });

  it('gir 0 for tomme lister', () => {
    expect(tellDistincteUider([], [])).toBe(0);
  });

  it('dedupliserer duplikater i samme liste', () => {
    expect(tellDistincteUider(['a', 'a', 'a'])).toBe(1);
  });
});
