"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PAGE_CSS = `
  .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
  
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .kpi-card { background: #fff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; border-right: 4px solid #0f172a; }
  .kpi-title { font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 5px; }
  .kpi-value { font-size: 24px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right; }
  
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  th { background: #f8fafc; padding: 16px; text-align: right; color: #475569; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; vertical-align: middle;}
  
  .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; }
  .status-pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
  .status-paid { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
  
  .btn-pay { background: #10b981; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s;}
  .btn-pay:hover { background: #059669; }
`;

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('commissions')
      .select(`
        id, total_commission_value, agent_commission_value, status, created_at,
        deal:deals(compound, unit_value),
        agent:agents(full_name, company:companies(name))
      `)
      .order('created_at', { ascending: false });
      
    if (data) setCommissions(data);
    setLoading(false);
  };

  useEffect(() => { fetchCommissions(); }, []);

  const handlePay = async (id: string) => {
    if (window.confirm("هل أنت متأكد من صرف هذه العمولة؟ لا يمكن التراجع بعد التحويل لـ Paid.")) {
      const { error } = await supabase.from('commissions').update({ status: 'Paid' }).eq('id', id);
      if (!error) {
        alert("✅ تم صرف العمولة وتحديث الخزنة.");
        fetchCommissions();
      }
    }
  };

  const totalPending = commissions.filter(c => c.status !== 'Paid').reduce((sum, c) => sum + Number(c.agent_commission_value), 0);
  const totalPaid = commissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + Number(c.agent_commission_value), 0);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="header-flex">
        <h1 style={{fontSize: '24px', fontWeight: 800, color: '#0f172a'}}>الخزنة والعمولات المركزية</h1>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card" style={{borderRightColor: '#f59e0b'}}>
          <div className="kpi-title">مطلوبات قيد الانتظار (Liability)</div>
          <div className="kpi-value">{totalPending.toLocaleString()} EGP</div>
        </div>
        <div className="kpi-card" style={{borderRightColor: '#10b981'}}>
          <div className="kpi-title">إجمالي المصروفات (Paid)</div>
          <div className="kpi-value">{totalPaid.toLocaleString()} EGP</div>
        </div>
      </div>

      {loading ? <p>جاري مزامنة الخزنة...</p> : (
        <table>
          <thead>
            <tr>
              <th>الصفقة / المشروع</th>
              <th>المندوب والفرع</th>
              <th>قيمة العمولة المستحقة</th>
              <th>الحالة</th>
              <th>إجراءات مالية</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((comm) => (
              <tr key={comm.id}>
                <td>
                  <div style={{fontWeight: 800, color: '#185FA5'}}>{comm.deal?.compound || 'غير محدد'}</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>قيمة الوحدة: {Number(comm.deal?.unit_value || 0).toLocaleString()} EGP</div>
                </td>
                <td>
                  <div style={{fontWeight: 700}}>{comm.agent?.full_name || 'موظف محذوف'}</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>🏢 {comm.agent?.company?.name || 'فرع غير محدد'}</div>
                </td>
                <td style={{direction: 'ltr', textAlign: 'right', fontWeight: 800, color: '#0f172a'}}>
                  {Number(comm.agent_commission_value).toLocaleString()} EGP
                </td>
                <td>
                  <span className={`status-badge ${comm.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
                    {comm.status === 'Paid' ? '✓ تم الصرف' : '⏳ قيد الانتظار'}
                  </span>
                </td>
                <td>
                  {comm.status !== 'Paid' && (
                    <button className="btn-pay" onClick={() => handlePay(comm.id)}>اعتماد وصرف</button>
                  )}
                </td>
              </tr>
            ))}
            {commissions.length === 0 && <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>الخزنة فارغة حالياً.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}