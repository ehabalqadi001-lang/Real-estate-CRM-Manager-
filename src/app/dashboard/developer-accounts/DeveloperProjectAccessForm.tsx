'use client'

import { useActionState, useMemo } from 'react'
import { FolderKanban, Save } from 'lucide-react'
import { grantDeveloperProjectAccessAction, type DeveloperAccountActionState } from './actions'

type AccountOption = {
  id: string
  developer_id: string
  label: string
}

type ProjectOption = {
  id: string
  developer_id: string | null
  name_ar: string | null
  name: string | null
}

const initialState: DeveloperAccountActionState = { ok: false, message: '' }

export function DeveloperProjectAccessForm({
  accounts,
  projects,
}: {
  accounts: AccountOption[]
  projects: ProjectOption[]
}) {
  const [state, formAction, pending] = useActionState(grantDeveloperProjectAccessAction, initialState)
  const groupedProjects = useMemo(() => projects, [projects])

  return (
    <section className="ds-card p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <FolderKanban className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black text-[var(--fi-ink)]">ربط مشاريع المطور</h2>
          <p className="text-sm font-semibold text-[var(--fi-muted)]">حدد أي مشاريع يستطيع حساب المطور إدارتها أو مشاهدة عملائها.</p>
        </div>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="grid gap-4">
        <label className="space-y-2">
          <span className="text-sm font-black text-[var(--fi-ink)]">حساب المطور</span>
          <select name="developerAccountId" required className="h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold dark:bg-white/5" defaultValue="">
            <option value="" disabled>اختر حساب المطور</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[var(--fi-ink)]">المشروع</span>
          <select name="projectId" required className="h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold dark:bg-white/5" defaultValue="">
            <option value="" disabled>اختر مشروع</option>
            {groupedProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name_ar || project.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 text-sm font-bold text-[var(--fi-ink)]">
          <label className="flex items-center gap-2"><input type="checkbox" name="canViewLeads" defaultChecked /> مشاهدة العملاء المهتمين</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="canManageInventory" /> إدارة المخزون</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="canManageMedia" /> إدارة الصور والفيديوهات</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="canManageMeetings" defaultChecked /> إدارة الاجتماعات</label>
        </div>

        <button type="submit" disabled={pending} className="fi-primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60">
          <Save className="size-4" aria-hidden="true" />
          {pending ? 'جار الحفظ...' : 'حفظ صلاحية المشروع'}
        </button>
      </form>
    </section>
  )
}
