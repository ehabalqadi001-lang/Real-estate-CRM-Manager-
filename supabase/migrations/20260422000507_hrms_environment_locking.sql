-- Fast Investment HRMS: departments, employee onboarding, environment locking, and attendance.

alter table public.departments
  add column if not exists name_ar text,
  add column if not exists manager_id uuid;

insert into public.departments (name, slug, description, name_ar)
values
  ('Sales', 'sales', 'Sales brokerage and deal closing', 'المبيعات'),
  ('Finance', 'finance', 'Payroll, commissions, and payouts', 'المالية'),
  ('Marketing', 'marketing', 'Campaigns and lead acquisition', 'التسويق'),
  ('Data Entry', 'data-entry', 'Inventory and master data operations', 'إدخال البيانات'),
  ('Customer Service', 'customer-service', 'Client support and communications', 'خدمة العملاء'),
  ('Human Resources', 'hr', 'Hiring, attendance, and payroll governance', 'الموارد البشرية')
on conflict (slug) do update
set
  name_ar = excluded.name_ar,
  description = excluded.description;

alter table public.user_profiles
  add column if not exists username text;

create unique index if not exists user_profiles_username_key
  on public.user_profiles (lower(username))
  where username is not null;

alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

alter table public.employees
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists basic_salary numeric(12,2),
  add column if not exists commission_rate numeric(5,2) not null default 0,
  add column if not exists status text not null default 'active',
  add column if not exists allowed_ip text,
  add column if not exists allowed_wifi_ssid text,
  add column if not exists allowed_lat numeric(10,7),
  add column if not exists allowed_long numeric(10,7),
  add column if not exists allowed_radius integer not null default 150,
  add column if not exists is_env_locked boolean not null default false,
  add column if not exists environment_locked_at timestamptz,
  add column if not exists environment_locked_by uuid references auth.users(id);

update public.employees
set
  user_id = coalesce(user_id, id),
  basic_salary = coalesce(basic_salary, base_salary),
  status = case when termination_date is null then status else 'inactive' end
where user_id is null or basic_salary is null;

create unique index if not exists employees_user_id_key
  on public.employees (user_id)
  where user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_status_check'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
      add constraint employees_status_check
      check (status in ('active','probation','suspended','inactive','terminated'));
  end if;
end $$;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status text not null default 'present'
    check (status in ('present','absent','late','half_day','remote','leave','blocked')),
  environment_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, date)
);

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2020),
  total_commissions numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_salary numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, month, year)
);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select up.role from public.user_profiles up where up.id = auth.uid() limit 1),
    (select p.role from public.profiles p where p.id = auth.uid() limit 1),
    'viewer'
  );
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select up.company_id from public.user_profiles up where up.id = auth.uid() limit 1),
    (select p.company_id from public.profiles p where p.id = auth.uid() limit 1)
  );
$$;

create or replace function public.is_hr_manager()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.current_user_role() in (
    'super_admin',
    'platform_admin',
    'hr_manager',
    'hr_staff',
    'hr_officer'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.current_user_role() in ('super_admin', 'platform_admin');
$$;

alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.payroll enable row level security;

drop policy if exists "departments_read_all" on public.departments;
drop policy if exists "departments_hr_write" on public.departments;

create policy "departments_read_all"
  on public.departments
  for select
  to authenticated
  using (true);

create policy "departments_hr_write"
  on public.departments
  for all
  to authenticated
  using (public.is_hr_manager())
  with check (public.is_hr_manager());

drop policy if exists "employees_select" on public.employees;
drop policy if exists "employees_insert" on public.employees;
drop policy if exists "employees_update" on public.employees;
drop policy if exists "employees_delete" on public.employees;

create policy "employees_select"
  on public.employees
  for select
  to authenticated
  using (
    public.is_super_admin()
    or user_id = auth.uid()
    or (
      public.is_hr_manager()
      and company_id = public.current_company_id()
    )
  );

create policy "employees_insert"
  on public.employees
  for insert
  to authenticated
  with check (
    public.is_hr_manager()
    and (
      public.is_super_admin()
      or company_id = public.current_company_id()
    )
  );

create policy "employees_update"
  on public.employees
  for update
  to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_hr_manager()
      and company_id = public.current_company_id()
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.is_hr_manager()
      and company_id = public.current_company_id()
    )
  );

create policy "employees_delete"
  on public.employees
  for delete
  to authenticated
  using (public.is_super_admin());

drop policy if exists "attendance_select" on public.attendance;
drop policy if exists "attendance_insert" on public.attendance;
drop policy if exists "attendance_update" on public.attendance;

create policy "attendance_select"
  on public.attendance
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.employees e
      where e.id = attendance.employee_id
        and (
          e.user_id = auth.uid()
          or public.is_super_admin()
          or (public.is_hr_manager() and e.company_id = public.current_company_id())
        )
    )
  );

create policy "attendance_insert"
  on public.attendance
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.employees e
      where e.id = attendance.employee_id
        and (e.user_id = auth.uid() or public.is_hr_manager())
    )
  );

create policy "attendance_update"
  on public.attendance
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.employees e
      where e.id = attendance.employee_id
        and (e.user_id = auth.uid() or public.is_hr_manager())
    )
  )
  with check (
    exists (
      select 1
      from public.employees e
      where e.id = attendance.employee_id
        and (e.user_id = auth.uid() or public.is_hr_manager())
    )
  );

drop policy if exists "payroll_select" on public.payroll;
drop policy if exists "payroll_write" on public.payroll;

create policy "payroll_select"
  on public.payroll
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.employees e
      where e.id = payroll.employee_id
        and (
          e.user_id = auth.uid()
          or public.is_super_admin()
          or (public.is_hr_manager() and e.company_id = public.current_company_id())
        )
    )
  );

create policy "payroll_write"
  on public.payroll
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.employees e
      where e.id = payroll.employee_id
        and (public.is_super_admin() or (public.is_hr_manager() and e.company_id = public.current_company_id()))
    )
  )
  with check (
    exists (
      select 1
      from public.employees e
      where e.id = payroll.employee_id
        and (public.is_super_admin() or (public.is_hr_manager() and e.company_id = public.current_company_id()))
    )
  );

create index if not exists attendance_employee_date_idx on public.attendance(employee_id, date desc);
create index if not exists payroll_employee_period_idx on public.payroll(employee_id, year desc, month desc);
create index if not exists employees_company_department_idx on public.employees(company_id, department_id);
