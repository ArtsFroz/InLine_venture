import type { Campus } from '../state/types'

export interface DemoUser {
  name: string // short display name, as on 10 · Profil
  fullName: string
  initials: string
  nimMasked: string
  major: string
  homeCampus: Campus
  nimVerified: true
}

// Fictional demo student (10 · Profil shows "Nadia S." + "NIM terverifikasi").
export const DEMO_USER: DemoUser = {
  name: 'Nadia S.',
  fullName: 'Nadia Salsabila',
  initials: 'NS',
  nimMasked: '2702••••12',
  major: 'Sistem Informasi',
  homeCampus: 'Anggrek',
  nimVerified: true,
}
