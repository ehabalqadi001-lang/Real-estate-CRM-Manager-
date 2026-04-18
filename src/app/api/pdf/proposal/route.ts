import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ProposalDocument, type ProposalData } from '@/lib/pdf/ProposalDocument'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dealId = searchParams.get('dealId')

  let data: ProposalData

  if (dealId) {
    const supabase = await createRawClient()
    const { data: deal } = await supabase
      .from('deals')
      .select(`
        id, compound, property_type, unit_value, amount_paid,
        governorate, stage, created_at,
        client:clients(full_name, phone, national_id),
        developer:developers(name),
        agent:profiles!deals_agent_id_fkey(full_name)
      `)
      .eq('id', dealId)
      .single()

    const client = Array.isArray(deal?.client) ? deal?.client[0] : deal?.client
    const developer = Array.isArray(deal?.developer) ? deal?.developer[0] : deal?.developer
    const agent = Array.isArray(deal?.agent) ? deal?.agent[0] : deal?.agent

    const totalPrice = deal?.unit_value ?? 0
    const downPayment = deal?.amount_paid ?? 0

    data = {
      proposalNumber: `FI-${dealId?.slice(0, 8).toUpperCase()}`,
      date: new Date().toLocaleDateString('ar-EG'),
      clientName: client?.full_name ?? 'عميل غير معروف',
      clientPhone: client?.phone ?? undefined,
      clientNationalId: client?.national_id ?? undefined,
      agentName: agent?.full_name ?? undefined,
      compound: deal?.compound ?? '—',
      developer: typeof developer === 'string' ? developer : developer?.name,
      unitType: deal?.property_type ?? undefined,
      governorate: deal?.governorate ?? undefined,
      totalPrice,
      downPayment,
      monthlyInstallment: totalPrice > downPayment ? Math.round((totalPrice - downPayment) / 60) : undefined,
      installmentYears: 5,
      expectedReturn: 12,
      notes: 'هذا المقترح صالح لمدة 30 يوماً من تاريخ الإصدار. الأسعار قابلة للتغيير وفقاً لسياسة المطور.',
    }
  } else {
    // Demo proposal when no dealId supplied
    data = {
      proposalNumber: 'FI-DEMO-001',
      date: new Date().toLocaleDateString('ar-EG'),
      clientName: 'عميل تجريبي',
      clientPhone: '01000000000',
      agentName: 'مسؤول المبيعات',
      compound: 'مدينة نصر الجديدة',
      developer: 'FAST INVESTMENT',
      unitType: 'شقة',
      area: 120,
      floor: 3,
      unitNumber: 'A-301',
      governorate: 'القاهرة',
      deliveryDate: '2027',
      finishType: 'نصف تشطيب',
      totalPrice: 2_400_000,
      downPayment: 480_000,
      monthlyInstallment: 32_000,
      installmentYears: 5,
      maintenanceFees: 24_000,
      expectedReturn: 12,
      installments: [
        { label: 'مقدم الحجز', amount: 48_000, dueDate: new Date().toLocaleDateString('ar-EG') },
        { label: 'دفعة العقد (خلال 30 يوم)', amount: 432_000, dueDate: '' },
        { label: 'قسط شهري × 60 شهر', amount: 32_000, dueDate: 'شهرياً' },
      ],
      notes: 'هذا المقترح صالح لمدة 30 يوماً من تاريخ الإصدار. الأسعار قابلة للتغيير وفقاً لسياسة المطور. تواصل مع مسؤول المبيعات للحصول على عرض نهائي.',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(ProposalDocument, { data }) as any)

  const filename = `FI_Proposal_${data.proposalNumber}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
