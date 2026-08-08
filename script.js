const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');
const detailButtons = document.querySelectorAll('.detail-toggle');

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const urls = ['data/gallery.json', 'gallery.json'];
  let items = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        console.warn(`Gallery load failed from ${url}:`, res.status);
        continue;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn(`Gallery JSON invalid from ${url}`);
        continue;
      }
      items = data;
      break;
    } catch (error) {
      console.warn(`Gallery fetch error from ${url}:`, error);
    }
  }

  if (!items) {
    grid.innerHTML = '<div class="gallery-card"><p class="muted">Galeri tidak dapat dimuat.</p></div>';
    return;
  }

  grid.innerHTML = '';
  items.forEach((src) => {
    const resolvedSrc = src.startsWith('http') || src.startsWith('/') || src.startsWith('./') ? src : `images/${src}`;
    const card = document.createElement('div');
    card.className = 'gallery-card';

    const img = document.createElement('img');
    img.src = resolvedSrc;
    img.alt = `Foto galeri kelas: ${src.split('/').pop()}`;
    img.loading = 'lazy';
    img.className = 'gallery-thumb';
    img.addEventListener('click', () => openLightbox(resolvedSrc));

    const actions = document.createElement('div');
    actions.className = 'gallery-actions';

    const download = document.createElement('a');
    download.href = resolvedSrc;
    download.download = src.split('/').pop();
    download.className = 'download-btn';
    download.textContent = 'Download';
    actions.appendChild(download);

    card.appendChild(img);
    card.appendChild(actions);
    grid.appendChild(card);
  });
}

function openLightbox(src) {
  if (!src) return;

  let overlay = document.getElementById('lightboxOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lightboxOverlay';
    overlay.className = 'lightbox';
    overlay.innerHTML = `
      <div class="lightbox-inner">
        <div class="lightbox-header">
          <button id="lightboxClose" class="lightbox-close" aria-label="Tutup">✕</button>
          <a id="lightboxDownload" class="download-btn lightbox-download" href="" download="" aria-label="Download gambar">Download</a>
        </div>
        <img id="lightboxImg" src="" alt="Gambar galeri diperbesar" />
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.id === 'lightboxClose') {
        overlay.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('open')) {
        overlay.classList.remove('open');
      }
    });
  }

  const img = overlay.querySelector('#lightboxImg');
  const download = overlay.querySelector('#lightboxDownload');
  if (img) {
    img.src = src;
  }
  if (download) {
    download.href = src;
    download.download = src.split('/').pop();
  }

  overlay.classList.add('open');
}

menuToggle?.addEventListener('click', () => {
  siteNav?.classList.toggle('open');
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 720) {
      siteNav?.classList.remove('open');
    }
  });
});

detailButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.nextElementSibling;
    if (panel instanceof HTMLElement) {
      panel.classList.toggle('open');
      button.textContent = panel.classList.contains('open') ? 'Sembunyikan' : 'Detail';
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  loadGallery();

  const galleryToggle = document.getElementById('galleryToggle');
  const galleryGrid = document.getElementById('galleryGrid');

  galleryToggle?.addEventListener('click', () => {
    if (!galleryGrid) return;

    const collapsed = galleryGrid.classList.toggle('collapsed');
    galleryToggle.textContent = collapsed ? 'Tampilkan' : 'Sembunyikan';
    galleryToggle.setAttribute('aria-expanded', String(!collapsed));
  });
});
