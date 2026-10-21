// Converts the original Figma photos (docs/figma/raw) into small WebP files
// served from public/images/places/<place-id>.webp. Run with `npm run photos`.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW_DIR = path.join(ROOT, 'docs', 'figma', 'raw')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'places')
const MAX_WIDTH = 800
const QUALITY = 72

// place id -> source photo (and an optional crop, in source pixels).
// The 12 coffee places use the photos they have in the Figma file; the raw folder
// holds 11 distinct photos (the rest are duplicates), so Kedai Pagi and the seven
// non-coffee places use distinct crops of the photos.
const PHOTOS = [
  { id: 'kopi-tepi', src: 'img5.jpeg' },
  { id: 'ruang-seduh', src: 'img8.png' },
  { id: 'kedai-senja', src: 'img19.png' },
  { id: 'kopi-kaca', src: 'img7.png' },
  { id: 'ruang-baca', src: 'img12.jpeg' },
  { id: 'kedai-hujan', src: 'img13.jpeg' },
  { id: 'seduh-studio', src: 'img1.jpeg' },
  { id: 'kopi-kayu', src: 'img15.jpeg' },
  { id: 'ruang-hijau', src: 'img2.jpeg' },
  { id: 'kedai-pagi', src: 'img1.jpeg', crop: { left: 700, top: 50, width: 452, height: 440 } },
  { id: 'seduh-malam', src: 'img6.jpeg' },
  { id: 'kopi-bawah', src: 'img4.jpeg' },
  { id: 'dapur-mahasiswa', src: 'img2.jpeg', crop: { left: 560, top: 360, width: 592, height: 540 } },
  { id: 'kantin-kijang', src: 'img4.jpeg', crop: { left: 560, top: 330, width: 592, height: 598 } },
  { id: 'dapur-syahdan', src: 'img15.jpeg', crop: { left: 0, top: 200, width: 600, height: 600 } },
  { id: 'teras-teh', src: 'img19.png', crop: { left: 270, top: 300, width: 520, height: 332 } },
  { id: 'segar-jus', src: 'img8.png', crop: { left: 330, top: 100, width: 460, height: 420 } },
  { id: 'roti-sudut', src: 'img4.jpeg', crop: { left: 0, top: 520, width: 640, height: 408 } },
  { id: 'camilan-koridor', src: 'img15.jpeg', crop: { left: 480, top: 180, width: 672, height: 600 } },
]

async function convert({ id, src, crop }) {
  let pipeline = sharp(path.join(RAW_DIR, src)).rotate()
  if (crop) pipeline = pipeline.extract(crop)
  const out = path.join(OUT_DIR, `${id}.webp`)
  await pipeline
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(out)
  const { size } = await fs.stat(out)
  return size
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  let total = 0
  for (const photo of PHOTOS) {
    const size = await convert(photo)
    total += size
    process.stdout.write(`${photo.id}.webp  ${(size / 1024).toFixed(1)} KB\n`)
  }
  process.stdout.write(`Total ${(total / 1024).toFixed(1)} KB for ${PHOTOS.length} photos\n`)
}

main().catch((error) => {
  process.stderr.write(`optimize-photos failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
