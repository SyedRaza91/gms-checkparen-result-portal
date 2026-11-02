create extension if not exists pgcrypto;
create table public.admin_users(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create table public.examinations(id uuid primary key default gen_random_uuid(),name text not null,academic_year text not null,created_at timestamptz not null default now(),unique(name,academic_year));
create table public.students(id uuid primary key default gen_random_uuid(),admission_number text not null unique,student_name text not null,father_name text not null,class_name text not null check(class_name in('1st','2nd','3rd','4th','5th','6th','7th','8th')),roll_number text not null,created_at timestamptz not null default now());
create index students_class_roll_idx on public.students(class_name,roll_number);
create table public.results(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id) on delete cascade,examination_id uuid not null references public.examinations(id) on delete cascade,subject_marks jsonb not null,total_obtained numeric(9,2) not null default 0,total_maximum numeric(9,2) not null default 0,percentage numeric(5,2) not null default 0,grade text not null default 'F',result_status text not null default 'Needs Improvement',remarks text not null default '',is_published boolean not null default false,published_at timestamptz,created_at timestamptz not null default now(),unique(student_id,examination_id),check(total_maximum>=0 and total_obtained>=0 and total_obtained<=total_maximum));
create table public.lookup_rate_limits(ip_hash text primary key,window_started_at timestamptz not null,attempts integer not null default 0);
alter table public.admin_users enable row level security;alter table public.examinations enable row level security;alter table public.students enable row level security;alter table public.results enable row level security;alter table public.lookup_rate_limits enable row level security;
revoke all on public.admin_users,public.examinations,public.students,public.results,public.lookup_rate_limits from anon,authenticated;
grant select on public.admin_users to authenticated;
grant select,insert,update,delete on public.examinations,public.students,public.results to authenticated;
create or replace function public.is_school_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.admin_users where user_id=(select auth.uid()));$$;
create policy "Admin reads own allowlist" on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
create policy "School admin manages exams" on public.examinations for all to authenticated using(public.is_school_admin()) with check(public.is_school_admin());
create policy "School admin manages students" on public.students for all to authenticated using(public.is_school_admin()) with check(public.is_school_admin());
create policy "School admin manages results" on public.results for all to authenticated using(public.is_school_admin()) with check(public.is_school_admin());
create or replace function public.consume_lookup_attempt(p_ip_hash text) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 insert into public.lookup_rate_limits(ip_hash,window_started_at,attempts) values(p_ip_hash,now(),1)
 on conflict(ip_hash) do update set attempts=case when lookup_rate_limits.window_started_at<now()-interval '10 minutes' then 1 else lookup_rate_limits.attempts+1 end,
 window_started_at=case when lookup_rate_limits.window_started_at<now()-interval '10 minutes' then now() else lookup_rate_limits.window_started_at end
 returning attempts into n;
 return n<=8;
end;$$;
revoke all on function public.consume_lookup_attempt(text) from public,anon,authenticated;
grant execute on function public.consume_lookup_attempt(text) to service_role;
