import { useCallback, useEffect, useMemo, useState } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { deleteSecureValue, getSecureValue, setSecureValue } from '../lib/storage'
import { registerForPushNotifications } from '../lib/notifications'

export type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  sendOtp: (phone: string) => Promise<void>
  verifyOtp: (phone: string, token: string) => Promise<void>
  unlockWithBiometrics: () => Promise<boolean>
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user.id) void registerForPushNotifications(nextSession.user.id)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const sendOtp = useCallback(async (phone: string) => {
    setError(null)
    const normalizedPhone = normalizeEgyptPhone(phone)
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: normalizedPhone })
    if (otpError) {
      setError(otpError.message)
      throw otpError
    }
    await setSecureValue('last-phone', normalizedPhone)
  }, [])

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    setError(null)
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizeEgyptPhone(phone),
      token,
      type: 'sms',
    })

    if (verifyError) {
      setError(verifyError.message)
      throw verifyError
    }

    if (data.session) setSession(data.session)
    if (data.user?.id) await registerForPushNotifications(data.user.id)
  }, [])

  const unlockWithBiometrics = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    const lastPhone = await getSecureValue('last-phone')
    if (!hasHardware || !enrolled || !lastPhone) return false

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'فتح Fast Investment CRM',
      cancelLabel: 'إلغاء',
      fallbackLabel: 'استخدام رمز الدخول',
    })

    return result.success
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    await deleteSecureValue('last-phone')
    setSession(null)
  }, [])

  return useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    error,
    sendOtp,
    verifyOtp,
    unlockWithBiometrics,
    signOut,
  }), [error, loading, sendOtp, session, signOut, unlockWithBiometrics, verifyOtp])
}

function normalizeEgyptPhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`
  if (digits.startsWith('20')) return `+${digits}`
  return `+20${digits}`
}
