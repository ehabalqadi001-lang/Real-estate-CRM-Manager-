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
# هوية FAST
أنت "FAST"، المساعد الذكي المركزي لمنصة FAST INVESTMENT العقارية. تعمل ضمن معمارية RAG متصلة بقاعدة بيانات Supabase. أسلوبك: احترافي، حاد، تحليلي، وعالي الكفاءة.

# قواعد الأدوار (Role_ID)
يتم تحديد دورك من خلال Role_ID المرسل معك في كل طلب. يجب أن تلتزم صارمًا بحدود كل دور:

## Role_ID: Client (عميل / مستثمر)
**الهدف:** توجيههم لأفضل استثمار وبناء الثقة.
**المسموح:**
- الإجابة على الاستفسارات حول الوحدات والمشاريع المتاحة، مع التركيز على مناطق مثل العاصمة الإدارية الجديدة (R7, R8, Downtown) عند الاقتضاء.
- النمذجة المالية المبدئية: عند السؤال عن وحدات فندقية أو تجارية، احسب وفسّر العائد على الاستثمار (ROI)، صافي القيمة الحالية (NPV)، ومعدل العائد الداخلي (IRR) بناءً على بيانات السياق.
- إرشادهم لأفضل خطة سداد تناسب ميزانيتهم.
**الممنوع:**
- لا تكشف أبدًا عمولات الوسطاء الداخلية أو الاختناقات التشغيلية للشركة.

## Role_ID: Sales (وكيل / وسيط)
**الهدف:** تمكينهم من إغلاق الصفقات بشكل أسرع وإدارة pipeline.
**المسموح:**
- استرداد تفاصيل مشاريع محددة وخطط السداد ومواصفات الوحدات فورًا.
- المساعدة في صياغة رسائل متابعة شخصية عبر البريد الإلكتروني أو WhatsApp.
- تقديم ملخصات سريعة لتاريخ العميل واعتراضاته السابقة من سياق CRM للتحضير للاتصال التالي.

## Role_ID: Management (إدارة / مدير)
**الهدف:** تحسين أداء الفريق واتخاذ القرارات الاستراتيجية.
**المسموح:**
- تحليل pipeline المبيعات وتحديد اختناقات سير العمل باستخدام "نظرية القيود" (Theory of Constraints / TOC).
- تقييم أداء الفريق باستخدام مقاييس تقييم 360 درجة المقدمة في السياق.
- المساعدة في هيكلة برامج التدريب أو "خلايا العمل" لتحقيق أقصى كفاءة في طابق المبيعات.
- توفير تنبؤات مبيعات مدعومة بالبيانات.

## Role_ID: Super_Admin
**الهدف:** تحكم كامل في النظام، صحة تقنية، ووصول مطلق للبيانات.
**المسموح:**
- استخراج البيانات الخام وإعداد تقارير معقدة متعددة الأقسام.
- المساعدة في فحوصات صحة النظام (تشخيص تنبيهات "Pending Environment Connection" أو حالة تكامل API).
- تنفيذ أوامر تعديل الصلاحيات أو مستويات الوصول عند الاتصال بواجهات برمجة الإدارة الخلفية.

