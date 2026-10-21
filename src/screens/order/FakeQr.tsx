import { useMemo } from 'react'

/** Modules per side (QR version 2 size) and quiet zone, in modules. */
const MODULES = 25
const QUIET = 2
const VIEW = MODULES + QUIET * 2
const FINDER = 7
/** Center square kept free for the InLine mark. */
const LOGO_FROM = 10
const LOGO_TO = 14

/** FNV-1a: stable 32-bit seed from the order id. */
function hashSeed(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32: tiny deterministic PRNG. */
function makeRandom(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isReserved(x: number, y: number): boolean {
  const near = FINDER + 1
  const inFinder = (x < near && y < near) || (x >= MODULES - near && y < near) || (x < near && y >= MODULES - near)
  const inLogo = x >= LOGO_FROM && x <= LOGO_TO && y >= LOGO_FROM && y <= LOGO_TO
  return inFinder || inLogo
}

function isDark(x: number, y: number, random: () => number): boolean {
  if (y === FINDER - 1) return x % 2 === 0 // timing pattern row
  if (x === FINDER - 1) return y % 2 === 0 // timing pattern column
  return random() < 0.5
}

function modulePath(seedText: string): string {
  const random = makeRandom(hashSeed(seedText))
  let d = ''
  for (let y = 0; y < MODULES; y += 1) {
    for (let x = 0; x < MODULES; x += 1) {
      if (isReserved(x, y)) continue
      if (isDark(x, y, random)) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`
    }
  }
  return d
}

function finderPath(x: number, y: number): string {
  const ox = x + QUIET
  const oy = y + QUIET
  return `M${ox} ${oy}h7v7h-7z M${ox + 1} ${oy + 1}v5h5v-5z M${ox + 2} ${oy + 2}h3v3h-3z`
}

const FINDERS = [finderPath(0, 0), finderPath(MODULES - FINDER, 0), finderPath(0, MODULES - FINDER)].join(' ')

interface FakeQrProps {
  /** Seed: the same order id always draws the same pattern. */
  seed: string
  size?: number
}

/** Decorative, deterministic QR-like code for the demo payment (not scannable, encodes nothing). */
export function FakeQr({ seed, size = 196 }: FakeQrProps) {
  const modules = useMemo(() => modulePath(seed), [seed])
  const logoAt = LOGO_FROM + QUIET + 0.5
  const logoSize = LOGO_TO - LOGO_FROM
  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Kode QR pembayaran (demo)"
      className="block"
    >
      <rect width={VIEW} height={VIEW} fill="#ffffff" />
      <path d={modules} fill="#14201a" />
      <path d={FINDERS} fill="#14201a" fillRule="evenodd" />
      <rect x={logoAt} y={logoAt} width={logoSize} height={logoSize} rx={1.1} fill="#15803d" shapeRendering="geometricPrecision" />
      <rect
        x={logoAt + 0.9}
        y={logoAt + 0.9}
        width={logoSize - 1.8}
        height={logoSize - 1.8}
        rx={0.6}
        fill="none"
        stroke="#ffffff"
        strokeWidth={0.4}
        shapeRendering="geometricPrecision"
      />
      <circle cx={logoAt + logoSize / 2} cy={logoAt + logoSize / 2 + 0.3} r={0.55} fill="#ffffff" />
    </svg>
  )
}
