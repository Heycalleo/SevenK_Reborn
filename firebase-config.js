// Konfigurasi Firebase untuk fitur Buku Tamu.
//
// CARA MENGISI (sekali saja, ±5 menit, gratis):
// 1. Buka https://console.firebase.google.com/ lalu klik "Add project".
// 2. Beri nama project, misal "sevenk-komentar", lalu lanjut sampai selesai.
// 3. Di halaman project, klik ikon Web (</>) untuk menambah aplikasi web.
// 4. Firebase akan menampilkan objek bernama firebaseConfig.
// 5. Salin nilainya ke objek di bawah ini (ganti tulisan "GANTI_...").
// 6. Masuk menu Build > Firestore Database > Create database > pilih mode produksi.
// 7. Masuk tab Rules, ganti isinya dengan aturan dari file FIRESTORE-RULES.txt.
//
// Selama nilai di bawah masih "GANTI_...", form komentar akan menampilkan
// pesan bahwa Buku Tamu belum dikonfigurasi.

export const firebaseConfig = {
  apiKey: 'GANTI_API_KEY',
  authDomain: 'GANTI_PROJECT_ID.firebaseapp.com',
  projectId: 'GANTI_PROJECT_ID',
  storageBucket: 'GANTI_PROJECT_ID.appspot.com',
  messagingSenderId: 'GANTI_SENDER_ID',
  appId: 'GANTI_APP_ID'
};

// True bila config sudah diisi (dipakai untuk menampilkan pesan panduan).
export const isFirebaseConfigured = !Object.values(firebaseConfig)
  .some((value) => typeof value !== 'string' || value.startsWith('GANTI_'));