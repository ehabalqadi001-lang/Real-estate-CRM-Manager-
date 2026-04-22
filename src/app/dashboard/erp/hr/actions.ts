'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type HrActionState = {
  ok: boolean
  message: string
}

export type EnvironmentPayload = {
  employeeId: string
  latitude: number | null
  longitude: number | null
  wifiSsid?: string | null
  radius?: number | null
}

const HR_WRITE_ROLES: AppRole[] = [
  'super_admin',
  'platform_admin',
  'hr_manager',
  'hr_staff',
  'hr_officer',
]

const EMPLOYEE_ROLES: AppRole[] = [
  'agent',
  'senior_agent',
  'branch_manager',
  'finance_officer',
  'finance_manager',
  'hr_manager',
  'hr_staff',
  'hr_officer',
  'customer_support',
  'cs_agent',
  'cs_supervisor',
  'marketing_manager',
  'campaign_specialist',
  'inventory_rep',
  'data_manager',
  'viewer',
]

export async function createEmployeeAction(_prev: HrActionState, formData: FormData): Promise<HrActionState> {
  try {
    const session = await requireHrWrite()
    const companyId = session.profile.company_id ?? session.profile.tenant_id
    if (!companyId) return fail('لا توجد شركة مرتبطة بحساب المدير الحالي.')

    const fullName = clean(formData.get('fullName'))
    const username = clean(formData.get('username')).toLowerCase()
    const emailInput = clean(formData.get('email')).toLowerCase()
    const phone = clean(formData.get('phone'))
    const password = String(formData.get('password') ?? '')
    const departmentId = clean(formData.get('departmentId'))
    const jobTitle = clean(formData.get('jobTitle'))
    const role = clean(formData.get('role')) as AppRole
    const basicSalary = toMoney(formData.get('basicSalary'))
    const commissionRate = toMoney(formData.get('commissionRate'))
    const hireDate = clean(formData.get('hireDate')) || new Date().toISOString().slice(0, 10)

    if (!fullName || !username || !password || !departmentId || !jobTitle) {
      return fail('أكمل الاسم واسم المستخدم وكلمة المرور والقسم والمسمى الوظيفي.')
    }

    if (password.length < 8) {
      return fail('كلمة المرور يجب ألا تقل عن 8 أحرف.')
    }

    if (!EMPLOYEE_ROLES.includes(role)) {
      return fail('الدور الوظيفي المختار غير مسموح في نظام الموارد البشرية.')
    }

    const email = emailInput || `${username}@fastinvestment.local`
    const service = createServiceRoleClient()

    const { data: existingUsername } = await service
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingUsername) {
      return fail('اسم المستخدم موجود بالفعل. اختر اسم مستخدم آخر.')
    }

    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: phone || undefined,
      user_metadata: {
        username,
        full_name: fullName,
      },
      app_metadata: {
        role,
        company_id: companyId,
      },
    })

    if (createError || !created.user) {
      return fail(createError?.message ?? 'تعذر إنشاء حساب الموظف في نظام الدخول.')
    }

    const userId = created.user.id
    const [firstName, ...restName] = fullName.split(/\s+/)
    const lastName = restName.join(' ') || firstName
    const employeeNumber = `FI-${new Date().getFullYear()}-${userId.slice(0, 8).toUpperCase()}`

    const profilePayload = {
      id: userId,
      full_name: fullName,
      username,
      email,
      phone,
      role,
      company_id: companyId,
      account_type: 'company',
      status: 'active',
      is_active: true,
      hire_date: hireDate,
    }

    const userProfilePayload = {
      id: userId,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      phone,
      role,
      company_id: companyId,
      account_type: 'company',
      status: 'active',
      onboarding_completed: true,
    }

    const { error: profileError } = await service.from('profiles').upsert(profilePayload, { onConflict: 'id' })
    if (profileError) throw profileError

    const { error: userProfileError } = await service.from('user_profiles').upsert(userProfilePayload, { onConflict: 'id' })
    if (userProfileError) throw userProfileError

    const { error: employeeError } = await service.from('employees').upsert({
      id: userId,
      user_id: userId,
      company_id: companyId,
      employee_number: employeeNumber,
      department_id: departmentId,
      job_title: jobTitle,
      hire_date: hireDate,
      base_salary: basicSalary,
      basic_salary: basicSalary,
      commission_rate: commissionRate,
      employment_type: 'full_time',
      salary_currency: 'EGP',
      pay_cycle: 'monthly',
      status: 'active',
    }, { onConflict: 'id' })

    if (employeeError) throw employeeError

    revalidatePath('/dashboard/erp/hr')
    return { ok: true, message: `تم إنشاء حساب ${fullName} بنجاح.` }
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء إنشاء الموظف.')
  }
}

