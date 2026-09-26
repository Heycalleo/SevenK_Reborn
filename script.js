/* Class Seven K - interaksi halaman.
   Ikon memakai glyph SVG (Phosphor), bukan emoji.
   Efek gulir memakai IntersectionObserver + scroll-driven CSS,
   tanpa window.addEventListener('scroll'). */

const ICONS = {
  moon: '<svg viewBox="0 0 256 256" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,96.15,96.15,0,1,0,127.8,127.8A8,8,0,0,0,233.54,142.23Z"/></svg>',
  sun: '<svg viewBox="0 0 256 256" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,128a8,8,0,0,0,8,8h24a8,8,0,0,0,0-16H200A8,8,0,0,0,192,128ZM58.34,186.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM128,192a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V200A8,8,0,0,0,128,192ZM40,128a8,8,0,0,0-8-8H8a8,8,0,0,0,0,16H32A8,8,0,0,0,40,128Z"/></svg>',
  menu: '<svg viewBox="0 0 256 256" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>',
  arrowUp: '<svg viewBox="0 0 256 256" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z"/></svg>',
  close: '<svg viewBox="0 0 256 256" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>',
  download: '<svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"/></svg>'
};

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
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', 'Kembali ke atas');
  backToTop.innerHTML = ICONS.arrowUp;
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(backToTop);

  if (!('IntersectionObserver' in window)) {
    backToTop.classList.add('is-visible');
    return;
  }

  // Sentinel tipis di dua posisi: satu untuk bayangan header saat mulai
  // menggulir, satu lagi untuk memunculkan tombol kembali ke atas.
  const makeSentinel = (top) => {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = `position:absolute;top:${top}px;left:0;width:1px;height:1px;pointer-events:none;`;
    document.body.appendChild(el);
    return el;
  };

  const headerSentinel = makeSentinel(4);
  const topSentinel = makeSentinel(480);

  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('has-scrolled', !entry.isIntersecting);
  }).observe(headerSentinel);

  new IntersectionObserver(([entry]) => {
    backToTop.classList.toggle('is-visible', !entry.isIntersecting);
  }).observe(topSentinel);
}

let galleryItems = [];
let activeFilter = 'all';
let galleryLoaded = false;
const GALLERY_BATCH_SIZE = 2;
let visibleGalleryCount = GALLERY_BATCH_SIZE;

