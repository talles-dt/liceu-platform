import { describe, it, expect } from 'vitest';
import { passwordError } from '@/lib/passwordPolicy';
describe('shared password policy', () => {
 it.each([null, undefined, 123, {}, '', 'Abcdef!', 'abcdefg!', 'Abcdefgh', 'Abcdefg '])('rejects weak or malformed input %j', value => {
  expect(passwordError(value)).not.toBeNull();
 });
 it.each(['Abcdefg!', 'Uma frase longa!'])('accepts compliant password', value => {
  expect(passwordError(value)).toBeNull();
 });
});
