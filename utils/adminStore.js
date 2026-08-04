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

function changePassword(username, newPlainPassword) {
  writeAdmin(username, newPlainPassword);
}

module.exports = { readAdmin, writeAdmin, verifyLogin, adminExists, changePassword };
