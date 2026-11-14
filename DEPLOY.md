# Deploying the Lumen demo for a client

## Which platform?

| Platform | Cost | Works with this app as-is? | Notes |
|---|---|---|---|
| **Render** (recommended) | Free | ✅ Yes | Runs the app as one always-on Node server, so the built-in JSON database works. Free instances sleep after 15 min without visits; the first visit afterwards takes ~30–50 s to wake up. Data resets to the demo seed when it restarts, which is ideal for demos. |
| Vercel | Free | ⚠️ Partly | Great for Next.js, but it runs serverless functions with no shared disk, so orders/edits made in the demo can vanish between requests. Needs a real database (e.g. Neon Postgres) first. |
| Railway | ~$5 trial credit | ✅ Yes | Similar to Render, no sleep, but not free long-term. |
| Hostinger | Paid (Node.js needs a Business/Cloud or VPS plan) | ✅ On a VPS | Good if you want a custom domain on hosting you already pay for. More setup. |
| AWS | Free tier for 12 months (EC2 / Lightsail trial) | ✅ On EC2/Lightsail | Most setup work (server, Node, PM2, Nginx, HTTPS). Overkill for a demo. |

> Claude itself can't host this app. Claude artifacts are static pages, and this is a full server app with logins, an API and a database.

## Deploy to Render (about 10 minutes)

You need: a free **GitHub** account and a free **Render** account (sign up at render.com with GitHub).

### 1. Put the code on GitHub

**Option A — with Git (recommended)**

```bash
git init
git add .
git commit -m "Lumen Atelier demo"
```

Create an empty repository on github.com (New repository, no README), then:

```bash
git remote add origin https://github.com/<your-username>/lumen-atelier.git
git branch -M main
git push -u origin main
```

**Option B — without Git:** on github.com create a new repository, click **uploading an existing file**, and drag in the project's files and folders. Do **not** upload `node_modules`, `.next` or `.data`.

### 2. Create the service on Render

1. Render dashboard → **New** → **Blueprint**.
2. Connect GitHub and pick the `lumen-atelier` repository.
3. Render reads `render.yaml` (free plan, Singapore region, build/start commands, a random `AUTH_SECRET`). Click **Apply**.
4. Wait for the first build (~3–5 min). Your link looks like `https://lumen-atelier.onrender.com`.

Every later `git push` to `main` redeploys automatically.

### 3. Before sending the link to the client

- Open the link once yourself a minute before the meeting so the free instance is awake.
- The login page shows one-click **Demo accounts** (customer and admin) so the client can try both sides. Anyone with the link can use them, so the admin panel is open to them too. That's fine for a demo, but don't put real data in it.
- Payments are mocked: UPI (any valid UPI ID, `fail@upi` declines) and cards (`4242 4242 4242 4242`). No real money moves.
- Data resets to the seed whenever the instance restarts or you redeploy. To reset manually, use **Manual Deploy → Restart service** in Render.

## Optional: custom domain

Render → your service → **Settings → Custom Domains** → add e.g. `demo.yourstudio.in`, then add the CNAME record it shows at your domain registrar (Hostinger, GoDaddy…). HTTPS is issued automatically.
