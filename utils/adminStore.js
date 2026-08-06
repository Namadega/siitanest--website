const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongo = require('./mongo');

const ADMIN_PATH = path.join(__dirname, '..', 'data', 'admin.json');

// ---------- Local file mode (default for local development) ----------
function readAdminFromFile() {
  if (!fs.existsSync(ADMIN_PATH)) return null;
  return JSON.parse(fs.readFileSync(ADMIN_PATH, 'utf-8'));
}
function writeAdminToFile(username, passwordHash) {
  fs.writeFileSync(ADMIN_PATH, JSON.stringify({ username, passwordHash }, null, 2));
}

// ---------- Public API (used by routes) — works the same whether the ----------
// ---------- account lives in MongoDB or in a local file. ----------
// Every MongoDB call here is wrapped so that a database problem (wrong
// credentials, network hiccup, etc.) never crashes the server — it just
// means the account can't be found/saved permanently until it's fixed.

async function readAdmin() {
  if (mongo.isEnabled()) {
    try {
      const collection = await mongo.getCollection();
      const doc = await collection.findOne({ _id: 'admin' });
      if (!doc) return null;
      return { username: doc.username, passwordHash: doc.passwordHash };
    } catch (err) {
      console.error('Could not read admin account from MongoDB:', err.message);
      return null;
    }
  }
  return readAdminFromFile();
}

async function writeAdmin(username, plainPassword) {
  const passwordHash = bcrypt.hashSync(plainPassword, 10);
  if (mongo.isEnabled()) {
    try {
      const collection = await mongo.getCollection();
      await collection.replaceOne({ _id: 'admin' }, { _id: 'admin', username, passwordHash }, { upsert: true });
    } catch (err) {
      console.error(
        'Could not save admin account to MongoDB (login will still work for this session, ' +
        'but won\'t be remembered after a restart until the database connection is fixed):',
        err.message
      );
    }
    return;
  }
  writeAdminToFile(username, passwordHash);
}

async function verifyLogin(username, plainPassword) {
  const admin = await readAdmin();
  if (!admin) return false;
  if (admin.username !== username) return false;
  return bcrypt.compareSync(plainPassword, admin.passwordHash);
}

async function adminExists() {
  const admin = await readAdmin();
  return !!admin;
}

// Allows creating the first admin account purely from environment variables,
// for hosts (like Render's free tier) where there's no shell/console access
// to run `npm run setup` interactively. Only runs if no account exists yet —
// once an account exists (whether created this way or via `npm run setup`),
// it's left alone, including any password changed later from the admin panel.
async function bootstrapFromEnv() {
  if (await adminExists()) return false;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return false;
  if (password.length < 8) {
    console.warn('ADMIN_PASSWORD must be at least 8 characters — skipping admin bootstrap.');
    return false;
  }
  await writeAdmin(username, password);
  console.log(`Admin account "${username}" created from environment variables.`);
  return true;
}

async function changePassword(username, newPlainPassword) {
  await writeAdmin(username, newPlainPassword);
}

module.exports = { readAdmin, writeAdmin, verifyLogin, adminExists, changePassword, bootstrapFromEnv };
