// Indonesian display formatting. All functions are pure.

function groupThousands(n: number): string {
  return String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function decimalId(n: number, digits = 1): string {
  const fixed = n.toFixed(digits)
  const trimmed = fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
  return trimmed.replace('.', ',')
}

/** 22000 → "Rp22.000" (dot thousands, no space, no decimals). */
export function formatRupiah(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}Rp${groupThousands(n)}`
}

/** (20000, 50000) → "Rp20–50rb"; equal values → "Rp20rb". */
export function formatPriceRange(min: number, max: number): string {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  if (hi < 1000) return lo === hi ? formatRupiah(lo) : `${formatRupiah(lo)}–${groupThousands(hi)}`
  const loK = decimalId(lo / 1000)
  const hiK = decimalId(hi / 1000)
  return lo === hi ? `Rp${hiK}rb` : `Rp${loK}–${hiK}rb`
}

/** 300 → "300 m", 1200 → "1,2 km", 2000 → "2 km". */
export function formatDistance(m: number): string {
  if (m < 2000) return `${Math.max(0, Math.round(m))} m`
  return `${decimalId(m / 1000)} km`
}
