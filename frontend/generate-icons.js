import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create public/icons directory
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Generate SVG Icon (Tinglev Corporate Logo Symbol)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="tGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#009FE3" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0284C7" flood-opacity="0.6"/>
    </filter>
  </defs>
  
  <!-- Rounded Base Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  
  <!-- Subtle Border Ring -->
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="#38BDF8" stroke-width="4" stroke-opacity="0.3" />

  <!-- Tinglev Geometric T Emblem -->
  <g transform="translate(106, 80) scale(3.0)" filter="url(#glow)">
    <!-- Top Bar Left Part -->
    <path d="M0 0 H47 V102 H0 V0 Z" fill="#FFFFFF" />
    <!-- Bottom Left Cut -->
    <path d="M0 108 H47 V160 H35 L0 125 V108 Z" fill="url(#tGrad)" />
    <!-- Top Right Cut -->
    <path d="M53 0 H65 L100 35 V52 H53 V0 Z" fill="url(#tGrad)" />
    <!-- Bottom Right Pillar -->
    <path d="M53 58 H100 V160 H53 V58 Z" fill="#FFFFFF" />
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');
console.log('✅ Created icon.svg');

// 2. Pure Node PNG Creator (generates uncompressed/deflated raw RGBA PNGs)
function createPng(width, height, drawPixel) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1; // +1 for filter byte (0)
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // CRC32 implementation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 = RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Geometric rendering function for Tinglev App Icon
function tinglevPixel(x, y, size) {
  const normX = x / size;
  const normY = y / size;

  // Background Slate 900 -> Sky 600 Gradient
  const gradT = (normX + normY) * 0.5;
  const bgR = Math.round(15 + gradT * (2 - 15));
  const bgG = Math.round(23 + gradT * (132 - 23));
  const bgB = Math.round(42 + gradT * (199 - 42));

  // Transform coordinates to 100x160 Tinglev emblem space
  // Margin in normalized coordinates: [0.20, 0.15] to [0.80, 0.85]
  const emblemLeft = 0.22;
  const emblemRight = 0.78;
  const emblemTop = 0.18;
  const emblemBottom = 0.82;

  if (normX >= emblemLeft && normX <= emblemRight && normY >= emblemTop && normY <= emblemBottom) {
    const ex = ((normX - emblemLeft) / (emblemRight - emblemLeft)) * 100;
    const ey = ((normY - emblemTop) / (emblemBottom - emblemTop)) * 160;

    // Piece 1: Top Bar Left (0,0) to (47, 102) -> White
    if (ex >= 0 && ex <= 47 && ey >= 0 && ey <= 102) {
      return [255, 255, 255, 255];
    }
    // Piece 2: Bottom Left Cut (0,108) to (47, 160) with chamfer -> Cyan #009FE3
    if (ex >= 0 && ex <= 47 && ey >= 108 && ey <= 160) {
      // Chamfer from (0, 125) to (35, 160) -> line is (ey - 125)/(160 - 125) = ex/35 => ex >= (ey - 125)
      if (ey < 125 || (ex >= (ey - 125))) {
        return [0, 159, 227, 255];
      }
    }
    // Piece 3: Top Right Cut (53, 0) to (100, 52) with chamfer -> Cyan #009FE3
    if (ex >= 53 && ex <= 100 && ey >= 0 && ey <= 52) {
      // Chamfer from (65, 0) to (100, 35) -> (ex - 65) >= ey
      if (ey > 35 || ((ex - 53) <= (ey + 12))) {
        return [0, 159, 227, 255];
      }
    }
    // Piece 4: Bottom Right Pillar (53, 58) to (100, 160) -> White
    if (ex >= 53 && ex <= 100 && ey >= 58 && ey <= 160) {
      return [255, 255, 255, 255];
    }
  }

  // Base background
  return [bgR, bgG, bgB, 255];
}

// Generate Icons
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192.png', size: 192 }
];

for (const { name, size } of sizes) {
  const pngBuf = createPng(size, size, (x, y, w, h) => tinglevPixel(x, y, w));
  fs.writeFileSync(path.join(iconsDir, name), pngBuf);
  console.log(`✅ Generated ${name} (${size}x${size})`);
}
