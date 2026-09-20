// Buku Tamu: komentar tanpa login, disimpan di Firebase Firestore.
// Fitur: captcha sederhana, honeypot anti-bot, jeda antar kirim, sensor kata,
// dan mode admin (login untuk menghapus pesan).

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const form = document.getElementById('commentForm');
const list = document.getElementById('commentList');
const status = document.getElementById('commentStatus');
const submitBtn = document.getElementById('commentSubmit');
const captchaQuestion = document.getElementById('captchaQuestion');
const captchaInput = document.getElementById('commentCaptcha');
const honeypot = document.getElementById('commentWebsite');

const adminToggle = document.getElementById('adminToggle');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginStatus = document.getElementById('adminLoginStatus');
const adminBar = document.getElementById('commentAdmin');
const adminLogout = document.getElementById('adminLogout');

const RATE_LIMIT_MS = 30000; // jeda minimal antar komentar
const RATE_KEY = 'sevenk-last-comment';

// Daftar kata yang disensor. Dicocokkan sebagai kata utuh agar tidak salah
// menyensor bagian dari kata lain.
const BLOCKED_WORDS = [
  'anjing', 'anjir', 'bangsat', 'bajingan', 'kontol', 'memek', 'pepek',
  'ngentot', 'ngehe', 'kampret', 'keparat', 'brengsek', 'babi', 'tolol',
  'goblok', 'goblog', 'idiot', 'bodoh', 'sialan', 'setan', 'kimak',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'bastard'
];

// Simpan jawaban captcha yang benar di memori saja.
let captchaAnswer = null;
let currentUser = null;
let latestItems = [];
let deleteComment = null;

function setStatus(target, message, tone = '') {
  if (!target) return;
  target.textContent = message;
  target.dataset.tone = tone;
}

function textNode(value) {
  return document.createTextNode(String(value ?? ''));
}

function makeCaptcha() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  captchaAnswer = a + b;
  if (captchaQuestion) captchaQuestion.textContent = `${a} + ${b} = ?`;
  if (captchaInput) captchaInput.value = '';
}

// Mengganti kata terlarang dengan bintang, mempertahankan panjang kata.
function censorText(value) {
  let result = String(value ?? '');
  BLOCKED_WORDS.forEach((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(pattern, (match) => '*'.repeat(match.length));
  });
  return result;
}

function containsBlockedWord(value) {
  const lower = String(value ?? '').toLowerCase();
  return BLOCKED_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(lower));
}

function formatDate(timestamp) {
  try {
    const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '';
  }
}

function renderComments(items) {
  if (!list) return;
  latestItems = items;
  list.setAttribute('aria-busy', 'false');
  list.textContent = '';

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Belum ada komentar. Jadilah yang pertama menulis pesan untuk 7K.';
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'comment-item';

    const head = document.createElement('header');
    head.className = 'comment-head';

    const author = document.createElement('span');
    author.className = 'comment-author';
    author.appendChild(textNode(censorText(item.name || 'Anonim')));

    const time = document.createElement('time');
    time.className = 'comment-time';
    time.appendChild(textNode(formatDate(item.createdAt)));

    head.appendChild(author);
    head.appendChild(time);

    // Tombol hapus hanya muncul untuk admin yang sudah login.
    if (currentUser && deleteComment && item.id) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'comment-delete';
      remove.textContent = 'Hapus';
      remove.addEventListener('click', async () => {
        if (!window.confirm('Hapus komentar ini?')) return;
        remove.disabled = true;
        try {
          await deleteComment(item.id);
        } catch (error) {
          console.error('Delete error:', error);
          remove.disabled = false;
        }
      });
      head.appendChild(remove);
    }

    const body = document.createElement('p');
    body.className = 'comment-body';
    String(censorText(item.message) || '').split('\n').forEach((line, index) => {
      if (index > 0) body.appendChild(document.createElement('br'));
      body.appendChild(textNode(line));
    });

    article.appendChild(head);
    article.appendChild(body);
    list.appendChild(article);
  });
}

