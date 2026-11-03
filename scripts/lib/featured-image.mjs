// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * Branded featured image generator (free, offline, uses sharp).
 * Reads brand colors from src/design/tokens.css and the site name from site.config.ts,
 * so every generated image matches the client's design.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function tokens() {
  const css = readFileSync('src/design/tokens.css', 'utf8');
  const v = (name, d) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim() ?? d;
  const cfg = readFileSync('src/site.config.ts', 'utf8');
  return {
    primary: v('color-primary', '#1f4fd6'),
    contrast: v('color-primary-contrast', '#ffffff'),
    accent: v('color-accent', '#f5a524'),
    brand: cfg.match(/name:\s*'([^']+)'/)?.[1] ?? '',
  };
}

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * @param {{ title: string, out: string, label?: string, width?: number, height?: number }} o
 */
export async function makeFeaturedImage({ title, out, label = '', width = 1600, height = 900 }) {
  const t = tokens();
  let size = 84;
  let lines = wrap(title, 26);
  if (lines.length > 4) { size = 66; lines = wrap(title, 34); }
  if (lines.length > 5) lines = [...lines.slice(0, 4), lines.slice(4).join(' ').slice(0, 30) + '...'];
  const lh = size * 1.18;
  const top = height / 2 - (lines.length * lh) / 2 + size * 0.35;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${t.primary}"/><stop offset="1" stop-color="${t.primary}" stop-opacity="0.78"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="${t.primary}"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${width - 120}" cy="120" r="260" fill="${t.accent}" opacity="0.18"/>
  <circle cx="${width - 40}" cy="${height + 60}" r="320" fill="${t.contrast}" opacity="0.06"/>
  <rect x="120" y="${top - size * 1.35}" width="90" height="10" rx="5" fill="${t.accent}"/>
  ${label ? `<text x="120" y="${top - size * 1.7}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="3" fill="${t.contrast}" opacity="0.85">${esc(label.toUpperCase())}</text>` : ''}
  ${lines.map((l, i) => `<text x="120" y="${top + i * lh}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" fill="${t.contrast}">${esc(l)}</text>`).join('\n  ')}
  <text x="120" y="${height - 90}" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="${t.contrast}" opacity="0.9">${esc(t.brand)}</text>
</svg>`;
  mkdirSync(dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  return out;
}
