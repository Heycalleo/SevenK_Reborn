// Buku Tamu: komentar tanpa login, disimpan di Firebase Firestore.
// Anti-spam: honeypot + tantangan teks (ketik kata yang ditampilkan) +
// cooldown antar kirim + sensor kata kasar.

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const form = document.getElementById('commentForm');
const list = document.getElementById('commentList');
const status = document.getElementById('commentStatus');
const submitBtn = document.getElementById('commentSubmit');
const challengeLabel = document.getElementById('captchaQuestion');
const challengeInput = document.getElementById('commentCaptcha');
const honeypot = document.getElementById('commentWebsite');

const RATE_LIMIT_MS = 60000; // cooldown antar kirim yang sama
const RATE_KEY = 'sevenk-last-comment';

// Kata yang disensor. Dicocokkan sebagai kata utuh agar tidak salah menyensor
// bagian dari kata lain.
const BLOCKED_WORDS = [
  'anjing', 'anjir', 'bangsat', 'bajingan', 'kontol', 'memek', 'pepek',
  'ngentot', 'ngehe', 'kampret', 'keparat', 'brengsek', 'babi', 'tolol',
  'goblok', 'goblog', 'idiot', 'bodoh', 'sialan', 'setan', 'kimak',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'bastard'
];

// Kata untuk tantangan ketik. Bot yang tidak merender teks tidak bisa menjawab.
const CHALLENGE_WORDS = [
  'kelas', 'tujuh', 'spentil', 'kenangan', 'galeri', 'piket', 'jadwal',
  'sekolah', 'teman', 'belajar', 'senang', 'hari', 'minggu', 'keluarga'
];

let challengeAnswer = null;

function setStatus(target, message, tone = '') {
  if (!target) return;
  target.textContent = message;
  target.dataset.tone = tone;
}

function textNode(value) {
  return document.createTextNode(String(value ?? ''));
}

function makeChallenge() {
  const word = CHALLENGE_WORDS[Math.floor(Math.random() * CHALLENGE_WORDS.length)];
  challengeAnswer = word.toLowerCase();
  if (challengeLabel) challengeLabel.textContent = `Ketik kata "${word}" di bawah ini`;
  if (challengeInput) challengeInput.value = '';
}

// Mengganti kata terlarang dengan bintang.
function censorText(value) {
  let result = String(value ?? '');
  BLOCKED_WORDS.forEach((word) => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), (m) => '*'.repeat(m.length));
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
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (error) {
    return '';
  }
}

function renderComments(items) {
  if (!list) return;
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

  makeChallenge();

  if (!isFirebaseConfigured) {
    form.querySelectorAll('input, textarea, button').forEach((el) => { el.disabled = true; });
    list.setAttribute('aria-busy', 'false');
    list.innerHTML = '<p class="muted">Buku Tamu belum dikonfigurasi.</p>';
    return;
  }

  let commentsRef;
  let addComment;
  let makeTimestamp;

  try {
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const app = appModule.initializeApp(firebaseConfig);
    const db = fs.getFirestore(app);
    commentsRef = fs.collection(db, 'comments');
    addComment = (data) => fs.addDoc(commentsRef, data);
    makeTimestamp = () => fs.serverTimestamp();

    const recentQuery = fs.query(
      commentsRef,
      fs.orderBy('createdAt', 'desc'),
      fs.limit(100)
    );

    fs.onSnapshot(recentQuery, (snapshot) => {
      renderComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error('Firestore read error:', error);
      list.setAttribute('aria-busy', 'false');
      list.innerHTML = '<p class="muted">Komentar tidak dapat dimuat saat ini.</p>';
    });
  } catch (error) {
    console.error('Firebase init error:', error);
    list.setAttribute('aria-busy', 'false');
    list.innerHTML = '<p class="muted">Komentar tidak dapat dimuat saat ini.</p>';
    return;
  }

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

    // Tantangan ketik kata (bukan angka) — lebih tahan terhadap bot otomatis.
    const answer = (challengeInput?.value.trim() || '').toLowerCase();
    if (!challengeAnswer || answer !== challengeAnswer) {
      setStatus(status, 'Tantangan tidak sesuai. Coba lagi.', 'error');
      makeChallenge();
      return;
    }

    // Cooldown antar kirim untuk menahan spam beruntun.
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
      await addComment({
        name: name.slice(0, 40),
        message: message.slice(0, 500),
        createdAt: makeTimestamp()
      });
      localStorage.setItem(RATE_KEY, String(Date.now()));
      form.reset();
      makeChallenge();
      setStatus(status, 'Terima kasih, pesanmu sudah terkirim.', 'success');
    } catch (error) {
      console.error('Firestore write error:', error);
      setStatus(status, 'Pesan gagal dikirim. Coba lagi sebentar lagi.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

init();