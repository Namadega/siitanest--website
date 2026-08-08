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

// Separate config for the background video upload: different allowed types
// and a larger size limit, but still capped to keep it a genuinely "short
// clip" rather than a full-length video (also keeps it well under MongoDB's
// 16MB single-document limit when stored there).
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
function videoFileFilter(req, file, cb) {
  if (!ALLOWED_VIDEO_MIME.has(file.mimetype)) {
    return cb(new Error('Only MP4, WEBM, or MOV video files are allowed'));
  }
  cb(null, true);
}
const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB — keep it short (a few seconds to ~20s of compressed footage)
});

function randomName() {
  return crypto.randomBytes(12).toString('hex');
}

module.exports = { upload, uploadVideo, randomName };
