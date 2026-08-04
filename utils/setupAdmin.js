/**
 * Run with: npm run setup
 * Creates (or resets) the single admin account used to log into /admin
 */
const readline = require('readline');
const { writeAdmin, adminExists } = require('./adminStore');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

(async () => {
  console.log('=== Siitanest Admin Setup ===');
  if (adminExists()) {
    const proceed = await ask('An admin account already exists. Reset it? (y/N): ');
    if (proceed.trim().toLowerCase() !== 'y') {
      console.log('Cancelled. Existing admin account left unchanged.');
      rl.close();
      return;
    }
  }

  const username = (await ask('Choose an admin username: ')).trim();
  let password = '';
  while (password.length < 8) {
    password = await ask('Choose a password (min 8 characters): ');
    if (password.length < 8) console.log('Password too short, try again.');
  }

  writeAdmin(username, password);
  console.log('\nAdmin account saved. You can now log in at /admin/login with these credentials.');
  rl.close();
})();
