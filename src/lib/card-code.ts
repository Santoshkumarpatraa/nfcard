import { randomInt } from "node:crypto";

// No 0/O, 1/I/L: codes get read aloud and typed in during support calls.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function generateCardCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Accepts a bare code or a pasted card link (with any ?s=qr suffix); malformed input simply fails isCardCode. */
export function normaliseCardCode(input: string): string {
  return safeDecode(input)
    .trim()
    .replace(/^.*\/t\//i, "")
    .replace(/[?#].*$/, "")
    .toUpperCase();
}

export function isCardCode(code: string): boolean {
  return code.length === LENGTH && [...code].every((char) => ALPHABET.includes(char));
}
