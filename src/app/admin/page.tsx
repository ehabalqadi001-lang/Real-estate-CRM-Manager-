"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalBranches: 0,
    totalDealsValue: 0,
    pendingCommissions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      // جلب إحصائيات سريعة للمدير
      const { count: agentsCount } = await supabase.from('agents').select('*', { count: 'exact', head: true });
      const { count: branchesCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      
      const { data: dealsData } = await supabase.from('deals').select('unit_value');
      const totalDeals = dealsData?.reduce((sum, d) => sum + Number(d.unit_value || 0), 0) || 0;

      const { data: commsData } = await supabase.from('commissions').select('agent_commission_value').eq('status', 'Pending');
      const totalComms = commsData?.reduce((sum, c) => sum + Number(c.agent_commission_value || 0), 0) || 0;

      setStats({
        totalAgents: agentsCount || 0,
        totalBranches: branchesCount || 0,
        totalDealsValue: totalDeals,
        pendingCommissions: totalComms
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) return <div>جاري تحميل بيانات المنظومة...</div>;

  return (
    <div>
      <h1 style={{fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '30px'}}>النظرة العامة للمؤسسة</h1>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px'}}>
        <div style={{background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', borderRight: '4px solid #3b82f6'}}>
          <div style={{fontSize: '14px', color: '#64748b', fontWeight: 700}}>حجم المبيعات الإجمالي</div>
          <div style={{fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '5px', direction: 'ltr', textAlign: 'right'}}>{stats.totalDealsValue.toLocaleString()} EGP</div>
        </div>
        
        <div style={{background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', borderRight: '4px solid #10b981'}}>
          <div style={{fontSize: '14px', color: '#64748b', fontWeight: 700}}>إجمالي الموظفين</div>
          <div style={{fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '5px'}}>{stats.totalAgents} موظف</div>
        </div>

        <div style={{background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', borderRight: '4px solid #8b5cf6'}}>
          <div style={{fontSize: '14px', color: '#64748b', fontWeight: 700}}>الشركات / الفروع</div>
          <div style={{fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '5px'}}>{stats.totalBranches} فرع</div>
        </div>

        <div style={{background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', borderRight: '4px solid #f59e0b'}}>
          <div style={{fontSize: '14px', color: '#64748b', fontWeight: 700}}>عمولات مستحقة الدفع</div>
          <div style={{fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '5px', direction: 'ltr', textAlign: 'right'}}>{stats.pendingCommissions.toLocaleString()} EGP</div>
        </div>
      </div>
      
      {/* يمكن لاحقاً إضافة رسوم بيانية هنا */}
      <div style={{background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
        <h2 style={{fontSize: '18px', fontWeight: 700, marginBottom: '15px'}}>لوحة الإشعارات الإدارية</h2>
        <p style={{color: '#64748b'}}>جميع الأنظمة تعمل بكفاءة. تم تطبيق نظام الصلاحيات الجديد (RBAC) بنجاح.</p>
      </div>
    </div>
  );
}