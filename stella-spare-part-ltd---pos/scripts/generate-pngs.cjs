const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createSolidPNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // CRC table
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

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each line
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Border or gear pattern
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      const isInner = dist < width * 0.4;
      const isRing = dist >= width * 0.35 && dist <= width * 0.42;

      if (isRing) {
        rawData[pxOffset] = 245;     // Gold R
        rawData[pxOffset + 1] = 158; // Gold G
        rawData[pxOffset + 2] = 11;  // Gold B
        rawData[pxOffset + 3] = 255;
      } else if (isInner) {
        rawData[pxOffset] = 15;      // Navy R
        rawData[pxOffset + 1] = 23;  // Navy G
        rawData[pxOffset + 2] = 42;  // Navy B
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

// Deep navy background #0f172a (15, 23, 42)
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createSolidPNG(192, 192, 15, 23, 42));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createSolidPNG(512, 512, 15, 23, 42));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createSolidPNG(512, 512, 15, 23, 42));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createSolidPNG(180, 180, 15, 23, 42));
console.log('Generated PNG icons in public/');
