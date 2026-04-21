import '../global.css'
import { Stack, router, usePathname } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { I18nManager } from 'react-native'
import { useAuth } from '../hooks/use-auth'

I18nManager.allowRTL(true)
I18nManager.forceRTL(false)

export default function RootLayout() {
  const { session, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    const inAuth = pathname.startsWith('/(auth)')
    if (!session && !inAuth) router.replace('/(auth)/login')
    if (session && inAuth) router.replace('/(tabs)')
  }, [loading, pathname, session])

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link
      if (typeof link === 'string') router.push(link)
    })

    return () => subscription.remove()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}
