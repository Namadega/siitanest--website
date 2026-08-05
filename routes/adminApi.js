const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const db = require('../utils/db');
const { upload } = require('../middleware/upload');
const { changePassword, readAdmin } = require('../utils/adminStore');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ALLOWED_FOLDERS = new Set(['gallery', 'stories', 'news', 'programs', 'misc']);

function safeUnlink(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  const filePath = path.join(__dirname, '..', publicUrl);
  fs.unlink(filePath, () => {}); // best-effort, ignore errors (e.g. already gone)
}

// ---------- Image upload ----------
// POST /api/admin/upload?folder=gallery   (multipart field name: "image")
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const folder = ALLOWED_FOLDERS.has(req.query.folder) ? req.query.folder : 'misc';
    if (!req.file) return res.status(400).json({ error: 'No image file received.' });

    const filename = `${crypto.randomBytes(12).toString('hex')}.jpg`;
    const destDir = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);

    // Re-encode to a reasonable web size/quality regardless of source format.
    await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(destPath);

    res.json({ url: `/uploads/${folder}/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image upload failed. Please try a different image.' });
  }
});

// ---------- Settings (org info, hero/about text, contact, social links) ----------
router.get('/settings', (req, res) => res.json(db.get('settings').value()));

router.put('/settings', express.json(), (req, res) => {
  db.set('settings', { ...db.get('settings').value(), ...req.body }).write();
  res.json(db.get('settings').value());
});

// ---------- Stats (the "1,250+ Children Supported" counters) ----------
router.get('/stats', (req, res) => res.json(db.get('stats').value()));

router.put('/stats', express.json(), (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected an array of stats.' });
  db.set('stats', req.body).write();
  res.json(db.get('stats').value());
});

// ---------- Generic collection CRUD factory for programs / gallery / stories / news / team ----------
function registerCollection(name, { defaults = {} } = {}) {
  router.get(`/${name}`, (req, res) => res.json(db.get(name).value()));

  router.post(`/${name}`, express.json(), (req, res) => {
    const item = {
      id: `${name}-${crypto.randomBytes(6).toString('hex')}`,
      createdAt: new Date().toISOString(),
      ...defaults,
      ...req.body
    };
    db.get(name).push(item).write();
    res.status(201).json(item);
  });

  router.put(`/${name}/:id`, express.json(), (req, res) => {
    const record = db.get(name).find({ id: req.params.id });
    if (!record.value()) return res.status(404).json({ error: 'Not found' });
    record.assign(req.body).write();
    res.json(record.value());
  });

  router.delete(`/${name}/:id`, (req, res) => {
    const record = db.get(name).find({ id: req.params.id }).value();
    if (!record) return res.status(404).json({ error: 'Not found' });
    if (record.image) safeUnlink(record.image);
    db.get(name).remove({ id: req.params.id }).write();
    res.json({ ok: true });
  });
}

registerCollection('programs');
registerCollection('gallery', { defaults: { caption: '' } });
registerCollection('stories', { defaults: { published: true } });
registerCollection('news', { defaults: { date: new Date().toISOString() } });
registerCollection('team');

// ---------- Change password ----------
router.post('/change-password', express.json(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const { verifyLogin } = require('../utils/adminStore');
    const admin = await readAdmin();
    if (!admin) return res.status(400).json({ error: 'No admin account exists.' });
    if (!(await verifyLogin(admin.username, currentPassword || ''))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    await changePassword(admin.username, newPassword);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while updating the password.' });
  }
});

router.get('/whoami', (req, res) => {
  res.json({ username: req.session.username });
});

module.exports = router;
