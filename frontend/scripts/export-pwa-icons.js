/**
 * Genera PNG para PWA desde los SVG en public/icons/.
 * Requiere: npm install (sharp en devDependencies)
 */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Instala sharp: npm install --save-dev sharp@0.32.6');
    process.exit(1);
  }

  const svgMain = fs.readFileSync(path.join(iconsDir, 'orquesta-cafe.svg'));
  const svgMask = fs.readFileSync(path.join(iconsDir, 'orquesta-cafe-maskable.svg'));

  const out = [
    [svgMain, path.join(publicDir, 'logo192.png'), 192],
    [svgMain, path.join(publicDir, 'logo512.png'), 512],
    [svgMain, path.join(iconsDir, 'icon-72.png'), 72],
    [svgMain, path.join(iconsDir, 'icon-96.png'), 96],
    [svgMain, path.join(iconsDir, 'icon-128.png'), 128],
    [svgMain, path.join(iconsDir, 'icon-144.png'), 144],
    [svgMain, path.join(iconsDir, 'icon-152.png'), 152],
    [svgMain, path.join(iconsDir, 'icon-192.png'), 192],
    [svgMain, path.join(iconsDir, 'icon-384.png'), 384],
    [svgMain, path.join(iconsDir, 'icon-512.png'), 512],
    [svgMask, path.join(iconsDir, 'icon-maskable-512.png'), 512],
    [svgMain, path.join(iconsDir, 'apple-touch-icon.png'), 180],
    [svgMain, path.join(iconsDir, 'favicon-32.png'), 32],
    [svgMain, path.join(iconsDir, 'favicon-48.png'), 48],
  ];

  for (const [buf, dest, size] of out) {
    await sharp(buf).resize(size, size).png().toFile(dest);
    console.log('Wrote', path.relative(publicDir, dest));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
