import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icon.svg');
await sharp(svg, { density: 300 }).resize(1024, 1024).png().toFile('assets/logo.png');
console.log('wrote assets/logo.png');
