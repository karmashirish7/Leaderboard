-- Run this once in Supabase Dashboard → SQL Editor

create table if not exists transactions (
  id                   text primary key,
  salesperson          text not null,
  store_name           text not null,
  subscription_type    text not null,
  subscription_duration text,
  total_amount         numeric not null default 0,
  paid_amount          numeric not null default 0,
  remaining_amount     numeric not null default 0,
  date                 text not null,
  created_at           timestamptz not null default now()
);

-- Allow public read/write (anon key) — tighten with RLS if needed
alter table transactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'transactions'
    and policyname = 'Allow all for anon'
  ) then
    execute $policy$
      create policy "Allow all for anon"
        on transactions
        for all
        to anon
        using (true)
        with check (true)
    $policy$;
  end if;
end $$;
