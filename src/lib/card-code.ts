import { randomInt } from "node:crypto";

// No 0/O, 1/I/L: codes get read aloud and typed in during support calls.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function generateCardCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export function normaliseCardCode(input: string): string {
  return decodeURIComponent(input).trim().toUpperCase();
}

export function isCardCode(code: string): boolean {
  return code.length === LENGTH && [...code].every((char) => ALPHABET.includes(char));
}
