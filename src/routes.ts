// Every path in the app. Screens and demo controls navigate only through these.
export const ROUTES = {
  home: '/',
  results: '/hasil', // Hasil AI / Radar. Query: ?q=<text>
  place: (id: string) => `/tempat/${id}`,
  queue: '/antrean', // Antrean Saya. ?batal=1 opens the cancel sheet
  joki: (placeId: string) => `/joki/${placeId}`,
  titip: (placeId: string) => `/titip/${placeId}`,
  pay: (orderId: string) => `/bayar/${orderId}`, // fake QRIS
  track: (orderId: string) => `/lacak/${orderId}`, // 7 (titip) or 7a (joki), by order type
  done: (orderId: string) => `/selesai/${orderId}`,
  saved: '/disimpan',
  profile: '/profil',
  buddy: '/buddy',
} as const
