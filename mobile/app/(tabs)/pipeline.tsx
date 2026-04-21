import { StyleSheet, Text, View } from 'react-native'
import { PipelineBoard } from '../../components/pipeline-board'
import { ErrorState, LoadingState, Screen } from '../../components/ui'
import { useCrmData } from '../../hooks/use-crm-data'

export default function PipelineTab() {
  const { deals, loading, error, isOffline, refresh } = useCrmData()

  if (loading) return <Screen><LoadingState /></Screen>

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>خط المبيعات</Text>
        <Text style={styles.subtitle}>{isOffline ? 'وضع غير متصل: سيتم مزامنة التغييرات لاحقاً' : 'اسحب أفقياً بين المراحل'}</Text>
      </View>
      {error ? <ErrorState label={error} onRetry={refresh} /> : null}
      <PipelineBoard deals={deals} offline={isOffline} onChanged={refresh} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
    padding: 16,
    paddingBottom: 0,
  },
  title: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
  },
})
