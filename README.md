# Perimeter Watch

A shared sighting board for Santa Clara University. Static front end
(`public/index.html`) + a tiny Express API (`server.js`) that stores
reports in memory and drops anything older than 5 hours.

## Run it locally

```bash
npm install
npm start
```

Then open http://localhost:3000

## Deploy on Render

1. **Push this folder to a GitHub repo.** Render deploys from a repo, so
   create a new repo (e.g. `perimeter-watch`) and push these files
   (`server.js`, `package.json`, `public/index.html`, this README) to it.

2. **In Render:** go to [render.com](https://render.com) → **New +** →
   **Web Service** → connect the GitHub repo you just made.

3. **Settings when Render asks:**
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free is fine to start

4. Click **Create Web Service**. Render will build and deploy — you'll get
   a URL like `https://perimeter-watch.onrender.com`. That's the link to
   share.

## Good to know

- **Reports are shared automatically** once this is deployed — the site
  talks to the `/api/reports` endpoint on the same server, so everyone
  who opens the link sees the same board.
- **Free-tier caveat:** reports currently live in server memory, not a
  database. Render's free instances spin down after inactivity and lose
  memory on restart, so the board can reset itself between bursts of
  traffic. Given reports expire after 5 hours anyway, this is usually a
  non-issue — but if you want reports to reliably survive a restart,
  the fix is to swap the in-memory `reports` array in `server.js` for a
  real store (Render offers a free Postgres instance you could add, or
  even a single JSON file on a persistent disk on a paid plan). Say the
  word if you want that wired up.
- **No accounts, no moderation** — anyone with the link can post or view.
  If you want a simple way to remove a bad report, the easiest addition
  is an admin-only `DELETE /api/reports/:id` route gated behind a
  password you set as an environment variable in Render.
