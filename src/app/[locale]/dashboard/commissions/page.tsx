"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  /* ... نفس التنسيقات السابقة مع إضافة التنسيقات الجديدة ... */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .confirm-modal { background: #fff; padding: 25px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
  .undo-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #0f1c2e; color: #fff; padding: 12px 25px; border-radius: 50px; display: flex; gap: 15px; align-items: center; z-index: 999; box-shadow: 0 5px 15px rgba(0,0,0,0.2); animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { bottom: -50px; } to { bottom: 20px; } }
  
  @media print {
    .sidebar, .header, .btn-action, .view-toggle, .filters-row { display: none !important; }
    .main-content { margin: 0 !important; padding: 0 !important; }
    .table-container { border: none !important; box-shadow: none !important; }
    th, td { border: 1px solid #eee !important; }
  }
`;

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{id: string, oldStatus: string} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('commissions').select(`*, deal:deals(*), agent:user_profiles(full_name)`).order('created_at', { ascending: false });
    if (data) setCommissions(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 🛡️ منطق التحديث الآمن مع إمكانية التراجع
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const currentComm = commissions.find(c => c.id === id);
    setLastAction({ id, oldStatus: currentComm.status });
    
    const { error } = await supabase.from('commissions').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setConfirmId(null);
      fetchData();
      // يختفي إشعار التراجع بعد 10 ثواني
      setTimeout(() => setLastAction(null), 10000);
    }
  };

  const undoAction = async () => {
    if (!lastAction) return;
    await supabase.from('commissions').update({ status: lastAction.oldStatus }).eq('id', lastAction.id);
    setLastAction(null);
    fetchData();
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* ... Sidebar ... */}

      <div className="main-content">
        <div className="header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 className="header-title">العمولات والمطالبات المالية</h1>
          <button 
            onClick={() => window.print()} 
            className="btn-action" 
            style={{background:'#0f1c2e', display:'flex', gap:'8px', alignItems:'center'}}
          >
            <span>🖨️</span> تصدير كشف حساب PDF
          </button>
        </div>

        {/* ... الإحصائيات (مجموع المحصلة والمستحقة) ... */}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>تفاصيل الصفقة</th>
                <th>المندوب</th>
                <th>قيمة العمولة</th>
                <th>الحالة</th>
                <th className="btn-action">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(comm => (
                <tr key={comm.id}>
                  <td>
                    <Link href={`/dashboard/leads/${comm.deal_id}`} style={{color:'#185FA5', fontWeight:800, textDecoration:'none'}}>
                      {comm.deal?.compound} ↗
                    </Link>
                    <div style={{fontSize:'12px', color:'#64748b'}}>المطور: {comm.deal?.developer}</div>
                  </td>
                  <td>{comm.agent?.full_name}</td>
                  <td style={{fontWeight:700, direction:'ltr', textAlign:'right'}}>{Number(comm.agent_commission_value).toLocaleString()} EGP</td>
                  <td>
                    <span className={`status-badge status-${comm.status.toLowerCase()}`}>
                      {comm.status === 'Paid' ? '✓ تم التحصيل' : '⏳ قيد الانتظار'}
                    </span>
                  </td>
                  <td className="btn-action">
                    {comm.status !== 'Paid' && (
                      <button 
                        onClick={() => setConfirmId(comm.id)} 
                        className="btn-action"
                        style={{background:'#10b981', color:'#fff', padding:'5px 10px', borderRadius:'6px', cursor:'pointer'}}
                      >
                        تأكيد التحصيل
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛡️ نافذة التأكيد (Safety Modal) */}
      {confirmId && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div style={{fontSize:'40px', marginBottom:'15px'}}>💰</div>
            <h3>تأكيد استلام العمولة</h3>
            <p style={{color:'#64748b', margin:'15px 0'}}>هل أنت متأكد من تحصيل هذه العمولة؟ سيتم تحديث السجلات المالية فوراً.</p>
            <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
              <button onClick={() => handleUpdateStatus(confirmId, 'Paid')} style={{background:'#10b981', color:'#fff', border:'none', padding:'10px 25px', borderRadius:'8px', fontWeight:700, cursor:'pointer'}}>نعم، تم التحصيل</button>
              <button onClick={() => setConfirmId(null)} style={{background:'#f1f5f9', border:'none', padding:'10px 25px', borderRadius:'8px', fontWeight:700, cursor:'pointer'}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 إشعار التراجع (Undo Toast) */}
      {lastAction && (
        <div className="undo-toast">
          <span>تم تحديث حالة العمولة بنجاح</span>
          <button onClick={undoAction} style={{background:'#185FA5', color:'#fff', border:'none', padding:'4px 12px', borderRadius:'4px', cursor:'pointer', fontWeight:700}}>تراجع عن الإجراء</button>
        </div>
      )}
    </div>
  );
}