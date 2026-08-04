const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Store incoming files in memory; we re-encode them with sharp before
// writing to disk, so we fully control final format/size and strip
// anything unexpected out of the uploaded file.
const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});

function randomName() {
  return crypto.randomBytes(12).toString('hex');
}

module.exports = { upload, randomName };
