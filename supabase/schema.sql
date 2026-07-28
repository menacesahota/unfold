-- unfold customer portal schema
-- Run in Supabase SQL editor, then set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'admin');

create type public.order_status as enum (
  'enquiry',
  'quoted',
  'sample_in_progress',
  'sample_shipped',
  'sample_approved',
  'in_production',
  'quality_check',
  'dispatched',
  'delivered',
  'on_hold',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  company_name text not null default '',
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  title text not null default 'Box order',
  status public.order_status not null default 'enquiry',
  lead_time_days integer,
  estimated_dispatch_date date,
  estimated_delivery_date date,
  carrier text,
  tracking_number text,
  tracking_url text,
  dispatch_method text,
  dispatch_address text,
  dispatch_notes text,
  currency text not null default 'GBP',
  subtotal numeric(12, 2) not null default 0,
  vat numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  customer_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  name text not null default 'Custom box',
  fefco text not null default '0201',
  length_mm integer not null,
  width_mm integer not null,
  height_mm integer not null,
  board text not null default 'kraft',
  wall text not null default 'single',
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 4) not null default 0,
  line_total numeric(12, 2) not null default 0,
  brand_text text not null default '',
  print_notes text not null default '',
  sort_order integer not null default 0
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status,
  title text not null,
  detail text not null default '',
  happened_at timestamptz not null default now(),
  visible_to_customer boolean not null default true
);

create index orders_customer_id_idx on public.orders (customer_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_events_order_id_idx on public.order_events (order_id, happened_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, company_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

create policy "profiles read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles update own or admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

create policy "orders read own or admin"
  on public.orders for select
  using (customer_id = auth.uid() or public.is_admin());

create policy "orders write admin"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "items read via order"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = auth.uid() or public.is_admin())
    )
  );

create policy "items write admin"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "events read via order"
  on public.order_events for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = auth.uid() or public.is_admin())
        and (visible_to_customer = true or public.is_admin())
    )
  );

create policy "events write admin"
  on public.order_events for all
  using (public.is_admin())
  with check (public.is_admin());
