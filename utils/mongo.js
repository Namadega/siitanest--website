/**
 * Shared MongoDB connection. Only used when MONGODB_URI is set in the
 * environment. When it's not set, the rest of the app falls back to the
 * simple local-file storage instead (see utils/db.js and utils/adminStore.js) —
 * this keeps local development simple while allowing hosts with ephemeral
 * disks (like Render's free tier) to persist content permanently.
 */
const { MongoClient } = require('mongodb');

let collectionPromise = null;

function isEnabled() {
  return !!process.env.MONGODB_URI;
}

// Returns a promise for the single shared collection all app data lives in.
// Connects once and reuses the connection for every subsequent call.
function getCollection() {
  if (!isEnabled()) return Promise.reject(new Error('MONGODB_URI is not set'));
  if (!collectionPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    collectionPromise = client.connect().then(() => {
      const dbName = process.env.MONGODB_DB || 'siitanest';
      return client.db(dbName).collection('app_data');
    });
    collectionPromise.catch(() => {
      // Allow a later call to retry instead of being stuck on a rejected promise forever.
      collectionPromise = null;
    });
  }
  return collectionPromise;
}

module.exports = { isEnabled, getCollection };