# القيود التشغيلية
1. إذا كانت البيانات المطلوبة غير موجودة في السياق، قل صراحةً: "هذه المعلومة غير متوفرة في قاعدة بياناتي الحالية" - لا تخترع أسعارًا أو مقاييس عقارية.
2. أجب باللغة التي يبدأ بها المستخدم المحادثة (الافتراضي: العربية).
3. نسّق الردود الطويلة باستخدام: نقاط مرقمة، **نص غامق للمقاييس الرئيسية**، وفقرات واضحة لسهولة القراءة داخل widget الدردشة.
4. لا تذكر مفاتيح API أو أسرار البنية الداخلية.
5. إذا طلب المستخدم صلاحية غير متاحة لدوره، اشرح ذلك واقترح بديلاً مسموحًا.
`

type RoleId = 'Client' | 'Sales' | 'Management' | 'Super_Admin'

function getRoleId(role: AppRole | 'guest'): RoleId {
  if (role === 'super_admin' || role === 'admin') return 'Super_Admin'
  if (role === 'company_admin' || role === 'company' || role === 'branch_manager' || role === 'marketing_manager' || role === 'cs_supervisor') return 'Management'
  if (role === 'agent' || role === 'broker' || role === 'senior_agent' || role === 'campaign_specialist' || role === 'cs_agent') return 'Sales'
  return 'Client'
}

function calculateROI(params: { totalInvestment: number; annualIncome: number }): number {
  if (!params.totalInvestment) return 0
  return (params.annualIncome / params.totalInvestment) * 100
}

function calculateNPV(params: { initialInvestment: number; annualCashFlow: number; discountRate: number; years: number }): number {
  let npv = -params.initialInvestment
  for (let i = 1; i <= params.years; i++) {
    npv += params.annualCashFlow / Math.pow(1 + params.discountRate / 100, i)
  }
  return Math.round(npv)
}

function calculateIRR(params: { initialInvestment: number; annualCashFlow: number; years: number }): number {
  let rate = 0.1
  for (let iter = 0; iter < 100; iter++) {
    let npv = -params.initialInvestment
    let dnpv = 0
    for (let t = 1; t <= params.years; t++) {
      npv += params.annualCashFlow / Math.pow(1 + rate, t)
      dnpv -= (t * params.annualCashFlow) / Math.pow(1 + rate, t + 1)
    }
    const step = npv / dnpv
    rate -= step
    if (Math.abs(step) < 1e-7) break
  }
  return Math.round(rate * 10000) / 100
}

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
  const roleId = getRoleId(sessionRole ?? 'guest')
  const normalizedQuestion = question.toLowerCase()
  const wantsSales     = includesAny(normalizedQuestion, ['بيع', 'مبيعات', 'صفقة', 'deal', 'sales', 'pipeline'])
  const wantsHr        = includesAny(normalizedQuestion, ['hr', 'موظف', 'موارد', 'راتب', 'اجاز', 'إجاز'])
  const wantsFinance   = includesAny(normalizedQuestion, ['عمولة', 'تحصيل', 'صرف', 'finance', 'commission'])
  const wantsComparison = includesAny(normalizedQuestion, ['قارن', 'مقارنة', 'compare', 'payment plan', 'خطة سداد'])
  const wantsProposal  = includesAny(normalizedQuestion, ['عرض', 'proposal', 'pdf', 'استثماري', 'عميل مهتم'])
  const wantsFinancial = includesAny(normalizedQuestion, ['roi', 'npv', 'irr', 'عائد', 'استثمار', 'invest', 'فندق', 'تجاري'])
  const wantsTOC       = includesAny(normalizedQuestion, ['اختناق', 'bottleneck', 'toc', 'قيود', 'constraints', 'فريق', 'أداء', 'performance'])
  const wantsHealth    = includesAny(normalizedQuestion, ['system', 'api', 'env', 'health', 'نظام', 'بيئة', 'connection', 'اتصال'])

  const tools: Promise<FastToolResult>[] = [
    loadRagContext(supabase, session, question),
    loadMarketplaceSnapshot(supabase),
    loadInventorySnapshot(supabase),
  ]

  // Client: financial modeling for investment decisions
  if ((roleId === 'Client' || roleId === 'Sales') && wantsFinancial) {
    tools.push(loadFinancialModelingContext(supabase, question))
  }

  // Sales: pipeline + commissions
  if (session && sessionRole && (isBrokerRole(sessionRole) || isManagerRole(sessionRole) || isSuperAdmin(sessionRole))) {
    tools.push(loadUserSalesSnapshot(supabase, session.user.id, companyId, sessionRole, wantsSales || wantsFinance))
  }

  // Management: pipeline overview + TOC analysis
  if (session && sessionRole && (isManagerRole(sessionRole) || isSuperAdmin(sessionRole))) {
    tools.push(loadManagementSnapshot(supabase, companyId))
    if (wantsTOC) tools.push(loadTOCAnalysis(supabase, companyId))
  }

  // HR
  if (session && sessionRole && isHrRole(sessionRole) && wantsHr) {
    tools.push(loadHrSnapshot(supabase, companyId))
  }

  // Super Admin: system health
  if (roleId === 'Super_Admin' && wantsHealth) {
    tools.push(loadSystemHealthContext())
  }

  // All roles: payment plan comparison + proposal
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

async function loadFinancialModelingContext(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  question: string,
): Promise<FastToolResult> {
  const budget = extractBudget(question)

  const { data: units } = await supabase
    .from('units')
    .select('id, unit_number, unit_type, project_name, price, area_sqm, status')
    .in('unit_type', ['hotel', 'commercial', 'shop', 'office', 'فندقي', 'تجاري'])
    .in('status', ['available', 'active', 'approved'])
    .order('price', { ascending: true })
    .limit(6)

  const candidates = (units ?? []).map((unit) => {
    const price = Number(unit.price ?? 0)
    const annualIncome = price * 0.08  // conservative 8% yield estimate
    const roi = calculateROI({ totalInvestment: price, annualIncome })
    const npv = calculateNPV({ initialInvestment: price, annualCashFlow: annualIncome, discountRate: 12, years: 10 })
    const irr = calculateIRR({ initialInvestment: price, annualCashFlow: annualIncome, years: 10 })
    return { ...unit, estimated_annual_income: Math.round(annualIncome), roi_pct: roi.toFixed(2), npv_egp: npv, irr_pct: irr }
  })

  return {
    name: 'financial_modeling',
    description: `ROI/NPV/IRR estimates (8% yield, 12% discount rate, 10-year horizon).${budget ? ` Budget filter: ≤${budget.toLocaleString()} EGP.` : ''} Figures are indicative — advise client to verify with official developer projections.`,
    data: budget ? candidates.filter((u) => Number(u.price ?? 0) <= budget) : candidates,
  }
}

async function loadTOCAnalysis(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  companyId: string | null,
): Promise<FastToolResult> {
  let query = supabase
    .from('deals')
    .select('id, stage, agent_id, created_at, updated_at, status')
    .order('created_at', { ascending: false })
    .limit(200)

  if (companyId) query = query.eq('company_id', companyId)
  const { data: deals } = await query

  const stageCounts: Record<string, number> = {}
  const stageAgeDays: Record<string, number[]> = {}
  const now = Date.now()
  for (const deal of deals ?? []) {
    const stage = deal.stage ?? 'unknown'
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1
    const ageDays = (now - new Date(deal.updated_at ?? deal.created_at).getTime()) / 86_400_000
    stageAgeDays[stage] = [...(stageAgeDays[stage] ?? []), ageDays]
  }

  const stageAnalysis = Object.entries(stageCounts).map(([stage, count]) => {
    const ages = stageAgeDays[stage] ?? []
    const avgAge = ages.length ? ages.reduce((s, a) => s + a, 0) / ages.length : 0
    return { stage, count, avg_age_days: Math.round(avgAge) }
  }).sort((a, b) => b.avg_age_days - a.avg_age_days)

  const bottleneck = stageAnalysis[0]

  return {
    name: 'toc_analysis',
    description: 'Theory of Constraints analysis: pipeline stage counts and average deal age to identify the highest constraint.',
    data: {
      stageAnalysis,
      bottleneck: bottleneck
        ? { stage: bottleneck.stage, avg_age_days: bottleneck.avg_age_days, deal_count: bottleneck.count }
        : null,
      totalDeals: deals?.length ?? 0,
      analysisNote: 'Stage with highest avg_age_days is the current pipeline bottleneck per TOC framework.',
    },
  }
}

async function loadSystemHealthContext(): Promise<FastToolResult> {
  const checks = {
    GEMINI_API_KEY:           !!process.env.GEMINI_API_KEY,
    ANTHROPIC_API_KEY:        !!process.env.ANTHROPIC_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:!!process.env.SUPABASE_SERVICE_ROLE_KEY,
    WHATSAPP_TOKEN:           !!process.env.WHATSAPP_TOKEN,
    CRON_SECRET:              !!process.env.CRON_SECRET,
  }

  const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  const healthy = missing.length === 0

  return {
    name: 'system_health',
    description: 'Environment variable presence check. Does NOT expose values — only confirms configured/missing.',
    data: {
      status: healthy ? 'healthy' : 'degraded',
      configured: Object.entries(checks).filter(([, v]) => v).map(([k]) => k),
      missing,
      recommendation: missing.length
        ? `Add missing vars to Vercel Dashboard → Settings → Environment Variables: ${missing.join(', ')}`
        : 'All critical environment variables are configured.',
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
  const roleId = getRoleId(role)
  return `
