import 'server-only'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServiceRoleClient } from '@/lib/supabase/service'
import type { AppSession } from '@/shared/auth/types'

type IngestDocument = {
  source_type: 'project' | 'unit' | 'ad'
  source_table: string
  source_id: string
  title: string
  content: string
  company_id: string | null
  visibility: 'public' | 'company'
  metadata: Record<string, unknown>
}

export type FastKnowledgeStatus = {
  documents: number
  chunks: number
  embeddedChunks: number
  conversations: number
  messages: number
  lastUpdatedAt: string | null
  recentDocuments: FastKnowledgeDocumentSummary[]
}

export type FastKnowledgeDocumentSummary = {
  id: string
  title: string
  sourceType: string
  visibility: string
  updatedAt: string
}

export type FastKnowledgeIngestResult = FastKnowledgeStatus & {
  ok: true
  documentsScanned: number
  documentsUpserted: number
  chunksUpserted: number
}

const FAST_ALLOWED_ROLES = [
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'branch_manager',
  'sales_director',
  'team_leader',
  'agent',
  'senior_agent',
  'broker',
  'account_manager',
]

export async function getFastKnowledgeStatus(session: AppSession): Promise<FastKnowledgeStatus> {
  const service = createServiceRoleClient()
  const companyId = session.profile.company_id ?? session.profile.tenant_id ?? null

  const documentQuery = service
    .from('fast_agent_documents')
    .select('id', { count: 'exact', head: true })

  const chunkQuery = service
    .from('fast_agent_chunks')
    .select('id', { count: 'exact', head: true })

  const embeddedChunkQuery = service
    .from('fast_agent_chunks')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null)

  const conversationQuery = service
    .from('fast_agent_conversations')
    .select('id', { count: 'exact', head: true })

  const messageQuery = service
    .from('fast_agent_messages')
    .select('id', { count: 'exact', head: true })

  if (companyId) {
    documentQuery.or(`company_id.eq.${companyId},company_id.is.null`)
    chunkQuery.or(`company_id.eq.${companyId},company_id.is.null`)
    embeddedChunkQuery.or(`company_id.eq.${companyId},company_id.is.null`)
    conversationQuery.eq('company_id', companyId)
    messageQuery.or(`company_id.eq.${companyId},company_id.is.null`)
  }

  const [documents, chunks, embeddedChunks, conversations, messages, latestDocument, latestMessage] = await Promise.all([
    documentQuery,
    chunkQuery,
    embeddedChunkQuery,
    conversationQuery,
    messageQuery,
    latestDocumentQuery(service, companyId),
    latestMessageQuery(service, companyId),
  ])
  const recentDocuments = await getRecentFastKnowledgeDocuments(session, 8)

  return {
    documents: documents.count ?? 0,
    chunks: chunks.count ?? 0,
    embeddedChunks: embeddedChunks.count ?? 0,
    conversations: conversations.count ?? 0,
    messages: messages.count ?? 0,
    lastUpdatedAt: latestTimestamp(latestDocument.data?.updated_at, latestMessage.data?.created_at),
    recentDocuments,
  }
}

