import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarLabelStyle: { fontWeight: '900' },
        tabBarStyle: { minHeight: 62, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="pipeline" options={{ title: 'Pipeline' }} />
      <Tabs.Screen name="clients" options={{ title: 'العملاء' }} />
      <Tabs.Screen name="inventory" options={{ title: 'المخزون' }} />
      <Tabs.Screen name="commissions" options={{ title: 'أرباحي' }} />
    </Tabs>
  )
}
