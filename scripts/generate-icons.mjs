// One-off icon generator. Renders a purple-gradient rounded square with "TF"
// at every PWA icon size into /public/icons/. Pure-JS PNG encoder — no deps.
//
//   node scripts/generate-icons.mjs
//
// Outputs:  public/icons/icon-{72,96,128,144,152,192,384,512}.png
// Plus:     public/icons/icon-512-maskable.png (with safe-area padding)

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = resolve(__dirname, "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

// ─── tiny PNG encoder ───
function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tag = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tag, data])), 0);
  return Buffer.concat([len, tag, data, crc]);
}
function makePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[(stride + 1) * y] = 0;
    rgba.copy(raw, (stride + 1) * y + 1, stride * y, stride * (y + 1));
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ─── pixel painter ───
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

// 5x7 bitmap font for "T" and "F" — each letter is 5 cols × 7 rows of 0/1
const GLYPHS = {
  T: [
    "11111",
    "00100",
    "00100",
    "00100",
    "00100",
    "00100",
    "00100",
  ],
  F: [
    "11111",
    "10000",
    "10000",
    "11110",
    "10000",
    "10000",
    "10000",
  ],
};

function drawGlyph(rgba, width, char, x0, y0, scale, color) {
  const g = GLYPHS[char];
  for (let gy = 0; gy < 7; gy++) {
    for (let gx = 0; gx < 5; gx++) {
      if (g[gy][gx] !== "1") continue;
      // Anti-aliased block: fill scale x scale region
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const x = x0 + gx * scale + dx;
          const y = y0 + gy * scale + dy;
          if (x < 0 || y < 0 || x >= width) continue;
          const idx = (y * width + x) * 4;
          rgba[idx]     = color[0];
          rgba[idx + 1] = color[1];
          rgba[idx + 2] = color[2];
          rgba[idx + 3] = 255;
        }
      }
    }
  }
}

function makeIcon(size, { padding = 0 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = Math.floor(size * 0.22);
  const c1 = [124, 58, 237];   // #7C3AED purple-600
  const c2 = [99, 102, 241];   // #6366F1 indigo-500

  // Background: rounded square with diagonal gradient
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Rounded-square mask
      let inside = true;
      const insidePadding = padding;
      const minX = insidePadding, minY = insidePadding;
      const maxX = size - 1 - insidePadding, maxY = size - 1 - insidePadding;
      if (x < minX || x > maxX || y < minY || y > maxY) {
        inside = false;
      } else if (x < minX + radius && y < minY + radius) {
        const dx = (minX + radius) - x, dy = (minY + radius) - y;
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (x > maxX - radius && y < minY + radius) {
        const dx = x - (maxX - radius), dy = (minY + radius) - y;
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (x < minX + radius && y > maxY - radius) {
        const dx = (minX + radius) - x, dy = y - (maxY - radius);
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (x > maxX - radius && y > maxY - radius) {
        const dx = x - (maxX - radius), dy = y - (maxY - radius);
        if (dx * dx + dy * dy > radius * radius) inside = false;
      }
      if (!inside) {
        // Transparent
        rgba[idx] = 0; rgba[idx + 1] = 0; rgba[idx + 2] = 0; rgba[idx + 3] = 0;
        continue;
      }
      const t = (x + y) / (2 * size);
      const c = lerpColor(c1, c2, t);
      rgba[idx]     = c[0];
      rgba[idx + 1] = c[1];
      rgba[idx + 2] = c[2];
      rgba[idx + 3] = 255;
    }
  }

  // "TF" — center the two glyphs (5 cols each) with 2 cols gap
  const glyphCols = 5 + 2 + 5; // 12
  const glyphRows = 7;
  const inner = size - padding * 2;
  const scale = Math.max(1, Math.floor(inner / (glyphCols + 4))); // leave horizontal margin
  const totalW = glyphCols * scale;
  const totalH = glyphRows * scale;
  const x0 = Math.floor(padding + (inner - totalW) / 2);
  const y0 = Math.floor(padding + (inner - totalH) / 2);
  const white = [255, 255, 255];
  drawGlyph(rgba, size, "T", x0,                       y0, scale, white);
  drawGlyph(rgba, size, "F", x0 + (5 + 2) * scale,     y0, scale, white);

  return makePng(size, size, rgba);
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
for (const size of SIZES) {
  const png = makeIcon(size);
  writeFileSync(resolve(OUT_DIR, `icon-${size}.png`), png);
  console.log(`  ✓ icon-${size}.png`);
}
// Maskable variant — adds 12% safe padding so Android can mask any shape
const maskable = makeIcon(512, { padding: Math.round(512 * 0.12) });
writeFileSync(resolve(OUT_DIR, "icon-512-maskable.png"), maskable);
console.log("  ✓ icon-512-maskable.png");

console.log(`\nDone → ${OUT_DIR}`);
