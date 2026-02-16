import { randomInt } from 'crypto';

const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*()-_=+';
const ALL = `${LOWER}${UPPER}${DIGITS}${SYMBOLS}`;

export function randomStrongPassword(length = 20): string {
  if (length < 4) {
    throw new Error('Password length must be at least 4 to include all character types');
  }
  const picks = [
    LOWER[randomInt(LOWER.length)],
    UPPER[randomInt(UPPER.length)],
    DIGITS[randomInt(DIGITS.length)],
    SYMBOLS[randomInt(SYMBOLS.length)]
  ];

  while (picks.length < length) picks.push(ALL[randomInt(ALL.length)]);
  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks.join('');
}
