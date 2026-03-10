create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    role text not null,
    granted_by_user_id uuid references public.users(id),
    created_at timestamptz not null default now(),
    constraint user_roles_user_id_role_key unique (user_id, role)
);

insert into public.user_roles (user_id, role)
select u.id, 'student'
from public.users u
on conflict (user_id, role) do nothing;

insert into public.user_roles (user_id, role)
select cp.user_id, 'creator'
from public.creator_profiles cp
on conflict (user_id, role) do nothing;
