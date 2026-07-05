// Nexus Tools — UI layer. Imports pure logic from tools.js and wires it to the DOM.
import * as T from './tools.js';

/* ------------------------------------------------------------------ *
 * Tiny DOM helpers
 * ------------------------------------------------------------------ */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard');
  } catch {
    toast('Copy failed — select and copy manually');
  }
}

// Build a labelled field wrapper.
function field(labelText, control, hint) {
  return el('div', { class: 'field' }, labelText ? el('label', {}, labelText) : null, control, hint ? el('div', { class: 'hint' }, hint) : null);
}

function outputBox() {
  return el('div', { class: 'output' });
}

function copyBtn(getText) {
  return el('button', { class: 'btn secondary', onclick: () => copy(getText()) }, '📋 Copy');
}

/* ------------------------------------------------------------------ *
 * Tool renderers — each returns a DOM node
 * ------------------------------------------------------------------ */

function passwordTool() {
  const out = el('input', { type: 'text', readonly: 'readonly' });
  const meter = el('span');
  const meterWrap = el('div', { class: 'meter' }, meter);
  const strengthLabel = el('div', { class: 'hint' });
  const len = el('input', { type: 'number', min: '4', max: '128', value: '20' });
  const sets = {
    lower: el('input', { type: 'checkbox', checked: 'checked' }),
    upper: el('input', { type: 'checkbox', checked: 'checked' }),
    digits: el('input', { type: 'checkbox', checked: 'checked' }),
    symbols: el('input', { type: 'checkbox', checked: 'checked' }),
    avoidAmbiguous: el('input', { type: 'checkbox' }),
  };
  const colors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  function regen() {
    try {
      const pw = T.generatePassword({
        length: Number(len.value) || 20,
        lower: sets.lower.checked,
        upper: sets.upper.checked,
        digits: sets.digits.checked,
        symbols: sets.symbols.checked,
        avoidAmbiguous: sets.avoidAmbiguous.checked,
      });
      out.value = pw;
      const s = T.passwordStrength(pw);
      meter.style.width = `${(s.score + 1) * 20}%`;
      meter.style.background = colors[s.score];
      strengthLabel.textContent = `${s.label} · ~${s.entropyBits} bits of entropy`;
    } catch (e) {
      out.value = '';
      strengthLabel.textContent = e.message;
    }
  }
  [len, ...Object.values(sets)].forEach((n) => n.addEventListener('change', regen));

  const checkbox = (key, label) => el('label', { class: 'checkbox' }, sets[key], label);

  const card = el('div', { class: 'card' },
    field('Generated password', el('div', { class: 'row' }, out, copyBtn(() => out.value))),
    meterWrap, strengthLabel,
    field('Length', len),
    el('div', { class: 'row' },
      checkbox('lower', 'a-z'), checkbox('upper', 'A-Z'),
      checkbox('digits', '0-9'), checkbox('symbols', '!@#$'),
      checkbox('avoidAmbiguous', 'Avoid look-alikes')),
    el('div', { class: 'row' }, el('button', { class: 'btn', onclick: regen }, '🔁 Regenerate')));
  regen();
  return card;
}

function hashTool() {
  const input = el('textarea', { placeholder: 'Type or paste text to hash…' });
  const algo = el('select', {},
    ...['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512'].map((a) => el('option', {}, a)));
  const out = outputBox();
  async function run() {
    if (!input.value) { out.textContent = ''; return; }
    try {
      out.textContent = await T.hashText(input.value, algo.value);
    } catch (e) {
      out.textContent = e.message;
    }
  }
  input.addEventListener('input', run);
  algo.addEventListener('change', run);
  return el('div', { class: 'card' },
    field('Text', input),
    field('Algorithm', algo),
    el('div', { class: 'row' }, copyBtn(() => out.textContent)),
    out);
}

function uuidTool() {
  const count = el('input', { type: 'number', min: '1', max: '100', value: '5' });
  const out = outputBox();
  function run() {
    const n = Math.max(1, Math.min(100, Number(count.value) || 1));
    out.textContent = Array.from({ length: n }, () => T.uuidv4()).join('\n');
  }
  count.addEventListener('change', run);
  run();
  return el('div', { class: 'card' },
    field('How many?', count),
    el('div', { class: 'row' }, el('button', { class: 'btn', onclick: run }, '🔁 Generate'), copyBtn(() => out.textContent)),
    out);
}

