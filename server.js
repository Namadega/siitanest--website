require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const requireAuth = require('./middleware/requireAuth');
const authRoutes = require('./routes/auth');
const publicApiRoutes = require('./routes/publicApi');
const adminApiRoutes = require('./routes/adminApi');
const db = require('./utils/db');
const { bootstrapFromEnv, adminExists } = require('./utils/adminStore');

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

(async () => {
  // Wait for site content to finish loading (from MongoDB if configured,
  // otherwise this resolves immediately for local file storage) before
  // accepting any requests.
  await db.ready;

  // If no admin account exists yet, and ADMIN_USERNAME/ADMIN_PASSWORD were
  // provided as environment variables, create the account automatically.
  // This lets hosts without shell/console access (e.g. Render's free tier)
  // get an admin login without running `npm run setup` by hand.
  await bootstrapFromEnv();
  if (!(await adminExists())) {
    console.warn(
      'No admin account exists yet. Run "npm run setup", or set ADMIN_USERNAME ' +
      'and ADMIN_PASSWORD environment variables and restart, to create one.'
    );
  }

  app.listen(PORT, () => {
    console.log(`Siitanest website running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
  });
})();
