# Setup login, signup, dan verifikasi buddy

Panduan ini mengaktifkan login sungguhan di InLine (bukan mode demo):

- Pengguna biasa masuk dengan **Google**, **Microsoft kampus**, atau **email + password** (dengan link verifikasi email).
- Siapa pun bisa daftar **jadi buddy** dari Profil: isi NIM, foto KTM, dan selfie sambil memegang KTM. Pendaftaran
  direview manual oleh admin InLine. Mode Buddy baru terbuka setelah disetujui.
- Data pendaftaran disimpan di **Cloud Firestore** (paket gratis Spark sudah cukup, tidak perlu kartu kredit).
  Foto KTM dan selfie dihapus otomatis saat admin menyetujui atau menolak.

Perkiraan waktu: 30–45 menit. Microsoft (langkah 5) bisa dilewati dulu.

---

## 1. Buat project Firebase

1. Buka <https://console.firebase.google.com> → **Add project** → beri nama (mis. `inline-binus`). Google Analytics boleh dimatikan.
2. Di halaman project: ikon **</>** (Web) → beri nama app `InLine web` → **Register app**. Hosting tidak perlu dicentang.
3. Salin nilai `apiKey`, `authDomain`, `projectId`, `appId` dari config yang muncul.

## 2. Aktifkan metode login

**Build → Authentication → Get started → Sign-in method**:

- **Email/Password**: Enable (yang "Email link" tidak perlu).
- **Google**: Enable → pilih email support → Save.
- **Microsoft**: lihat langkah 5.

**Authentication → Settings → Authorized domains** → **Add domain**: `inlineventure.netlify.app`
(`localhost` sudah ada secara default).

**Authentication → Templates → Email address verification** (opsional): ubah bahasa template ke Indonesia.

**Google Cloud console → APIs & Services → Credentials → Web client (auto created by Google Service)** →
**Authorized redirect URIs**, tambahkan alamat handler login di domain aplikasi sendiri, lalu **Save**:
`https://inlineventure.netlify.app/__/auth/handler` dan `http://localhost:4173/__/auth/handler`
(tambah `http://localhost:5173/__/auth/handler` kalau login dites lewat `npm run dev`). Halaman `/__/auth/*`
diteruskan ke Firebase oleh `public/_redirects` (Netlify) dan `vite.config.ts` (lokal), supaya login lewat
redirect tetap jalan di browser yang memblokir storage pihak ketiga (Safari, Chrome).

## 3. Buat Firestore dan pasang rules

1. **Build → Firestore Database → Create database** → lokasi `asia-southeast2 (Jakarta)` → **Start in production mode**.
2. Tab **Rules** → hapus isinya → tempel seluruh isi file [`firestore.rules`](../firestore.rules) → **Publish**.

## 4. Isi environment variable

Untuk website live, nilai `VITE_*` di bawah sudah ada di [`.env.production`](../.env.production) (publik, ikut
ke browser). Untuk lokal, salin ke `.env.local` (lihat `.env.example`). Hanya `GEMINI_API_KEY` yang diisi di
**Netlify → Project configuration → Environment variables**, karena kunci itu rahasia:

| Nama | Isi |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` (mis. `inline-binus.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_MICROSOFT_TENANT` | `binus.ac.id` |
| `VITE_MICROSOFT_LOGIN` | isi `off` kalau langkah 5 belum selesai atau gagal |
| `GEMINI_API_KEY` | key AI (lihat README) |

Netlify men-deploy otomatis setiap push ke `main`. Setelah mengubah env var di Netlify, jalankan **Deploys →
Trigger deploy → Deploy site** (variabel dibaca saat build).

## 5. Login Microsoft kampus (opsional, coba dulu)

1. Buka <https://entra.microsoft.com> dengan akun Microsoft **pribadi** (bukan akun BINUS) →
   **App registrations → New registration**.
   - Name: `InLine`
   - Supported account types: **Accounts in any organizational directory (Multitenant)**
   - Redirect URI: **Web** → `https://inlineventure.netlify.app/__/auth/handler` (aplikasi memakai domainnya
     sendiri sebagai `authDomain`); tambahkan juga `http://localhost:4173/__/auth/handler` untuk tes lokal
2. Salin **Application (client) ID**. Lalu **Certificates & secrets → New client secret** → salin **Value**-nya.
3. Firebase → Authentication → Sign-in method → **Microsoft** → Enable → tempel Application ID dan secret → Save.
4. **Tes dengan akun @binus.ac.id** di <https://inlineventure.netlify.app>:
   - Berhasil masuk: selesai.
   - Muncul **"Need admin approval"** / **"Approval required"**: tenant BINUS memblokir aplikasi pihak ketiga. Set
     `VITE_MICROSOFT_LOGIN=off` lalu deploy ulang. Login Google/email dan verifikasi buddy lewat KTM tetap jalan.
     Untuk jangka panjang, minta IT BINUS memberi admin consent untuk aplikasi `InLine`.

## 6. Jadikan dirimu admin

1. Daftar/masuk ke InLine dengan akunmu.
2. Firebase → Authentication → **Users** → salin **User UID** akunmu.
3. Firestore → **Start collection** → Collection ID `admins` → Document ID = UID tadi → tambah field
   `name` (string) = namamu → Save.
4. Buka ulang Profil di InLine: muncul menu **Review pendaftaran buddy (admin)**.

Ulangi untuk anggota tim lain yang ikut mereview. Koleksi `admins` hanya bisa diubah dari console, bukan dari aplikasi.

## 7. Uji alur lengkap (sebelum pameran)

1. HP A: **Daftar** dengan email + password → buka link verifikasi di email → Profil → **Sudah verifikasi**.
2. HP A: Profil → **Daftar jadi buddy** → isi NIM (10 digit), kampus, WhatsApp, foto KTM, selfie → centang
   persetujuan → **Kirim**. Status berubah jadi **Sedang direview**.
3. HP/laptop admin: Profil → **Review pendaftaran buddy** → cek foto → **Setujui**.
4. HP A: status otomatis berubah jadi **Kamu buddy terverifikasi** → **Buka Mode Buddy**.
5. Coba juga **Tolak** dengan alasan → pendaftar melihat alasannya dan bisa **Ajukan ulang**.

## Yang dijamin sistem, dan yang belum

- Hanya admin yang bisa menyetujui. Pendaftar tidak bisa mengubah statusnya sendiri (dijaga `firestore.rules`).
- Akun email/password wajib verifikasi email sebelum bisa mendaftar buddy.
- "Microsoft terhubung" dicek oleh rules dari token Firebase. Alamat @binus.ac.id yang tampil berasal dari akun
  Microsoft itu, tetapi tetap cocokkan dengan KTM saat review.
- **NIM hanya dicek formatnya** (10 digit). BINUS tidak punya API publik, jadi keasliannya dicek manual lewat KTM dan
  selfie. Jangan menyebut "NIM terverifikasi BINUS".
- Pesanan, pembayaran, dan order masuk di Mode Buddy masih tersimpan di perangkat (belum di server). Pembatasan Mode
  Buddy saat ini ada di aplikasi; saat order dipindah ke server, aturan yang sama (`status == 'verified'`) harus dicek
  di sana.
