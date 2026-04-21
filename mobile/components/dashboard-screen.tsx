import { FlashList } from '@shopify/flash-list'
import { Link } from 'expo-router'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, ErrorState, LoadingState, Screen } from './ui'
import { useCrmData } from '../hooks/use-crm-data'

export function DashboardScreen() {
  const { clients, deals, tasks, kpis, loading, error, isOffline, refresh } = useCrmData()

  if (loading) return <Screen><LoadingState /></Screen>

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>FAST INVESTMENT CRM</Text>
            <Text style={styles.title}>لوحة اليوم</Text>
          </View>
          {isOffline ? <Text style={styles.offline}>بيانات محفوظة</Text> : <Text style={styles.online}>متصل</Text>}
        </View>

        {error ? <ErrorState label={error} onRetry={refresh} /> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          <KpiCard label="العملاء" value={kpis.clients.toLocaleString('ar-EG')} />
          <KpiCard label="صفقات نشطة" value={kpis.activeDeals.toLocaleString('ar-EG')} />
          <KpiCard label="قيمة Pipeline" value={formatMoney(kpis.pipelineValue)} />
          <KpiCard label="مهام اليوم" value={kpis.todayTasks.toLocaleString('ar-EG')} />
        </ScrollView>

        <Section title="مهام اليوم">
          {tasks.length === 0 ? <EmptyState label="لا توجد مهام عاجلة اليوم" /> : tasks.map((task) => (
            <Card key={task.id} style={styles.item}>
              <Text style={styles.itemTitle}>{task.title}</Text>
              <Text style={styles.itemMeta}>{task.due_date ? new Date(task.due_date).toLocaleDateString('ar-EG') : 'بدون موعد'}</Text>
            </Card>
          ))}
        </Section>

        <Section title="آخر النشاطات">
          <View style={styles.feed}>
            {deals.slice(0, 5).map((deal) => (
              <View key={deal.id} style={styles.feedItem}>
                <Text style={styles.itemTitle}>{deal.title}</Text>
                <Text style={styles.itemMeta}>{stageLabel(deal.stage)} · {formatMoney(deal.value)}</Text>
              </View>
            ))}
            {deals.length === 0 ? <EmptyState label="لا توجد صفقات نشطة" /> : null}
          </View>
        </Section>

        <Section title="عملاء حديثون">
          <FlashList
            data={clients.slice(0, 8)}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={styles.item}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.phone ?? 'بدون رقم'} · {item.status ?? 'جديد'}</Text>
              </Card>
            )}
            ListEmptyComponent={<EmptyState label="لا توجد بيانات عملاء" />}
          />
        </Section>
      </ScrollView>

      <Link href="/(tabs)/clients" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+ عميل</Text>
        </Pressable>
      </Link>
    </Screen>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.kpiCard}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ج.م`
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    new: 'جديد',
    contacted: 'تواصل',
    viewing: 'معاينة',
    offer: 'عرض سعر',
    contract: 'عقد',
    closed: 'مغلقة',
    lost: 'خسرنا',
  }
  return labels[stage] ?? stage
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
  },
  offline: {
    borderRadius: 999,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: '900',
  },
  online: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    color: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: '900',
  },
  kpiRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  kpiCard: {
    width: 150,
  },
  kpiValue: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
  kpiLabel: {
    marginTop: 6,
    color: '#64748b',
    fontWeight: '800',
    textAlign: 'right',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
  },
  item: {
    marginBottom: 8,
  },
  itemTitle: {
    color: '#0f172a',
    fontWeight: '900',
    textAlign: 'right',
  },
  itemMeta: {
    marginTop: 4,
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
  },
  feed: {
    gap: 8,
  },
  feedItem: {
    borderRightWidth: 3,
    borderRightColor: '#16a34a',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontWeight: '900',
  },
})
