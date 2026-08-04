const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
const DEFAULT_PATH = path.join(__dirname, '..', 'data', 'db.default.json');

// On first run, seed the live database from the default template.
if (!fs.existsSync(DB_PATH)) {
  fs.copyFileSync(DEFAULT_PATH, DB_PATH);
}

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Make sure every top-level collection exists even if db.json is older/edited.
db.defaults({
  settings: {},
  stats: [],
  programs: [],
  gallery: [],
  stories: [],
  news: [],
  team: []
}).write();

module.exports = db;
