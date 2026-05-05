-- ============================================================
-- VFR — Supabase Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── Tabla de perfiles de usuario ────────────────────────────
create table if not exists public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  height       numeric(5,1) not null,
  weight       numeric(5,1) not null,
  gender       numeric(3,1) default 1.5,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── Tabla de escaneos (historial) ───────────────────────────
-- Cada escaneo agrupa medidas + fotos de las 3 poses
create table if not exists public.scans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Medidas corporales
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
  -- Fotos (base64 data URLs — almacenadas directamente para simplicidad)
  photo_front  text,
  photo_side   text,
  photo_back   text,
  -- Datos del perfil en el momento del escaneo
  height_at_scan  numeric(5,1),
  weight_at_scan  numeric(5,1),
  captured_at  timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.user_profiles enable row level security;
alter table public.scans enable row level security;

-- Políticas para user_profiles
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.user_profiles for delete
  using (auth.uid() = id);

-- Políticas para scans
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

-- ─── Trigger: updated_at automático ──────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_profiles_updated
  before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();
