import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, EmptyState } from './ui'
import { enqueueOfflineAction } from '../lib/offline'
import { supabase } from '../lib/supabase'
import type { MobileDeal, PipelineStage } from '../lib/types'

const STAGES: Array<{ key: PipelineStage; label: string }> = [
  { key: 'new', label: 'جديد' },
  { key: 'contacted', label: 'تواصل' },
  { key: 'viewing', label: 'معاينة' },
  { key: 'offer', label: 'عرض سعر' },
  { key: 'contract', label: 'عقد' },
  { key: 'closed', label: 'مغلقة' },
  { key: 'lost', label: 'خسرنا' },
]

export function PipelineBoard({ deals, offline, onChanged }: { deals: MobileDeal[]; offline: boolean; onChanged: () => void }) {
  const [selected, setSelected] = useState<MobileDeal | null>(null)
  const grouped = useMemo(() => STAGES.map((stage) => ({
    ...stage,
    deals: deals.filter((deal) => deal.stage === stage.key),
  })), [deals])

  async function moveNext(deal: MobileDeal) {
    const index = STAGES.findIndex((stage) => stage.key === deal.stage)
    const next = STAGES[index + 1]
    if (!next) return

    if (offline) {
      await enqueueOfflineAction({ type: 'update_stage', payload: { dealId: deal.id, stage: next.key } })
      onChanged()
      return
    }

    const { error } = await supabase.from('deals').update({ stage: next.key }).eq('id', deal.id)
    if (error) throw error
    onChanged()
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
        {grouped.map((column) => (
          <View key={column.key} style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{column.label}</Text>
              <Text style={styles.badge}>{column.deals.length.toLocaleString('ar-EG')}</Text>
            </View>
            {column.deals.length === 0 ? <EmptyState label="لا توجد صفقات" /> : column.deals.map((deal) => (
              <Pressable key={deal.id} onPress={() => setSelected(deal)} onLongPress={() => void moveNext(deal)}>
                <Card style={styles.dealCard}>
                  <Text style={styles.dealTitle}>{deal.client_name ?? deal.title}</Text>
                  <Text style={styles.dealMeta}>{deal.project_name ?? 'مشروع غير محدد'}</Text>
                  <Text style={styles.dealValue}>{formatMoney(deal.value)}</Text>
                  <Text style={styles.hint}>اسحب/اضغط مطولاً للمرحلة التالية</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      <Modal visible={selected !== null} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.dealMeta}>{selected?.client_name ?? 'عميل غير محدد'}</Text>
            <Text style={styles.dealValue}>{formatMoney(selected?.value ?? 0)}</Text>
            <Button onPress={() => selected && void moveNext(selected)}>نقل للمرحلة التالية</Button>
            <Button variant="secondary" onPress={() => setSelected(null)}>إغلاق</Button>
          </View>
        </View>
      </Modal>
    </>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value)} ج.م`
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row-reverse',
    gap: 12,
    padding: 16,
  },
  column: {
    width: 290,
    minHeight: 520,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  columnHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  columnTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  badge: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    color: '#166534',
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontWeight: '900',
  },
  dealCard: {
    marginBottom: 10,
  },
  dealTitle: {
    color: '#0f172a',
    fontWeight: '900',
    textAlign: 'right',
  },
  dealMeta: {
    marginTop: 5,
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
  },
  dealValue: {
    marginTop: 10,
    color: '#16a34a',
    fontWeight: '900',
    textAlign: 'right',
  },
  hint: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalContent: {
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
    padding: 18,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
})
