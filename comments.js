// Buku Tamu: komentar tanpa login, disimpan di Firebase Firestore.
// Pengunjung cukup menulis nama + pesan.

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const form = document.getElementById('commentForm');
const list = document.getElementById('commentList');
const status = document.getElementById('commentStatus');
const submitBtn = document.getElementById('commentSubmit');

function setStatus(message, tone = '') {
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

// Membuat simpul teks dengan aman (tanpa innerHTML), sehingga pesan pengunjung
// tidak mungkin disisipkan sebagai HTML.
function textNode(value) {
  return document.createTextNode(String(value ?? ''));
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
    author.appendChild(textNode(item.name || 'Anonim'));

    const time = document.createElement('time');
    time.className = 'comment-time';
    time.appendChild(textNode(formatDate(item.createdAt)));

    head.appendChild(author);
    head.appendChild(time);

    const body = document.createElement('p');
    body.className = 'comment-body';
    // Baris baru dipertahankan tanpa menyisipkan HTML mentah.
    String(item.message || '').split('\n').forEach((line, index) => {
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
  let query;
  let orderBy;
  let limit;
  let onSnapshot;
  let serverTimestamp;

  try {
    // Modul Firebase dimuat dari CDN, jadi tidak perlu proses build.
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const app = appModule.initializeApp(firebaseConfig);
    db = firestoreModule.getFirestore(app);
    collection = firestoreModule.collection;
    addDoc = firestoreModule.addDoc;
    query = firestoreModule.query;
    orderBy = firestoreModule.orderBy;
    limit = firestoreModule.limit;
    onSnapshot = firestoreModule.onSnapshot;
    serverTimestamp = firestoreModule.serverTimestamp;
  } catch (error) {
    console.error('Firebase init error:', error);
    list.setAttribute('aria-busy', 'false');
    list.innerHTML = '<p class="muted">Komentar tidak dapat dimuat saat ini.</p>';
    return;
  }

  const commentsRef = collection(db, 'comments');
  const recentQuery = query(commentsRef, orderBy('createdAt', 'desc'), limit(100));

  onSnapshot(recentQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => doc.data());
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
      setStatus('Nama dan pesan perlu diisi.', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus('Mengirim...', '');

    try {
      await addDoc(commentsRef, {
        name: name.slice(0, 40),
        message: message.slice(0, 500),
        createdAt: serverTimestamp()
      });
      form.reset();
      setStatus('Terima kasih, pesanmu sudah terkirim.', 'success');
    } catch (error) {
      console.error('Firestore write error:', error);
      setStatus('Pesan gagal dikirim. Coba lagi sebentar lagi.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

init();