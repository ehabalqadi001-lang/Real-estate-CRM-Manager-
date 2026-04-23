import 'server-only'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { getCurrentSession } from '@/shared/auth/session'
import { isBrokerRole, isHrRole, isManagerRole, isSuperAdmin, type AppRole, type AppSession } from '@/shared/auth/types'

export type FastAgentMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type FastAgentResponse = {
  reply: string
  mode: 'ai' | 'fallback'
  role: AppRole | 'guest'
  tools: string[]
  conversationId: string | null
}

type FastToolResult = {
  name: string
  description: string
  data: unknown
}

type FastConversationOptions = {
  conversationId?: string | null
}

const FAST_SYSTEM_PROMPT = `
أنت FAST، مستشار ذكاء اصطناعي داخل نظام FAST INVESTMENT.
تتصرف كمستشار عقاري وتشغيلي شامل، لكنك مقيد تماما بصلاحيات المستخدم والسياق المرسل لك فقط.

قواعد إلزامية:
- لا تفترض وجود بيانات غير موجودة في السياق.
- لا تكشف عمولات أو رواتب أو بيانات عملاء أو تقارير إدارة إلا إذا كانت موجودة في السياق ومسموحة للدور الحالي.
- إذا طلب المستخدم صلاحية غير متاحة له، اشرح ذلك باختصار واقترح بديل مسموح.
- أجب بالعربية الواضحة، ويمكنك استخدام نقاط مختصرة.
- لا تذكر مفاتيح API أو أسرار أو تفاصيل بنية داخلية حساسة.
`

export async function runFastAgent(messages: FastAgentMessage[], options: FastConversationOptions = {}): Promise<FastAgentResponse> {
  const session = await getCurrentSession()
  const role = session?.profile.role ?? 'guest'
  const question = messages.at(-1)?.content?.trim() ?? ''
  const conversationId = await ensureConversation(session, options.conversationId ?? null, question)
  if (session && conversationId && question) {
    await logFastMessage({ session, conversationId, role: 'user', content: question })
  }
  const tools = await collectAllowedContext(session, question)

  if (!question) {
    return {
      reply: 'أنا FAST. اكتب سؤالك عن العملاء، العقارات، الشركاء، التقارير، أو خطوات استخدام النظام وسأساعدك حسب صلاحياتك.',
      mode: 'fallback',
      role,
      tools: tools.map((tool) => tool.name),
      conversationId,
    }
  }

  const fallback = buildFallbackAnswer({ session, question, tools })

  if (!process.env.GEMINI_API_KEY) {
    const response = {
      reply: fallback,
      mode: 'fallback',
      role,
      tools: tools.map((tool) => tool.name),
      conversationId,
    } satisfies FastAgentResponse
    if (session && conversationId) await logFastMessage({ session, conversationId, role: 'assistant', content: response.reply, mode: response.mode, tools: response.tools })
    return response
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      systemInstruction: FAST_SYSTEM_PROMPT,
    })

    const result = await model.generateContent(buildAgentPrompt({
      session,
      role,
      question,
      messages,
      tools,
    }))

    const text = result.response.text().trim()
    const response = {
      reply: text || fallback,
      mode: text ? 'ai' : 'fallback',
      role,
      tools: tools.map((tool) => tool.name),
      conversationId,
    } satisfies FastAgentResponse
    if (session && conversationId) await logFastMessage({ session, conversationId, role: 'assistant', content: response.reply, mode: response.mode, tools: response.tools })
    return response
  } catch (error) {
    console.error('FAST agent generation failed', error)
    const response = {
      reply: `${fallback}\n\nملاحظة: تم استخدام رد احتياطي لأن مزود الذكاء الاصطناعي غير متاح حاليا أو تجاوز الحصة.`,
      mode: 'fallback',
      role,
      tools: tools.map((tool) => tool.name),
      conversationId,
    } satisfies FastAgentResponse
    if (session && conversationId) await logFastMessage({ session, conversationId, role: 'assistant', content: response.reply, mode: response.mode, tools: response.tools })
    return response
  }
}

