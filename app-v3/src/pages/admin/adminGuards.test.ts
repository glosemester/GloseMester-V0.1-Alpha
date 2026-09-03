import { describe, it, expect } from 'vitest';
import { erSelvDemotering } from './adminGuards';

describe('erSelvDemotering', () => {
  it('sant når man fjerner sin egen admin-rolle', () => {
    expect(erSelvDemotering('uid-1', 'uid-1', 'laerer')).toBe(true);
  });

  it('usant når man endrer en annen brukers rolle', () => {
    expect(erSelvDemotering('uid-1', 'uid-2', 'laerer')).toBe(false);
  });

  it('usant når man gjør seg selv til admin', () => {
    expect(erSelvDemotering('uid-1', 'uid-1', 'admin')).toBe(false);
  });

  it('usant når egen uid er ukjent (ikke lastet ennå)', () => {
    expect(erSelvDemotering('uid-1', undefined, 'laerer')).toBe(false);
  });
});
