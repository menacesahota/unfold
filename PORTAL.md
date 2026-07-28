# Customer portal

Customers track orders from enquiry → sample → production → dispatch → delivery.

## Try it now (demo mode)

No backend required. Open `/portal.html` and sign in with:

- Customer: `demo@customer.com` / `demo1234`
- Admin: `admin@unfold.supply` / `admin1234`

Demo data lives in the browser (`localStorage`) until Supabase is connected.

## Production (Supabase)

1. Create a free [Supabase](https://supabase.com) project.
2. In the SQL editor, run `supabase/schema.sql`.
3. Authentication → Providers → Email: enable email/password.
4. Copy Project URL and anon key into Render env vars (and local `.env`):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Create customer accounts via the portal sign-up page.
6. Promote your ops user to admin in Supabase SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'you@unfold.supply';
```

7. Redeploy on Render so Vite embeds the env vars.

## Pages

| URL | Purpose |
|---|---|
| `/portal.html` | Login + order list |
| `/portal-order.html?id=…` | Journey, boxes, prices, lead times, dispatch |
| `/portal-admin.html` | Create orders + publish status updates |

## Journey statuses

enquiry → quoted → sample_in_progress → sample_shipped → sample_approved → in_production → quality_check → dispatched → delivered

Also: `on_hold`, `cancelled`.
