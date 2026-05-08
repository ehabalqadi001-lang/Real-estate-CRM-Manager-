'use client'

import { User, Phone, Mail, Briefcase } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface TeamMember {
  id: string
  name: string
  role: string
  phone: string | null
  email: string | null
  created_at: string
}

export default function TeamList({ members }: { members: TeamMember[] }) {
  const { t } = useI18n()

  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <User size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{t('لم يتم إضافة أي موظف بعد', 'No team members added yet')}</h3>
        <p className="text-sm">{t('اضغط على زر "إضافة عضو للفريق" للبدء في بناء فريق المبيعات الخاص بك وتوزيع المهام عليهم.', 'Click "Add Team Member" to start building your sales team and assigning tasks.')}</p>
      </div>
    )
  }

  function roleLabel(role: string) {
    const labels: Record<string, string> = {
      'Sales Representative': t('مسؤول مبيعات', 'Sales Representative'),
      'Sales Manager': t('مدير مبيعات', 'Sales Manager'),
      'Team Leader': t('قائد فريق', 'Team Leader'),
    }
    return labels[role] ?? t('إداري', 'Admin')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <div key={member.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
              <span className="text-xl font-bold text-slate-700">{member.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
              <div className="flex items-center gap-1 text-sm text-blue-600 font-medium mt-1">
                <Briefcase size={14} />
                <span>{roleLabel(member.role)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400" />
              <span dir="ltr" className="font-medium">{member.phone || t('غير مسجل', 'Not registered')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-slate-400" />
              <span className="truncate">{member.email || t('غير مسجل', 'Not registered')}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
