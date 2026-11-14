-- Bucket público 'fotos' + permisos abiertos (TP2 a TP5, todavía sin login)
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict (id) do nothing;

drop policy if exists "Permisos totales fotos" on storage.objects;
create policy "Permisos totales fotos" on storage.objects
  for all to public
  using (bucket_id = 'fotos') with check (bucket_id = 'fotos');
