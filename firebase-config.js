// Konfigurasi Firebase untuk fitur Buku Tamu.
//
// Nilai di bawah berasal dari Firebase Console > Project settings > Your apps.
// Kunci web Firebase memang aman untuk bersifat publik; keamanan data diatur
// oleh Firestore Security Rules (lihat FIRESTORE-RULES.txt).

export const firebaseConfig = {
  apiKey: 'AIzaSyAV9EaB2QMwcYOYzNBQxWw4M2Xw-0XRZ18',
  authDomain: 'sevenk-komentar.firebaseapp.com',
  projectId: 'sevenk-komentar',
  storageBucket: 'sevenk-komentar.firebasestorage.app',
  messagingSenderId: '305583114240',
  appId: '1:305583114240:web:c20b1b540a44da9046f0e5',
  measurementId: 'G-0CDX32HTPV'
};

// True bila config sudah diisi (dipakai untuk menampilkan pesan panduan).
export const isFirebaseConfigured = !Object.values(firebaseConfig)
  .some((value) => typeof value !== 'string' || value.startsWith('GANTI_'));