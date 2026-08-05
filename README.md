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

> **No shell/console access on your host?** (e.g. Render's free tier) —
> instead of step 2 above, set two environment variables in your host's
> dashboard: `ADMIN_USERNAME` and `ADMIN_PASSWORD` (8+ characters). The app
> creates that admin account automatically the first time it starts up. See
> the Render walkthrough in Section 3 below.

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
4. Add these environment variables in the host's dashboard (do **not** upload
   your local `.env` file):
   - `SESSION_SECRET` — any long random string
   - `NODE_ENV` — `production`
   - `ADMIN_USERNAME` — the username you want to log in with
   - `ADMIN_PASSWORD` — a password, 8+ characters
   - `MONGODB_URI` — see below (needed for content to actually stay saved)
5. Deploy. The app creates your admin account automatically on first startup
   using the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set — no shell or console
   access needed (useful since Shell access is a paid-plan feature on Render).

**Why `MONGODB_URI` matters:** Render and Railway's free tiers use a
*temporary* filesystem — it resets whenever the service restarts or
redeploys, which happens often on the free tier (e.g. after 15 minutes with
no visitors). Without a database, any content you add through `/admin` would
disappear on the next restart.

To fix this for free, connect a free MongoDB Atlas database:
1. Go to **mongodb.com/cloud/atlas**, create a free account, and create a
   free (M0) cluster — takes about 5 minutes.
2. In Atlas, create a database user (username + password) under
   **Database Access**.
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so
   Render can reach it.
4. Click **Connect** on your cluster → **Drivers** → copy the connection
   string (looks like `mongodb+srv://user:password@cluster.mongodb.net/`).
5. Paste that as the `MONGODB_URI` environment variable in Render, with your
   real username/password filled in.

Once this is set, all content saved through `/admin` — mission/vision,
contact info, stats, programs, stories, news, **and uploaded photos** — is
stored in MongoDB and survives restarts. No paid plan required.

> Note: MongoDB Atlas's free tier includes 512MB of storage — plenty for a
> nonprofit site's text content and a large number of photos (each photo is
> compressed to a reasonable web size before storing). If you ever outgrow
> it, Atlas's paid tiers start very cheap.

### Option A2 — A tiny paid plan with a persistent disk
An alternative to MongoDB: Render/Railway's paid plans (often just
$1-7/month) let you attach a **persistent disk** and mount it at the `data/`
and `uploads/` folders — this keeps the original simple local-file storage
working permanently without needing a database at all. Either approach
works; MongoDB is the free option, a persistent disk is the "don't think
about it again" option.

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
