import type { InputHTMLAttributes } from 'react'
import { Palette, Save, Settings, ShieldCheck } from 'lucide-react'
import { getCompanySettings, saveCompanySettings } from './actions'
import SettingsToggles from './SettingsToggles'
import ChangePasswordDialog from './ChangePasswordDialog'
import TwoFactorSetup from './TwoFactorSetup'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const company = await getCompanySettings()
  const logoStyle = company?.logo_url
    ? { backgroundImage: `url(${JSON.stringify(company.logo_url)})` }
    : undefined

  return (
    <div className="max-w-4xl space-y-5 p-4 sm:p-6" dir="ltr">
      <div className="flex items-center gap-3 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:p-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <Settings size={18} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[var(--fi-ink)]">Tenant Settings</h1>
          <p className="text-xs text-[var(--fi-muted)]">Workspace identity, white-label branding, notifications, and security.</p>
        </div>
      </div>

      <form action={saveCompanySettings}>
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 border-b border-[var(--fi-line)] pb-4 font-black text-[var(--fi-ink)]">
            <Palette size={16} className="text-[var(--fi-emerald)]" aria-hidden="true" />
            White-label Branding
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company name" name="company_name" defaultValue={company?.company_name ?? ''} placeholder="FAST INVESTMENT" />
            <Field label="Subdomain" name="subdomain" dir="ltr" defaultValue={company?.subdomain ?? ''} placeholder="apex" disabled />
            <Field label="Custom domain" name="domain" dir="ltr" defaultValue={company?.domain ?? ''} placeholder="crm.company.com" />
            <Field label="Support phone" name="phone" type="tel" dir="ltr" defaultValue={company?.phone ?? ''} placeholder="+201XXXXXXXXX" />
            <div>
              <label htmlFor="primary_brand_color" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--fi-muted)]">Primary brand color</label>
              <input
                id="primary_brand_color"
                name="primary_brand_color"
                type="color"
                defaultValue={company?.primary_brand_color ?? '#0f766e'}
                className="h-11 w-full rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
              />
            </div>
            <div className="md:col-span-2">
              <Field label="Logo URL" name="logo_url" type="url" dir="ltr" defaultValue={company?.logo_url ?? ''} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <Field label="Primary contact" name="full_name" defaultValue={company?.full_name ?? ''} />
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--fi-muted)]">Live shell preview</p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="flex size-12 items-center justify-center overflow-hidden rounded-lg bg-contain bg-center bg-no-repeat text-sm font-black text-white shadow-sm"
                style={{ backgroundColor: company?.primary_brand_color ?? '#0f766e', ...logoStyle }}
              >
                {company?.logo_url ? null : 'CRM'}
              </div>
              <div className="min-w-0">
                <p className="truncate font-black text-[var(--fi-ink)]">{company?.company_name ?? 'Your Brokerage'}</p>
                <p className="truncate text-sm text-[var(--fi-muted)]">{company?.domain ?? 'crm.company.com'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-[var(--fi-emerald)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Save size={14} aria-hidden="true" />
              Save changes
            </button>
          </div>
        </div>
      </form>

      <SettingsToggles initialPrefs={company?.notification_prefs as Record<string, boolean> | null} />

      <div className="rounded-lg bg-[#0B1120] p-5 text-white shadow-xl">
        <h2 className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4 font-black">
          <ShieldCheck size={16} className="text-[var(--fi-emerald)]" aria-hidden="true" />
          Security and Access
        </h2>
        <div className="space-y-3">
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
            Tenant admins can update their workspace brand identity. Platform billing and tenant suspension remain Super Admin operations.
          </p>
          <ChangePasswordDialog />
          <TwoFactorSetup />
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--fi-muted)]">{label}</label>
      <input
        id={name}
        name={name}
        className="w-full rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
        {...props}
      />
    </div>
  )
}