async function collectAllowedContext(session: AppSession | null, question: string): Promise<FastToolResult[]> {
  const supabase = await createServerSupabaseClient()
  const sessionRole = session?.profile.role
  const companyId = session?.profile.company_id ?? session?.profile.tenant_id ?? null
  const normalizedQuestion = question.toLowerCase()
  const wantsSales = includesAny(normalizedQuestion, ['بيع', 'مبيعات', 'صفقة', 'deal', 'sales', 'pipeline'])
  const wantsHr = includesAny(normalizedQuestion, ['hr', 'موظف', 'موارد', 'راتب', 'اجاز', 'إجاز'])
  const wantsFinance = includesAny(normalizedQuestion, ['عمولة', 'تحصيل', 'صرف', 'finance', 'commission'])
  const wantsComparison = includesAny(normalizedQuestion, ['قارن', 'مقارنة', 'compare', 'payment plan', 'خطة سداد'])
  const wantsProposal = includesAny(normalizedQuestion, ['عرض', 'proposal', 'pdf', 'استثماري', 'عميل مهتم'])

  const tools: Promise<FastToolResult>[] = [
    loadRagContext(supabase, session, question),
    loadMarketplaceSnapshot(supabase),
    loadInventorySnapshot(supabase),
  ]

  if (session && sessionRole && (isBrokerRole(sessionRole) || isManagerRole(sessionRole) || isSuperAdmin(sessionRole))) {
    tools.push(loadUserSalesSnapshot(supabase, session.user.id, companyId, sessionRole, wantsSales || wantsFinance))
  }

  if (session && sessionRole && (isManagerRole(sessionRole) || isSuperAdmin(sessionRole))) {
    tools.push(loadManagementSnapshot(supabase, companyId))
  }

  if (session && sessionRole && isHrRole(sessionRole) && wantsHr) {
    tools.push(loadHrSnapshot(supabase, companyId))
  }

  if (wantsComparison) {
    tools.push(comparePaymentPlans(supabase, question))
  }

  if (wantsProposal && session && sessionRole && (isBrokerRole(sessionRole) || isManagerRole(sessionRole) || isSuperAdmin(sessionRole))) {
    tools.push(generateProposalDraft(supabase, question))
  }

  const settled = await Promise.allSettled(tools)
  return settled.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
}

async function loadRagContext(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  session: AppSession | null,
  question: string,
): Promise<FastToolResult> {
  if (!question.trim()) {
    return { name: 'rag_memory', description: 'No RAG query was provided.', data: [] }
  }

  const companyId = session?.profile.company_id ?? session?.profile.tenant_id ?? null
  const role = session?.profile.role ?? null
  const embedding = await embedQuestion(question)

  if (embedding.length > 0) {
    const { data, error } = await supabase.rpc('match_fast_agent_chunks', {
      query_embedding: `[${embedding.join(',')}]`,
      match_count: 6,
      filter_company_id: companyId,
      filter_role: role,
    })

    if (!error && data) {
      return {
        name: 'rag_memory',
        description: 'Semantic pgvector memory search over indexed FAST knowledge.',
        data,
      }
    }
  }

  const keywords = question
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2)
    .slice(0, 6)

  let query = supabase
    .from('fast_agent_chunks')
    .select('id,document_id,content,metadata,visibility,created_at')
    .limit(6)

  if (keywords.length) {
    query = query.or(keywords.map((keyword) => `content.ilike.%${keyword.replaceAll(',', ' ')}%`).join(','))
  }

  const { data } = await query
  return {
    name: 'rag_memory',
    description: 'Keyword fallback over indexed FAST knowledge.',
    data: data ?? [],
  }
}

async function embedQuestion(question: string): Promise<number[]> {
  if (!process.env.GEMINI_API_KEY) return []

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004' })
    const result = await model.embedContent(question)
    return result.embedding.values.slice(0, 768)
  } catch (error) {
    console.error('FAST embedding failed', error)
    return []
  }
}