export async function getRecentFastKnowledgeDocuments(session: AppSession, limit = 8): Promise<FastKnowledgeDocumentSummary[]> {
  const service = createServiceRoleClient()
  const companyId = session.profile.company_id ?? session.profile.tenant_id ?? null

  let query = service
    .from('fast_agent_documents')
    .select('id,title,source_type,visibility,updated_at')
    .order('updated_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 20)))

  if (companyId) query = query.or(`company_id.eq.${companyId},company_id.is.null`)

  const { data, error } = await query
  if (error) {
    console.error('FAST recent documents failed', error)
    return []
  }

  return (data ?? []).map((document) => ({
    id: document.id,
    title: document.title,
    sourceType: document.source_type,
    visibility: document.visibility,
    updatedAt: document.updated_at,
  }))
}

export async function ingestFastKnowledge(session: AppSession): Promise<FastKnowledgeIngestResult> {
  const service = createServiceRoleClient()
  const companyId = session.profile.company_id ?? session.profile.tenant_id ?? null

  const [projects, units, ads] = await Promise.all([
    service
      .from('projects')
      .select('id,company_id,name,name_ar,description,developer_id,city,district,total_units,available_units,status,commission_pct')
      .limit(80),
    service
      .from('units')
      .select('id,company_id,project_id,project_name,unit_number,unit_type,city,area_sqm,price,status,bedrooms,bathrooms,delivery_date')
      .limit(160),
    service
      .from('ads')
      .select('id,title,description,price,property_type,location,area_sqm,bedrooms,bathrooms,listing_type,status,user_id')
      .eq('status', 'approved')
      .limit(120),
  ])

  const documents: IngestDocument[] = [
    ...(projects.data ?? [])
      .filter((project) => !companyId || project.company_id === companyId || !project.company_id)
      .map((project) => ({
        source_type: 'project' as const,
        source_table: 'projects',
        source_id: String(project.id),
        title: project.name_ar ?? project.name ?? 'Project',
        content: [
          `Project: ${project.name_ar ?? project.name ?? ''}`,
          `Description: ${project.description ?? ''}`,
          `City: ${project.city ?? ''}`,
          `District: ${project.district ?? ''}`,
          `Total units: ${project.total_units ?? ''}`,
          `Available units: ${project.available_units ?? ''}`,
          `Status: ${project.status ?? ''}`,
          `Commission percent: ${project.commission_pct ?? ''}`,
        ].join('\n'),
        company_id: project.company_id ?? null,
        visibility: 'company' as const,
        metadata: { developer_id: project.developer_id },
      })),
    ...(units.data ?? [])
      .filter((unit) => !companyId || unit.company_id === companyId || !unit.company_id)
      .map((unit) => ({
        source_type: 'unit' as const,
        source_table: 'units',
        source_id: String(unit.id),
        title: `${unit.project_name ?? 'Unit'} ${unit.unit_number ?? ''}`.trim(),
        content: [
          `Unit: ${unit.unit_number ?? ''}`,
          `Project: ${unit.project_name ?? ''}`,
          `Type: ${unit.unit_type ?? ''}`,
          `City: ${unit.city ?? ''}`,
          `Area sqm: ${unit.area_sqm ?? ''}`,
          `Price: ${unit.price ?? ''} EGP`,
          `Bedrooms: ${unit.bedrooms ?? ''}`,
          `Bathrooms: ${unit.bathrooms ?? ''}`,
          `Delivery: ${unit.delivery_date ?? ''}`,
          `Status: ${unit.status ?? ''}`,
        ].join('\n'),
        company_id: unit.company_id ?? null,
        visibility: 'company' as const,
        metadata: { project_id: unit.project_id },
      })),
    ...(ads.data ?? []).map((ad) => ({
      source_type: 'ad' as const,
      source_table: 'ads',
      source_id: String(ad.id),
      title: ad.title ?? 'Marketplace ad',
      content: [
        `Ad: ${ad.title ?? ''}`,
        `Description: ${ad.description ?? ''}`,
        `Type: ${ad.property_type ?? ''}`,
        `Location: ${ad.location ?? ''}`,
        `Area sqm: ${ad.area_sqm ?? ''}`,
        `Price: ${ad.price ?? ''} EGP`,
        `Bedrooms: ${ad.bedrooms ?? ''}`,
        `Bathrooms: ${ad.bathrooms ?? ''}`,
        `Listing: ${ad.listing_type ?? ''}`,
      ].join('\n'),
      company_id: null,
      visibility: 'public' as const,
      metadata: { user_id: ad.user_id },
    })),
  ]

  let documentsUpserted = 0
  let chunksUpserted = 0

  for (const doc of documents) {
    const { data: savedDoc, error: docError } = await service
      .from('fast_agent_documents')
      .upsert({
        ...doc,
        updated_at: new Date().toISOString(),
        allowed_roles: doc.visibility === 'public' ? [] : FAST_ALLOWED_ROLES,
        created_by: session.user.id,
      }, { onConflict: 'source_type,source_table,source_id' })
      .select('id')
      .maybeSingle()

    if (docError || !savedDoc?.id) {
      console.error('FAST document ingest failed', docError)
      continue
    }

    documentsUpserted += 1

    for (const [index, content] of chunkText(doc.content).entries()) {
      const embedding = await embedContent(content)
      const { error: chunkError } = await service
        .from('fast_agent_chunks')
        .upsert({
          document_id: savedDoc.id,
          company_id: doc.company_id,
          chunk_index: index,
          content,
          embedding: embedding.length ? `[${embedding.join(',')}]` : null,
          metadata: doc.metadata,
          visibility: doc.visibility,
          allowed_roles: doc.visibility === 'public' ? [] : FAST_ALLOWED_ROLES,
        }, { onConflict: 'document_id,chunk_index' })

      if (!chunkError) chunksUpserted += 1
      else console.error('FAST chunk ingest failed', chunkError)
    }
  }

  const status = await getFastKnowledgeStatus(session)

  return {
    ok: true,
    documentsScanned: documents.length,
    documentsUpserted,
    chunksUpserted,
    ...status,
  }
}

function chunkText(content: string) {
  const normalized = content.replace(/\s+\n/g, '\n').trim()
  if (normalized.length <= 1200) return [normalized]

  const chunks: string[] = []
  for (let index = 0; index < normalized.length; index += 1000) {
    chunks.push(normalized.slice(index, index + 1200))
  }
  return chunks
}

async function embedContent(content: string): Promise<number[]> {
  if (!process.env.GEMINI_API_KEY) return []

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004' })
    const result = await model.embedContent(content)
    return result.embedding.values.slice(0, 768)
  } catch (error) {
    console.error('FAST ingest embedding failed', error)
    return []
  }
}

function latestDocumentQuery(service: ReturnType<typeof createServiceRoleClient>, companyId: string | null) {
  let query = service
    .from('fast_agent_documents')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (companyId) query = query.or(`company_id.eq.${companyId},company_id.is.null`)
  return query.maybeSingle()
}

function latestMessageQuery(service: ReturnType<typeof createServiceRoleClient>, companyId: string | null) {
  let query = service
    .from('fast_agent_messages')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  if (companyId) query = query.or(`company_id.eq.${companyId},company_id.is.null`)
  return query.maybeSingle()
}

function latestTimestamp(first?: string | null, second?: string | null) {
  const values = [first, second].filter(Boolean) as string[]
  if (!values.length) return null
  return values.sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
}
