"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main-content { margin-right: 64px; flex: 1; padding: 30px; max-width: 1400px; margin-left: auto; margin-right: auto;}
  
  .header-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }
  
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .kpi-card { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
  .kpi-title { font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 8px; }
  .kpi-value { font-size: 24px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right;}
  
  .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  
  .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; }
  .status-pending { background: #F1F5F9; color: #64748B; }
  .status-claimed { background: #FFFBEB; color: #F59E0B; }
  .status-paid { background: #ECFDF5; color: #10B981; }

  .btn-action { background: #185FA5; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s;}
  .btn-action:hover { background: #124b82; }
`;

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('agent');

  const fetchData = async () => {
    setLoading(true);
    
    // 1. معرفة صلاحية المستخدم الحالي لعرض الأزرار المناسبة
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
      if (profile) setUserRole(profile.role);
    }

    // 2. جلب العمولات مع ربطها بالصفقة والمندوب
    const { data, error } = await supabase
      .from('commissions')
      .select(`
        *,
        deal:deals(compound, unit_value, developer_id),
        agent:user_profiles(full_name)
      `)
      .order('created_at', { ascending: false });

    if (data) setCommissions(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // دالة لتحديث حالة العميلة (للمديرين فقط)
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('commissions').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchData();
      alert("✅ تم تحديث حالة العمولة.");
    } else {
      alert("❌ حدث خطأ: " + error.message);
    }
  };

  // إحصائيات سريعة
  const totalPending = commissions.filter(c => c.status !== 'Paid').reduce((sum, c) => sum + Number(c.agent_commission_value), 0);
  const totalPaid = commissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + Number(c.agent_commission_value), 0);

  const isAdmin = ['super_admin', 'sales_manager', 'accountant'].includes(userRole);

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
      </div>

      <div className="main-content">
        <h1 className="header-title">
          <svg width="28" height="28" fill="none" stroke="#10B981" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          الخزنة وإدارة العمولات
        </h1>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">مستحقات قيد الانتظار للمندوبين</div>
            <div className="kpi-value" style={{color: '#F59E0B'}}>{totalPending.toLocaleString()} EGP</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">إجمالي العمولات المصروفة</div>
            <div className="kpi-value" style={{color: '#10B981'}}>{totalPaid.toLocaleString()} EGP</div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>معلومات الصفقة</th>
                {isAdmin && <th>الموظف المستفيد</th>}
                <th>إجمالي عمولة الشركة</th>
                <th>نصيب المندوب</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة</th>
                {isAdmin && <th>إجراءات مالية</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 7 : 5} style={{textAlign: 'center', padding: '30px'}}>جاري مزامنة الخزنة...</td></tr>
              ) : commissions.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 5} style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>لا توجد عمولات مسجلة بعد. سيتم إضافتها تلقائياً عند تأكيد الصفقات.</td></tr>
              ) : (
                commissions.map(comm => (
                  <tr key={comm.id}>
                    <td>
                      <div style={{fontWeight: 800}}>{comm.deal?.compound || 'غير محدد'}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>قيمة البيعة: {Number(comm.deal?.unit_value || 0).toLocaleString()} EGP</div>
                    </td>
                    {isAdmin && (
                      <td style={{fontWeight: 700, color: '#185FA5'}}>
                        {comm.agent?.full_name || 'موظف محذوف'}
                      </td>
                    )}
                    <td style={{direction: 'ltr', textAlign: 'right', fontWeight: 600}}>{Number(comm.total_commission_value).toLocaleString()} EGP</td>
                    <td style={{direction: 'ltr', textAlign: 'right', fontWeight: 800, color: '#10B981'}}>{Number(comm.agent_commission_value).toLocaleString()} EGP</td>
                    <td>{comm.expected_payment_date ? new Date(comm.expected_payment_date).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                    <td>
                      <span className={`status-badge ${comm.status === 'Pending' ? 'status-pending' : comm.status === 'Claimed' ? 'status-claimed' : 'status-paid'}`}>
                        {comm.status === 'Pending' ? '⏳ قيد الانتظار' : comm.status === 'Claimed' ? 'درجة المطالبة' : '✓ تم الصرف'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        {comm.status !== 'Paid' && (
                          <button onClick={() => updateStatus(comm.id, 'Paid')} className="btn-action">
                            صرف العمولة
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}