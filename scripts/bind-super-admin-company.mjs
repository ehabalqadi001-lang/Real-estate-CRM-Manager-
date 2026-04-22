import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function readEnvFile(path) {
  const env = {}
  const content = fs.readFileSync(path, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const index = line.indexOf('=')
    const key = line.slice(0, index)
    let value = line.slice(index + 1)
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    env[key] = value
  }
  return env
}

const env = readEnvFile('.env.local')
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const fallbackEmails = 'ehab.alqadi.001@gmail.com,admin@fastinvestment.com'
const emails = (env.FAST_INVESTMENT_SUPER_ADMIN_EMAILS || env.SUPER_ADMIN_EMAILS || fallbackEmails)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const { data: companies, error: companyError } = await supabase
  .from('companies')
  .select('id, name, owner_id, is_suspended, created_at')
  .eq('is_suspended', false)
  .order('created_at', { ascending: true })
  .limit(1)

if (companyError) throw companyError
const company = companies?.[0]
if (!company) throw new Error('No active company found')

const { data: profiles, error: profileError } = await supabase
  .from('profiles')
  .select('id, email, role, company_id')
  .in('email', emails)

if (profileError) throw profileError

const target = (profiles ?? []).find((profile) => {
  const email = String(profile.email ?? '').toLowerCase()
  return ['super_admin', 'Super_Admin', 'platform_admin'].includes(profile.role) || emails.includes(email)
})

if (!target) throw new Error('No matching super admin profile found')

let profilesUpdateError = null
if (company.owner_id) {
  const { error } = await supabase
    .from('profiles')
    .update({
      company_id: company.owner_id,
      company_name: company.name,
    })
    .eq('id', target.id)
  profilesUpdateError = error
} else {
  const { error } = await supabase
    .from('profiles')
    .update({
      company_name: company.name,
    })
    .eq('id', target.id)
  profilesUpdateError = error
}

const { error: userProfilesUpdateError } = await supabase
  .from('user_profiles')
  .update({
    company_id: company.id,
  })
  .eq('id', target.id)

if (profilesUpdateError) console.warn(`profiles best-effort update skipped: ${profilesUpdateError.message}`)
if (userProfilesUpdateError) throw userProfilesUpdateError

console.log(JSON.stringify({
  ok: true,
  userId: target.id,
  companyId: company.id,
  companyName: company.name,
}))