async function init() {
  if (!form || !list) return;

  makeCaptcha();

  if (!isFirebaseConfigured) {
    form.querySelectorAll('input, textarea, button').forEach((el) => {
      el.disabled = true;
    });
    list.setAttribute('aria-busy', 'false');
    list.innerHTML = '<p class="muted">Buku Tamu belum dikonfigurasi. Pemilik website perlu mengisi <code>firebase-config.js</code> terlebih dahulu.</p>';
    return;
  }

  let db;
  let collection;
  let addDoc;
  let deleteDoc;
  let query;
  let orderBy;
  let limit;
  let onSnapshot;
  let serverTimestamp;
  let authApi;

  try {
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const authModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');

    const app = appModule.initializeApp(firebaseConfig);
    db = firestoreModule.getFirestore(app);
    collection = firestoreModule.collection;
    addDoc = firestoreModule.addDoc;
    deleteDoc = firestoreModule.deleteDoc;
    query = firestoreModule.query;
    orderBy = firestoreModule.orderBy;
    limit = firestoreModule.limit;
    onSnapshot = firestoreModule.onSnapshot;
    serverTimestamp = firestoreModule.serverTimestamp;

    const auth = authModule.getAuth(app);
    authApi = {
      signIn: (email, password) => authModule.signInWithEmailAndPassword(auth, email, password),
      signOut: () => authModule.signOut(auth),
      onChange: (cb) => authModule.onAuthStateChanged(auth, cb)
    };
  } catch (error) {
    console.error('Firebase init error:', error);
    list.setAttribute('aria-busy', 'false');
    list.innerHTML = '<p class="muted">Komentar tidak dapat dimuat saat ini.</p>';
    return;
  }

  // Helper hapus dokumen: deleteComment(id)
  deleteComment = (id) => firestoreModule.deleteDoc(firestoreModule.doc(db, 'comments', id));

  const commentsRef = collection(db, 'comments');
  const recentQuery = query(commentsRef, orderBy('createdAt', 'desc'), limit(100));

  onSnapshot(recentQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderComments(items);
  }, (error) => {
    console.error('Firestore read error:', error);
    list.setAttribute('aria-busy', 'false');
    list.innerHTML = '<p class="muted">Komentar tidak dapat dimuat saat ini.</p>';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const message = form.message.value.trim();

    if (!name || !message) {
      setStatus(status, 'Nama dan pesan perlu diisi.', 'error');
      return;
    }

    // Honeypot: kolom ini hanya terisi oleh bot.
    if (honeypot && honeypot.value.trim() !== '') {
      setStatus(status, 'Pesan tidak dapat dikirim.', 'error');
      return;
    }

    // Captcha sederhana.
    const answer = Number(captchaInput?.value.trim());
    if (!captchaAnswer || answer !== captchaAnswer) {
      setStatus(status, 'Jawaban verifikasi salah. Coba lagi.', 'error');
      makeCaptcha();
      return;
    }

    // Jeda antar kirim untuk menahan spam beruntun.
    const last = Number(localStorage.getItem(RATE_KEY) || 0);
    const elapsed = Date.now() - last;
    if (elapsed < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      setStatus(status, `Mohon tunggu ${wait} detik sebelum mengirim lagi.`, 'error');
      return;
    }

    // Tolak kalau mengandung kata terlarang.
    if (containsBlockedWord(name) || containsBlockedWord(message)) {
      setStatus(status, 'Pesan mengandung kata yang tidak pantas. Mohon diperbaiki.', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus(status, 'Mengirim...', '');

    try {
      await addDoc(commentsRef, {
        name: name.slice(0, 40),
        message: message.slice(0, 500),
        createdAt: serverTimestamp()
      });
      localStorage.setItem(RATE_KEY, String(Date.now()));
      form.reset();
      makeCaptcha();
      setStatus(status, 'Terima kasih, pesanmu sudah terkirim.', 'success');
    } catch (error) {
      console.error('Firestore write error:', error);
      setStatus(status, 'Pesan gagal dikirim. Coba lagi sebentar lagi.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---------- Admin ----------
  adminToggle?.addEventListener('click', () => {
    if (!adminLoginForm) return;
    adminLoginForm.hidden = !adminLoginForm.hidden;
  });

  adminLoginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    adminLoginBtn.disabled = true;
    setStatus(adminLoginStatus, 'Memproses...', '');
    try {
      await authApi.signIn(adminEmail.value.trim(), adminPassword.value);
      setStatus(adminLoginStatus, 'Berhasil masuk.', 'success');
      adminLoginForm.hidden = true;
      adminLoginForm.reset();
    } catch (error) {
      console.error('Login error:', error);
      setStatus(adminLoginStatus, 'Email atau kata sandi salah.', 'error');
    } finally {
      adminLoginBtn.disabled = false;
    }
  });

  adminLogout?.addEventListener('click', async () => {
    try {
      await authApi.signOut();
      setStatus(adminLoginStatus, 'Sudah keluar dari mode admin.', '');
    } catch (error) {
      console.error('Logout error:', error);
    }
  });

  authApi.onChange((user) => {
    currentUser = user;
    if (adminBar) adminBar.hidden = !user;
    if (adminToggle) adminToggle.hidden = Boolean(user);
    // Gambar ulang agar tombol hapus muncul/hilang sesuai status login.
    renderComments(latestItems);
  });
}

init();