import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, ErrorState, Screen } from '../../components/ui'
import { useAuth } from '../../hooks/use-auth'

export default function OtpScreen() {
  const params = useLocalSearchParams<{ phone?: string }>()
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { verifyOtp, error } = useAuth()
  const phone = params.phone ?? ''

  async function submit() {
    setSubmitting(true)
    try {
      await verifyOtp(phone, token)
      router.replace('/(tabs)')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>رمز التحقق</Text>
        <Text style={styles.subtitle}>أدخل الرمز المرسل إلى {phone || 'رقم الهاتف'}.</Text>
        {error ? <ErrorState label={error} /> : null}
        <TextInput
          value={token}
          onChangeText={setToken}
          keyboardType="number-pad"
          placeholder="000000"
          maxLength={6}
          textAlign="center"
          style={styles.input}
        />
        <Button onPress={submit} disabled={submitting || token.length < 6}>
          {submitting ? 'جاري التحقق...' : 'تأكيد الدخول'}
        </Button>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    padding: 18,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
  },
  input: {
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
  },
})
