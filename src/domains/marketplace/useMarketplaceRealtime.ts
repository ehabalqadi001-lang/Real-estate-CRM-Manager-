'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/shared/supabase/browser'

export function useAdStatus(adId: string, initialStatus: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['ad-status', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('status, rejection_reason, reviewed_at')
        .eq('id', adId)
        .single()

      if (error) throw error
      return data
    },
    initialData: { status: initialStatus, rejection_reason: null, reviewed_at: null },
  })

  useEffect(() => {
    const channel = supabase
      .channel(`ad-status-${adId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ads', filter: `id=eq.${adId}` },
        () => queryClient.invalidateQueries({ queryKey: ['ad-status', adId] })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [adId, queryClient, supabase])

  return query
}

export function useChatMessages(adId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['chat-messages', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('ad_id', adId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    refetchInterval: false,
  })

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${adId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `ad_id=eq.${adId}` },
        () => queryClient.invalidateQueries({ queryKey: ['chat-messages', adId] })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [adId, queryClient, supabase])

  return query
}
