-- TP6: tabla comentarios + RLS en restaurantes y comentarios + permisos del bucket

create table if not exists public.comentarios (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  restaurante_id bigint not null references public.restaurantes(id) on delete cascade,
  texto text not null,
  user_email text not null
);

alter table public.restaurantes enable row level security;
alter table public.comentarios enable row level security;

-- restaurantes
drop policy if exists "Permitir lectura publica" on public.restaurantes;
drop policy if exists "Permitir insertar a usuarios logueados" on public.restaurantes;
drop policy if exists "Permitir editar solo al dueño" on public.restaurantes;
drop policy if exists "Permitir borrar solo al dueño" on public.restaurantes;

create policy "Permitir lectura publica" on public.restaurantes
  for select to public using (true);
create policy "Permitir insertar a usuarios logueados" on public.restaurantes
  for insert to authenticated with check (true);
-- En SQL, UPDATE y DELETE van en dos políticas (en el panel se arman juntas)
create policy "Permitir editar solo al dueño" on public.restaurantes
  for update to authenticated
  using (auth.jwt() ->> 'email' = user_email) with check (auth.jwt() ->> 'email' = user_email);
create policy "Permitir borrar solo al dueño" on public.restaurantes
  for delete to authenticated
  using (auth.jwt() ->> 'email' = user_email);

-- comentarios
drop policy if exists "Permitir lectura publica" on public.comentarios;
drop policy if exists "Permitir insertar a usuarios logueados" on public.comentarios;

create policy "Permitir lectura publica" on public.comentarios
  for select to public using (true);
create policy "Permitir insertar a usuarios logueados" on public.comentarios
  for insert to authenticated with check (true);

-- bucket 'fotos': ahora ver es público y subir/cambiar/borrar requiere sesión
drop policy if exists "Permisos totales fotos" on storage.objects;
drop policy if exists "Ver fotos" on storage.objects;
drop policy if exists "Subir fotos con sesion" on storage.objects;

create policy "Ver fotos" on storage.objects
  for select to public using (bucket_id = 'fotos');
create policy "Subir fotos con sesion" on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos') with check (bucket_id = 'fotos');
