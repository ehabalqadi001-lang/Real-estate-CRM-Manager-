import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import type { MobileClient, MobileDeal, OfflineAction } from './types'

const CLIENTS_KEY = 'fast-investment:last-clients'
const DEALS_KEY = 'fast-investment:active-deals'
const QUEUE_KEY = 'fast-investment:offline-queue'

export async function cacheClients(clients: MobileClient[]) {
  await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients.slice(0, 100)))
}

export async function cacheDeals(deals: MobileDeal[]) {
  await AsyncStorage.setItem(DEALS_KEY, JSON.stringify(deals.slice(0, 100)))
}

export async function getCachedClients(): Promise<MobileClient[]> {
  const raw = await AsyncStorage.getItem(CLIENTS_KEY)
  return raw ? JSON.parse(raw) as MobileClient[] : []
}

export async function getCachedDeals(): Promise<MobileDeal[]> {
  const raw = await AsyncStorage.getItem(DEALS_KEY)
  return raw ? JSON.parse(raw) as MobileDeal[] : []
}

export async function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt'>) {
  const current = await getOfflineQueue()
  const next: OfflineAction = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  } as OfflineAction
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...current, next]))
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  return raw ? JSON.parse(raw) as OfflineAction[] : []
}

export async function syncOfflineQueue() {
  const queue = await getOfflineQueue()
  if (queue.length === 0) return { synced: 0 }

  let synced = 0
  for (const action of queue) {
    if (action.type === 'update_stage') {
      const { error } = await supabase
        .from('deals')
        .update({ stage: action.payload.stage, updated_at: new Date().toISOString() })
        .eq('id', action.payload.dealId)
      if (error) throw error
      synced += 1
    }

    if (action.type === 'add_note') {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('deal_activities').insert({
        deal_id: action.payload.dealId,
        user_id: user?.id ?? null,
        action: 'note',
        note: action.payload.note,
      })
      if (error) throw error
      synced += 1
    }
  }

  await AsyncStorage.removeItem(QUEUE_KEY)
  return { synced }
}
