import { describe, expect, test } from 'vitest'
import { getPlace } from '../data/places'
import type { Place } from '../state/types'
import { crowdShare } from './crowdModel'

const TUESDAY = 2
const SATURDAY = 6
const at = (h: number, m: number) => h * 60 + m

function place(id: string): Place {
  const found = getPlace(id)
  if (!found) throw new Error(`missing place ${id}`)
  return found
}

/** Minute of the busiest 10-minute slot between 07.00 and 21.00. */
function peakMinute(p: Place, day: 0 | 1 | 2 | 3 | 4 | 5 | 6): number {
  let best = at(7, 0)
  for (let t = at(7, 0); t < at(21, 0); t += 10) if (crowdShare(p, day, t) > crowdShare(p, day, best)) best = t
  return best
}

describe('crowd model per area', () => {
  test('FOODPARK Basement peaks in the 12.50–13.20 lunch break and is full on a Tuesday', () => {
    const basement = place('bakmi-effata')
    const peak = peakMinute(basement, TUESDAY)
    expect(peak).toBeGreaterThanOrEqual(at(12, 50))
    expect(peak).toBeLessThan(at(13, 20))
    expect(crowdShare(basement, TUESDAY, peak)).toBeGreaterThanOrEqual(1)
  })

  test('Kantin Outdoor gets the Basement overflow: busier than its own share alone', () => {
    const outdoor = place('nasi-ayam-hainan')
    const basement = place('bakmi-effata')
    const t = peakMinute(basement, TUESDAY)
    expect(crowdShare(outdoor, TUESDAY, t)).toBeGreaterThan(crowdShare(basement, TUESDAY, t) * 0.8)
  })

  test('Lantai 1 chains stay below the Basement at the lunch peak', () => {
    const t = at(12, 55)
    expect(crowdShare(place('yoshinoya-lantai-1'), TUESDAY, t)).toBeLessThan(crowdShare(place('yoshinoya-foodpark'), TUESDAY, t))
  })

  test('Lantai 5 jumps at a 20-minute break and is quiet during class', () => {
    const lantai5 = place('kantin-lantai-5')
    expect(crowdShare(lantai5, TUESDAY, at(9, 5))).toBeGreaterThan(crowdShare(lantai5, TUESDAY, at(10, 0)) * 2)
  })

  test('Saturday is quieter than Tuesday', () => {
    const basement = place('bakmi-effata')
    expect(crowdShare(basement, SATURDAY, at(12, 55))).toBeLessThan(crowdShare(basement, TUESDAY, at(12, 55)))
  })

  test('closed places report 0', () => {
    expect(crowdShare(place('starbucks'), TUESDAY, at(21, 0))).toBe(0)
  })
})
