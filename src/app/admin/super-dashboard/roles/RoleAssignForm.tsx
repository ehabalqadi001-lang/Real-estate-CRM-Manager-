'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { assignRoleAction } from './actions'

interface Role {
  id: string
  name: string
  slug: string
  departments: { name: string } | null
}

interface Props {
  userId: string
  currentRole: string
  roles: Role[]
}

export function RoleAssignForm({ userId, currentRole, roles }: Props) {
  const [selected, setSelected] = useState(currentRole)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [pending, start]        = useTransition()

  const save = () => {
    setError(''); setSaved(false)
    const fd = new FormData()
    fd.set('user_id', userId)
    fd.set('role', selected)
    start(async () => {
      const res = await assignRoleAction(fd)
      if (res?.error) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setSaved(false) }}
        className="flex-1 rounded-xl border border-[#DDE6E4] bg-[#FBFCFA] px-3 py-2 text-xs font-semibold text-[#102033] dark:bg-slate-800 dark:text-white"
      >
        <optgroup label="Legacy Roles">
          {['super_admin','company_admin','company_owner','sales_director','team_leader','broker','freelancer','finance_officer','hr_officer','customer_support','agent','viewer'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </optgroup>
        <optgroup label="Fast Investment Roles">
          {roles.map((r) => (
            <option key={r.id} value={r.slug}>{r.name} ({r.departments?.name ?? '—'})</option>
          ))}
        </optgroup>
      </select>

      <Button
        size="sm"
        disabled={pending || selected === currentRole}
        onClick={save}
        className={`h-8 px-3 ${saved ? 'bg-[#0F8F83]' : 'bg-[#C9964A]'} font-semibold text-white hover:opacity-90`}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : saved ? <CheckCircle2 className="size-3.5" /> : 'حفظ'}
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
