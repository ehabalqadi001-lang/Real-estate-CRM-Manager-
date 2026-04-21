import { router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, ErrorState, Screen } from '../../components/ui'
import { useAuth } from '../../hooks/use-auth'

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { sendOtp, unlockWithBiometrics, error } = useAuth()

  async function submit() {
    setSubmitting(true)
    try {
      await sendOtp(phone)
      router.push({ pathname: '/(auth)/otp', params: { phone } })
    } finally {
      setSubmitting(false)
    }
  }

  async function biometricUnlock() {
    const ok = await unlockWithBiometrics()
    if (ok) router.replace('/(tabs)')
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>Fast Investment CRM</Text>
          <Text style={styles.title}>تسجيل الدخول برقم الهاتف</Text>
          <Text style={styles.subtitle}>أدخل رقم الهاتف المسجل لاستلام رمز تحقق عبر SMS.</Text>
        </View>

        {error ? <ErrorState label={error} /> : null}

        <View style={styles.form}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+201XXXXXXXXX"
            textAlign="right"
            style={styles.input}
          />
          <Button onPress={submit} disabled={submitting || phone.trim().length < 8}>
            {submitting ? 'جاري الإرسال...' : 'إرسال رمز الدخول'}
          </Button>
          <Button variant="secondary" onPress={biometricUnlock}>فتح بالبصمة</Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 22,
    padding: 18,
  },
  header: {
    gap: 8,
  },
  brand: {
    color: '#16a34a',
    fontWeight: '900',
    textAlign: 'right',
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
    lineHeight: 24,
    textAlign: 'right',
  },
  form: {
    gap: 12,
  },
  label: {
    color: '#0f172a',
    fontWeight: '900',
    textAlign: 'right',
  },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontWeight: '800',
  },
})
