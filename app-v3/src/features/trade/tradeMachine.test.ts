import { describe, it, expect } from 'vitest';
import { kanOvergaa, kanRolleOvergaa, erAvsluttet, erUtloept } from './tradeMachine';

describe('kanOvergaa', () => {
  it('lovlige overganger', () => {
    expect(kanOvergaa('pending', 'accepted')).toBe(true);
    expect(kanOvergaa('pending', 'cancelled')).toBe(true);
    expect(kanOvergaa('pending', 'expired')).toBe(true);
    expect(kanOvergaa('accepted', 'completed')).toBe(true);
    expect(kanOvergaa('accepted', 'expired')).toBe(true);
  });
  it('ulovlige overganger', () => {
    expect(kanOvergaa('completed', 'pending')).toBe(false);
    expect(kanOvergaa('pending', 'completed')).toBe(false); // må innom accepted
    expect(kanOvergaa('cancelled', 'accepted')).toBe(false);
    expect(kanOvergaa('expired', 'completed')).toBe(false);
    expect(kanOvergaa('accepted', 'pending')).toBe(false);
  });
});

describe('kanRolleOvergaa', () => {
  it('kun responder aksepterer', () => {
    expect(kanRolleOvergaa('pending', 'accepted', 'responder')).toBe(true);
    expect(kanRolleOvergaa('pending', 'accepted', 'initiator')).toBe(false);
  });
  it('kun initiativtaker avbryter', () => {
    expect(kanRolleOvergaa('pending', 'cancelled', 'initiator')).toBe(true);
    expect(kanRolleOvergaa('pending', 'cancelled', 'responder')).toBe(false);
  });
  it('begge kan fullføre', () => {
    expect(kanRolleOvergaa('accepted', 'completed', 'initiator')).toBe(true);
    expect(kanRolleOvergaa('accepted', 'completed', 'responder')).toBe(true);
  });
  it('avviser ulovlig graf uansett rolle', () => {
    expect(kanRolleOvergaa('completed', 'pending', 'initiator')).toBe(false);
  });
});

describe('erAvsluttet / erUtloept', () => {
  it('avsluttede tilstander', () => {
    expect(erAvsluttet('completed')).toBe(true);
    expect(erAvsluttet('cancelled')).toBe(true);
    expect(erAvsluttet('expired')).toBe(true);
    expect(erAvsluttet('pending')).toBe(false);
    expect(erAvsluttet('accepted')).toBe(false);
  });
  it('utløp sammenlignes mot nå', () => {
    expect(erUtloept(1000, 2000)).toBe(true);
    expect(erUtloept(2000, 1000)).toBe(false);
    expect(erUtloept(1000, 1000)).toBe(true); // på grensen = utløpt
  });
});
