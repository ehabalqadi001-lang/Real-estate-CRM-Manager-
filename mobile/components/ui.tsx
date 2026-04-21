import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Button({
  children,
  onPress,
  disabled,
  variant = 'primary',
}: {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.86 },
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryButtonText]}>{children}</Text>
    </Pressable>
  )
}

export function LoadingState({ label = 'جاري التحميل...' }: { label?: string }) {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator color="#16a34a" />
      <Text style={styles.muted}>{label}</Text>
    </View>
  )
}

export function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.centerState}>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  )
}

export function ErrorState({ label, onRetry }: { label: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorState}>
      <Text style={styles.errorText}>{label}</Text>
      {onRetry ? <Button variant="secondary" onPress={onRetry}>إعادة المحاولة</Button> : null}
    </View>
  )
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    writingDirection: 'rtl',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 14,
  },
  button: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
  },
  centerState: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  muted: {
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontWeight: '900',
    textAlign: 'center',
  },
  errorState: {
    margin: 16,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '900',
    textAlign: 'right',
  },
})
