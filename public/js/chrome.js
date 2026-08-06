// Shared across every page: header/footer rendering, escaping, and small icon maps.
// Loaded before each page's own script (index.html, donate.html, get-involved.html, gallery.html).

const SOCIAL_ICONS = {
  facebook: 'f',
  instagram: '&#128247;',
  twitter: 'X',
  youtube: '&#9654;'
};

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadSettings() {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to load site settings');
  return res.json();
}

// Fills in the header (brand name/tagline) and footer (org info, contact,
// social links, copyright line) — present in the same form on every page.
function renderChrome(settings) {
  if (!settings) return;
  document.title = `${settings.orgName || 'Siitanest'} ${settings.orgTagline || ''}`.trim();

  const brandName = document.getElementById('brand-name');
  const brandSub = document.getElementById('brand-sub');
  if (brandName) brandName.textContent = (settings.orgName || 'SIITANEST').toUpperCase();
  if (brandSub) brandSub.textContent = settings.orgTagline || '';

  const footerOrgName = document.getElementById('footer-org-name');
  const footerOrgSub = document.getElementById('footer-org-sub');
  const footerNote = document.getElementById('footer-note');
  const footerAddress = document.getElementById('footer-address');
  const footerPhone = document.getElementById('footer-phone');
  const footerEmail = document.getElementById('footer-email');
  const footerBottom = document.getElementById('footer-bottom');

  if (footerOrgName) footerOrgName.textContent = (settings.orgName || '').toUpperCase();
  if (footerOrgSub) footerOrgSub.textContent = settings.orgTagline || '';
  if (footerNote) footerNote.textContent = settings.footerNote || '';
  if (footerAddress) footerAddress.innerHTML = `&#128205; ${escapeHtml(settings.address || '')}`;
  if (footerPhone) footerPhone.innerHTML = `&#128222; ${escapeHtml(settings.phone || '')}`;
  if (footerEmail) footerEmail.innerHTML = `&#9993; ${escapeHtml(settings.email || '')}`;
  if (footerBottom) {
    footerBottom.textContent = `© ${new Date().getFullYear()} ${settings.orgName || ''} ${settings.orgTagline || ''}. All Rights Reserved.`;
  }

  const social = settings.socialLinks || {};
  const socialRow = document.getElementById('social-row');
  if (socialRow) {
    socialRow.innerHTML = Object.entries(social)
      .filter(([, url]) => url)
      .map(([key, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${SOCIAL_ICONS[key] || key[0].toUpperCase()}</a>`)
      .join('');
  }
}

function renderFooterPrograms(programs) {
  const el = document.getElementById('footer-programs');
  if (!el) return;
  if (!programs || !programs.length) { el.innerHTML = ''; return; }
  el.innerHTML = programs.map((p) => `<li><a href="/#programs">${escapeHtml(p.title)}</a></li>`).join('');
}
