create or replace function public.create_family_invite(p_workspace_id uuid)
returns table(token text, pin text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
  raw_pin text := lpad((floor(random() * 1000000))::int::text, 6, '0');
  expiry timestamptz := now() + interval '24 hours';
begin
  if not exists (
    select 1
    from public.family_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception '초대 권한이 없습니다.';
  end if;

  insert into public.family_invites(
    workspace_id, token, pin_hash, expires_at, created_by
  ) values (
    p_workspace_id,
    raw_token,
    extensions.crypt(raw_pin, extensions.gen_salt('bf')),
    expiry,
    auth.uid()
  );

  return query select raw_token, raw_pin, expiry;
end
$$;

revoke all on function public.create_family_invite(uuid) from public;
grant execute on function public.create_family_invite(uuid) to authenticated;
