const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const ADMIN_PATH = path.join(__dirname, '..', 'data', 'admin.json');

function readAdmin() {
  if (!fs.existsSync(ADMIN_PATH)) return null;
  return JSON.parse(fs.readFileSync(ADMIN_PATH, 'utf-8'));
}

function writeAdmin(username, plainPassword) {
  const passwordHash = bcrypt.hashSync(plainPassword, 10);
  fs.writeFileSync(
    ADMIN_PATH,
    JSON.stringify({ username, passwordHash }, null, 2)
  );
}

function verifyLogin(username, plainPassword) {
  const admin = readAdmin();
  if (!admin) return false;
  if (admin.username !== username) return false;
  return bcrypt.compareSync(plainPassword, admin.passwordHash);
}

function adminExists() {
  return fs.existsSync(ADMIN_PATH);
}

// Allows creating the first admin account purely from environment variables,
// for hosts (like Render's free tier) where there's no shell/console access
// to run `npm run setup` interactively.
function bootstrapFromEnv() {
  if (adminExists()) return false;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return false;
  if (password.length < 8) {
    console.warn('ADMIN_PASSWORD must be at least 8 characters — skipping admin bootstrap.');
    return false;
  }
  writeAdmin(username, password);
  console.log(`Admin account "${username}" created from environment variables.`);
  return true;
}

function changePassword(username, newPlainPassword) {
  writeAdmin(username, newPlainPassword);
}

module.exports = { readAdmin, writeAdmin, verifyLogin, adminExists, changePassword, bootstrapFromEnv };
