const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');
const detailButtons = document.querySelectorAll('.detail-toggle');

let revealObserver;

function setupScrollReveal(scope = document) {
  const items = scope.querySelectorAll('.section h3, .section-intro, .highlight-card, .structure-card, .schedule-card, .gallery-card, .site-footer .container');

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px' });
  }

  items.forEach((item, index) => {
    if (item.classList.contains('js-reveal')) return;
    item.classList.add('js-reveal');
    item.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
    revealObserver.observe(item);
  });
}

function setupScrollEffects() {
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', 'Kembali ke atas');
  backToTop.innerHTML = '<span aria-hidden="true">↑</span>';
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(backToTop);

  let ticking = false;
  const updateScrollEffects = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progressValue = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progress.style.transform = `scaleX(${Math.min(Math.max(progressValue, 0), 1)})`;
    document.body.classList.toggle('has-scrolled', window.scrollY > 18);
    backToTop.classList.toggle('is-visible', window.scrollY > 420);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollEffects);
  }, { passive: true });

  updateScrollEffects();
}

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

  setupScrollReveal(grid);
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

function animateStats() {
  const numbers = document.querySelectorAll('.stat-number');
  numbers.forEach((number) => {
    const targetText = number.textContent?.trim() || '0';
    const target = parseInt(targetText.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(target) || target <= 0) return;

    const duration = 1000;
    const start = performance.now();
    const initial = 0;

    const update = (time) => {
      const elapsed = Math.min(time - start, duration);
      const progress = elapsed / duration;
      const current = Math.floor(initial + (target - initial) * progress);
      number.textContent = `${current}` + (targetText.includes('%') ? '%' : '');
      if (elapsed < duration) {
        requestAnimationFrame(update);
      } else {
        number.textContent = targetText;
      }
    };

    requestAnimationFrame(update);
  });
}

menuToggle?.addEventListener('click', () => {
  siteNav?.classList.toggle('open');
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  const linkUrl = new URL(link.href, window.location.href);
  const isHomeSection = window.location.pathname.endsWith('index.html') && linkUrl.hash === '#home';
  const isCurrentPage = linkUrl.pathname === window.location.pathname && (!linkUrl.hash || isHomeSection);
  if (isCurrentPage) link.setAttribute('aria-current', 'page');

  link.addEventListener('click', () => {
    if (window.innerWidth <= 720) {
      siteNav?.classList.remove('open');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-current-year]').forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });
  setupScrollReveal();
  setupScrollEffects();
  animateStats();
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

detailButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.nextElementSibling;
    if (panel instanceof HTMLElement) {
      panel.classList.toggle('open');
      button.textContent = panel.classList.contains('open') ? 'Sembunyikan' : 'Detail';
    }
  });
});
