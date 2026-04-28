// Generate every PWA icon size from a single source logo.
//
//   node scripts/generate-icons.mjs
//
// 1. If `public/icons/logo-source.png` (or .jpg/.svg/.webp) exists → resize that to every PWA size
//    with a brand-coloured background and proper padding. Maskable variant gets extra safe area.
// 2. Otherwise → falls back to a generated purple "TF" tile so the PWA still has icons.
//
// Outputs:
//   public/icons/icon-{72,96,128,144,152,192,384,512}.png
//   public/icons/icon-512-maskable.png

import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "..");
const ICON_DIR  = join(ROOT, "public", "icons");
mkdirSync(ICON_DIR, { recursive: true });

// Find a source logo if the user dropped one in
function findSource() {
  const candidates = ["logo-source.png", "logo-source.jpg", "logo-source.jpeg",
                      "logo-source.webp", "logo-source.svg",
                      "logo.png", "logo.svg"];
  for (const name of candidates) {
    const p = join(ICON_DIR, name);
    if (existsSync(p)) return p;
  }
  return null;
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BG_LIGHT = { r: 255, g: 255, b: 255, alpha: 1 };

const sourcePath = findSource();

if (sourcePath) {
  // ── Use sharp to scale a real logo ──────────────────────────────────────
  const { default: sharp } = await import("sharp");
  console.log(`[icons] using source: ${sourcePath}`);

  for (const size of SIZES) {
    // Standard icons: pad ~10% around the logo, white background, no rounding
    // (the OS / browser handles rounding to a squircle when displayed)
    const inner = Math.round(size * 0.84);
    const logo  = await sharp(sourcePath)
      .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: BG_LIGHT },
    })
      .composite([{ input: logo, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toFile(join(ICON_DIR, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);
  }

  // Maskable: 80% safe area (logo at 60% so OS-applied masks don't clip it)
  const maskSize  = 512;
  const maskInner = Math.round(maskSize * 0.60);
  const maskLogo  = await sharp(sourcePath)
    .resize(maskInner, maskInner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: maskSize, height: maskSize, channels: 4, background: BG_LIGHT },
  })
    .composite([{ input: maskLogo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(join(ICON_DIR, "icon-512-maskable.png"));
  console.log("  ✓ icon-512-maskable.png");

  console.log(`\nDone → ${ICON_DIR}`);
} else {
  console.log("[icons] no source logo found — falling back to generated 'TF' tiles");
  console.log(`        drop your logo here:  ${join(ICON_DIR, "logo-source.png")}\n`);

  // ── Pure-Node fallback (the original "TF" generator) ────────────────────
  function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
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
    ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 6;
    const stride = width * 4;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
      raw[(stride + 1) * y] = 0;
      rgba.copy(raw, (stride + 1) * y + 1, stride * y, stride * (y + 1));
    }
    const idat = zlib.deflateSync(raw, { level: 9 });
    return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(c1, c2, t) {
    return [Math.round(lerp(c1[0],c2[0],t)),Math.round(lerp(c1[1],c2[1],t)),Math.round(lerp(c1[2],c2[2],t))];
  }
  const GLYPHS = {
    T: ["11111","00100","00100","00100","00100","00100","00100"],
    F: ["11111","10000","10000","11110","10000","10000","10000"],
  };
  function drawGlyph(rgba, w, char, x0, y0, scale, color) {
    const g = GLYPHS[char];
    for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) {
      if (g[gy][gx] !== "1") continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const x = x0 + gx*scale + dx, y = y0 + gy*scale + dy;
        if (x < 0 || y < 0 || x >= w) continue;
        const idx = (y * w + x) * 4;
        rgba[idx]=color[0]; rgba[idx+1]=color[1]; rgba[idx+2]=color[2]; rgba[idx+3]=255;
      }
    }
  }
  function makeIcon(size, { padding = 0 } = {}) {
    const rgba = Buffer.alloc(size * size * 4);
    const radius = Math.floor(size * 0.22);
    const c1 = [124, 58, 237], c2 = [99, 102, 241];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let inside = true;
      const minX = padding, minY = padding, maxX = size-1-padding, maxY = size-1-padding;
      if (x < minX || x > maxX || y < minY || y > maxY) inside = false;
      else if (x < minX+radius && y < minY+radius) {
        const dx = (minX+radius)-x, dy = (minY+radius)-y;
        if (dx*dx+dy*dy > radius*radius) inside = false;
      } else if (x > maxX-radius && y < minY+radius) {
        const dx = x-(maxX-radius), dy = (minY+radius)-y;
        if (dx*dx+dy*dy > radius*radius) inside = false;
      } else if (x < minX+radius && y > maxY-radius) {
        const dx = (minX+radius)-x, dy = y-(maxY-radius);
        if (dx*dx+dy*dy > radius*radius) inside = false;
      } else if (x > maxX-radius && y > maxY-radius) {
        const dx = x-(maxX-radius), dy = y-(maxY-radius);
        if (dx*dx+dy*dy > radius*radius) inside = false;
      }
      if (!inside) { rgba[idx+3] = 0; continue; }
      const t = (x + y) / (2 * size);
      const c = lerpColor(c1, c2, t);
      rgba[idx]=c[0]; rgba[idx+1]=c[1]; rgba[idx+2]=c[2]; rgba[idx+3]=255;
    }
    const glyphCols = 12, glyphRows = 7;
    const inner = size - padding * 2;
    const scale = Math.max(1, Math.floor(inner / (glyphCols + 4)));
    const totalW = glyphCols*scale, totalH = glyphRows*scale;
    const x0 = Math.floor(padding + (inner - totalW) / 2);
    const y0 = Math.floor(padding + (inner - totalH) / 2);
    drawGlyph(rgba, size, "T", x0, y0, scale, [255,255,255]);
    drawGlyph(rgba, size, "F", x0 + 7*scale, y0, scale, [255,255,255]);
    return makePng(size, size, rgba);
  }
  for (const size of SIZES) {
    writeFileSync(join(ICON_DIR, `icon-${size}.png`), makeIcon(size));
    console.log(`  ✓ icon-${size}.png`);
  }
  writeFileSync(join(ICON_DIR, "icon-512-maskable.png"), makeIcon(512, { padding: Math.round(512*0.12) }));
  console.log("  ✓ icon-512-maskable.png");
  console.log(`\nDone → ${ICON_DIR}`);
}
