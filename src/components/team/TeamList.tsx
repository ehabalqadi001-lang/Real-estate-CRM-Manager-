'use client'

import { User, Phone, Mail, Briefcase } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  phone: string | null
  email: string | null
  created_at: string
}

export default function TeamList({ members }: { members: TeamMember[] }) {
  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <User size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">لم يتم إضافة أي موظف بعد</h3>
        <p className="text-sm">اضغط على زر &ldquo;إضافة عضو للفريق&rdquo; للبدء في بناء فريق المبيعات الخاص بك وتوزيع المهام عليهم.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <div key={member.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          {/* لمسة تصميمية جانبية */}
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
              <span className="text-xl font-bold text-slate-700">{member.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
              <div className="flex items-center gap-1 text-sm text-blue-600 font-medium mt-1">
                <Briefcase size={14} />
                <span>{member.role === 'Sales Representative' ? 'مسؤول مبيعات' : member.role === 'Sales Manager' ? 'مدير مبيعات' : member.role === 'Team Leader' ? 'قائد فريق' : 'إداري'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400" />
              <span dir="ltr" className="font-medium">{member.phone || 'غير مسجل'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-slate-400" />
              <span className="truncate">{member.email || 'غير مسجل'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}