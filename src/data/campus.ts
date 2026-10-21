import { CAMPUSES, type Campus } from '../state/types'

/** Campus chips, in display order ("Antar ke": Anggrek · Syahdan · Kijang · Binus Square). */
export const CAMPUS_CHIPS: readonly Campus[] = CAMPUSES

/** Example delivery / meeting spots inside each campus. The first one is the default. */
export const CAMPUS_SPOTS: Readonly<Record<Campus, readonly string[]>> = {
  Anggrek: ['Lobby lt. 1 / ruang kelas 712', 'Lobby lt. 1', 'Ruang kelas 712', 'Perpustakaan', 'Food court lt. 2'],
  Syahdan: ['Lobby utama', 'Ruang kelas 305', 'Perpustakaan', 'Taman tengah'],
  Kijang: ['Lobby lt. 1', 'Ruang kelas 501', 'Perpustakaan', 'Area tunggu lt. 2'],
  'Binus Square': ['Lobby', 'Food court', 'Ruang belajar bersama', 'Lobby asrama'],
}

export function defaultSpot(campus: Campus): string {
  return CAMPUS_SPOTS[campus][0]
}

/** Joki Antre default "Titik temu / catatan" (5 · Joki Antre). */
export const DEFAULT_MEETING_POINT = 'Anggrek, lobby lt. 1'

export function isCampus(value: string): value is Campus {
  return (CAMPUSES as readonly string[]).includes(value)
}
