# Connect the customer portal (Supabase)

The site already switches to live mode when these env vars are set at **build** time.

## 1. Create a free Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. **New project** → name it `unfold` → set a strong DB password → region close to the UK (e.g. `eu-west-2` / London if available).
3. Wait until the project is ready.

## 2. Run the schema

1. In the project, open **SQL Editor** → **New query**.
2. Paste the full contents of `supabase/schema.sql` from this repo.
3. Click **Run**.

## 3. Auth settings

1. **Authentication → Providers → Email** — enable Email.
2. For a smoother launch, you can temporarily turn **off** “Confirm email” under **Authentication → Providers → Email** (turn it back on later).
3. **Authentication → URL Configuration**:
   - Site URL: `https://unfold.supply`
   - Redirect URLs add:
     - `https://unfold.supply/portal.html`
     - `http://localhost:5173/portal.html`

## 4. Copy API keys

**Project Settings → API**:

- Project URL → `VITE_SUPABASE_URL`
- `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

## 5. Local `.env`

Create `.env` in the project root (never commit it):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then:

```bash
npm run dev
```

Open `/portal.html` — demo credentials should be gone.

## 6. Render (production)

In the Render service → **Environment**:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | your project URL |
| `VITE_SUPABASE_ANON_KEY` | your anon key |

Trigger a **clear build / redeploy** so Vite embeds the vars.

## 7. Create your admin account

1. On the live site, open `/portal.html` → **Create account** with `hello@unfold.supply` (or your ops email).
2. In Supabase **SQL Editor** run:

```sql
update public.profiles
set role = 'admin'
where email = 'hello@unfold.supply';
```

3. Sign out and sign back in — you should see **Admin**.

## 8. Smoke test

1. Create a second account as a fake customer.
2. As admin: create an order for that customer with a box line and price.
3. Sign in as the customer — order appears with journey + pricing.
4. As admin: push status to **Sample approved** then **In production**.
5. Customer sees the updates.

## Notes

- Without the env vars, the portal stays in **demo** mode (browser-only).
- Customers cannot self-promote to admin (roles are forced to `customer` on sign-up).
- Orders are created/updated by admin only; customers can only read their own.
