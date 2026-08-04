# Siitanest Mother's Love Home — Website + Admin Panel

A complete website with a built-in admin panel. Once it's set up, you (or anyone
you give the login to) can update photos, stories, activities/news, programs,
impact stats, and contact/social media details directly from a web browser —
no code editing required.

## What's included

- **Public website** (`/public`) — the homepage your visitors see.
- **Admin panel** (`/admin`) — a password-protected dashboard for editing content.
- **Backend server** (`server.js` + `/routes`) — stores your content in a simple
  file-based database (`data/db.json`) and serves everything.
- **Uploaded photos** are saved in `/uploads` and automatically resized/optimized.

No external database (like MySQL or MongoDB) is required — everything is
stored in plain JSON files on the server, which keeps hosting simple and cheap.

---

## 1. First-time setup

You'll need [Node.js](https://nodejs.org) version 18 or later installed on
whatever computer or server will run the site.

```bash
# 1. Install dependencies
npm install

# 2. Create your admin login (choose your own username & password)
npm run setup

# 3. Copy the environment file and edit it
cp .env.example .env
```

Open the new `.env` file and set `SESSION_SECRET` to any long random string
(this just keeps admin logins secure — mash your keyboard for 40+ characters).

```bash
# 4. Start the site
npm start
```

The website will be running at `http://localhost:3000` and the admin panel at
`http://localhost:3000/admin`.

Log in with the username and password you chose in step 2.

---

## 2. Using the admin panel

Once logged in at `/admin`, you'll see a sidebar with:

| Section | What you can edit |
|---|---|
| **Site & Contact Info** | Organization name, hero banner text & photo, About section text & photo, address, phone, email, donate link, footer tagline |
| **Impact Stats** | The four counters under the hero banner (e.g. "1,250+ Children Supported") |
| **Programs** | The Education / Nutrition / Shelter / Healthcare cards — add, edit, or remove |
| **Gallery** | Upload and remove photos shown in the homepage gallery |
| **Stories** | Add stories of hope, with a name, quote, and photo — mark as Published or Draft |
| **News & Activities** | Post updates about recent activities, each with a photo, title, and date |
| **Account** | Change your admin password |

Every change you make (adding a photo, editing text, publishing a story) shows
up on the live website immediately — just refresh the homepage to see it.

**Social media handles**: go to Site & Contact Info → Social Media Handles,
paste the full link to each profile (e.g. `https://facebook.com/yourpage`).
Leave a field blank to hide that icon from the footer.

If you ever forget your password, run `npm run setup` again on the server —
it will ask to reset the existing account.

---

## 3. Hosting it online

This is a normal Node.js app, so it runs on any host that supports Node —
here are the simplest options:

### Option A — Render.com or Railway.app (easiest, has a free tier)
1. Push this project to a GitHub repository.
2. Create a new "Web Service" and connect the repo.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Add environment variables `SESSION_SECRET` and `NODE_ENV=production` in the
   host's dashboard (do **not** upload your local `.env` file).
5. After the first deploy, use the host's "Shell" or "Console" tab to run
   `npm run setup` once, to create your admin login.
6. Important: on these platforms the filesystem often resets on redeploy, so
   for anything beyond a quick trial, ask your host about a persistent disk
   /volume and mount it at the `data/` and `uploads/` folders so your content
   and photos aren't lost when the app restarts.

### Option B — A VPS (DigitalOcean, Linode, AWS Lightsail, etc.)
1. Install Node.js on the server.
2. Upload this project (e.g. via `git clone` or `scp`).
3. Run `npm install`, `npm run setup`, and set up your `.env` file as above.
4. Use a process manager so the site stays running and restarts if it crashes:
   ```bash
   npm install -g pm2
   pm2 start server.js --name siitanest
   pm2 save
   pm2 startup
   ```
5. Put Nginx in front of it as a reverse proxy and get a free HTTPS certificate
   with [Certbot](https://certbot.eff.org/), so your site runs on `https://yourdomain.org`
   instead of `http://yourserver:3000`.

### Option C — Shared "cPanel" hosting
Only works if your host explicitly supports **Node.js applications** (look for
"Setup Node.js App" in cPanel — many hosts now offer this via Passenger). If
your host only offers plain PHP/static hosting, this project won't run there —
you'd need a VPS or a Node-friendly host like Option A instead.

---

## 4. Project structure

```
siitanest/
├── server.js              ← starts everything
├── public/                ← the website (HTML/CSS/JS)
├── admin/                 ← the admin panel (login + dashboard)
├── routes/                ← backend logic (API endpoints)
├── middleware/             ← login-check and image-upload handling
├── utils/                 ← database & admin-account helpers
├── data/
│   ├── db.default.json    ← starting content (don't edit — used only once)
│   └── db.json            ← your live content (created automatically)
└── uploads/                ← photos you upload through the admin panel
```

## 5. Backing up your content

Your entire site's content lives in two places — back these up periodically:
- `data/db.json` (all text content)
- `uploads/` (all photos)

Copying these two to a safe location is a complete backup of everything
you've entered through the admin panel.

## 6. Security notes

- There is a single admin account by design (simple for a small nonprofit
  team). If multiple people need separate logins with different permissions,
  that would need to be added as an enhancement.
- Change the default `SESSION_SECRET` before putting this online.
- Always run it behind HTTPS in production (see Option B above) so login
  credentials aren't sent in plain text.
