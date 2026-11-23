// Buddy verification: an application (NIM, KTM photo, selfie holding the KTM) stored in Firestore
// and reviewed by an InLine admin. firestore.rules enforces who can write what: the applicant can
// only submit "pending", only admins can approve or reject, and the photos are wiped on review.
// Photos are compressed JPEG data URLs inside the document (Firestore free tier, no Storage bucket).
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { CAMPUSES, type Campus } from '../state/types'
import { getDb, getFirebaseAuth } from './firebase'

export type BuddyStatus = 'pending' | 'verified' | 'rejected'

export interface BuddyApplication {
  uid: string
  name: string
  email: string
  nim: string
  campus: Campus
  whatsapp: string
  /** Claimed by the client; only trusted together with microsoftLinked (checked by the rules). */
  binusEmail: string | null
  microsoftLinked: boolean
  ktmImage: string | null
  selfieImage: string | null
  consent: true
  status: BuddyStatus
  note: string | null
  submittedAt: Timestamp | null
  reviewedAt: Timestamp | null
  reviewedBy: string | null
}

export interface ApplicationForm {
  name: string
  nim: string
  campus: Campus
  whatsapp: string
  ktmImage: string
  selfieImage: string
}

export interface Applicant {
  uid: string
  email: string
  binusEmail: string | null
  microsoftLinked: boolean
}

const APPLICATIONS = 'buddyApplications'
const ADMINS = 'admins'

/** BINUS student numbers are 10 digits (e.g. 2702123456). Only the format can be checked. */
export const NIM_RE = /^\d{10}$/
const WA_RE = /^628\d{7,11}$/
/** Each photo stays well under Firestore's 1 MiB document limit. */
export const MAX_IMAGE_CHARS = 380_000
const IMAGE_MAX_SIDE = 1000
const IMAGE_QUALITIES = [0.75, 0.6, 0.45] as const

/** "0812-3456-7890", "+62 812…" or "62812…" → "6281234567890"; null when it is not an Indonesian mobile number. */
export function normalizeWhatsapp(input: string): string | null {
  const digits = input.replace(/[^\d]/g, '')
  const local = digits.startsWith('62') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
  const full = `62${local}`
  return WA_RE.test(full) ? full : null
}

export function validateForm(form: ApplicationForm): string | null {
  const name = form.name.trim()
  if (name.length < 2 || name.length > 60) return 'Nama lengkap 2–60 karakter, sesuai KTM.'
  if (!NIM_RE.test(form.nim.trim())) return 'NIM harus 10 digit angka.'
  if (!CAMPUSES.includes(form.campus)) return 'Pilih kampus.'
  if (!normalizeWhatsapp(form.whatsapp)) return 'Nomor WhatsApp tidak valid (contoh 0812xxxxxxx).'
  if (!form.ktmImage) return 'Foto KTM wajib diisi.'
  if (!form.selfieImage) return 'Selfie sambil memegang KTM wajib diisi.'
  return null
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak bisa dibaca.'))
    }
    img.src = url
  })
}

/** Resizes a photo to at most 1000 px and re-encodes it as JPEG (also strips EXIF/location data). */
export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa foto.')
  const img = await loadImage(file)
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser tidak mendukung pengolahan foto.')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  for (const quality of IMAGE_QUALITIES) {
    const data = canvas.toDataURL('image/jpeg', quality)
    if (data.length <= MAX_IMAGE_CHARS) return data
  }
  throw new Error('Foto terlalu besar. Coba foto ulang dengan cahaya lebih terang.')
}

export async function submitApplication(applicant: Applicant, form: ApplicationForm): Promise<void> {
  const problem = validateForm(form)
  if (problem) throw new Error(problem)
  const data: Omit<BuddyApplication, 'submittedAt'> & { submittedAt: ReturnType<typeof serverTimestamp> } = {
    uid: applicant.uid,
    name: form.name.trim(),
    email: applicant.email,
    nim: form.nim.trim(),
    campus: form.campus,
    whatsapp: normalizeWhatsapp(form.whatsapp) ?? '',
    binusEmail: applicant.microsoftLinked ? applicant.binusEmail : null,
    microsoftLinked: applicant.microsoftLinked,
    ktmImage: form.ktmImage,
    selfieImage: form.selfieImage,
    consent: true,
    status: 'pending',
    note: null,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
  }
  // Fresh token: the rules check email_verified and the linked Microsoft identity from it.
  await getFirebaseAuth().currentUser?.getIdToken(true)
  await setDoc(doc(getDb(), APPLICATIONS, applicant.uid), data)
}

/** Withdraws a pending or rejected application (the photos are deleted with it). */
export async function withdrawApplication(uid: string): Promise<void> {
  await deleteDoc(doc(getDb(), APPLICATIONS, uid))
}

export function watchMyApplication(
  uid: string,
  onChange: (application: BuddyApplication | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), APPLICATIONS, uid),
    (snap) => onChange(snap.exists() ? (snap.data() as BuddyApplication) : null),
    onError,
  )
}

/** True when an admins/{uid} document exists (created by hand in the Firebase console). */
export function watchIsAdmin(uid: string, onChange: (isAdmin: boolean) => void): Unsubscribe {
  return onSnapshot(
    doc(getDb(), ADMINS, uid),
    (snap) => onChange(snap.exists()),
    () => onChange(false),
  )
}

export function watchPendingApplications(
  onChange: (applications: BuddyApplication[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(getDb(), APPLICATIONS), where('status', '==', 'pending')),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as BuddyApplication)
      list.sort((a, b) => (a.submittedAt?.toMillis() ?? 0) - (b.submittedAt?.toMillis() ?? 0))
      onChange(list)
    },
    onError,
  )
}

/** Admin decision. The photos are wiped in the same write (UU PDP: keep only what is needed). */
export async function reviewApplication(
  uid: string,
  decision: 'verified' | 'rejected',
  note: string,
  adminUid: string,
): Promise<void> {
  const trimmed = note.trim().slice(0, 200)
  await updateDoc(doc(getDb(), APPLICATIONS, uid), {
    status: decision,
    note: trimmed || null,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    ktmImage: null,
    selfieImage: null,
  })
}

/** Firestore error → Indonesian message. */
export function firestoreErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : ''
  if (code === 'permission-denied') return 'Akses ditolak. Pastikan emailmu sudah terverifikasi, lalu coba lagi.'
  if (code === 'unavailable') return 'Tidak ada koneksi. Coba lagi.'
  if (code === 'resource-exhausted') return 'Server sedang sibuk. Coba lagi sebentar lagi.'
  if (error instanceof Error && !code) return error.message
  return 'Gagal menyimpan. Coba lagi.'
}