async function loadMarketplaceSnapshot(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<FastToolResult> {
  const { data } = await supabase
    .from('ads')
    .select('id,title,price,property_type,location,area_sqm,bedrooms,bathrooms,is_featured,listing_type,status,created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(8)

  return {
    name: 'marketplace_search',
    description: 'Approved marketplace ads visible to the current session.',
    data: data ?? [],
  }
}

async function loadInventorySnapshot(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<FastToolResult> {
  const { data } = await supabase
    .from('units')
    .select('id, unit_number, unit_type, project_name, city, area_sqm, price, status, bedrooms, bathrooms')
    .in('status', ['available', 'active', 'approved'])
    .order('price', { ascending: true })
    .limit(8)

  return {
    name: 'inventory_lookup',
    description: 'Available inventory records allowed by current database policies.',
    data: data ?? [],
  }
}

async function loadUserSalesSnapshot(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  companyId: string | null,
  role: AppRole,
  includeFinance: boolean,
): Promise<FastToolResult> {
  const isManager = isManagerRole(role) || isSuperAdmin(role)
  let dealsQuery = supabase
    .from('deals')
    .select('id,title,client_name,status,stage,total_amount,unit_value,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(8)

  if (!isManager) dealsQuery = dealsQuery.eq('agent_id', userId)
  else if (companyId) dealsQuery = dealsQuery.eq('company_id', companyId)

  const [{ data: deals }, commissions] = await Promise.all([
    dealsQuery,
    includeFinance && (isManager || isBrokerRole(role))
      ? supabase
        .from('commissions')
        .select('id,deal_id,amount,status,expected_date,paid_at,created_at')
        .order('created_at', { ascending: false })
        .limit(6)
      : Promise.resolve({ data: [] }),
  ])

  return {
    name: 'sales_and_commissions',
    description: isManager
      ? 'Sales pipeline and commission rows scoped to manager/company permissions.'
      : 'Own broker/sales records only. No team-wide data.',
    data: {
      deals: deals ?? [],
      commissions: commissions.data ?? [],
    },
  }
}

async function loadManagementSnapshot(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  companyId: string | null,
): Promise<FastToolResult> {
  let leadsQuery = supabase
    .from('leads')
    .select('id,name,phone,status,source,expected_value,created_at,agent_id')
    .order('created_at', { ascending: false })
    .limit(8)

  if (companyId) leadsQuery = leadsQuery.eq('company_id', companyId)

  const { data: leads } = await leadsQuery

  return {
    name: 'management_snapshot',
    description: 'Recent lead indicators for managers and admins only.',
    data: {
      leads: leads ?? [],
    },
  }
}

async function loadHrSnapshot(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  companyId: string | null,
): Promise<FastToolResult> {
  let employeesQuery = supabase
    .from('employees')
    .select('id,department,position,status,hire_date,base_salary')
    .order('hire_date', { ascending: false })
    .limit(8)

  if (companyId) employeesQuery = employeesQuery.eq('company_id', companyId)

  const { data: employees } = await employeesQuery

  return {
    name: 'hr_policy_context',
    description: 'HR employee indicators for HR roles only. Salary data is never loaded for non-HR roles.',
    data: employees ?? [],
  }
}

async function comparePaymentPlans(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  question: string,
): Promise<FastToolResult> {
  const { data: plans } = await supabase
    .from('property_payment_plans')
    .select('id,property_id,name,down_payment_pct,installment_years,installment_frequency,maintenance_fee_pct,total_price,monthly_installment,plan_rank')
    .eq('active', true)
    .order('plan_rank', { ascending: true })
    .limit(8)

  const normalized = (plans ?? []).map((plan) => {
    const total = Number(plan.total_price ?? 0)
    const downPct = Number(plan.down_payment_pct ?? 0)
    const downPayment = total && downPct ? Math.round(total * downPct / 100) : 0
    const years = Number(plan.installment_years ?? 0)
    const monthly = Number(plan.monthly_installment ?? 0)
    return {
      ...plan,
      downPayment,
      estimatedPaidOverTerm: monthly && years ? monthly * years * 12 + downPayment : total,
    }
  })

  return {
    name: 'comparePaymentPlans',
    description: 'Compares available payment plans and calculates down payments and estimated total paid.',
    data: {
      question,
      plans: normalized,
    },
  }
}

async function generateProposalDraft(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  question: string,
): Promise<FastToolResult> {
  const budget = extractBudget(question)
  let query = supabase
    .from('units')
    .select('id,unit_number,unit_type,project_name,city,area_sqm,price,status,bedrooms,bathrooms,delivery_date')
    .in('status', ['available', 'active', 'approved'])
    .order('price', { ascending: true })
    .limit(5)

  if (budget) query = query.lte('price', budget)

  const { data: units } = await query
  return {
    name: 'generateProposal',
    description: 'Builds a proposal draft from visible inventory candidates. PDF generation can be called by existing proposal/PDF routes after user confirms.',
    data: {
      requestedBrief: question,
      budget,
      recommendedUnits: units ?? [],
      proposalSections: [
        'ملخص احتياج العميل',
        'أفضل الوحدات المطابقة',
        'نقاط القوة الاستثمارية',
        'المخاطر أو نقاط المراجعة',
        'الخطوة التالية المقترحة',
      ],
    },
  }
}

function buildAgentPrompt({
  session,
  role,
  question,
  messages,
  tools,
}: {
  session: AppSession | null
  role: AppRole | 'guest'
  question: string
  messages: FastAgentMessage[]
  tools: FastToolResult[]
}) {
  return `
المستخدم:
${JSON.stringify({
  id: session?.user.id ?? null,
  name: session?.profile.full_name ?? 'زائر',
  email: session?.profile.email ?? session?.user.email ?? null,
  role,
  companyId: session?.profile.company_id ?? null,
  tenantName: session?.profile.tenant_name ?? null,
}, null, 2)}

الأدوات والسياق المسموح فقط:
${JSON.stringify(tools, null, 2)}

آخر المحادثة:
${JSON.stringify(messages.slice(-8), null, 2)}

سؤال المستخدم:
${question}

أجب كوكيل FAST. إذا احتجت بيانات غير موجودة في السياق، اطلب من المستخدم تحديدها أو أخبره أن الصلاحية/البيانات غير متاحة.
`
}

function buildFallbackAnswer({
  session,
  question,
  tools,
}: {
  session: AppSession | null
  question: string
  tools: FastToolResult[]
}) {
  const role = session?.profile.role ?? 'guest'
  const visibleTools = tools.map((tool) => tool.name).join('، ') || 'لا توجد أدوات متاحة'
  const adsTool = tools.find((tool) => tool.name === 'marketplace_search')
  const inventoryTool = tools.find((tool) => tool.name === 'inventory_lookup')
  const adsCount = Array.isArray(adsTool?.data) ? adsTool.data.length : 0
  const unitsCount = Array.isArray(inventoryTool?.data) ? inventoryTool.data.length : 0

  return [
    `أنا FAST، قرأت سؤالك: "${question}".`,
    `دورك الحالي: ${role}. الأدوات المتاحة لك الآن: ${visibleTools}.`,
    `أرى ${adsCount} إعلانات سوق و${unitsCount} وحدات مخزون ضمن السياق المتاح.`,
    'يمكنني مساعدتك في البحث، المقارنة، إعداد عرض مبدئي، أو توجيهك للخطوة التالية حسب صلاحياتك.',
  ].join('\n')
}

function includesAny(value: string, tokens: string[]) {
  return tokens.some((token) => value.includes(token.toLowerCase()))
}

function extractBudget(question: string) {
  const normalized = question.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(مليون|m|million)/i)
  if (millionMatch) return Math.round(Number(millionMatch[1]) * 1_000_000)
  const numberMatch = normalized.match(/\b(\d{6,9})\b/)
  return numberMatch ? Number(numberMatch[1]) : null
}

async function ensureConversation(session: AppSession | null, conversationId: string | null, question: string) {
  if (!session) return null
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.profile.tenant_id ?? null

  if (conversationId) {
    const { data } = await supabase
      .from('fast_agent_conversations')
      .select('id')
      .eq('id', conversationId)
      .maybeSingle()
    if (data?.id) return data.id as string
  }

  const title = question ? question.slice(0, 80) : 'FAST conversation'
  const { data, error } = await supabase
    .from('fast_agent_conversations')
    .insert({
      user_id: session.user.id,
      company_id: companyId,
      title,
      role_at_start: session.profile.role,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('FAST conversation create failed', error)
    return null
  }

  return data?.id as string | null
}

async function logFastMessage({
  session,
  conversationId,
  role,
  content,
  mode,
  tools,
}: {
  session: AppSession
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  mode?: 'ai' | 'fallback'
  tools?: string[]
}) {
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.profile.tenant_id ?? null
  const { error } = await supabase.from('fast_agent_messages').insert({
    conversation_id: conversationId,
    user_id: session.user.id,
    company_id: companyId,
    role,
    content,
    mode,
    tools: tools ?? [],
  })

  if (error) console.error('FAST message log failed', error)

  await supabase
    .from('fast_agent_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
}
