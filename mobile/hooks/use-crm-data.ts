import NetInfo from '@react-native-community/netinfo'
import { useEffect, useMemo, useState } from 'react'
import { cacheClients, cacheDeals, getCachedClients, getCachedDeals, syncOfflineQueue } from '../lib/offline'
import { supabase } from '../lib/supabase'
import type { MobileClient, MobileDeal, MobileTask, PipelineStage } from '../lib/types'

export function useCrmData() {
  const [clients, setClients] = useState<MobileClient[]>([])
  const [deals, setDeals] = useState<MobileDeal[]>([])
  const [tasks, setTasks] = useState<MobileTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false
      setIsOffline(offline)
      if (!offline) void syncOfflineQueue().catch(() => undefined)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const net = await NetInfo.fetch()
      const offline = net.isConnected === false || net.isInternetReachable === false
      setIsOffline(offline)

      if (offline) {
        const [cachedClients, cachedDeals] = await Promise.all([getCachedClients(), getCachedDeals()])
        setClients(cachedClients)
        setDeals(cachedDeals)
        setTasks([])
        return
      }

      const [clientsResult, dealsResult, tasksResult] = await Promise.all([
        supabase
          .from('leads')
          .select('id, name, client_name, full_name, phone, status, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('deals')
          .select('id, title, stage, value, unit_value, client_name, project_name, updated_at, created_at')
          .not('stage', 'in', '("closed","lost")')
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(100),
        supabase
          .from('tasks')
          .select('id, title, due_date, status')
          .neq('status', 'done')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(10),
      ])

      if (clientsResult.error) throw clientsResult.error
      if (dealsResult.error) throw dealsResult.error
      if (tasksResult.error) throw tasksResult.error

      const nextClients = (clientsResult.data ?? []).map((client) => ({
        id: client.id,
        name: client.name ?? client.client_name ?? client.full_name ?? 'عميل غير محدد',
        phone: client.phone ?? null,
        status: client.status ?? null,
        created_at: client.created_at ?? null,
      }))

      const nextDeals = (dealsResult.data ?? []).map((deal) => ({
        id: deal.id,
        title: deal.title ?? 'صفقة عقارية',
        stage: normalizeStage(deal.stage),
        value: Number(deal.value ?? deal.unit_value ?? 0),
        client_name: deal.client_name ?? null,
        project_name: deal.project_name ?? null,
        updated_at: deal.updated_at ?? null,
        created_at: deal.created_at ?? null,
      }))

      setClients(nextClients)
      setDeals(nextDeals)
      setTasks((tasksResult.data ?? []) as MobileTask[])
      await Promise.all([cacheClients(nextClients), cacheDeals(nextDeals)])
    } catch (loadError) {
      const [cachedClients, cachedDeals] = await Promise.all([getCachedClients(), getCachedDeals()])
      setClients(cachedClients)
      setDeals(cachedDeals)
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل البيانات')
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }

  const kpis = useMemo(() => ({
    clients: clients.length,
    activeDeals: deals.length,
    pipelineValue: deals.reduce((sum, deal) => sum + deal.value, 0),
    todayTasks: tasks.length,
  }), [clients.length, deals, tasks.length])

  return {
    clients,
    deals,
    tasks,
    kpis,
    loading,
    error,
    isOffline,
    refresh: load,
  }
}

export function normalizeStage(stage: string | null | undefined): PipelineStage {
  if (stage === 'contacted' || stage === 'viewing' || stage === 'offer' || stage === 'contract' || stage === 'closed' || stage === 'lost') return stage
  return 'new'
}