function getGalleryMoreButton() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return null;

  let button = document.getElementById('galleryMore');
  if (button) return button;

  button = document.createElement('button');
  button.id = 'galleryMore';
  button.type = 'button';
  button.className = 'button secondary gallery-more';
  button.textContent = 'Tampilkan lebih banyak';
  button.addEventListener('click', () => {
    visibleGalleryCount += GALLERY_BATCH_SIZE;
    renderGallery();
  });
  grid.insertAdjacentElement('afterend', button);
  return button;
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const moreButton = getGalleryMoreButton();

  grid.innerHTML = '';

  const filtered = activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter((item) => (item.tags || []).includes(activeFilter));

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="gallery-card"><p class="muted">Tidak ada foto dengan kategori ini.</p></div>';
    if (moreButton) moreButton.hidden = true;
    return;
  }

  const resolveImage = (value) => {
    if (value.startsWith('http') || value.startsWith('/') || value.startsWith('./')) return value;
    return value.startsWith('images/') ? value : `images/${value}`;
  };

  filtered.slice(0, visibleGalleryCount).forEach((item) => {
    const src = item.src;
    const fullSrc = resolveImage(src);
    const thumbSrc = resolveImage(item.thumb || src);
    const card = document.createElement('div');
    card.className = 'gallery-card';

    const img = document.createElement('img');
    // Grid memakai thumbnail kecil agar ringan; lightbox memakai file penuh.
    img.src = thumbSrc;
    img.alt = item.alt || `Foto galeri kelas: ${src.split('/').pop()}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 225;
    img.height = 400;
    img.className = 'gallery-thumb';

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'gallery-open';
    openButton.setAttribute('aria-label', `Perbesar foto: ${img.alt}`);
    openButton.appendChild(img);
    openButton.addEventListener('click', () => openLightbox(fullSrc, img.alt, src.split('/').pop(), openButton));

    const actions = document.createElement('div');
    actions.className = 'gallery-actions';

    const download = document.createElement('a');
    download.href = fullSrc;
    download.download = src.split('/').pop();
    download.className = 'download-btn';
    download.innerHTML = `${ICONS.download}<span>Download</span>`;
    actions.appendChild(download);

    card.appendChild(openButton);
    card.appendChild(actions);
    grid.appendChild(card);
  });

  if (moreButton) {
    const remaining = filtered.length - visibleGalleryCount;
    moreButton.hidden = remaining <= 0;
    moreButton.textContent = remaining > 0
      ? `Tampilkan ${Math.min(remaining, GALLERY_BATCH_SIZE)} foto lagi`
      : 'Tampilkan lebih banyak';
  }

  setupScrollReveal(grid);
}

function setupGalleryFilters() {
  const container = document.getElementById('galleryFilters');
  if (!container) return;

  const tagSet = new Set();
  galleryItems.forEach((item) => (item.tags || []).forEach((tag) => tagSet.add(tag)));
  const tags = Array.from(tagSet);

  const names = { all: 'Semua' };
  tags.forEach((tag) => { names[tag] = tag.charAt(0).toUpperCase() + tag.slice(1); });

  const options = ['all', ...tags];
  container.innerHTML = '';

  options.forEach((value) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-filter-btn';
    btn.dataset.filter = value;
    btn.textContent = names[value];
    btn.setAttribute('aria-pressed', value === activeFilter ? 'true' : 'false');
    btn.addEventListener('click', () => {
      activeFilter = value;
      visibleGalleryCount = GALLERY_BATCH_SIZE;
      container.querySelectorAll('.gallery-filter-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.filter === value);
        b.setAttribute('aria-pressed', b.dataset.filter === value ? 'true' : 'false');
      });
      renderGallery();
    });
    if (value === activeFilter) btn.classList.add('active');
    container.appendChild(btn);
  });
}

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  let items = null;

  try {
    // Data galeri boleh memakai cache browser; tidak perlu diunduh ulang pada
    // setiap kunjungan halaman.
    const res = await fetch('data/gallery.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) items = data;
    }
  } catch (error) {
    console.warn('Gallery fetch error:', error);
  }

  if (!items) {
    grid.innerHTML = '<div class="gallery-card"><p class="muted">Galeri tidak dapat dimuat.</p></div>';
    return;
  }

  // Normalisasi: terima format lama (string) dan format baru (objek src + thumb + tags + alt)
  galleryItems = items.map((entry) => {
    if (typeof entry === 'string') {
      return { src: entry, thumb: entry, tags: [], alt: '' };
    }
    return {
      src: entry.src || '',
      thumb: entry.thumb || entry.src || '',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      alt: entry.alt || ''
    };
  }).filter((item) => item.src);

  setupGalleryFilters();
  renderGallery();
}

function setupGalleryLoading() {
  const gallery = document.getElementById('gallery');
  if (!gallery || galleryLoaded) return;

  const load = () => {
    if (galleryLoaded) return;
    galleryLoaded = true;
    loadGallery();
  };

  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }

  // Galeri dimuat ketika sudah mendekati layar, bukan saat beranda dibuka.
  const galleryObserver = new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    load();
  }, { rootMargin: '200px 0px' });

  galleryObserver.observe(gallery);
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
}

function openLightbox(src, alt = '', filename = '', trigger = null) {
  if (!src) return;

  let overlay = document.getElementById('lightboxOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lightboxOverlay';
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'lightboxTitle');
    overlay.innerHTML = `
      <div class="lightbox-inner" tabindex="-1">
        <h2 class="sr-only" id="lightboxTitle">Pratinjau foto galeri</h2>
        <div class="lightbox-header">
          <button id="lightboxClose" class="lightbox-close" aria-label="Tutup pratinjau foto">${ICONS.close}</button>
          <a id="lightboxDownload" class="download-btn lightbox-download" href="" download="" aria-label="Download gambar">${ICONS.download}<span>Download</span></a>
        </div>
        <img id="lightboxImg" src="" alt="" />
      </div>
    `;
    document.body.appendChild(overlay);

    const closeLightbox = () => {
      if (!overlay.classList.contains('open')) return;
      overlay.classList.remove('open');
      document.body.classList.remove('lightbox-open');
      const opener = overlay.returnFocus;
      overlay.returnFocus = null;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('#lightboxClose')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!overlay.classList.contains('open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(overlay);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  const img = overlay.querySelector('#lightboxImg');
  const download = overlay.querySelector('#lightboxDownload');
  if (img) {
    img.src = src;
    img.alt = alt || 'Foto galeri kelas';
  }
  if (download) {
    download.href = src;
    download.download = filename || src.split('/').pop();
    download.setAttribute('aria-label', `Download ${alt || 'foto galeri kelas'}`);
  }

  overlay.returnFocus = trigger || document.activeElement;
  document.body.classList.add('lightbox-open');
  overlay.classList.add('open');
  overlay.querySelector('.lightbox-inner')?.focus();
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

const mobileMenuQuery = window.matchMedia('(max-width: 900px)');

// Ikon menu dan tutup dipasang sekali di awal, lalu hanya ditukar lewat
// kelas .is-open. Kalau innerHTML diganti setiap klik, elemen yang sedang
// disentuh user menjadi lepas dari DOM, sehingga pengecekan "klik di luar
// header" salah menilai dan menu yang baru terbuka langsung tertutup lagi.
function initMenuIcons() {
  if (!menuToggle || menuToggle.dataset.iconsReady) return;
  menuToggle.innerHTML =
    `<span class="menu-icon menu-icon-open" aria-hidden="true">${ICONS.menu}</span>` +
    `<span class="menu-icon menu-icon-close" aria-hidden="true">${ICONS.close}</span>`;
  menuToggle.dataset.iconsReady = 'true';
}

function setMenuState(open = false) {
  if (!menuToggle || !siteNav) return;
  initMenuIcons();

  const isMobile = mobileMenuQuery.matches;
  const shouldOpen = isMobile && open;
  siteNav.classList.toggle('open', shouldOpen);
  siteNav.setAttribute('aria-hidden', String(isMobile ? !shouldOpen : false));
  if ('inert' in siteNav) siteNav.inert = isMobile && !shouldOpen;

  menuToggle.setAttribute('aria-expanded', String(shouldOpen));
  menuToggle.setAttribute('aria-label', shouldOpen ? 'Tutup menu' : 'Buka menu');
  menuToggle.classList.toggle('is-open', shouldOpen);
}

menuToggle?.addEventListener('click', () => {
  if (!siteNav) return;
  setMenuState(!siteNav.classList.contains('open'));
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !siteNav?.classList.contains('open')) return;
  setMenuState(false);
  menuToggle?.focus();
});

document.addEventListener('click', (event) => {
  if (!mobileMenuQuery.matches || !siteNav?.classList.contains('open')) return;
  const header = menuToggle.closest('.header-inner');
  if (!header) return;
  // composedPath dipakai sebagai cadangan: jalur event sudah dihitung saat
  // klik, jadi tetap benar walau ada elemen yang sudah dilepas dari DOM.
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  const insideHeader = header.contains(event.target) || path.includes(header);
  if (!insideHeader) setMenuState(false);
});

const handleMenuBreakpoint = () => setMenuState(false);
if (typeof mobileMenuQuery.addEventListener === 'function') {
  mobileMenuQuery.addEventListener('change', handleMenuBreakpoint);
} else if (typeof mobileMenuQuery.addListener === 'function') {
  mobileMenuQuery.addListener(handleMenuBreakpoint);
}

setMenuState(false);

// Dark Mode
const themeToggle = document.getElementById('themeToggle');
const STORAGE_KEY = 'sevenk-theme';

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  if (themeToggle) {
    themeToggle.setAttribute('aria-checked', String(dark));
    themeToggle.setAttribute('aria-label', dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
    const icon = themeToggle.querySelector('.theme-toggle-icon');
    if (icon) icon.innerHTML = dark ? ICONS.sun : ICONS.moon;
  }
}

function readSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    // Tema tetap berfungsi di sesi ini jika storage browser dibatasi.
  }
}

function initTheme() {
  const saved = readSavedTheme();
  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const dark = saved === 'dark' || (!saved && systemPrefersDark);
  applyTheme(dark);
}

themeToggle?.addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark');
  saveTheme(dark ? 'dark' : 'light');
  applyTheme(dark);
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  const linkUrl = new URL(link.href, window.location.href);
  const isHomeSection = window.location.pathname.endsWith('index.html') && linkUrl.hash === '#home';
  const isCurrentPage = linkUrl.pathname === window.location.pathname && (!linkUrl.hash || isHomeSection);
  if (isCurrentPage) link.setAttribute('aria-current', 'page');

  link.addEventListener('click', () => {
    if (mobileMenuQuery.matches) {
      setMenuState(false);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-current-year]').forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });

  if (menuToggle) {
    initMenuIcons();
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  const infoAccordion = document.querySelector('.info-accordion details');
  if (infoAccordion && window.innerWidth <= 900) {
    infoAccordion.open = false;
  }

  setupScrollReveal();
  setupScrollEffects();
  animateStats();
  setupGalleryLoading();

  const galleryToggle = document.getElementById('galleryToggle');
  const galleryGrid = document.getElementById('galleryGrid');

  galleryToggle?.addEventListener('click', () => {
    if (!galleryGrid) return;

    const collapsed = galleryGrid.classList.toggle('collapsed');
    galleryToggle.textContent = collapsed ? 'Tampilkan' : 'Sembunyikan';
    galleryToggle.setAttribute('aria-expanded', String(!collapsed));
    const galleryMore = document.getElementById('galleryMore');
    if (galleryMore) {
      const filteredCount = activeFilter === 'all'
        ? galleryItems.length
        : galleryItems.filter((item) => (item.tags || []).includes(activeFilter)).length;
      galleryMore.hidden = collapsed || filteredCount <= visibleGalleryCount;
    }
  });
});

// Terapkan tema segera supaya tidak ada kedipan saat halaman dibuka.
initTheme();

detailButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.nextElementSibling;
    if (panel instanceof HTMLElement) {
      panel.classList.toggle('open');
      button.textContent = panel.classList.contains('open') ? 'Sembunyikan' : 'Detail';
    }
  });
});