export async function bindEmployeeEnvironmentAction(payload: EnvironmentPayload): Promise<HrActionState> {
  try {
    const session = await requireHrWrite()
    const companyId = session.profile.company_id ?? session.profile.tenant_id
    const ip = await getRequestIp()
    const service = createServiceRoleClient()

    const { data: employee, error: employeeError } = await service
      .from('employees')
      .select('id, company_id')
      .eq('id', payload.employeeId)
      .maybeSingle()

    if (employeeError) throw employeeError
    if (!employee) return fail('الموظف غير موجود.')
    if (session.profile.role !== 'super_admin' && employee.company_id !== companyId) {
      return fail('لا تملك صلاحية ربط بيئة هذا الموظف.')
    }

    const { error } = await service
      .from('employees')
      .update({
        allowed_ip: ip,
        allowed_wifi_ssid: payload.wifiSsid?.trim() || null,
        allowed_lat: payload.latitude,
        allowed_long: payload.longitude,
        allowed_radius: payload.radius ?? 150,
        is_env_locked: true,
        environment_locked_at: new Date().toISOString(),
        environment_locked_by: session.user.id,
      })
      .eq('id', payload.employeeId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr')
    return { ok: true, message: 'تم ربط بيئة العمل لهذا الموظف بنجاح.' }
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'تعذر ربط بيئة العمل.')
  }
}

export async function attendancePunchAction(payload: Omit<EnvironmentPayload, 'employeeId'>): Promise<HrActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()
    const requestIp = await getRequestIp()

    const { data: employee, error: employeeError } = await service
      .from('employees')
      .select('id, company_id, user_id, is_env_locked, allowed_ip, allowed_wifi_ssid, allowed_lat, allowed_long, allowed_radius')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (employeeError) throw employeeError
    if (!employee) return fail('لا يوجد ملف موظف مرتبط بحسابك. تواصل مع الموارد البشرية.')
    if (!employee.is_env_locked) return fail('لم يتم ربط بيئة العمل بعد. تواصل مع الموارد البشرية.')

    const validation = validateEnvironment({
      requestIp,
      wifiSsid: payload.wifiSsid ?? null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      employee,
    })

    if (!validation.allowed) {
      await service.from('attendance').upsert({
        employee_id: employee.id,
        date: today(),
        status: 'blocked',
        environment_metadata: validation.metadata,
      }, { onConflict: 'employee_id,date' })

      return fail('خارج النطاق المسموح. لا يمكن تسجيل الحضور من هذه البيئة.')
    }

    const { data: current, error: currentError } = await service
      .from('attendance')
      .select('id, check_in, check_out')
      .eq('employee_id', employee.id)
      .eq('date', today())
      .maybeSingle()

    if (currentError) throw currentError

    const now = new Date().toISOString()
    const update = current?.check_in
      ? { check_out: now, status: 'present', environment_metadata: validation.metadata, updated_at: now }
      : { check_in: now, status: 'present', environment_metadata: validation.metadata, updated_at: now }

    const { error: attendanceError } = await service.from('attendance').upsert({
      id: current?.id,
      employee_id: employee.id,
      date: today(),
      ...update,
    }, { onConflict: 'employee_id,date' })

    if (attendanceError) throw attendanceError

    await service.from('attendance_logs').upsert({
      company_id: employee.company_id,
      employee_id: employee.id,
      log_date: today(),
      check_in: current?.check_in ?? now,
      check_out: current?.check_in ? now : null,
      status: 'present',
      notes: 'تم التسجيل من بوابة الموظف الذكية',
      recorded_by: session.user.id,
    }, { onConflict: 'company_id,employee_id,log_date' })

    revalidatePath('/dashboard/erp/hr')
    revalidatePath('/dashboard/employee')
    return { ok: true, message: current?.check_in ? 'تم تسجيل الانصراف بنجاح.' : 'تم تسجيل الحضور بنجاح.' }
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'تعذر تسجيل الحضور.')
  }
}

async function requireHrWrite() {
  const session = await requireSession()
  if (!HR_WRITE_ROLES.includes(session.profile.role)) {
    throw new Error('غير مصرح لك بإدارة ملفات الموظفين.')
  }
  return session
}

async function getRequestIp() {
  const headerStore = await headers()
  const forwardedFor = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || headerStore.get('x-real-ip') || 'unknown'
}

function validateEnvironment({
  requestIp,
  wifiSsid,
  latitude,
  longitude,
  employee,
}: {
  requestIp: string
  wifiSsid: string | null
  latitude: number | null
  longitude: number | null
  employee: {
    allowed_ip: string | null
    allowed_wifi_ssid: string | null
    allowed_lat: number | null
    allowed_long: number | null
    allowed_radius: number | null
  }
}) {
  const ipMatch = Boolean(employee.allowed_ip && employee.allowed_ip === requestIp)
  const wifiMatch = Boolean(employee.allowed_wifi_ssid && wifiSsid && employee.allowed_wifi_ssid.trim().toLowerCase() === wifiSsid.trim().toLowerCase())
  const distance = employee.allowed_lat && employee.allowed_long && latitude && longitude
    ? calculateDistanceMeters(Number(employee.allowed_lat), Number(employee.allowed_long), latitude, longitude)
    : null
  const gpsMatch = distance !== null && distance <= Number(employee.allowed_radius ?? 150)

  return {
    allowed: ipMatch || wifiMatch || gpsMatch,
    metadata: {
      request_ip: requestIp,
      wifi_ssid: wifiSsid,
      latitude,
      longitude,
      distance_meters: distance,
      checks: {
        ip: ipMatch,
        wifi: wifiMatch,
        gps: gpsMatch,
      },
      checked_at: new Date().toISOString(),
    },
  }
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000
  const toRad = (value: number) => (value * Math.PI) / 180
  const deltaLat = toRad(lat2 - lat1)
  const deltaLon = toRad(lon2 - lon1)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? '').trim()
}

function toMoney(value: FormDataEntryValue | null) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fail(message: string): HrActionState {
  return { ok: false, message }
}
