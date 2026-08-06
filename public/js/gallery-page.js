function openLightbox(src, caption) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <img src="${escapeHtml(src)}" alt="${escapeHtml(caption || '')}">
  `;
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.classList.contains('lightbox-close')) box.remove();
  });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { box.remove(); document.removeEventListener('keydown', onEsc); }
  });
  document.body.appendChild(box);
}

function renderFullGallery(gallery) {
  const el = document.getElementById('full-gallery-grid');
  if (!gallery || !gallery.length) {
    el.innerHTML = '<p class="empty-note">Photos will appear here once added in the admin panel.</p>';
    return;
  }
  el.innerHTML = gallery
    .map(
      (g, i) => `<img src="${escapeHtml(g.image)}" alt="${escapeHtml(g.caption || '')}" data-idx="${i}">`
    )
    .join('');
  el.querySelectorAll('img').forEach((img, i) => {
    img.addEventListener('click', () => openLightbox(gallery[i].image, gallery[i].caption));
  });
}

(async function init() {
  try {
    const [settings, gallery] = await Promise.all([
      loadSettings(),
      fetch('/api/gallery').then((r) => r.json())
    ]);
    renderChrome(settings);
    renderFullGallery(gallery);
    const programsRes = await fetch('/api/programs');
    if (programsRes.ok) renderFooterPrograms(await programsRes.json());
  } catch (err) {
    console.error(err);
  }
})();
