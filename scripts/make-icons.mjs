// Renders the InLine PWA icons from public/icon.svg.
// Usage: npm run icons
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const outDir = join(publicDir, 'icons')

const GREEN = '#15803D'

// Same glyph as the in-app Logo tile (24×24 grid, white strokes).
const GLYPH =
  '<g fill="none" stroke="#fff" stroke-width="2">' +
  '<rect x="3.5" y="4" width="17" height="16" rx="3.5"/>' +
  '<path d="M3.5 9.25h17"/>' +
  '<circle cx="12" cy="14.6" r="2.1"/>' +
  '</g>'

/** Full-bleed square (no transparency) with the glyph scaled to `glyphRatio` of the canvas. */
function fullBleedSvg(size, glyphRatio) {
  const scale = (size * glyphRatio) / 24
  const offset = (size - 24 * scale) / 2
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" fill="${GREEN}"/>` +
      `<g transform="translate(${offset} ${offset}) scale(${scale})">${GLYPH}</g>` +
      '</svg>',
  )
}

async function render(input, size, file) {
  const target = join(outDir, file)
  await sharp(input, { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toFile(target)
  process.stdout.write(`  wrote public/icons/${file} (${size}×${size})\n`)
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const iconSvg = await readFile(join(publicDir, 'icon.svg'))

  await render(iconSvg, 192, 'icon-192.png')
  await render(iconSvg, 512, 'icon-512.png')
  // Maskable: glyph kept inside the 80% safe zone (≈45% of canvas) on solid green.
  await render(fullBleedSvg(512, 0.5), 512, 'icon-512-maskable.png')
  // iOS rounds corners itself and dislikes transparency.
  await render(fullBleedSvg(180, 0.56), 180, 'apple-touch-icon.png')
}

main().catch((error) => {
  process.stderr.write(`make-icons failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