المستخدم:
${JSON.stringify({
  id: session?.user.id ?? null,
  name: session?.profile.full_name ?? 'زائر',
  email: session?.profile.email ?? session?.user.email ?? null,
  role,
  Role_ID: roleId,
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
  const roleId = getRoleId(role)
  const visibleTools = tools.map((tool) => tool.name).join('، ') || 'لا توجد أدوات متاحة'
  const adsTool = tools.find((tool) => tool.name === 'marketplace_search')
  const inventoryTool = tools.find((tool) => tool.name === 'inventory_lookup')
  const adsCount = Array.isArray(adsTool?.data) ? adsTool.data.length : 0
  const unitsCount = Array.isArray(inventoryTool?.data) ? inventoryTool.data.length : 0

  const roleCapabilities: Record<RoleId, string> = {
    Client:      'البحث عن وحدات، مقارنة خطط السداد، حساب ROI/NPV/IRR للوحدات التجارية والفندقية، إعداد عرض استثماري.',
    Sales:       'استرداد تفاصيل المشاريع والوحدات، صياغة رسائل متابعة، ملخص تاريخ العميل واعتراضاته.',
    Management:  'تحليل pipeline، اكتشاف الاختناقات (TOC)، تقييم أداء الفريق 360°، تنبؤات المبيعات.',
    Super_Admin: 'استخراج بيانات خام، تقارير متعددة الأقسام، فحص صحة النظام، تعديل الصلاحيات.',
  }

  return [
    `أنا FAST، قرأت سؤالك: "${question}".`,
    `دورك: **${roleId}** (${role}). الأدوات المتاحة: ${visibleTools}.`,
    `أرى ${adsCount} إعلانات سوق و${unitsCount} وحدات مخزون ضمن السياق المتاح.`,
    `قدراتي لدورك: ${roleCapabilities[roleId]}`,
    'اكتب سؤالك وسأساعدك فورًا.',
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
