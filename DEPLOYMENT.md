# Deployment — Vercel + Vercel Postgres

Complete step-by-step guide to deploy the AI HR Agent to a live URL.

---

## Prerequisites

- [x] GitHub repo with this code pushed
- [x] Vercel account (free tier is enough)
- [x] OpenRouter API key in hand (`sk-or-v1-...`)
- [x] Resend API key in hand (`re_...`)

---

## Step 1 — Push Your Latest Code to GitHub

The following files MUST be committed before deployment:

```bash
cd /Users/kushagrarajpoot/my-studio/ai_hr_app
git add .
git commit -m "Prep for Vercel deployment"
git push
```

Confirm `.env.local` is NOT in git (it's in `.gitignore`). Only `.env.example` should be committed.

---

## Step 2 — Create a New Vercel Project

1. Go to **https://vercel.com/new**
2. Click **Import** next to your GitHub repo
3. On the "Configure Project" screen, Vercel auto-detects Next.js. Leave defaults.
4. **Do NOT click Deploy yet** — environment variables are not set
5. Expand **Environment Variables** and add the following (from `.env.example`):

| Name | Value |
|---|---|
| `OPENROUTER_API_KEY` | `sk-or-v1-...` (your real key) |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` |
| `RESEND_API_KEY` | `re_...` (your real key) |
| `RESEND_FROM_EMAIL` | `AI HR Agent <onboarding@resend.dev>` |
| `RESEND_TEST_REDIRECT_TO` | `aipodcast125@gmail.com` (your verified email) |
| `AGENT_DEMO_DELAY_MS` | `1500` |

Leave `DATABASE_URL` and `DIRECT_URL` blank for now — Vercel will inject them in Step 3.

6. Click **Deploy**. The first deploy will partially succeed (build passes, runtime will error on DB calls). That is expected — we're attaching the database next.

---

## Step 3 — Provision Vercel Postgres

1. In your Vercel project dashboard, click **Storage** in the top nav
2. Click **Create Database** → choose **Postgres** (Neon-powered)
3. Name it (e.g. `ai-hr-db`) → choose a region close to your Vercel region → Create
4. On the confirmation screen, click **Connect Project** → select your project → choose "All Environments" → **Connect**

Vercel now auto-injects these env vars into your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`, `POSTGRES_HOST`, etc.

5. **Important — map these to Prisma's expected names.** Go to **Settings → Environment Variables**, find the existing auto-injected vars, and add two more:
   - `DATABASE_URL` = same value as `POSTGRES_PRISMA_URL` (pooled, for the app)
   - `DIRECT_URL` = same value as `POSTGRES_URL_NON_POOLING` (direct, for migrations)

Easiest way: click "Add New" → Name: `DATABASE_URL` → in the value field paste `${POSTGRES_PRISMA_URL}` (Vercel supports env var references) → Save. Repeat for `DIRECT_URL`.

Or just copy the actual connection string values from `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` and paste them.

---

## Step 4 — Push the Database Schema

You need to create the tables in your Postgres database. Run this locally against the remote Postgres:

1. Go to Vercel project → **Storage** → your Postgres DB → **.env.local** tab → copy all vars
2. Create a new file `ai_hr_app/.env.production.local` (already gitignored) with those vars, plus:

```
DATABASE_URL="<paste POSTGRES_PRISMA_URL value>"
DIRECT_URL="<paste POSTGRES_URL_NON_POOLING value>"
```

3. Push the schema from your local machine:

```bash
cd /Users/kushagrarajpoot/my-studio/ai_hr_app
npx dotenv -e .env.production.local -- npx prisma db push
```

Or simpler — temporarily replace `.env.local`'s DATABASE_URL with the production URL, run `npx prisma db push`, then restore it. (`.env.production.local` approach is cleaner.)

You should see:
```
🚀  Your database is now in sync with your Prisma schema.
```

---

## Step 5 — Redeploy

Vercel rebuilds automatically on the next git push. Force a redeploy:

```bash
git commit --allow-empty -m "Redeploy after DB setup"
git push
```

Or click **Redeploy** in the Vercel dashboard → latest deployment → **...** menu → Redeploy.

---

## Step 6 — Verify the Live Deployment

Once the deploy is green, open your Vercel URL (e.g. `ai-hr-app.vercel.app`).

### Smoke tests

1. `https://<your-url>/hr` — dashboard loads, shows "No jobs yet"
2. Click **+ New Job** — create a job → JD generates via OpenRouter
3. Open the apply link in an incognito tab
4. Submit a test candidate (use your verified Resend email as the candidate email, OR rely on the `RESEND_TEST_REDIRECT_TO` reroute)
5. Go back to `/hr/jobs/[id]` — watch the LIVE indicator, activity log, and Kanban update
6. Check inbox of `RESEND_TEST_REDIRECT_TO` email — outreach email lands with the availability link pointing at `https://<your-url>/availability/...`
7. Click the availability link, submit slots
8. Return to Kanban — candidate moves to Scheduled, `.ics` downloadable

If all 8 pass, your deployment is production-ready for demo.

---

## Common Issues

### `PrismaClientInitializationError: Can't reach database server`

Your `DATABASE_URL` isn't set or points to the wrong host. Go to Vercel → Settings → Env Vars, confirm `DATABASE_URL` is set to the pooled Postgres URL.

### `Cannot find module '@prisma/client' or its corresponding type declarations`

Prisma client was not generated during build. Verify `package.json` has:
- `"postinstall": "prisma generate"`
- `"build": "prisma generate && next build"`

Both are already set in this repo.

### Outreach emails contain `localhost:3000` in the availability link

The `origin` header was missing. The `getOrigin()` helper falls back to `NEXT_PUBLIC_APP_URL`. Add this env var in Vercel:
- `NEXT_PUBLIC_APP_URL` = `https://<your-vercel-url>.vercel.app`

### Resend still says "You can only send testing emails to your own email address"

Either:
- Keep using `RESEND_TEST_REDIRECT_TO=<your-resend-account-email>` (current workaround)
- Or go to `resend.com/domains`, verify a domain you own, then set `RESEND_FROM_EMAIL="AI HR Agent <hr@yourverifieddomain.com>"` and remove the redirect env var

### Build fails with `DIRECT_URL not set`

The schema references both `DATABASE_URL` and `DIRECT_URL`. Both must be set in Vercel env vars.

---

## Turning Off Demo Mode for Production

Once the demo is over, edit Vercel env vars:
- `AGENT_DEMO_DELAY_MS` → change from `1500` to `0`
- `RESEND_TEST_REDIRECT_TO` → remove once you have a verified domain

Click **Redeploy**.

---

## Quick Reference

| Thing | Where |
|---|---|
| Live URL | Vercel project → "Visit" button top right |
| Logs | Vercel project → Deployments → latest → Runtime Logs |
| Env vars | Vercel project → Settings → Environment Variables |
| Database | Vercel project → Storage → your DB → Data tab |
| Force redeploy | Vercel project → Deployments → ... → Redeploy |
