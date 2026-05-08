import { FlashList } from '@shopify/flash-list'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, ErrorState, LoadingState, Screen } from '../../components/ui'
import { supabase } from '../../lib/supabase'

type NotificationRow = {
  id: string
  type: string | null
  title: string | null
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string | null
}

export default function NotificationsTab() {
  const [items, setItems] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('id, type, title, body, link, is_read, created_at')
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(50)

    if (queryError) setError(queryError.message)
    const rows = (data ?? []) as NotificationRow[]
    setItems(rows)
    setUnreadCount(rows.filter((n) => !n.is_read).length)
    setLoading(false)
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => { void load() })
    return () => cancelAnimationFrame(frame)
  }, [load])

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id ?? '')
      .eq('is_read', false)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [])

  if (loading) return <Screen><LoadingState /></Screen>

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>الإشعارات</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>تحديد الكل كمقروء</Text>
          </Pressable>
        )}
      </View>

      {error ? <ErrorState label={error} onRetry={load} /> : null}

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => { if (!item.is_read) void markRead(item.id) }}>
            <Card style={[styles.card, !item.is_read && styles.unread]}>
              {!item.is_read && <View style={styles.dot} />}
              <Text style={styles.notifTitle}>{item.title ?? 'إشعار'}</Text>
              <Text style={styles.notifBody}>{item.body ?? ''}</Text>
              <Text style={styles.notifTime}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
                  : ''}
              </Text>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState label="لا توجد إشعارات" />}
        contentContainerStyle={styles.list}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    padding: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
  },
  badge: {
    borderRadius: 999,
    backgroundColor: '#ef4444',
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  markAllBtn: {
    alignSelf: 'flex-end',
  },
  markAllText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 13,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 10,
    position: 'relative',
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
  },
  dot: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  notifTitle: {
    color: '#0f172a',
    fontWeight: '900',
    textAlign: 'right',
    paddingRight: 4,
  },
  notifBody: {
    marginTop: 4,
    color: '#475569',
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 20,
  },
  notifTime: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
})
