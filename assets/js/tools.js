// Nexus Tools — pure utility functions (no DOM access).
//
// Everything here is written so it runs unchanged in two places:
//   1. The browser, loaded as a native ES module by app.js.
//   2. Node.js, imported by the test suite in tests/tools.test.js.
//
// Keeping the logic DOM-free is what makes the whole toolbox testable.

/* ------------------------------------------------------------------ *
 * Randomness helpers
 * ------------------------------------------------------------------ */

// Uniform integer in [0, max) using the platform CSPRNG when available.
// Uses rejection sampling to avoid modulo bias.
export function defaultRandom(max) {
  if (max <= 0) throw new Error('max must be positive');
  const g = globalThis.crypto;
  if (g && g.getRandomValues) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let x;
    do {
      g.getRandomValues(arr);
      x = arr[0];
    } while (x >= limit);
    return x % max;
  }
  return Math.floor(Math.random() * max);
}

/* ------------------------------------------------------------------ *
 * Password generator
 * ------------------------------------------------------------------ */

const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?',
};

const AMBIGUOUS = new Set(['l', 'I', '1', 'O', '0', 'o', 'B', '8', '5', 'S', '2', 'Z']);

export function generatePassword(options = {}, randomInt = defaultRandom) {
  const {
    length = 16,
    lower = true,
    upper = true,
    digits = true,
    symbols = false,
    avoidAmbiguous = false,
  } = options;

  const required = [];
  let pool = '';
  for (const [key, enabled] of [
    ['lower', lower],
    ['upper', upper],
    ['digits', digits],
    ['symbols', symbols],
  ]) {
    if (!enabled) continue;
    let set = CHARSETS[key];
    if (avoidAmbiguous) set = [...set].filter((c) => !AMBIGUOUS.has(c)).join('');
    pool += set;
    required.push(set);
  }
  if (!pool) throw new Error('Select at least one character set');

  const len = Math.max(1, Math.min(Math.floor(length), 4096));
  const chars = [];

  // Guarantee at least one character from each selected set (space permitting).
  for (const set of required) {
    if (chars.length < len) chars.push(set[randomInt(set.length)]);
  }
  while (chars.length < len) {
    chars.push(pool[randomInt(pool.length)]);
  }

  // Fisher–Yates shuffle so the guaranteed characters aren't front-loaded.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// Rough password strength estimate based on Shannon entropy of the char pool.
export function passwordStrength(pw) {
  if (!pw) return { score: 0, label: 'Empty', entropyBits: 0 };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  const entropyBits = pw.length * Math.log2(pool || 1);
  let score;
  let label;
  if (entropyBits < 28) [score, label] = [0, 'Very weak'];
  else if (entropyBits < 36) [score, label] = [1, 'Weak'];
  else if (entropyBits < 60) [score, label] = [2, 'Fair'];
  else if (entropyBits < 128) [score, label] = [3, 'Strong'];
  else [score, label] = [4, 'Very strong'];
  return { score, label, entropyBits: Math.round(entropyBits) };
}

/* ------------------------------------------------------------------ *
 * Base64 (Unicode-safe) & URL encoding
 * ------------------------------------------------------------------ */

export function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function decodeBase64(b64) {
  const binary = atob(String(b64).trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function urlEncode(str) {
  return encodeURIComponent(str);
}

export function urlDecode(str) {
  return decodeURIComponent(str);
}

/* ------------------------------------------------------------------ *
 * JSON
 * ------------------------------------------------------------------ */

export function formatJSON(str, indent = 2) {
  return JSON.stringify(JSON.parse(str), null, indent);
}

export function minifyJSON(str) {
  return JSON.stringify(JSON.parse(str));
}

/* ------------------------------------------------------------------ *
 * Case conversion
 * ------------------------------------------------------------------ */

export function splitWords(str) {
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ACRONYMWord boundary
    .split(/[\s_\-./]+/)
    .filter(Boolean);
}

export function toTitleCase(str) {
  return splitWords(str)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function toCamelCase(str) {
  return splitWords(str)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

export function toPascalCase(str) {
  return splitWords(str)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function toSnakeCase(str) {
  return splitWords(str).map((w) => w.toLowerCase()).join('_');
}

export function toKebabCase(str) {
  return splitWords(str).map((w) => w.toLowerCase()).join('-');
}

export function toConstantCase(str) {
  return splitWords(str).map((w) => w.toUpperCase()).join('_');
}

/* ------------------------------------------------------------------ *
 * Text statistics & line tools
 * ------------------------------------------------------------------ */

export function countText(str) {
  const text = String(str);
  const words = (text.trim().match(/\S+/g) || []).length;
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words,
    sentences: (text.match(/[^.!?]+[.!?]+/g) || []).length,
    lines: text === '' ? 0 : text.split(/\r\n|\r|\n/).length,
    paragraphs: text
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean).length,
    readingTimeMin: words / 200,
  };
}

export function sortLines(text, { numeric = false, descending = false } = {}) {
  const lines = String(text).split(/\r?\n/);
  const cmp = numeric ? (a, b) => Number(a) - Number(b) : (a, b) => a.localeCompare(b);
  lines.sort(cmp);
  if (descending) lines.reverse();
  return lines.join('\n');
}

export function dedupeLines(text) {
  const seen = new Set();
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }
  return out.join('\n');
}

export function reverseString(str) {
  return [...String(str)].reverse().join('');
}

/* ------------------------------------------------------------------ *
 * IDs & placeholder text
 * ------------------------------------------------------------------ */

export function uuidv4() {
  const g = globalThis.crypto;
  if (g && g.randomUUID) return g.randomUUID();
  const bytes = new Uint8Array(16);
  if (g && g.getRandomValues) g.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

const LOREM_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
    ' '
  );

export function loremIpsum(count = 3, unit = 'paragraphs', randomInt = defaultRandom) {
  const word = () => LOREM_WORDS[randomInt(LOREM_WORDS.length)];
  const sentence = () => {
    const words = Array.from({ length: 8 + randomInt(8) }, word);
    words[0] = words[0][0].toUpperCase() + words[0].slice(1);
    return words.join(' ') + '.';
  };
  const paragraph = () => Array.from({ length: 3 + randomInt(4) }, sentence).join(' ');
  const c = Math.max(1, Math.floor(count));
  if (unit === 'words') return Array.from({ length: c }, word).join(' ');
  if (unit === 'sentences') return Array.from({ length: c }, sentence).join(' ');
  return Array.from({ length: c }, paragraph).join('\n\n');
}

/* ------------------------------------------------------------------ *
 * Number bases
 * ------------------------------------------------------------------ */

export function convertBase(value, fromBase, toBase) {
  const n = parseInt(String(value).trim(), fromBase);
  if (Number.isNaN(n)) throw new Error(`Invalid number for base ${fromBase}`);
  return n.toString(toBase);
}

/* ------------------------------------------------------------------ *
 * Unit conversion
 * ------------------------------------------------------------------ */

// Every unit is expressed as a factor to the category's SI base unit.
export const UNIT_FACTORS = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nmi: 1852 },
  mass: { g: 1, kg: 1000, mg: 0.001, t: 1e6, lb: 453.59237, oz: 28.349523125, st: 6350.29318 },
  time: { s: 1, ms: 0.001, min: 60, h: 3600, day: 86400, week: 604800 },
  data: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, bit: 0.125 },
  speed: { 'm/s': 1, 'km/h': 1000 / 3600, mph: 1609.344 / 3600, kn: 1852 / 3600 },
};

