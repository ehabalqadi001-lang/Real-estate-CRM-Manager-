import { NextRequest, NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/erp/legal/generate
//
// Body: { templateId, dealId?, variables?: Record<string, string> }
//
// 1. Load the template from legal_templates
// 2. Merge deal data + variables into template content ({{variable}} placeholders)
// 3. Create a legal_documents record (status = 'draft')
// 4. Append an entry to legal_audit_logs
// 5. Return the new document record
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templateId, dealId, variables = {} } = body as {
      templateId: string
      dealId?: string
      variables?: Record<string, string>
    }

    if (!templateId) return NextResponse.json({ error: 'templateId is required' }, { status: 400 })

    const supabase = await createRawClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 403 })

    const allowedRoles = ['super_admin', 'legal_manager', 'hr_manager', 'finance_manager']
    if (!allowedRoles.includes(profile.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Load template
    const { data: template, error: tplErr } = await supabase
      .from('legal_templates')
      .select('id, name, template_type, content_html, content_json, required_variables, is_active')
      .eq('id', templateId)
      .eq('company_id', profile.company_id)
      .single()

    if (tplErr || !template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    if (!template.is_active) return NextResponse.json({ error: 'Template is inactive' }, { status: 400 })

    // 2. Optionally resolve deal variables
    const mergedVars: Record<string, string> = { ...variables }

    if (dealId) {
      const { data: deal } = await supabase
        .from('deals')
        .select(`
          id, title, project_name, compound, unit_value, amount_paid,
          governorate, property_type, stage,
          client:clients(full_name, phone, national_id, email),
          agent:profiles!deals_agent_id_fkey(full_name, email)
        `)
        .eq('id', dealId)
        .eq('company_id', profile.company_id)
        .single()

      if (deal) {
        const client = Array.isArray(deal.client) ? deal.client[0] : deal.client
        const agent  = Array.isArray(deal.agent)  ? deal.agent[0]  : deal.agent

        Object.assign(mergedVars, {
          deal_id:         deal.id,
          deal_title:      deal.title ?? deal.project_name ?? '',
          compound:        deal.compound ?? '',
          unit_value:      String(deal.unit_value ?? 0),
          amount_paid:     String(deal.amount_paid ?? 0),
          governorate:     deal.governorate ?? '',
          property_type:   deal.property_type ?? '',
          client_name:     client?.full_name ?? '',
          client_phone:    client?.phone ?? '',
          client_national_id: client?.national_id ?? '',
          agent_name:      agent?.full_name ?? '',
        })
      }
    }

    // 3. Render template — replace {{variable}} placeholders
    let renderedHtml = template.content_html ?? ''
    for (const [key, val] of Object.entries(mergedVars)) {
      renderedHtml = renderedHtml.replaceAll(`{{${key}}}`, val)
    }

    // Validate required variables are all filled
    const missing = (template.required_variables ?? []).filter(
      (v: string) => renderedHtml.includes(`{{${v}}}`)
    )
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Missing required variables: ${missing.join(', ')}`,
      }, { status: 400 })
    }

    // 4. Persist legal document (column names match legal_documents schema)
    const { data: doc, error: docErr } = await supabase
      .from('legal_documents')
      .insert({
        company_id:         profile.company_id,
        template_id:        template.id,
        deal_id:            dealId ?? null,
        title:              `${template.name} — ${mergedVars.client_name || mergedVars.deal_title || new Date().toLocaleDateString('ar-EG')}`,
        document_type:      template.template_type,
        generated_html:     renderedHtml,
        variables_snapshot: mergedVars,
        status:             'draft',
        generated_by:       user.id,
        client_name:        mergedVars.client_name ?? null,
      })
      .select()
      .single()

    if (docErr) throw docErr

    // 5. Audit log entry
    await supabase.from('legal_audit_logs').insert({
      company_id:   profile.company_id,
      document_id:  doc.id,
      action:       'created',
      actor_id:     user.id,
      actor_name:   profile.full_name ?? user.email,
      actor_role:   profile.role,
      details: {
        template_id:   template.id,
        template_name: template.name,
        deal_id:       dealId ?? null,
      },
    })

    return NextResponse.json({ success: true, document: doc })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
