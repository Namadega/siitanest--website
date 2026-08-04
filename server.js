require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const requireAuth = require('./middleware/requireAuth');
const authRoutes = require('./routes/auth');
const publicApiRoutes = require('./routes/publicApi');
const adminApiRoutes = require('./routes/adminApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directories exist even on a fresh clone.
['gallery', 'stories', 'news', 'programs', 'misc'].forEach((folder) => {
  fs.mkdirSync(path.join(__dirname, 'uploads', folder), { recursive: true });
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'siitanest-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      secure: process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === '1'
    }
  })
);

// Uploaded images, served publicly (this is how the frontend displays admin-added photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public website
app.use(express.static(path.join(__dirname, 'public')));

// Public read-only API for the website's own JS to consume
app.use('/api', publicApiRoutes);

// Admin login/logout (not behind requireAuth, obviously)
app.use('/admin', authRoutes);

// Everything else under /admin requires a logged-in session
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});
app.use('/admin/css', express.static(path.join(__dirname, 'admin', 'css')));
app.use('/admin/js', express.static(path.join(__dirname, 'admin', 'js')));
app.use('/api/admin', requireAuth, adminApiRoutes);

// Catch upload errors (bad file type, too large, etc.) and anything else that
// bubbles up, and return clean JSON instead of Express's default HTML error page.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err);
  const status = err.status || (err.message && err.message.includes('Only JPG') ? 400 : 500);
  res.status(status).json({
    error: err.message || 'Something went wrong on the server. Please try again.'
  });
});

app.listen(PORT, () => {
  console.log(`Siitanest website running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin`);
});