export function convertUnit(value, from, to, category) {
  const v = Number(value);
  if (!Number.isFinite(v)) throw new Error('Invalid number');
  if (category === 'temperature') return convertTemperature(v, from, to);
  const table = UNIT_FACTORS[category];
  if (!table) throw new Error(`Unknown category: ${category}`);
  if (!(from in table) || !(to in table)) throw new Error('Unknown unit');
  return (v * table[from]) / table[to];
}

export function convertTemperature(v, from, to) {
  let celsius;
  if (from === 'C') celsius = v;
  else if (from === 'F') celsius = ((v - 32) * 5) / 9;
  else if (from === 'K') celsius = v - 273.15;
  else throw new Error('Unknown temperature unit');

  if (to === 'C') return celsius;
  if (to === 'F') return (celsius * 9) / 5 + 32;
  if (to === 'K') return celsius + 273.15;
  throw new Error('Unknown temperature unit');
}

/* ------------------------------------------------------------------ *
 * Colour conversion
 * ------------------------------------------------------------------ */

export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('Invalid hex color');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return '#' + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }) {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/* ------------------------------------------------------------------ *
 * Hashing (async, uses Web Crypto SubtleCrypto)
 * ------------------------------------------------------------------ */

export async function hashText(text, algorithm = 'SHA-256') {
  const data = new TextEncoder().encode(text);
  const buf = await globalThis.crypto.subtle.digest(algorithm, data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------------ *
 * Timestamps
 * ------------------------------------------------------------------ */

export function unixToIso(seconds) {
  const ms = Number(seconds) * 1000;
  if (!Number.isFinite(ms)) throw new Error('Invalid timestamp');
  return new Date(ms).toISOString();
}

export function isoToUnix(iso) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error('Invalid date');
  return Math.floor(ms / 1000);
}