function loremTool() {
  const count = el('input', { type: 'number', min: '1', max: '50', value: '3' });
  const unit = el('select', {}, ...['paragraphs', 'sentences', 'words'].map((u) => el('option', {}, u)));
  const out = outputBox();
  function run() {
    out.textContent = T.loremIpsum(Number(count.value) || 3, unit.value);
  }
  count.addEventListener('change', run);
  unit.addEventListener('change', run);
  run();
  return el('div', { class: 'card' },
    el('div', { class: 'row' }, field('Amount', count), field('Unit', unit)),
    el('div', { class: 'row' }, el('button', { class: 'btn', onclick: run }, '🔁 Generate'), copyBtn(() => out.textContent)),
    out);
}

// Generic two-way text transformer (encode / decode style tools).
function transformTool({ placeholder, actions }) {
  const input = el('textarea', { placeholder });
  const out = outputBox();
  const buttons = actions.map((a) =>
    el('button', { class: 'btn' + (a.secondary ? ' secondary' : ''), onclick: () => {
      try { out.textContent = a.fn(input.value); out.classList.remove('error'); }
      catch (e) { out.textContent = e.message; out.classList.add('error'); }
    } }, a.label));
  return el('div', { class: 'card' },
    field('Input', input),
    el('div', { class: 'row' }, ...buttons, copyBtn(() => out.textContent)),
    field('Output', out));
}

function jsonTool() {
  return transformTool({
    placeholder: '{"hello":"world"}',
    actions: [
      { label: '✨ Beautify', fn: (v) => T.formatJSON(v, 2) },
      { label: '🗜️ Minify', fn: (v) => T.minifyJSON(v), secondary: true },
    ],
  });
}

function base64Tool() {
  return transformTool({
    placeholder: 'Text or Base64…',
    actions: [
      { label: '🔒 Encode', fn: T.encodeBase64 },
      { label: '🔓 Decode', fn: T.decodeBase64, secondary: true },
    ],
  });
}

function urlTool() {
  return transformTool({
    placeholder: 'Text or URL-encoded string…',
    actions: [
      { label: '🔒 Encode', fn: T.urlEncode },
      { label: '🔓 Decode', fn: T.urlDecode, secondary: true },
    ],
  });
}

function caseTool() {
  const map = {
    'UPPERCASE': (s) => s.toUpperCase(),
    'lowercase': (s) => s.toLowerCase(),
    'Title Case': T.toTitleCase,
    'camelCase': T.toCamelCase,
    'PascalCase': T.toPascalCase,
    'snake_case': T.toSnakeCase,
    'kebab-case': T.toKebabCase,
    'CONSTANT_CASE': T.toConstantCase,
  };
  return transformTool({
    placeholder: 'Type something like "hello world"…',
    actions: Object.entries(map).map(([label, fn], i) => ({ label, fn, secondary: i % 2 === 1 })),
  });
}

function linesTool() {
  return transformTool({
    placeholder: 'One item per line…',
    actions: [
      { label: 'A→Z', fn: (v) => T.sortLines(v) },
      { label: 'Z→A', fn: (v) => T.sortLines(v, { descending: true }), secondary: true },
      { label: '1→9', fn: (v) => T.sortLines(v, { numeric: true }) },
      { label: 'Dedupe', fn: T.dedupeLines, secondary: true },
      { label: 'Reverse text', fn: T.reverseString },
    ],
  });
}

function counterTool() {
  const input = el('textarea', { placeholder: 'Start typing…' });
  const grid = el('div', { class: 'stat-grid' });
  function stat(value, label) { return el('div', { class: 'stat' }, el('b', {}, value), el('span', {}, label)); }
  function run() {
    const r = T.countText(input.value);
    grid.replaceChildren(
      stat(r.words, 'Words'),
      stat(r.characters, 'Characters'),
      stat(r.charactersNoSpaces, 'No spaces'),
      stat(r.sentences, 'Sentences'),
      stat(r.lines, 'Lines'),
      stat(r.paragraphs, 'Paragraphs'),
      stat(r.readingTimeMin < 1 ? '<1' : Math.round(r.readingTimeMin), 'Min read'),
    );
  }
  input.addEventListener('input', run);
  run();
  return el('div', { class: 'card' }, field('Text', input), grid);
}

