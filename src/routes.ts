// Every path in the app. Screens and demo controls navigate only through these.
export const ROUTES = {
  home: '/',
  results: '/hasil', // Hasil AI / Radar. Query: ?q=<text>
  chat: '/chat', // AI Rekomendasi chat. ?q=<text> sends a first message
  place: (id: string) => `/tempat/${id}`,
  queue: '/antrean', // Antrean Saya. ?batal=1 opens the cancel sheet
  joki: (placeId: string) => `/joki/${placeId}`,
  titip: (placeId: string) => `/titip/${placeId}`,
  pay: (orderId: string) => `/bayar/${orderId}`, // fake QRIS
  track: (orderId: string) => `/lacak/${orderId}`, // 7 (titip) or 7a (joki), by order type
  done: (orderId: string) => `/selesai/${orderId}`,
  saved: '/disimpan',
  profile: '/profil',
  buddy: '/buddy', // Mode Buddy: only for verified buddies
  buddyApply: '/buddy/daftar', // Jadi Buddy: NIM + KTM + selfie, then review status
  admin: '/admin', // Review buddy applications (admins only)
} as const
