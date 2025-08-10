/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

async function ensurePngFromSvg(svgPath, pngPath, size = 128) {
  const sharp = require('sharp');
  const svg = fs.readFileSync(svgPath);
  await sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);
}

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const svgPath = path.join(root, 'icons', 'mino.svg');
    const pngPath = path.join(root, 'icons', 'mino.png');
    if (!fs.existsSync(svgPath)) {
      throw new Error(`Missing SVG: ${svgPath}`);
    }
    await ensurePngFromSvg(svgPath, pngPath, 128);
    console.log(`Generated icon: ${path.relative(root, pngPath)}`);
  } catch (err) {
    console.error('Failed to generate PNG icon from SVG:', err.message);
    process.exit(1);
  }
})();


