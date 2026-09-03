// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { hentTotpVerifisertUid, settTotpVerifisertUid, fjernTotpVerifisert } from './adminTotpSession';

afterEach(() => {
  sessionStorage.clear();
});

describe('adminTotpSession', () => {
  it('er null før noe er verifisert', () => {
    expect(hentTotpVerifisertUid()).toBeNull();
  });

  it('husker uid-en etter verifisering', () => {
    settTotpVerifisertUid('uid-123');
    expect(hentTotpVerifisertUid()).toBe('uid-123');
  });

  it('fjernTotpVerifisert nullstiller', () => {
    settTotpVerifisertUid('uid-123');
    fjernTotpVerifisert();
    expect(hentTotpVerifisertUid()).toBeNull();
  });

  it('et nytt kontobytte overskriver forrige uid', () => {
    settTotpVerifisertUid('uid-a');
    settTotpVerifisertUid('uid-b');
    expect(hentTotpVerifisertUid()).toBe('uid-b');
  });
});