function baseTool() {
  const value = el('input', { type: 'text', placeholder: 'e.g. 255 or ff or 1010', value: '255' });
  const from = el('select', {}, ...[['Decimal', 10], ['Binary', 2], ['Octal', 8], ['Hex', 16]].map(([l, v]) => el('option', { value: v }, l)));
  const to = el('select', {}, ...[['Binary', 2], ['Octal', 8], ['Decimal', 10], ['Hex', 16]].map(([l, v]) => el('option', { value: v }, l)));
  const out = outputBox();
  function run() {
    try { out.textContent = T.convertBase(value.value, Number(from.value), Number(to.value)); out.classList.remove('error'); }
    catch (e) { out.textContent = e.message; out.classList.add('error'); }
  }
  [value, from, to].forEach((n) => n.addEventListener('input', run));
  run();
  return el('div', { class: 'card' },
    field('Value', value),
    el('div', { class: 'row' }, field('From base', from), field('To base', to)),
    field('Result', out));
}

function unitTool() {
  const categories = {
    length: ['m', 'km', 'cm', 'mm', 'mi', 'yd', 'ft', 'in', 'nmi'],
    mass: ['g', 'kg', 'mg', 't', 'lb', 'oz', 'st'],
    temperature: ['C', 'F', 'K'],
    time: ['s', 'ms', 'min', 'h', 'day', 'week'],
    data: ['B', 'KB', 'MB', 'GB', 'TB', 'bit'],
    speed: ['m/s', 'km/h', 'mph', 'kn'],
  };
  const cat = el('select', {}, ...Object.keys(categories).map((c) => el('option', {}, c)));
  const value = el('input', { type: 'number', value: '1' });
  const from = el('select', {});
  const to = el('select', {});
  const out = outputBox();
  function fillUnits() {
    const units = categories[cat.value];
    from.replaceChildren(...units.map((u) => el('option', {}, u)));
    to.replaceChildren(...units.map((u) => el('option', {}, u)));
    to.selectedIndex = Math.min(1, units.length - 1);
    run();
  }
  function run() {
    try {
      const r = T.convertUnit(Number(value.value), from.value, to.value, cat.value);
      out.textContent = `${value.value} ${from.value} = ${Number(r.toPrecision(10))} ${to.value}`;
      out.classList.remove('error');
    } catch (e) { out.textContent = e.message; out.classList.add('error'); }
  }
  cat.addEventListener('change', fillUnits);
  [value, from, to].forEach((n) => n.addEventListener('input', run));
  fillUnits();
  return el('div', { class: 'card' },
    field('Category', cat),
    el('div', { class: 'row' }, field('Value', value), field('From', from), field('To', to)),
    field('Result', out));
}

