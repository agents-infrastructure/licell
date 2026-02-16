import { describe, it, expect } from 'vitest';
import { randomStrongPassword } from '../utils/crypto';

describe('randomStrongPassword', () => {
  it('generates password of default length 20', () => {
    const pw = randomStrongPassword();
    expect(pw.length).toBe(20);
  });

  it('generates password of custom length', () => {
    const pw = randomStrongPassword(32);
    expect(pw.length).toBe(32);
  });

  it('generates password of minimum length 4 (one from each category)', () => {
    const pw = randomStrongPassword(4);
    expect(pw.length).toBe(4);
  });

  it('contains at least one lowercase letter', () => {
    for (let i = 0; i < 50; i++) {
      const pw = randomStrongPassword();
      expect(pw).toMatch(/[a-z]/);
    }
  });

  it('contains at least one uppercase letter', () => {
    for (let i = 0; i < 50; i++) {
      const pw = randomStrongPassword();
      expect(pw).toMatch(/[A-Z]/);
    }
  });

  it('contains at least one digit', () => {
    for (let i = 0; i < 50; i++) {
      const pw = randomStrongPassword();
      expect(pw).toMatch(/[0-9]/);
    }
  });

  it('contains at least one symbol', () => {
    for (let i = 0; i < 50; i++) {
      const pw = randomStrongPassword();
      expect(pw).toMatch(/[!@#$%^&*()\-_=+]/);
    }
  });

  it('generates unique passwords', () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 100; i++) {
      passwords.add(randomStrongPassword());
    }
    expect(passwords.size).toBe(100);
  });

  it('does not contain ambiguous characters (0, O, l, 1, I)', () => {
    for (let i = 0; i < 100; i++) {
      const pw = randomStrongPassword();
      expect(pw).not.toMatch(/[0OlI1]/);
    }
  });

  it('throws when length is less than 4', () => {
    expect(() => randomStrongPassword(2)).toThrow('Password length must be at least 4');
    expect(() => randomStrongPassword(0)).toThrow('Password length must be at least 4');
    expect(() => randomStrongPassword(3)).toThrow('Password length must be at least 4');
  });
});
