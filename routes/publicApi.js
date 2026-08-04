const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Single combined payload the public homepage fetches on load.
router.get('/site-data', (req, res) => {
  const data = db.getState();
  res.json({
    settings: data.settings,
    stats: data.stats,
    programs: data.programs,
    gallery: data.gallery,
    stories: (data.stories || []).filter((s) => s.published !== false),
    news: (data.news || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  });
});

router.get('/settings', (req, res) => res.json(db.get('settings').value()));
router.get('/stats', (req, res) => res.json(db.get('stats').value()));
router.get('/programs', (req, res) => res.json(db.get('programs').value()));
router.get('/gallery', (req, res) => res.json(db.get('gallery').value()));
router.get('/stories', (req, res) =>
  res.json(db.get('stories').filter((s) => s.published !== false).value())
);
router.get('/news', (req, res) => res.json(db.get('news').value()));

module.exports = router;
