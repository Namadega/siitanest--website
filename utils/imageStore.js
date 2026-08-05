const fs = require('fs');
const path = require('path');
const mongo = require('./mongo');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

function docId(folder, filename) {
  return `image:${folder}/${filename}`;
}

// Saves an already-processed image buffer and returns its public URL.
// In MongoDB mode the bytes are stored in the database (so they survive
// restarts on hosts with temporary disks); otherwise they're written to the
// local uploads/ folder as before.
async function saveImage(folder, filename, buffer, contentType = 'image/jpeg') {
  const publicUrl = `/uploads/${folder}/${filename}`;
  if (mongo.isEnabled()) {
    const collection = await mongo.getCollection();
    await collection.replaceOne(
      { _id: docId(folder, filename) },
      { _id: docId(folder, filename), folder, filename, contentType, data: buffer },
      { upsert: true }
    );
  } else {
    const destDir = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, filename), buffer);
  }
  return publicUrl;
}

// Only used in MongoDB mode — local-file mode is served directly by
// express.static instead, so this isn't called there.
async function getImage(folder, filename) {
  if (!mongo.isEnabled()) return null;
  const collection = await mongo.getCollection();
  const doc = await collection.findOne({ _id: docId(folder, filename) });
  if (!doc || !doc.data) return null;
  const raw = doc.data;
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw.buffer || raw);
  return { buffer, contentType: doc.contentType || 'image/jpeg' };
}

// Accepts a public URL like "/uploads/gallery/abc123.jpg" and removes the
// underlying image, wherever it's stored. Best-effort — errors are logged,
// not thrown, since a failed cleanup shouldn't block the user's action.
async function deleteImage(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  const rel = publicUrl.replace('/uploads/', ''); // "folder/filename"
  if (mongo.isEnabled()) {
    try {
      const collection = await mongo.getCollection();
      await collection.deleteOne({ _id: `image:${rel}` });
    } catch (err) {
      console.error('Could not delete image from MongoDB:', err.message);
    }
  } else {
    fs.unlink(path.join(UPLOAD_ROOT, rel), () => {}); // ignore errors (e.g. already gone)
  }
}

module.exports = { saveImage, getImage, deleteImage };
