import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icon.svg');
const sizes = [
  ['public/pwa-192.png', 192],
  ['public/pwa-512.png', 512],
  ['public/pwa-maskable-512.png', 512],
  ['public/apple-touch-icon.png', 180],
];
for (const [out, size] of sizes) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(out);
  console.log('wrote', out);
}
