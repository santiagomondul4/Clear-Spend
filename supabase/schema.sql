-- Budget & Expense Tracker
-- Paste this script into the Supabase SQL Editor.
-- Creates profiles, categories, and transactions with row level security
-- so each user can only read and write their own budget data.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  currency_symbol text not null default '$',
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  budget_limit numeric(12, 2) not null default 0 check (budget_limit >= 0),
  icon_name text not null,
  color_hex text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

comment on column public.categories.budget_limit is 'Monthly budget target for this category.';

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('credit', 'debit')),
  name text not null check (char_length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

comment on table public.payment_methods is 'Card names the user saved for credit or debit. Cash has no saved name.';

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category_id uuid not null,
  payment_kind text not null check (payment_kind in ('credit', 'debit', 'cash')),
  card_name text,
  transaction_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete restrict,
  constraint transactions_card_name_check check (
    (payment_kind = 'cash' and card_name is null)
    or (
      payment_kind in ('credit', 'debit')
      and card_name is not null
      and char_length(btrim(card_name)) > 0
    )
  )
);

create index categories_user_id_idx on public.categories (user_id);
create index payment_methods_user_id_idx on public.payment_methods (user_id);
create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_category_user_idx on public.transactions (category_id, user_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.transactions enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.categories from public, anon, authenticated;
revoke all on table public.payment_methods from public, anon, authenticated;
revoke all on table public.transactions from public, anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.payment_methods to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy categories_select_own
  on public.categories
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy categories_insert_own
  on public.categories
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy categories_update_own
  on public.categories
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy categories_delete_own
  on public.categories
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy payment_methods_select_own
  on public.payment_methods
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy payment_methods_insert_own
  on public.payment_methods
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy payment_methods_update_own
  on public.payment_methods
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy payment_methods_delete_own
  on public.payment_methods
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy transactions_select_own
  on public.transactions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy transactions_insert_own
  on public.transactions
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy transactions_update_own
  on public.transactions
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy transactions_delete_own
  on public.transactions
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  );

  insert into public.categories (user_id, name, budget_limit, icon_name, color_hex)
  values
    (new.id, 'Food & Dining', 400, 'Utensils', '#818cf8'),
    (new.id, 'Bills & Utilities', 1200, 'Receipt', '#a78bfa'),
    (new.id, 'Groceries', 500, 'ShoppingCart', '#34d399'),
    (new.id, 'Shopping', 0, 'ShoppingBag', '#f472b6'),
    (new.id, 'Entertainment', 0, 'Clapperboard', '#fbbf24'),
    (new.id, 'Transportation', 0, 'Car', '#38bdf8'),
    (new.id, 'Health', 0, 'HeartPulse', '#fb7185'),
    (new.id, 'Misc', 0, 'MoreHorizontal', '#94a3b8');

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

create or replace function public.set_transaction_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_transaction_updated_at() from public, anon;
grant execute on function public.set_transaction_updated_at() to authenticated;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_transaction_updated_at();
