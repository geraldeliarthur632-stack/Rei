import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height) {
  // RGBA buffer: 4 bytes per pixel + 1 filter byte per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Distance from center for circle/rounded shape
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = width * 0.44;

      // Gradient background: Cyan (#0284c7) to Indigo (#4f46e5)
      const t = (x + y) / (width + height);
      let r = Math.round(2 + (79 - 2) * t);
      let g = Math.round(132 + (70 - 132) * t);
      let b = Math.round(199 + (229 - 199) * t);
      let a = 255;

      // Rounded squircle / circular badge
      if (dist > radius) {
        // Outside main icon bounds - smooth anti-aliased edge
        const edge = dist - radius;
        if (edge < 2) {
          a = Math.round(255 * (1 - edge / 2));
        } else {
          a = 0;
          r = 0;
          g = 0;
          b = 0;
        }
      } else {
        // Draw pulse symbol / lightning in center
        // Center area normalization (-1 to 1)
        const nx = (x - cx) / (width * 0.3);
        const ny = (y - cy) / (height * 0.3);

        // Stylized pulse / zap bolt
        const inBolt = 
          (Math.abs(ny - (-nx * 0.6)) < 0.25 && nx >= -0.7 && nx <= 0.7) ||
          (Math.abs(nx) < 0.18 && Math.abs(ny) < 0.6) ||
          (Math.abs(nx - 0.2) < 0.15 && ny > 0 && ny < 0.5) ||
          (Math.abs(nx + 0.2) < 0.15 && ny < 0 && ny > -0.5);

        if (inBolt) {
          // White symbol with subtle glow
          r = 255;
          g = 255;
          b = 255;
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // Deflate image data
  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crc]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0284c7" flood-opacity="0.3" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#grad)" filter="url(#shadow)" />
  <circle cx="256" cy="256" r="180" stroke="white" stroke-opacity="0.15" stroke-width="4" stroke-dasharray="8 8" />
  
  <!-- Pulse Wave + Devices Symbol -->
  <path d="M120 256 L180 256 L210 170 L260 342 L300 220 L330 256 L392 256" 
        stroke="white" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
  
  <circle cx="256" cy="256" r="14" fill="#38bdf8" />
  <circle cx="210" cy="170" r="10" fill="#ffffff" />
  <circle cx="260" cy="342" r="10" fill="#ffffff" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Generate PNGs
console.log('Generating 192x192 PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192));

console.log('Generating 512x512 PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512));

console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180));

console.log('Generating favicon.ico...');
// Valid 32x32 PNG for favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(32, 32));

console.log('PWA icons successfully generated in /public!');
