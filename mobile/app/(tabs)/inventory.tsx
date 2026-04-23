import { FlashList } from '@shopify/flash-list'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { Card, EmptyState, ErrorState, LoadingState, Screen } from '../../components/ui'
import { supabase } from '../../lib/supabase'

type UnitRow = {
  id: string
  unit_name: string | null
  unit_type: string | null
  price: number | null
  area_sqm: number | null
  status: string | null
}

export default function InventoryTab() {
  const [units, setUnits] = useState<UnitRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('inventory')
      .select('id, unit_name, unit_type, price, area_sqm, status')
      .order('created_at', { ascending: false })
      .limit(100)

    if (queryError) setError(queryError.message)
    setUnits((data ?? []) as UnitRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(frame)
  }, [load])

  const filtered = units.filter((unit) => `${unit.unit_name ?? ''} ${unit.unit_type ?? ''}`.includes(search))

  if (loading) return <Screen><LoadingState /></Screen>

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title}>بحث الوحدات</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder="اسم الوحدة أو نوعها" textAlign="right" style={styles.input} />
        {error ? <ErrorState label={error} onRetry={load} /> : null}
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.name}>{item.unit_name ?? 'وحدة عقارية'}</Text>
              <Text style={styles.meta}>{item.unit_type ?? 'غير محدد'} · {item.area_sqm ?? 0} م² · {item.status ?? 'متاح'}</Text>
              <Text style={styles.price}>{formatMoney(Number(item.price ?? 0))}</Text>
            </Card>
          )}
          ListEmptyComponent={<EmptyState label="لا توجد وحدات مطابقة" />}
        />
      </View>
    </Screen>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value)} ج.م`
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
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontWeight: '800',
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
    marginTop: 5,
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
  },
  price: {
    marginTop: 8,
    color: '#16a34a',
    fontWeight: '900',
    textAlign: 'right',
  },
})
