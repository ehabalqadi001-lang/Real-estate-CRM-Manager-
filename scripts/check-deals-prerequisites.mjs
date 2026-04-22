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

const { data: profiles, error: profileError } = await supabase
  .from('profiles')
  .select('id, email, role')
  .in('email', emails)

if (profileError) throw profileError

const target = profiles?.[0]
if (!target) throw new Error('No matching profile found')

const { data: userProfile, error: userProfileError } = await supabase
  .from('user_profiles')
  .select('company_id')
  .eq('id', target.id)
  .maybeSingle()

if (userProfileError) throw userProfileError
if (!userProfile?.company_id) throw new Error('Super Admin is not linked to user_profiles.company_id')

const companyId = userProfile.company_id

const [{ count: activeLeads, error: leadsError }, { count: teamMembers, error: teamError }, { count: existingDeals, error: dealsError }] = await Promise.all([
  supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .neq('status', 'Won'),
  supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('role', ['agent', 'senior_agent', 'branch_manager', 'company_admin', 'company_owner', 'admin', 'company']),
  supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId),
])

if (leadsError) throw leadsError
if (teamError) throw teamError
if (dealsError) throw dealsError

console.log(JSON.stringify({
  ok: true,
  companyId,
  activeLeads,
  teamMembers,
  existingDeals,
  canTestDealFromUi: Number(activeLeads ?? 0) > 0 && Number(teamMembers ?? 0) > 0,
}))
