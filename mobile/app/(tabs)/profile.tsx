import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, LoadingState, Screen } from '../../components/ui'
import { useAuth } from '../../hooks/use-auth'
import { supabase } from '../../lib/supabase'

type ProfileData = {
  full_name: string | null
  phone: string | null
  role: string | null
  company_name: string | null
  avatar_url: string | null
}

export default function ProfileTab() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ leads: 0, deals: 0, commissions: 0 })

  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const [profileRes, leadsRes, dealsRes, commRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('full_name, phone, role, company_name, avatar_url')
        .eq('id', user.id)
        .single(),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('assigned_to', user.id),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('assigned_to', user.id).not('stage', 'in', '("closed","lost")'),
      supabase.from('commissions').select('agent_amount').eq('agent_id', user.id).eq('status', 'paid'),
    ])

    if (profileRes.data) setProfile(profileRes.data as ProfileData)
    setStats({
      leads: leadsRes.count ?? 0,
      deals: dealsRes.count ?? 0,
      commissions: (commRes.data ?? []).reduce((sum, r) => sum + Number(r.agent_amount ?? 0), 0),
    })
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSignOut = useCallback(() => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: () => void signOut() },
    ])
  }, [signOut])

  if (authLoading || loading) return <Screen><LoadingState /></Screen>

  const roleLabel: Record<string, string> = {
    super_admin: 'مدير النظام',
    company_admin: 'مدير الشركة',
    company_owner: 'مالك الشركة',
    sales_manager: 'مدير مبيعات',
    sales_agent: 'وكيل مبيعات',
    account_manager: 'مدير حسابات',
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'المستخدم'}</Text>
          <Text style={styles.role}>{roleLabel[profile?.role ?? ''] ?? profile?.role ?? ''}</Text>
          {profile?.company_name ? (
            <Text style={styles.company}>{profile.company_name}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="عملائي" value={stats.leads.toLocaleString('ar-EG')} />
          <StatCard label="صفقات نشطة" value={stats.deals.toLocaleString('ar-EG')} />
          <StatCard
            label="عمولات مدفوعة"
            value={`${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(stats.commissions)} ج`}
          />
        </View>

        {/* Info */}
        <Card style={styles.infoCard}>
          <InfoRow label="رقم الهاتف" value={profile?.phone ?? user?.phone ?? '—'} />
          <InfoRow label="البريد الإلكتروني" value={user?.email ?? '—'} />
          <InfoRow label="رقم الهوية" value={user?.id?.slice(0, 8).toUpperCase() ?? '—'} />
        </Card>

        {/* Sign out */}
        <Button variant="secondary" onPress={handleSignOut}>تسجيل الخروج</Button>

        <Text style={styles.version}>Fast Investment CRM · v1.0.0</Text>
      </ScrollView>
    </Screen>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  name: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  role: {
    color: '#16a34a',
    fontWeight: '800',
    textAlign: 'center',
  },
  company: {
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoCard: {
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#64748b',
    fontWeight: '800',
  },
  infoValue: {
    color: '#0f172a',
    fontWeight: '900',
    textAlign: 'left',
    direction: 'ltr',
  },
  version: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
})
