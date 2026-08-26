-- Fix recursive RLS on usuarios by resolving gimnasio_id through a SECURITY DEFINER function.

create or replace function public.current_gimnasio_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select gimnasio_id
  from usuarios
  where auth_id = auth.uid()
  limit 1
$$;

revoke all on function public.current_gimnasio_id() from public;
grant execute on function public.current_gimnasio_id() to authenticated;

drop policy if exists gimnasio_isolation on usuarios;
drop policy if exists gimnasio_isolation on clientes;
drop policy if exists gimnasio_isolation on planes;
drop policy if exists gimnasio_isolation on membresias;
drop policy if exists gimnasio_isolation on turnos_caja;
drop policy if exists gimnasio_isolation on pagos;
drop policy if exists gimnasio_isolation on gastos;
drop policy if exists gimnasio_isolation on asistencias;
drop policy if exists gimnasio_isolation on config_sistema;
drop policy if exists gimnasio_own on gimnasios;

create policy usuarios_select_own_gym on usuarios
  for select
  using (gimnasio_id = public.current_gimnasio_id());

create policy usuarios_write_own_gym on usuarios
  for insert
  with check (gimnasio_id = public.current_gimnasio_id());

create policy usuarios_update_own_gym on usuarios
  for update
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy clientes_isolation on clientes
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy planes_isolation on planes
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy membresias_isolation on membresias
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy turnos_caja_isolation on turnos_caja
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy pagos_isolation on pagos
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy gastos_isolation on gastos
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy asistencias_isolation on asistencias
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy config_sistema_isolation on config_sistema
  for all
  using (gimnasio_id = public.current_gimnasio_id())
  with check (gimnasio_id = public.current_gimnasio_id());

create policy gimnasios_own on gimnasios
  for all
  using (id = public.current_gimnasio_id())
  with check (id = public.current_gimnasio_id());
