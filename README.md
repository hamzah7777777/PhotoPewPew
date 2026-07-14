# HSBC IRL — Event Email Sign-up

A QR-code email sign-up tool for events. Project a QR code on the big screen, attendees scan it on their phones and submit their email, and afterward you export the list as a `.txt` file (one email per line).

Fully static (Next.js `output: "export"`) deployed to GitHub Pages — all data lives in Supabase (Postgres + Auth), no server.

## One-time setup

### 1. Supabase project
1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then [`supabase/migrations/0002_pivot_to_event_signup.sql`](supabase/migrations/0002_pivot_to_event_signup.sql) (the second one drops the old photo-gallery schema this project started as, and creates the `events`/`signups` tables used today), then [`supabase/migrations/0003_event_display_options.sql`](supabase/migrations/0003_event_display_options.sql) (adds the per-event subtitle, sub text, and theme columns), then [`supabase/migrations/0004_event_background_image.sql`](supabase/migrations/0004_event_background_image.sql) (adds the optional background image column and its storage bucket), then [`supabase/migrations/0005_restrict_background_mime_types.sql`](supabase/migrations/0005_restrict_background_mime_types.sql) (restricts the bucket to PNG/JPEG uploads).
3. Under **Authentication → Users**, manually create the one admin user (you) with an email + password. This is the only login the app supports — it's for `/admin/` only, attendees never sign in.
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

The anon key is meant to be public (it ships in the static bundle); access control is enforced by Supabase Row Level Security — anyone can submit a signup, but only the signed-in admin can read or export them.

### 3. GitHub Pages deploy
1. In the repo's **Settings → Secrets and variables → Actions**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as repository secrets (same values as `.env.local`).
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. Push to `main` — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the static export and publishes it.
4. For the `sheffield.lol` domain: the build includes a `public/CNAME` file with `sheffield.lol`. At your DNS provider, point the domain at GitHub Pages (an `ALIAS`/`ANAME` or `A` records per [GitHub's docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)), then set the custom domain in **Settings → Pages** and enable "Enforce HTTPS" once it verifies.

## Using it

- **Admin**: go to `/admin/`, sign in, create a QR code — pick a title (e.g. "9 July 2026 Meeting"), an optional subtitle, the sub text shown under the QR code, an optional PNG or JPG background image (shown behind the QR code on the display page; images over 5 MB are automatically compressed in the browser before upload), and one of four colour themes (Classic, Midnight, Sunset, Forest). Each event gets its own QR code and email list.
- **At the event**: click **Display QR** on the event to open `/display/?event=...` in a new tab — put that on the projector. Attendees scan it, land on `/join/?event=...`, and submit their email. Scanning twice is harmless — duplicates are quietly treated as "already joined."
- **After the event**: click **Export emails (.txt)** to download every collected email for that event, one per line.

## Notes
- No passcode or login is needed to submit an email — the QR/join link itself is the only gate, same trust level the photo-gallery passcode used to have.
- `events` are publicly readable (needed so the display/join pages can resolve a link without logging in) but only the admin can create, edit, or delete them. `signups` can be inserted by anyone but only read or deleted by the admin, so attendees can't see each other's emails.
