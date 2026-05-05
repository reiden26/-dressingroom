-- ============================================================
-- Migración: reemplaza body_measurements por scans
-- Ejecutar SOLO si ya corriste el schema anterior
-- ============================================================

-- Eliminar tabla anterior si existe
drop table if exists public.body_measurements;

-- Crear tabla scans (si no existe ya)
create table if not exists public.scans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  shoulders    numeric(5,1) not null,
  chest        numeric(5,1) not null,
  waist        numeric(5,1) not null,
  hips         numeric(5,1) not null,
  inseam       numeric(5,1) not null,
  arm_length   numeric(5,1) not null,
  torso_length numeric(5,1) not null,
  confidence   numeric(4,3) default 0,
  bmi          numeric(4,1),
  is_estimated boolean default true,
  photo_front  text,
  photo_side   text,
  photo_back   text,
  height_at_scan  numeric(5,1),
  weight_at_scan  numeric(5,1),
  captured_at  timestamptz default now()
);

-- RLS
alter table public.scans enable row level security;

create policy "Users can view own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scans"
  on public.scans for update
  using (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  using (auth.uid() = user_id);
