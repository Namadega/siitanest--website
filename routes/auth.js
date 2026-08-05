const express = require('express');
const router = express.Router();
const path = require('path');
const { verifyLogin, adminExists } = require('../utils/adminStore');

router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, '..', 'admin', 'login.html'));
});

router.post('/login', express.json(), async (req, res) => {
  try {
    if (!(await adminExists())) {
      return res.status(400).json({
        error: 'No admin account has been set up yet. Run "npm run setup" on the server first.'
      });
    }
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (!(await verifyLogin(username, password))) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }
    req.session.isAdmin = true;
    req.session.username = username;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while logging in. Please try again.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

module.exports = router;
