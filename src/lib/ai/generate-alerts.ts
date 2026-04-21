import 'server-only'

import { generateText } from 'ai'
import { getCrmOpenAiModel, extractJsonArray } from './openai'
import type { AiAlert } from './types'

type AgentData = {
  agentId: string
  agentName: string
  staleLeads: Array<{ name: string; days: number; link: string }>
  stuckDeals: Array<{ title: string; stage: string; days: number; link: string }>
  pendingCommissions: Array<{ amount: number; days: number; link: string }>
  marketSignals: Array<{ area: string; note: string; link: string }>
}

const FALLBACK_ALERTS: AiAlert[] = [
  {
    priority: 'medium',
    title: 'راجع العملاء غير المتابعين',
    body: 'هناك فرص تحتاج متابعة سريعة قبل أن تنخفض نية الشراء.',
    action_label: 'فتح العملاء',
    action_link: '/dashboard/leads',
  },
]

export async function generateAlerts(agentData: AgentData): Promise<AiAlert[]> {
  const { text } = await generateText({
    model: getCrmOpenAiModel(),
    system: `أنت مساعد ذكي لنظام CRM عقاري.
لغتك: العربية الفصحى المبسطة.
أسلوبك: مختصر، عملي، يُحفّز على العمل.
أعد JSON فقط بدون Markdown.`,
    prompt: `بناءً على هذه البيانات: ${JSON.stringify(agentData)}
أنشئ 3 تنبيهات مفيدة للوكيل مع أولوية واحدة من: critical/high/medium/low.
أعد JSON بهذا الشكل:
[{ "priority": "high", "title": "...", "body": "...", "action_label": "...", "action_link": "/dashboard/..." }]`,
    temperature: 0.2,
  })

  const alerts = extractJsonArray<AiAlert>(text, FALLBACK_ALERTS)
  return alerts.slice(0, 3).map((alert) => ({
    priority: normalizePriority(alert.priority),
    title: String(alert.title || 'تنبيه ذكي'),
    body: String(alert.body || 'راجع البيانات واتخذ إجراء سريع.'),
    action_label: String(alert.action_label || 'فتح'),
    action_link: String(alert.action_link || '/dashboard'),
  }))
}

function normalizePriority(priority: string): AiAlert['priority'] {
  if (priority === 'critical' || priority === 'high' || priority === 'medium' || priority === 'low') return priority
  if (priority === 'عالي') return 'high'
  if (priority === 'منخفض') return 'low'
  return 'medium'
}
