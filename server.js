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
const mongo = require('./utils/mongo');
const imageStore = require('./utils/imageStore');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directories exist even on a fresh clone.
['gallery', 'stories', 'news', 'programs', 'misc', 'videos'].forEach((folder) => {
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

// Uploaded images, served publicly (this is how the frontend displays admin-added photos).
// When MongoDB is configured, images are stored there (so they survive restarts on hosts
// with temporary disks) and served dynamically here; otherwise this falls through to the
// plain static file server below, which reads them straight from the uploads/ folder.
app.get('/uploads/:folder/:filename', async (req, res, next) => {
  if (!mongo.isEnabled()) return next();
  try {
    const media = await imageStore.getImage(req.params.folder, req.params.filename);
    if (!media) return next();

    // Videos need HTTP Range support so browsers (especially mobile Safari)
    // can start playback without downloading the whole file first, and so
    // seeking works. Images are small enough to just send in full.
    if (media.contentType.startsWith('video/') && req.headers.range) {
      const total = media.buffer.length;
      const match = req.headers.range.match(/bytes=(\d*)-(\d*)/);
      const start = match && match[1] ? parseInt(match[1], 10) : 0;
      const end = match && match[2] ? parseInt(match[2], 10) : total - 1;
      const chunk = media.buffer.subarray(start, end + 1);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunk.length,
        'Content-Type': media.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      return res.end(chunk);
    }

    res.setHeader('Content-Type', media.contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(media.buffer);
  } catch (err) {
    next(err);
  }
});
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
  const isClientError =
    err.code === 'LIMIT_FILE_SIZE' ||
    (err.message && (err.message.includes('Only JPG') || err.message.includes('Only MP4')));
  const status = err.status || (isClientError ? 400 : 500);
  const message =
    err.code === 'LIMIT_FILE_SIZE'
      ? 'That file is too large. Please use a smaller file.'
      : err.message || 'Something went wrong on the server. Please try again.';
  res.status(status).json({ error: message });
});

// Last-resort safety net: if anything anywhere throws an unhandled promise
// rejection (a bug, a database hiccup, etc.), log it clearly instead of
// letting it silently crash the entire site.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection (server is still running):', err);
});

(async () => {
  try {
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
  } catch (err) {
    // Startup checks (e.g. a database problem) should never take the whole
    // site offline — log it clearly and still start the server below.
    console.error('A startup check failed, continuing anyway:', err);
  }

  app.listen(PORT, () => {
    console.log(`Siitanest website running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
  });
})();
