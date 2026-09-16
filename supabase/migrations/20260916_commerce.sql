-- Apply after schema.sql. Enable VITE_COMMERCE_ENABLED only after access tests pass.
-- Prevent a customer changing their profile role through the legacy update policy.
create or replace function public.protect_profile_role() returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and current_user not in ('postgres','supabase_admin') and not public.is_admin() then
    raise exception 'Only an administrator can change account roles';
  end if;
  return new;
end; $$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute function public.protect_profile_role();

create table if not exists public.packaging_quotes (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.profiles(id),
 reference text not null,
 version integer not null default 1 check(version>0),
 title text not null,
 specification text not null,
 quantity integer not null check(quantity>0),
 goods numeric(12,2) not null check(goods>=0),
 setup numeric(12,2) not null default 0 check(setup>=0),
 delivery numeric(12,2) not null default 0 check(delivery>=0),
 vat numeric(12,2) not null check(vat>=0),
 valid_until date not null,
 timing text not null,
 terms text not null,
 proof_path text,
 proof_version text,
 payment_url text,
 status text not null default 'draft' check(status in ('draft','sent','changes','accepted','superseded')),
 accepted_at timestamptz,
 order_id uuid references public.orders(id),
 created_at timestamptz not null default now(),
 unique(reference,version),
 check(payment_url is null or payment_url ~ '^https://invoice\.stripe\.com/i/[A-Za-z0-9_/?=.-]+$'),
 check((proof_path is null and proof_version is null) or (proof_path is not null and proof_version is not null))
);
create table if not exists public.packaging_quote_events (
 id uuid primary key default gen_random_uuid(),
 quote_id uuid not null references public.packaging_quotes(id),
 actor uuid not null references public.profiles(id),
 action text not null,
 detail text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.packaging_enquiries (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique,
 customer_id uuid references public.profiles(id),
 contact text not null,
 brief text not null,
 state text not null default 'new' check(state in ('new','checking','quoted','closed')),
 due_at timestamptz,
 owner_notes text not null default '',
 created_at timestamptz not null default now()
);
alter table public.packaging_quotes enable row level security;
alter table public.packaging_quote_events enable row level security;
alter table public.packaging_enquiries enable row level security;
create policy "read own published quotes" on public.packaging_quotes for select to authenticated using(public.is_admin() or (customer_id=auth.uid() and status<>'draft'));
create policy "admin creates draft quotes" on public.packaging_quotes for insert to authenticated with check(public.is_admin() and status='draft' and accepted_at is null);
-- All state changes use the locked RPC below; published quotes cannot be edited in place.
create policy "read quote events" on public.packaging_quote_events for select to authenticated using(exists(select 1 from public.packaging_quotes q where q.id=quote_id and (public.is_admin() or (q.customer_id=auth.uid() and q.status<>'draft'))));
create policy "admin enquiry queue" on public.packaging_enquiries for all to authenticated using(public.is_admin()) with check(public.is_admin());

create or replace function public.respond_packaging_quote(p_id uuid,p_action text,p_detail text default '') returns void language plpgsql security definer set search_path=public as $$
declare q public.packaging_quotes; admin boolean; new_order uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select * into q from public.packaging_quotes where id=p_id for update;
 if not found then raise exception 'Quote unavailable'; end if;
 admin := public.is_admin();
 if p_action='publish' then
  if not admin or q.status<>'draft' then raise exception 'Draft and admin access required'; end if;
  if q.valid_until < current_date or length(trim(q.terms))<10 or length(trim(q.specification))<10 then raise exception 'Complete terms and specification required'; end if;
  -- Serialize publication of revisions under the same reference.
  perform pg_advisory_xact_lock(hashtext(q.reference));
  if exists(select 1 from public.packaging_quotes where reference=q.reference and customer_id<>q.customer_id) then raise exception 'A reference belongs to one customer'; end if;
  if exists(select 1 from public.packaging_quotes where reference=q.reference and status='accepted') then raise exception 'Accepted quote is immutable; create a new reference'; end if;
  if exists(select 1 from public.packaging_quotes where reference=q.reference and version>=q.version and id<>q.id and status<>'draft') then raise exception 'Publish a newer version'; end if;
  update public.packaging_quotes set status='superseded' where reference=q.reference and status in ('sent','changes');
  update public.packaging_quotes set status='sent' where id=p_id;
 elsif p_action in ('accept','changes') then
  if q.customer_id<>auth.uid() or q.status<>'sent' or q.valid_until<current_date then raise exception 'Quote is not available for a response'; end if;
  perform pg_advisory_xact_lock(hashtext(q.reference));
  if p_action='accept' then
   insert into public.orders(order_number,customer_id,title,status,subtotal,vat,total,customer_notes)
   values('Q-'||q.id::text,q.customer_id,q.title,'quoted',q.goods+q.setup+q.delivery,q.vat,q.goods+q.setup+q.delivery+q.vat,
     'Approved quote '||q.reference||' v'||q.version||E'\n'||q.specification||E'\nQuantity: '||q.quantity||E'\nTiming: '||q.timing||E'\nPayment and production release require confirmation.') returning id into new_order;
   insert into public.order_events(order_id,status,title,detail) values(new_order,'quoted','Quote approved','Customer approved quote '||q.reference||' v'||q.version||'. Payment is not yet confirmed.');
   update public.packaging_quotes set status='accepted',accepted_at=now(),order_id=new_order where id=p_id;
  else
   if length(trim(p_detail))<3 then raise exception 'Describe the requested change'; end if;
   update public.packaging_quotes set status='changes' where id=p_id;
  end if;
 elsif p_action='withdraw' then
  if not admin or q.status not in ('draft','sent','changes') then raise exception 'Cannot withdraw this quote'; end if;
  update public.packaging_quotes set status='superseded' where id=p_id;
 else raise exception 'Unknown action'; end if;
 insert into public.packaging_quote_events(quote_id,actor,action,detail) values(p_id,auth.uid(),p_action,left(p_detail,5000));
end; $$;
revoke all on function public.respond_packaging_quote(uuid,text,text) from public;
grant execute on function public.respond_packaging_quote(uuid,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('packaging-proofs','packaging-proofs',false,10485760,array['application/pdf','image/png','image/jpeg']) on conflict(id) do nothing;
create policy "admins upload immutable proofs" on storage.objects for insert to authenticated with check(bucket_id='packaging-proofs' and public.is_admin());
create policy "read own published proof" on storage.objects for select to authenticated using(bucket_id='packaging-proofs' and (public.is_admin() or exists(select 1 from public.packaging_quotes q where q.proof_path=name and q.customer_id=auth.uid() and q.status<>'draft')));
