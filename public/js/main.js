// Homepage-specific rendering. Shared header/footer logic lives in chrome.js
// (loaded before this file) — escapeHtml, formatDate, renderChrome(), etc.

const ICONS = {
  children: '&#128118;',
  family: '&#128106;',
  graduate: '&#127891;',
  hands: '&#129309;',
  bowl: '&#127858;',
  home: '&#127968;',
  'heart-pulse': '&#128147;'
};

// Clean line-style SVG icons for the Programs cards (education/nutrition/
// shelter/healthcare) — used instead of emoji for a more professional look.
const PROGRAM_ICONS = {
  graduate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>',
  bowl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M12 11V4"/><path d="M8 4a4 4 0 0 1 8 0"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
  'heart-pulse': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3.5 12h3l2-4 3 8 2-5h4.5"/></svg>'
};

async function loadSiteData() {
  const res = await fetch('/api/site-data');
  if (!res.ok) throw new Error('Failed to load site content');
  return res.json();
}

function renderHomepageSettings(settings) {
  if (!settings) return;
  document.getElementById('hero-org-name').innerHTML =
    `${escapeHtml((settings.orgName || '').toUpperCase())}<span id="hero-org-tagline">${escapeHtml((settings.orgTagline || '').toUpperCase())}</span>`;
  document.getElementById('hero-headline').textContent = settings.heroHeadline || '';
  document.getElementById('hero-subtext').textContent = settings.heroSubtext || '';
  document.getElementById('hero-bg').style.backgroundImage = `url('${settings.heroImage || '/images/hero-default.svg'}')`;

  document.getElementById('about-title').textContent = settings.aboutTitle || 'Who We Are';
  document.getElementById('about-text').textContent = settings.aboutText || '';
  document.getElementById('about-image').src = settings.aboutImage || '/images/about-default.svg';

  document.getElementById('mission-text').textContent = settings.missionText || '';
  document.getElementById('vision-text').textContent = settings.visionText || '';
}

function renderStats(stats) {
  const el = document.getElementById('stats-bar');
  if (!stats || !stats.length) { el.innerHTML = ''; return; }
  el.innerHTML = stats
    .map(
      (s) => `
    <div class="stat">
      <div class="stat-icon">${ICONS[s.icon] || '&#11088;'}</div>
      <div class="stat-value">${escapeHtml(s.value)}</div>
      <div class="stat-label">${escapeHtml(s.label)}</div>
    </div>`
    )
    .join('');
}

function renderPrograms(programs) {
  const el = document.getElementById('programs-grid');
  if (!programs || !programs.length) {
    el.innerHTML = '<p class="empty-note">Programs will appear here once added in the admin panel.</p>';
    return;
  }
  el.innerHTML = programs
    .map(
      (p) => `
    <div class="program-card">
      <div class="program-icon ${p.color || 'green'}">${PROGRAM_ICONS[p.icon] || PROGRAM_ICONS['heart-pulse']}</div>
      <h4>${escapeHtml(p.title)}</h4>
      <ul>${(p.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      <a href="#programs" class="program-link ${p.color || 'green'}">Learn More &rarr;</a>
    </div>`
    )
    .join('');
}

function renderGalleryPreview(gallery) {
  const el = document.getElementById('gallery-grid');
  if (!gallery || !gallery.length) {
    el.innerHTML = '<p class="empty-note">Photos will appear here once added in the admin panel.</p>';
    return;
  }
  el.innerHTML = gallery
    .slice(0, 6)
    .map((g) => `<img src="${escapeHtml(g.image)}" alt="${escapeHtml(g.caption || '')}">`)
    .join('');
}

function renderStory(stories) {
  const card = document.getElementById('story-card');
  if (!stories || !stories.length) {
    card.innerHTML = '<p class="empty-note" style="color:rgba(255,255,255,0.8);">Stories will appear here once added in the admin panel.</p>';
    return;
  }
  const story = stories[0];
  document.getElementById('story-quote').textContent = `“${story.quote}”`;
  document.getElementById('story-author').textContent = `— ${story.name}${story.age ? ', Age ' + story.age : ''}`;
}

function renderNews(news) {
  const el = document.getElementById('news-grid');
  if (!news || !news.length) {
    el.innerHTML = '<p class="empty-note">News and updates will appear here once added in the admin panel.</p>';
    return;
  }
  el.innerHTML = news
    .slice(0, 3)
    .map(
      (n) => `
    <div class="news-card">
      ${n.image ? `<img src="${escapeHtml(n.image)}" alt="${escapeHtml(n.title)}">` : ''}
      <div class="body">
        <h4>${escapeHtml(n.title)}</h4>
        <p class="excerpt">${escapeHtml(n.excerpt || '')}</p>
        <div class="date">${escapeHtml(formatDate(n.date))}</div>
      </div>
    </div>`
    )
    .join('');
}

(async function init() {
  try {
    const data = await loadSiteData();
    renderChrome(data.settings);
    renderHomepageSettings(data.settings);
    renderStats(data.stats);
    renderPrograms(data.programs);
    renderGalleryPreview(data.gallery);
    renderStory(data.stories);
    renderNews(data.news);
    renderFooterPrograms(data.programs);
  } catch (err) {
    console.error(err);
  }
})();
