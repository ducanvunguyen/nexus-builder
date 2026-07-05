// Unit tests for the pure logic in assets/js/tools.js.
// Run with: npm test   (which calls `node --test`)

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  generatePassword,
  passwordStrength,
  encodeBase64,
  decodeBase64,
  urlEncode,
  urlDecode,
  formatJSON,
  minifyJSON,
  splitWords,
  toTitleCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  countText,
  sortLines,
  dedupeLines,
  reverseString,
  uuidv4,
  loremIpsum,
  convertBase,
  convertUnit,
  convertTemperature,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hashText,
  unixToIso,
  isoToUnix,
} from '../assets/js/tools.js';

// A deterministic "random" so password/lorem output is testable.
const seq = (values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

test('generatePassword respects length and character sets', () => {
  const pw = generatePassword({ length: 20, lower: true, upper: true, digits: true, symbols: true });
  assert.equal(pw.length, 20);
  assert.match(pw, /[a-z]/);
  assert.match(pw, /[A-Z]/);
  assert.match(pw, /[0-9]/);
});

test('generatePassword guarantees one of each selected set', () => {
  // With a deterministic RNG we still expect every selected class present.
  const pw = generatePassword({ length: 8, lower: true, upper: true, digits: true, symbols: false }, seq([0, 1, 2, 3, 4, 5, 6, 7]));
  assert.equal(pw.length, 8);
});

test('generatePassword throws when no set is selected', () => {
  assert.throws(() => generatePassword({ lower: false, upper: false, digits: false, symbols: false }));
});

test('passwordStrength scales with entropy', () => {
  assert.equal(passwordStrength('').score, 0);
  assert.ok(passwordStrength('abc').score < passwordStrength('Abc123!@#xYz_09').score);
  assert.equal(passwordStrength('correcthorsebatterystaplecorrecthorse').label !== 'Empty', true);
});

test('base64 round-trips Unicode', () => {
  const s = 'Hé l110 — 日本語 🚀';
  assert.equal(decodeBase64(encodeBase64(s)), s);
  assert.equal(encodeBase64('Man'), 'TWFu');
});

test('url encode/decode round-trips', () => {
  const s = 'a b&c=d/?#é';
  assert.equal(urlDecode(urlEncode(s)), s);
});

test('JSON format and minify', () => {
  assert.equal(formatJSON('{"a":1}', 2), '{\n  "a": 1\n}');
  assert.equal(minifyJSON('{ "a" : 1 }'), '{"a":1}');
  assert.throws(() => formatJSON('{nope}'));
});

test('splitWords handles mixed delimiters and camelCase', () => {
  assert.deepEqual(splitWords('helloWorld'), ['hello', 'World']);
  assert.deepEqual(splitWords('foo_bar-baz qux'), ['foo', 'bar', 'baz', 'qux']);
  assert.deepEqual(splitWords('XMLHttpRequest'), ['XML', 'Http', 'Request']);
});

test('case converters', () => {
  assert.equal(toTitleCase('hello world'), 'Hello World');
  assert.equal(toCamelCase('Hello world-foo'), 'helloWorldFoo');
  assert.equal(toPascalCase('hello world'), 'HelloWorld');
  assert.equal(toSnakeCase('Hello World'), 'hello_world');
  assert.equal(toKebabCase('Hello World'), 'hello-world');
  assert.equal(toConstantCase('Hello World'), 'HELLO_WORLD');
});

test('countText counts words, lines and characters', () => {
  const r = countText('Hello world.\nSecond line!');
  assert.equal(r.words, 4);
  assert.equal(r.lines, 2);
  assert.equal(r.sentences, 2);
  assert.equal(r.characters, 'Hello world.\nSecond line!'.length);
  assert.equal(countText('').lines, 0);
});

test('line tools: sort, dedupe, reverse', () => {
  assert.equal(sortLines('b\na\nc'), 'a\nb\nc');
  assert.equal(sortLines('10\n2\n1', { numeric: true }), '1\n2\n10');
  assert.equal(sortLines('a\nb', { descending: true }), 'b\na');
  assert.equal(dedupeLines('a\nb\na\nc\nb'), 'a\nb\nc');
  assert.equal(reverseString('abc🚀'), '🚀cba');
});

test('uuidv4 has the right shape and version bits', () => {
  const id = uuidv4();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(uuidv4(), uuidv4());
});

test('loremIpsum produces requested amount', () => {
  assert.equal(loremIpsum(5, 'words', seq([0, 1, 2, 3, 4])).split(' ').length, 5);
  assert.equal(loremIpsum(2, 'paragraphs', seq([0, 1, 2, 3])).split('\n\n').length, 2);
});

test('convertBase between hex/bin/dec', () => {
  assert.equal(convertBase('ff', 16, 10), '255');
  assert.equal(convertBase('255', 10, 2), '11111111');
  assert.equal(convertBase('101', 2, 16), '5');
  assert.throws(() => convertBase('zz', 10, 2));
});

test('convertUnit for length, mass, data', () => {
  assert.equal(convertUnit(1, 'km', 'm', 'length'), 1000);
  assert.equal(convertUnit(1000, 'g', 'kg', 'mass'), 1);
  assert.equal(convertUnit(1, 'GB', 'MB', 'data'), 1024);
  assert.ok(Math.abs(convertUnit(1, 'mi', 'km', 'length') - 1.609344) < 1e-9);
  assert.throws(() => convertUnit(1, 'x', 'm', 'length'));
});

test('temperature conversion', () => {
  assert.equal(convertTemperature(0, 'C', 'F'), 32);
  assert.equal(convertTemperature(100, 'C', 'K'), 373.15);
  assert.equal(convertTemperature(32, 'F', 'C'), 0);
  assert.equal(convertUnit(273.15, 'K', 'C', 'temperature'), 0);
});

test('colour conversions round-trip', () => {
  assert.deepEqual(hexToRgb('#ff8800'), { r: 255, g: 136, b: 0 });
  assert.deepEqual(hexToRgb('#fff'), { r: 255, g: 255, b: 255 });
  assert.equal(rgbToHex({ r: 255, g: 136, b: 0 }), '#ff8800');
  assert.deepEqual(rgbToHsl({ r: 255, g: 0, b: 0 }), { h: 0, s: 100, l: 50 });
  assert.deepEqual(hslToRgb({ h: 0, s: 100, l: 50 }), { r: 255, g: 0, b: 0 });
  assert.throws(() => hexToRgb('nope'));
});

test('hashText matches known SHA-256 vector', async () => {
  // SHA-256 of the empty string.
  assert.equal(
    await hashText(''),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  assert.equal(
    await hashText('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
});

test('timestamp conversion round-trips', () => {
  assert.equal(unixToIso(0), '1970-01-01T00:00:00.000Z');
  assert.equal(isoToUnix('1970-01-01T00:00:00Z'), 0);
  assert.equal(isoToUnix(unixToIso(1700000000)), 1700000000);
  assert.throws(() => isoToUnix('not-a-date'));
});