function colorTool() {
  const hex = el('input', { type: 'text', value: '#4f46e5' });
  const picker = el('input', { type: 'color', value: '#4f46e5', style: 'height:44px;padding:4px' });
  const swatch = el('div', { class: 'swatch' });
  const out = outputBox();
  function update(hexValue) {
    try {
      const rgb = T.hexToRgb(hexValue);
      const hsl = T.rgbToHsl(rgb);
      const clean = T.rgbToHex(rgb);
      hex.value = clean;
      picker.value = clean;
      swatch.style.background = clean;
      out.classList.remove('error');
      out.textContent = `HEX  ${clean}\nRGB  rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL  hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    } catch (e) { out.textContent = e.message; out.classList.add('error'); }
  }
  hex.addEventListener('input', () => update(hex.value));
  picker.addEventListener('input', () => update(picker.value));
  update(hex.value);
  return el('div', { class: 'card' },
    el('div', { class: 'row' }, field('Hex', hex), field('Pick', picker)),
    swatch,
    el('div', { class: 'row' }, copyBtn(() => out.textContent)),
    out);
}

function imageTool() {
  const file = el('input', { type: 'file', accept: 'image/*' });
  const quality = el('input', { type: 'range', min: '0.1', max: '1', step: '0.05', value: '0.7' });
  const maxW = el('input', { type: 'number', value: '1600', min: '16' });
  const info = el('div', { class: 'hint' }, 'Choose an image — everything happens locally in your browser.');
  const preview = el('img', { style: 'max-width:100%;border-radius:10px;margin-top:12px;display:none' });
  const dl = el('a', { class: 'btn', style: 'display:none;text-decoration:none' }, '⬇️ Download');
  let sourceImg = null;
  let originalSize = 0;

  function process() {
    if (!sourceImg) return;
    const scale = Math.min(1, (Number(maxW.value) || 1600) / sourceImg.naturalWidth);
    const canvas = el('canvas');
    canvas.width = Math.round(sourceImg.naturalWidth * scale);
    canvas.height = Math.round(sourceImg.naturalHeight * scale);
    canvas.getContext('2d').drawImage(sourceImg, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      preview.src = url;
      preview.style.display = 'block';
      dl.href = url;
      dl.download = 'nexus-compressed.jpg';
      dl.style.display = 'inline-flex';
      const pct = originalSize ? Math.round((1 - blob.size / originalSize) * 100) : 0;
      info.textContent = `${canvas.width}×${canvas.height} · ${fmtBytes(originalSize)} → ${fmtBytes(blob.size)} (${pct}% smaller)`;
    }, 'image/jpeg', Number(quality.value));
  }
  function fmtBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }
  file.addEventListener('change', () => {
    const f = file.files[0];
    if (!f) return;
    originalSize = f.size;
    const img = new Image();
    img.onload = () => { sourceImg = img; process(); };
    img.src = URL.createObjectURL(f);
  });
  [quality, maxW].forEach((n) => n.addEventListener('input', process));
  return el('div', { class: 'card' },
    field('Image', file),
    el('div', { class: 'row' }, field('Max width (px)', maxW), field('JPEG quality', quality)),
    info, preview, el('div', { class: 'row', style: 'margin-top:12px' }, dl));
}

function timestampTool() {
  const unix = el('input', { type: 'text', placeholder: 'e.g. 1700000000', value: String(Math.floor(Date.now() / 1000)) });
  const iso = el('input', { type: 'text', placeholder: 'e.g. 2023-11-14T22:13:20Z' });
  const out = outputBox();
  function fromUnix() {
    try { iso.value = T.unixToIso(unix.value); out.textContent = iso.value; out.classList.remove('error'); }
    catch (e) { out.textContent = e.message; out.classList.add('error'); }
  }
  function fromIso() {
    try { const u = T.isoToUnix(iso.value); unix.value = String(u); out.textContent = String(u); out.classList.remove('error'); }
    catch (e) { out.textContent = e.message; out.classList.add('error'); }
  }
  unix.addEventListener('input', fromUnix);
  iso.addEventListener('input', fromIso);
  fromUnix();
  return el('div', { class: 'card' },
    field('Unix timestamp (seconds)', unix, 'Type a Unix time to see the ISO date.'),
    field('ISO 8601 date', iso, 'Type an ISO date to see the Unix time.'),
    out);
}

/* ------------------------------------------------------------------ *
 * Registry & router
 * ------------------------------------------------------------------ */
const TOOLS = [
  { id: 'password', name: 'Password Generator', emoji: '🔐', group: 'Security', desc: 'Create strong, random passwords with a live strength meter.', render: passwordTool },
  { id: 'hash', name: 'Hash Generator', emoji: '#️⃣', group: 'Security', desc: 'SHA-256/1/384/512 hashes computed with the Web Crypto API.', render: hashTool },
  { id: 'uuid', name: 'UUID Generator', emoji: '🆔', group: 'Security', desc: 'Generate RFC-4122 version-4 UUIDs in bulk.', render: uuidTool },
  { id: 'json', name: 'JSON Formatter', emoji: '{ }', group: 'Developer', desc: 'Beautify or minify JSON, with validation.', render: jsonTool },
  { id: 'base64', name: 'Base64 Encode / Decode', emoji: '🔁', group: 'Developer', desc: 'Unicode-safe Base64 in both directions.', render: base64Tool },
  { id: 'url', name: 'URL Encode / Decode', emoji: '🔗', group: 'Developer', desc: 'Percent-encode or decode URL components.', render: urlTool },
  { id: 'base', name: 'Number Base Converter', emoji: '🔢', group: 'Developer', desc: 'Convert between binary, octal, decimal and hex.', render: baseTool },
  { id: 'timestamp', name: 'Timestamp Converter', emoji: '⏱️', group: 'Developer', desc: 'Convert between Unix time and ISO 8601 dates.', render: timestampTool },
  { id: 'case', name: 'Case Converter', emoji: '🔤', group: 'Text', desc: 'camelCase, snake_case, Title Case and more.', render: caseTool },
  { id: 'counter', name: 'Word Counter', emoji: '🧮', group: 'Text', desc: 'Count words, characters, sentences and reading time.', render: counterTool },
  { id: 'lines', name: 'Line Tools', emoji: '📃', group: 'Text', desc: 'Sort, deduplicate and reverse lines of text.', render: linesTool },
  { id: 'lorem', name: 'Lorem Ipsum', emoji: '📝', group: 'Text', desc: 'Generate placeholder text by words, sentences or paragraphs.', render: loremTool },
  { id: 'unit', name: 'Unit Converter', emoji: '📏', group: 'Everyday', desc: 'Length, mass, temperature, time, data and speed.', render: unitTool },
  { id: 'color', name: 'Color Converter', emoji: '🎨', group: 'Everyday', desc: 'Convert between HEX, RGB and HSL with a live preview.', render: colorTool },
  { id: 'image', name: 'Image Compressor', emoji: '🖼️', group: 'Everyday', desc: 'Resize and compress images — 100% on your device.', render: imageTool },
];

const main = () => document.getElementById('main');
const sidebar = () => document.getElementById('sidebar');

function renderSidebar(filter = '') {
  const nav = document.getElementById('nav');
  nav.replaceChildren();
  const q = filter.trim().toLowerCase();
  const groups = {};
  for (const t of TOOLS) {
    if (q && !(`${t.name} ${t.desc} ${t.group}`.toLowerCase().includes(q))) continue;
    (groups[t.group] ||= []).push(t);
  }
  const active = location.hash.slice(1);
  for (const [group, items] of Object.entries(groups)) {
    nav.append(el('div', { class: 'nav-group-title' }, group));
    for (const t of items) {
      nav.append(el('button', {
        class: 'nav-item' + (t.id === active ? ' active' : ''),
        onclick: () => { location.hash = t.id; closeSidebarMobile(); },
      }, el('span', { class: 'emoji' }, t.emoji), t.name));
    }
  }
  if (!Object.keys(groups).length) nav.append(el('div', { class: 'hint' }, 'No tools match your search.'));
}

function renderLanding() {
  main().replaceChildren(el('div', { class: 'landing' },
    el('div', { class: 'tool-header' },
      el('h1', {}, '🧰 Welcome to Nexus Tools'),
      el('p', {}, 'A fast, private toolbox of everyday utilities. Everything runs entirely in your browser — nothing you type is ever uploaded.')),
    el('p', {}, 'Pick a tool from the sidebar, or try a popular one:'),
    el('div', { class: 'chips' }, ...TOOLS.slice(0, 8).map((t) =>
      el('button', { class: 'chip', onclick: () => { location.hash = t.id; } }, `${t.emoji} ${t.name}`)))));
}

function route() {
  const id = location.hash.slice(1);
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) { renderLanding(); renderSidebar(document.getElementById('search').value); return; }
  document.title = `${tool.name} · Nexus Tools`;
  main().replaceChildren(
    el('div', { class: 'tool-header' }, el('h1', {}, `${tool.emoji} ${tool.name}`), el('p', {}, tool.desc)),
    tool.render());
  renderSidebar(document.getElementById('search').value);
  main().scrollTo?.(0, 0);
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('nexus-theme', theme);
  document.getElementById('theme-btn').textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
}
function initTheme() {
  const saved = localStorage.getItem('nexus-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}

/* ---------- Mobile sidebar ---------- */
function closeSidebarMobile() { sidebar().classList.remove('open'); }

/* ---------- Boot ---------- */
function boot() {
  initTheme();
  document.getElementById('theme-btn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
  document.getElementById('menu-btn').addEventListener('click', () => sidebar().classList.toggle('open'));
  document.getElementById('search').addEventListener('input', (e) => renderSidebar(e.target.value));
  window.addEventListener('hashchange', route);
  route();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
