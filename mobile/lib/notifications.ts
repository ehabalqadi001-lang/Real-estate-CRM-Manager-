import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(userId: string) {
  const current = await Notifications.getPermissionsAsync()
  const finalStatus = current.status === 'granted'
    ? current.status
    : (await Notifications.requestPermissionsAsync()).status

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('crm', {
      name: 'Fast Investment CRM',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16a34a',
    })
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,token' })

  return token
}
