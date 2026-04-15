'use client'

import { Flame, Snowflake, Sun } from 'lucide-react'

export default function LeadScoreBadge({ score }: { score: number }) {
  // تحليل النقاط لتحديد درجة حرارة العميل
  let config = {
    color: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: <Snowflake size={14} />,
    label: 'بارد',
    pulse: false
  }

  if (score >= 75) {
    // عميل ساخن جداً (Hot Lead)
    config = {
      color: 'bg-red-100 text-red-600 border-red-200 shadow-[0_0_10px_rgba(220,38,38,0.2)]',
      icon: <Flame size={14} className={score >= 90 ? 'animate-bounce' : ''} />,
      label: 'ساخن جداً',
      pulse: true
    }
  } else if (score >= 40) {
    // عميل دافئ (Warm Lead)
    config = {
      color: 'bg-amber-100 text-amber-600 border-amber-200',
      icon: <Sun size={14} />,
      label: 'مهتم',
      pulse: false
    }
  } else {
    // عميل بارد (Cold Lead)
    config = {
      color: 'bg-blue-50 text-blue-500 border-blue-100',
      icon: <Snowflake size={14} />,
      label: 'مبدئي',
      pulse: false
    }
  }

  return (
    <div className="flex items-center gap-2" dir="rtl">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-black text-[11px] ${config.color}`}>
        {config.pulse && (
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
        {config.icon}
        <span>{config.label} ({score}/100)</span>
      </div>
      
      {/* شريط التقدم المصغر */}
      <div className="hidden md:block w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${score >= 75 ? 'bg-red-500' : score >= 40 ? 'bg-amber-400' : 'bg-blue-400'}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  )
}