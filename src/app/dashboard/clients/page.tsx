import { getClientList } from '@/domains/clients/queries'
import AddClientButton from '../../../components/clients/AddClientButton'
import ClientsTable from '../../../components/clients/ClientsTable'
import { Users } from 'lucide-react'
import { getI18n } from '@/lib/i18n'

export default async function ClientsPage() {
  const { t, dir } = await getI18n()
  const { clients, error: fetchError } = await getClientList()

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Users size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">{t('إدارة العملاء', 'Client Management')}</h1>
            <p className="text-xs text-[var(--fi-muted)]">{t('قاعدة بيانات المستثمرين والعملاء الحاليين', 'Investor and current client database')}</p>
          </div>
        </div>
        <AddClientButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm">
        {fetchError ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 inline-block rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="font-bold text-red-700">{t('تنبيه بالنظام', 'System Alert')}</p>
              <p className="mt-1 text-sm text-red-600">{fetchError}</p>
            </div>
            <p className="text-xs text-[var(--fi-muted)]">{t('تأكد من وجود جدول العملاء وتفعيل سياسات RLS في Supabase', 'Verify the clients table exists and RLS policies are enabled in Supabase')}</p>
          </div>
        ) : (
          <ClientsTable initialData={clients} />
        )}
      </div>
    </div>
  )
}
