import { describe, expect, test } from 'vitest'
import { PLACES } from '../data/places'
import { freeSlotId, similarPlaces, suggestionToPlace, validateSuggestion, type PlaceSuggestion, type SuggestionForm } from './placeSuggestions'

const FORM: SuggestionForm = {
  name: 'Warung Bu Sri',
  category: 'Kantin',
  campus: 'Anggrek',
  area: 'Sekitar kampus',
  distanceM: 500,
  locationNote: 'Sebelah Indomaret',
  opens: '08:00',
  closes: '20:00',
  menu: [
    { name: 'Nasi Rames', price: '18.000' },
    { name: '', price: '' },
  ],
}

describe('validateSuggestion', () => {
  test('accepts a complete form and ignores empty menu rows', () => {
    expect(validateSuggestion(FORM)).toBeNull()
  })

  test('rejects a name that is too short', () => {
    expect(validateSuggestion({ ...FORM, name: ' A ' })).toBe('Nama tempat 2–60 karakter.')
  })

  test('rejects closing time before opening time', () => {
    expect(validateSuggestion({ ...FORM, opens: '20:00', closes: '08:00' })).toBe('Jam tutup harus setelah jam buka.')
  })

  test('needs at least one menu item', () => {
    expect(validateSuggestion({ ...FORM, menu: [{ name: '', price: '' }] })).toBe('Isi minimal 1 menu dan harganya.')
  })

  test('rejects prices outside Rp1.000–Rp500.000', () => {
    expect(validateSuggestion({ ...FORM, menu: [{ name: 'Es Teh', price: '500' }] })).toBe(
      'Harga menu antara Rp1.000 dan Rp500.000.',
    )
  })
})

describe('similarPlaces', () => {
  test('finds an existing tenant regardless of case and punctuation', () => {
    expect(similarPlaces('a&w', PLACES).map((p) => p.id)).toEqual(['aw'])
    expect(similarPlaces('yoshinoya', PLACES).map((p) => p.id)).toEqual(['yoshinoya-foodpark', 'yoshinoya-lantai-1'])
  })

  test('stays quiet for very short input', () => {
    expect(similarPlaces('ba', PLACES)).toEqual([])
  })
})

describe('freeSlotId', () => {
  const mine = (ids: string[]) => ids.map((id) => ({ id }) as PlaceSuggestion)

  test('returns the first unused slot', () => {
    expect(freeSlotId('u1', mine(['u1_1', 'u1_3']))).toBe('u1_2')
  })

  test('returns null when every slot is used', () => {
    expect(freeSlotId('u1', mine(['u1_1', 'u1_2', 'u1_3', 'u1_4', 'u1_5']))).toBeNull()
  })
})

test('suggestionToPlace builds a student place with prefixed ids and a price range', () => {
  const place = suggestionToPlace({
    id: 'u1_1',
    uid: 'u1',
    name: 'Warung Bu Sri',
    category: 'Kantin',
    campus: 'Anggrek',
    area: 'Sekitar kampus',
    distanceM: 500,
    locationNote: 'Sebelah Indomaret',
    openHours: '08.00–20.00',
    menu: [
      { name: 'Nasi Rames', price: 18000 },
      { name: 'Es Teh', price: 5000 },
    ],
    status: 'approved',
    note: null,
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
  })
  expect(place.id).toBe('c-u1_1')
  expect(place.source).toBe('mahasiswa')
  expect([place.priceMin, place.priceMax]).toEqual([5000, 18000])
  expect(place.menu.map((m) => m.id)).toEqual(['c-u1_1-m1', 'c-u1_1-m2'])
  expect(place.locationNote).toBe('Sebelah Indomaret')
})
