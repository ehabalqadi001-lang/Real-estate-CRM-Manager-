'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { sendWelcomeEmail } from '@/lib/email'

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options })
            })
          } catch {}
        },
      },
    },
  )
}

const ROLE_ALIASES: Record<string, string> = {
  'Super Admin': 'super_admin',
  Super_Admin: 'super_admin',
  SuperAdmin: 'super_admin',
  super_admin: 'super_admin',
  platform_admin: 'platform_admin',
  'Platform Admin': 'platform_admin',
  company_owner: 'company_owner',
  company_admin: 'company_admin',
  'Company Admin': 'company_admin',
  company: 'company_owner',
  admin: 'company_admin',
  Admin: 'company_admin',
  CLIENT: 'viewer',
  client: 'viewer',
  viewer: 'viewer',
}

const FAST_INVESTMENT_WELCOME_WHATSAPP =
  'مرحباً بك في FAST INVESTMENT. تم تفعيل حسابك بنجاح.'

type UploadedDocument = {
  name: string
  path: string
  type: string
  size: number
}

async function getRequestOrigin() {
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  if (!host) return null

  const protocol = headerStore.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

async function sendRegistrationWelcomeWhatsApp(phone: string) {
  const token = process.env.RESPOND_IO_API_TOKEN
  const origin = await getRequestOrigin()

  if (!token || !origin) return

  const response = await fetch(`${origin}/api/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-fast-investment-internal-token': token,
    },
    body: JSON.stringify({
      phone,
      message: FAST_INVESTMENT_WELCOME_WHATSAPP,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `WhatsApp welcome route failed with status ${response.status}`)
  }
}

function normalizeRole(role: unknown) {
  const value = String(role ?? '').trim()
  if (!value) return 'agent'
  return ROLE_ALIASES[value] ?? value
}

function formText(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim()
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `fast-${Date.now()}`
}

function fileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
}

async function uploadPartnerFile(fieldName: string, folder: string, formData: FormData) {
  const file = formData.get(fieldName)
  if (!(file instanceof File) || file.size === 0) return null

  const service = createServiceRoleClient()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension(file)}`
  const { data, error } = await service.storage.from('documents').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (error) throw new Error(`تعذر رفع ملف ${fieldName}: ${error.message}`)
  return { name: file.name, path: data.path, type: file.type, size: file.size } satisfies UploadedDocument
}

async function uploadPartnerFiles(fieldName: string, folder: string, formData: FormData, limit = 3) {
  const service = createServiceRoleClient()
  const files = formData
    .getAll(fieldName)
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, limit)

  const uploaded: UploadedDocument[] = []
  for (const file of files) {
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension(file)}`
    const { data, error } = await service.storage.from('documents').upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (error) throw new Error(`تعذر رفع ملف ${fieldName}: ${error.message}`)
    uploaded.push({ name: file.name, path: data.path, type: file.type, size: file.size })
  }
  return uploaded
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = await getSupabaseClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return {
      success: false,
      message: 'فشل تسجيل الدخول. يرجى التأكد من صحة البيانات.',
      details: error.message,
    }
  }

  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()

    const cookieStore = await cookies()
    cookieStore.set('user_role', normalizeRole(profile?.role), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  redirect('/')
}

export async function registerAction(formData: FormData) {
  const supabase = await getSupabaseClient()
  const service = createServiceRoleClient()

  const registrationMode = formText(formData, 'registrationMode') || 'partner'
  const isClientRegistration = registrationMode === 'client'
  const requestedAccountType = formText(formData, 'accountType') || 'broker_freelancer'
  const isCompanyPartner = !isClientRegistration && requestedAccountType === 'company'
  const isBrokerPartner = !isClientRegistration && !isCompanyPartner

  const email = formText(formData, 'email').toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const firstName = formText(formData, 'firstName')
  const lastName = formText(formData, 'lastName')
  const legacyFullName = formText(formData, 'fullName')
  const fullName = isBrokerPartner ? `${firstName} ${lastName}`.trim() : legacyFullName || formText(formData, 'managerName')
  const phone = formText(formData, 'phone') || formText(formData, 'managerPhone')
  const region = formText(formData, 'region')
  const companyName = formText(formData, 'companyName')
  const commercialRegNo = formText(formData, 'commercialRegNo')
  const managerName = formText(formData, 'managerName')
  const managerPhone = formText(formData, 'managerPhone')
  const ownerPhone = formText(formData, 'ownerPhone')
  const facebookUrl = formText(formData, 'facebookUrl')

  if (!email || !password) {
    return { success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان', details: 'Missing required credentials' }
  }

  if (!isClientRegistration && password !== confirmPassword) {
    return { success: false, message: 'كلمة المرور وتأكيدها غير متطابقين', details: 'Password confirmation mismatch' }
  }

  const accountType = isClientRegistration ? 'client' : isCompanyPartner ? 'company' : 'individual'
  const role = isClientRegistration ? 'CLIENT' : isCompanyPartner ? 'company_admin' : 'broker'
  const documentFolder = `partners/${slugify(email)}`

  try {
    const documents = {
      idFront: isBrokerPartner ? await uploadPartnerFile('idFront', `${documentFolder}/ids`, formData) : null,
      idBack: isBrokerPartner ? await uploadPartnerFile('idBack', `${documentFolder}/ids`, formData) : null,
      commercialRegister: isCompanyPartner ? await uploadPartnerFiles('commercialRegisterFiles', `${documentFolder}/commercial-register`, formData, 3) : [],
      taxCard: isCompanyPartner ? await uploadPartnerFile('taxCardImage', `${documentFolder}/tax-card`, formData) : null,
      ownerId: isCompanyPartner ? await uploadPartnerFile('ownerIdImage', `${documentFolder}/owner-id`, formData) : null,
      vatCertificate: isCompanyPartner ? await uploadPartnerFile('vatCertificate', `${documentFolder}/vat`, formData) : null,
      legacyId: !isClientRegistration ? await uploadPartnerFile('idDocument', `${documentFolder}/ids`, formData) : null,
      legacyLicense: isCompanyPartner ? await uploadPartnerFile('licenseDocument', `${documentFolder}/licenses`, formData) : null,
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: isClientRegistration ? 'client' : requestedAccountType,
          company_name: companyName || null,
          phone,
          region,
          commercial_reg_no: commercialRegNo || null,
          partner_documents: documents,
          status: isClientRegistration ? 'active' : 'pending',
        },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('registered')) {
        return {
          success: false,
          message: 'هذا البريد مسجل بالفعل',
          details: 'User already registered',
        }
      }
      return { success: false, message: 'فشل إنشاء الحساب', details: error.message }
    }

    if (data.user?.id) {
      const profileId = data.user.id
      const companyContextId = isCompanyPartner ? profileId : null

      const { error: profileError } = await service.from('profiles').upsert({
        id: profileId,
        email,
        full_name: fullName,
        phone,
        region,
        account_type: accountType,
        role,
        status: isClientRegistration ? 'active' : 'pending',
        company_id: companyContextId,
        company_name: isCompanyPartner ? companyName || 'FAST INVESTMENT Partner' : null,
        preferred_contact: isClientRegistration ? 'whatsapp' : null,
        is_active: isClientRegistration,
      })

      if (profileError) {
        return { success: false, message: 'تم إنشاء الحساب ولم يكتمل حفظ الملف الشخصي', details: profileError.message }
      }

      await service.from('user_profiles').upsert({
        id: profileId,
        email,
        full_name: fullName,
        phone,
        role: role === 'CLIENT' ? 'viewer' : role,
        status: isClientRegistration ? 'active' : 'pending',
        account_type: accountType,
        company_id: companyContextId,
        company_name: isCompanyPartner ? companyName || null : null,
        id_front_image: documents.idFront?.path ?? documents.legacyId?.path ?? null,
        id_back_image: documents.idBack?.path ?? null,
        commercial_register_images: documents.commercialRegister.map((doc) => doc.path),
        tax_card_images: documents.taxCard ? [documents.taxCard.path] : [],
        vat_image: documents.vatCertificate?.path ?? null,
      })

      const { data: brokerProfile } = await service
        .from('broker_profiles')
        .upsert({
          profile_id: profileId,
          company_id: companyContextId,
          display_name: isCompanyPartner ? companyName : fullName,
          phone_secondary: ownerPhone || null,
          national_id_url: documents.idFront?.path ?? documents.legacyId?.path ?? null,
          tax_card_url: documents.taxCard?.path ?? null,
          commercial_license: commercialRegNo || null,
          commercial_license_url: documents.commercialRegister[0]?.path ?? documents.legacyLicense?.path ?? null,
          verification_status: 'pending',
          onboarding_completed: false,
          onboarding_step: 1,
        }, { onConflict: 'profile_id' })
        .select('id')
        .maybeSingle()

      if (brokerProfile?.id) {
        const brokerDocs: Array<Record<string, unknown>> = [
          documents.idFront && { broker_id: brokerProfile.id, company_id: companyContextId, type: 'national_id_front', name: documents.idFront.name, url: documents.idFront.path, file_size: documents.idFront.size, mime_type: documents.idFront.type },
          documents.idBack && { broker_id: brokerProfile.id, company_id: companyContextId, type: 'national_id_back', name: documents.idBack.name, url: documents.idBack.path, file_size: documents.idBack.size, mime_type: documents.idBack.type },
          documents.taxCard && { broker_id: brokerProfile.id, company_id: companyContextId, type: 'tax_card', name: documents.taxCard.name, url: documents.taxCard.path, file_size: documents.taxCard.size, mime_type: documents.taxCard.type },
          documents.ownerId && { broker_id: brokerProfile.id, company_id: companyContextId, type: 'owner_id', name: documents.ownerId.name, url: documents.ownerId.path, file_size: documents.ownerId.size, mime_type: documents.ownerId.type },
          documents.vatCertificate && { broker_id: brokerProfile.id, company_id: companyContextId, type: 'vat_certificate', name: documents.vatCertificate.name, url: documents.vatCertificate.path, file_size: documents.vatCertificate.size, mime_type: documents.vatCertificate.type },
          ...documents.commercialRegister.map((doc, index) => ({ broker_id: brokerProfile.id, company_id: companyContextId, type: `commercial_register_${index + 1}`, name: doc.name, url: doc.path, file_size: doc.size, mime_type: doc.type })),
        ].filter(Boolean) as Array<Record<string, unknown>>

        if (brokerDocs.length > 0) {
          await service.from('broker_documents').insert(brokerDocs)
        }
      }

      if (!isClientRegistration) {
        await service.from('partner_applications').upsert({
          profile_id: profileId,
          company_id: companyContextId,
          applicant_type: isCompanyPartner ? 'company' : 'broker_freelancer',
          status: 'pending',
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: fullName || null,
          email,
          phone,
          company_name: companyName || null,
          manager_name: managerName || null,
          manager_phone: managerPhone || null,
          owner_phone: ownerPhone || null,
          facebook_url: facebookUrl || null,
          documents,
          brm_stage: 'application_review',
          payout_method: 'bank_transfer',
        }, { onConflict: 'profile_id,applicant_type' })
      }

      if (phone) {
        try {
          await sendRegistrationWelcomeWhatsApp(phone)
        } catch (error: unknown) {
          console.error('Failed to send registration WhatsApp welcome message', error)
        }
      }

      void sendWelcomeEmail({
        to: email,
        name: fullName,
        accountType: isClientRegistration ? 'client' : isCompanyPartner ? 'company' : 'individual',
      })
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء التسجيل',
      details: err instanceof Error ? err.message : 'خطأ غير معروف',
    }
  }

  if (isClientRegistration) redirect('/marketplace/profile')
  redirect('/pending-approval')
}
