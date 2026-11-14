-- TP2: tabel restaurantes (SQL Editor de Supabase). Equivale a crearla en el Table Editor.
create table if not exists public.restaurantes (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nombre text not null,
  cocina text,
  puntuacion numeric(3,1) check (puntuacion between 0 and 10),
  resena text,
  imagen_url text,
  user_email text
);

-- Sin RLS para poder hacer pruebas (en el TP6 se vuelve a activar)
alter table public.restaurantes disable row level security;

-- "Enable Realtime"
alter publication supabase_realtime add table public.restaurantes;
