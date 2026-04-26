'use client'

import { Users, Building } from 'lucide-react'

interface AnalyticsStats {
  leadStats: { total: number; fresh: number; followup: number; meeting: number }
  invStats: { available: number; sold: number }
}

export default function CRMAnalyticsVisualizer({ stats }: { stats: AnalyticsStats | null }) {
  if (!stats) return null;

  const { leadStats, invStats } = stats;

  // حساب النسب المئوية لمسار المبيعات
  const totalLeads = leadStats.total || 1; // لتجنب القسمة على صفر
  const freshPct = Math.round((leadStats.fresh / totalLeads) * 100);
  const followupPct = Math.round((leadStats.followup / totalLeads) * 100);
  const meetingPct = Math.round((leadStats.meeting / totalLeads) * 100);

  // حساب النسب المئوية للمخزون
  const totalInv = (invStats.available + invStats.sold) || 1;
  const availablePct = Math.round((invStats.available / totalInv) * 100);
  const soldPct = Math.round((invStats.sold / totalInv) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* 1. رسم بياني: مسار تحول العملاء (Lead Funnel) */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Users size={18} className="text-blue-600" /> معدل تحول العملاء (Pipeline Funnel)
        </h4>
        
        <div className="space-y-4">
          {/* Fresh Leads */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Fresh Leads (عملاء جدد)</span>
              <span>{leadStats.fresh} عميل ({freshPct}%)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${freshPct}%` }}></div>
            </div>
          </div>

          {/* Follow-up */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Follow-up (متابعة)</span>
              <span>{leadStats.followup} عميل ({followupPct}%)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
              <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${followupPct}%` }}></div>
            </div>
          </div>

          {/* Meeting */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Meeting (اجتماعات)</span>
              <span>{leadStats.meeting} عميل ({meetingPct}%)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${meetingPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. رسم بياني: حالة المخزون العقاري */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Building size={18} className="text-emerald-600" /> حالة المخزون العقاري (Inventory Status)
        </h4>
        
        <div className="flex h-12 w-full rounded-xl overflow-hidden shadow-sm mb-4">
          <div 
            className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-all" 
            // eslint-disable-next-line no-inline-styles/no-inline-styles
            style={{ width: `${availablePct}%` }}
            title="وحدات متاحة"
          >
            {availablePct > 10 ? `${availablePct}% متاحة` : ''}
          </div>
          <div 
            className="bg-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold transition-all" 
            // eslint-disable-next-line no-inline-styles/no-inline-styles
            style={{ width: `${soldPct}%` }}
            title="وحدات مباعة"
          >
            {soldPct > 10 ? `${soldPct}% مباعة` : ''}
          </div>
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-700">{invStats.available} متاحة</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-300"></span>
            <span className="font-bold text-slate-700">{invStats.sold} مباعة</span>
          </div>
        </div>
      </div>

    </div>
  )
}