import { FlashList } from '@shopify/flash-list'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, ErrorState, LoadingState, Screen } from '../../components/ui'
import { supabase } from '../../lib/supabase'

type CommissionRow = {
  id: string
  status: string | null
  gross_commission: number | null
  agent_amount: number | null
  created_at: string | null
}

export default function CommissionsTab() {
  const [rows, setRows] = useState<CommissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: queryError } = await supabase
      .from('commissions')
      .select('id, status, gross_commission, agent_amount, created_at')
      .eq('agent_id', user?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(50)

    if (queryError) setError(queryError.message)
    setRows((data ?? []) as CommissionRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(frame)
  }, [load])

  const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.agent_amount ?? row.gross_commission ?? 0), 0), [rows])

  if (loading) return <Screen><LoadingState /></Screen>

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title}>أرباحي</Text>
        <Card>
          <Text style={styles.meta}>إجمالي عمولاتي</Text>
          <Text style={styles.total}>{formatMoney(total)}</Text>
        </Card>
        {error ? <ErrorState label={error} onRetry={load} /> : null}
        <FlashList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.name}>{formatMoney(Number(item.agent_amount ?? item.gross_commission ?? 0))}</Text>
              <Text style={styles.meta}>{statusLabel(item.status)} · {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : 'بدون تاريخ'}</Text>
            </Card>
          )}
          ListEmptyComponent={<EmptyState label="لا توجد عمولات مسجلة" />}
        />
      </View>
    </Screen>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value)} ج.م`
}

function statusLabel(status: string | null) {
  const labels: Record<string, string> = {
    pending: 'قيد المراجعة',
    approved: 'معتمدة',
    processing: 'قيد الصرف',
    paid: 'مدفوعة',
    disputed: 'نزاع',
  }
  return labels[status ?? ''] ?? 'غير محدد'
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  title: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
  },
  total: {
    marginTop: 6,
    color: '#16a34a',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
  },
  card: {
    marginBottom: 10,
  },
  name: {
    color: '#0f172a',
    fontWeight: '900',
    textAlign: 'right',
  },
  meta: {
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
  },
})
