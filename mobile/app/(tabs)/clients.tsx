import { FlashList } from '@shopify/flash-list'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useMemo, useState } from 'react'
import { Card, EmptyState, ErrorState, LoadingState, Screen } from '../../components/ui'
import { useCrmData } from '../../hooks/use-crm-data'

export default function ClientsTab() {
  const { clients, loading, error, refresh } = useCrmData()
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => clients.filter((client) => `${client.name} ${client.phone ?? ''}`.includes(search)), [clients, search])

  if (loading) return <Screen><LoadingState /></Screen>

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title}>العملاء</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder="بحث بالاسم أو الهاتف" textAlign="right" style={styles.input} />
        {error ? <ErrorState label={error} onRetry={refresh} /> : null}
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.phone ?? 'بدون رقم'} · {item.status ?? 'جديد'}</Text>
            </Card>
          )}
          ListEmptyComponent={<EmptyState label="لا توجد نتائج" />}
        />
      </View>
    </Screen>
  )
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
})
