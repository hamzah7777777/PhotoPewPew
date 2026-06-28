# PhotoPewPew

A small client-gallery tool for photo shoots. Upload compressed (~250KB) previews for a shoot, send the client a link + passcode, and they can browse, crop/rotate, mark favorites, and request the full-res version of a photo by email. Originals never leave your machine.

Fully static (Next.js `output: "export"`) deployed to GitHub Pages — all data lives in Supabase (Postgres + Storage + Auth), no server.

## One-time setup

### 1. Supabase project
1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Under **Authentication → Users**, manually create the one admin user (you) with an email + password. This is the only login the app supports — it's for `/admin/` only, clients never sign in.
4. Under **Project Settings → API**, copy the **Project URL** and **anon public key**.

### 2. Local environment
Copy `.env.local.example` to `.env.local` and fill in the two values from step 1.4:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then:

```
npm install
npm run dev
```

The anon key is meant to be public (it ships in the static bundle); access control is enforced by Supabase Row Level Security and the `unlock_shoot` RPC, not by hiding the key.

### 3. GitHub Pages deploy
1. In the repo's **Settings → Secrets and variables → Actions**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as repository secrets (same values as `.env.local`).
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. Push to `main` — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the static export and publishes it.
4. For the `sheffield.lol` domain: the build includes a `public/CNAME` file with `sheffield.lol`. At your DNS provider, point the domain at GitHub Pages (an `ALIAS`/`ANAME` or `A` records per [GitHub's docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)), then set the custom domain in **Settings → Pages** and enable "Enforce HTTPS" once it verifies.

## Using it

- **Admin**: go to `/admin/`, sign in, create a shoot (title, client name, passcode, your email), then upload photos for it — they're compressed to ~250KB in the browser before upload. Copy the client link shown next to each shoot (`/gallery/?slug=...`) and send it with the passcode.
- **Client**: opens the link, enters the passcode, browses the grid, taps a photo to crop/rotate/favorite it, and can hit "Request full-res" to open an email to you with the shoot and filename pre-filled.

## Notes
- The shoot passcode is a soft gate (plain text, checked via a Postgres RPC) — good enough to keep a gallery from being stumbled on, not a hard security boundary.
- Only compressed previews are ever stored in Supabase; full-resolution originals stay on your machine and are sent manually when a client emails you.
