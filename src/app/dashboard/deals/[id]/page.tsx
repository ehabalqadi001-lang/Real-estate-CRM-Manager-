"use client";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DealRecord {
  id: string
  compound?: string
  property_type?: string
  developer?: { name?: string } | string | null
  client?: { full_name?: string; phone?: string; national_id?: string } | null
  buyer_name?: string
  buyer_phone?: string
  unit_value?: number
  amount_paid?: number
  governorate?: string
  registration_status?: string
  stage?: string
  created_at?: string
}

interface Installment {
  id: string
  due_date: string
  amount: number
  status: string
}

interface Activity {
  id: string
  created_at: string
  description?: string
  user?: { full_name?: string } | null
}

type LegacyDealSupabase = {
  from(table: 'deal_activities'): {
    insert(values: Array<{
      deal_id: string
      user_id?: string
      action_type: string
      description: string
    }>): Promise<{ error: Error | null }>
  }
  from(table: 'deals'): {
    update(values: { stage: string }): {
      eq(column: 'id', value: string): Promise<{ error: Error | null }>
    }
  }
}

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  .main-content { padding: 30px; max-width: 1400px; margin: 0 auto; width: 100%; }
  .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
  .btn-back { background: none; border: none; color: #64748b; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 15px;}
  .btn-back:hover { color: #0f172a; }
  .deal-header { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); border-right: 5px solid #185FA5;}
  .deal-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 5px; }
  .deal-subtitle { font-size: 14px; color: #64748b; font-weight: 600; }
  .stage-badge { padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; background: #EFF6FF; color: #185FA5; border: 1px solid #BFDBFE; }
  .grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
  @media (max-width: 1024px) { .grid-layout { grid-template-columns: 1fr; } }
  .card-section { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; margin-bottom: 25px; }
  .section-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;}
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .info-item { display: flex; flex-direction: column; gap: 4px; }
  .info-label { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; }
  .info-value { font-size: 15px; color: #0f172a; font-weight: 800; }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 12px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600;}
  .overdue-row { background-color: #FEF2F2 !important; }
  .overdue-text { color: #DC2626 !important; font-weight: 800 !important; }
  .btn-pay { background: #10B981; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s;}
  .btn-pay:hover { background: #059669; }
  .activity-log { display: flex; flex-direction: column; gap: 15px; max-height: 400px; overflow-y: auto; padding-right: 5px;}
  .log-item { border-right: 2px solid #e2e8f0; padding-right: 15px; position: relative; }
  .log-item::before { content: ''; position: absolute; right: -5px; top: 5px; width: 8px; height: 8px; border-radius: 50%; background: #185FA5; }
  .log-date { font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 2px; }
  .log-desc { font-size: 13px; color: #0f172a; font-weight: 600; }
  .log-user { font-size: 11px; color: #64748b; margin-top: 4px; }
`;

export default function DealDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [deal, setDeal] = useState<DealRecord | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  const fetchDealData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: dealData } = await supabase
      .from('deals')
      .select('*, client:clients(full_name, phone, national_id), developer:developers(name)')
      .eq('id', id)
      .single()
    const { data: instData } = await supabase
      .from('installments')
      .select('*')
      .eq('deal_id', id)
      .order('due_date', { ascending: true })
    const { data: actData } = await supabase
      .from('deal_activities')
      .select('*, user:user_profiles(full_name)')
      .eq('deal_id', id)
      .order('created_at', { ascending: false })
    setDeal(dealData)
    setInstallments(instData || [])
    setActivities(actData || [])
    setLoading(false)
  }, [id]);

  useEffect(() => {
    void fetchDealData(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchDealData]);

  const handleAddNote = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const legacySupabase = supabase as unknown as LegacyDealSupabase;
    await legacySupabase.from('deal_activities').insert([{
      deal_id: String(id),
      user_id: user?.id,
      action_type: 'note',
      description: `أضاف ملاحظة: ${newNote}`
    }]);
    setNewNote('');
    fetchDealData();
  };

  const handleChangeStage = async (newStage: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const oldStage = deal?.stage ?? '';
    const legacySupabase = supabase as unknown as LegacyDealSupabase;
    await legacySupabase.from('deals').update({ stage: newStage }).eq('id', String(id));
    await legacySupabase.from('deal_activities').insert([{
      deal_id: String(id),
      user_id: user?.id,
      action_type: 'status_change',
      description: `تم تغيير مرحلة الصفقة من ${oldStage} إلى ${newStage}`
    }]);
    // Send email notification in background
    if (user?.email) {
      void fetch('/api/notify/deal-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          agentName: user.email,
          clientName: deal?.buyer_name ?? 'العميل',
          dealTitle: `${deal?.compound ?? ''} — ${deal?.property_type ?? ''}`,
          oldStage,
          newStage,
          dealId: id,
        }),
      })
    }
    fetchDealData();
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>جاري فتح ملف الصفقة...</div>;
  if (!deal) return <div style={{padding: '50px', textAlign: 'center'}}>لم يتم العثور على الصفقة.</div>;

  const today = new Date();
  const developerName = typeof deal.developer === 'object' && deal.developer?.name
    ? deal.developer.name
    : typeof deal.developer === 'string' ? deal.developer : 'غير محدد';
  const clientName = typeof deal.client === 'object' && deal.client?.full_name
    ? deal.client.full_name
    : deal.buyer_name ?? '';

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="main-content">
        <div className="header-actions">
          <button onClick={() => router.back()} className="btn-back">
            ← العودة لقائمة المبيعات
          </button>
        </div>

        <div className="deal-header">
          <div>
            <h1 className="deal-title">{deal.compound} - {deal.property_type}</h1>
            <div className="deal-subtitle">
              المطور: <span style={{color:'#185FA5', fontWeight:800}}>{developerName}</span> |
              العميل: {clientName}
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'}}>
            <a href={`/api/contracts/generate?dealId=${id}`} target="_blank" rel="noopener noreferrer"
              style={{background:'#0f172a',color:'#fff',padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:800,textDecoration:'none',display:'flex',alignItems:'center',gap:'6px'}}>
              📄 طباعة العقد
            </a>
            <a href={`/api/pdf/proposal?dealId=${id}`} target="_blank" rel="noopener noreferrer"
              style={{background:'#C9964A',color:'#fff',padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:800,textDecoration:'none',display:'flex',alignItems:'center',gap:'6px'}}>
              📊 المقترح الاستثماري PDF
            </a>
            <select
              className="stage-badge"
              value={deal.stage ?? ''}
              onChange={(e) => handleChangeStage(e.target.value)}
              style={{cursor: 'pointer', outline: 'none'}}
            >
              <option value="EOI">اهتمام (EOI)</option>
              <option value="Reservation">حجز (Reservation)</option>
              <option value="Contracted">تعاقد (Contracted)</option>
              <option value="Registration">شهر عقاري (Registration)</option>
              <option value="Handover">تسليم (Handover)</option>
            </select>
            <div style={{fontSize: '12px', color: '#64748b'}}>
              تاريخ التسجيل: {deal.created_at ? new Date(deal.created_at).toLocaleDateString('ar-EG') : '—'}
            </div>
          </div>
        </div>

        <div className="grid-layout">
          <div>
            <div className="card-section">
              <div className="section-title">🏢 بيانات الوحدة والعميل</div>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">اسم العميل المشتري</span><span className="info-value">{deal.buyer_name}</span></div>
                <div className="info-item"><span className="info-label">رقم هاتف العميل</span><span className="info-value" style={{direction: 'ltr', textAlign: 'right'}}>{deal.buyer_phone}</span></div>
                <div className="info-item"><span className="info-label">المشروع / الكومباوند</span><span className="info-value">{deal.compound}</span></div>
                <div className="info-item"><span className="info-label">المطور العقاري</span><span className="info-value">{developerName}</span></div>
                <div className="info-item"><span className="info-label">إجمالي قيمة الوحدة</span><span className="info-value" style={{color: '#185FA5'}}>{Number(deal.unit_value ?? 0).toLocaleString()} EGP</span></div>
                <div className="info-item"><span className="info-label">المقدم المدفوع</span><span className="info-value" style={{color: '#10B981'}}>{Number(deal.amount_paid ?? 0).toLocaleString()} EGP</span></div>
                <div className="info-item"><span className="info-label">المحافظة</span><span className="info-value">{deal.governorate}</span></div>
                <div className="info-item"><span className="info-label">حالة الشهر العقاري</span><span className="info-value">{deal.registration_status}</span></div>
              </div>
            </div>

            <div className="card-section">
              <div className="section-title">📅 جدول الأقساط (Installments)</div>
              {installments.length === 0 ? (
                <div style={{textAlign: 'center', color: '#64748b', padding: '20px'}}>لم يتم إعداد جدول أقساط لهذه الصفقة بعد.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>تاريخ الاستحقاق</th>
                      <th>القيمة (EGP)</th>
                      <th>الحالة</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map(inst => {
                      const dueDate = new Date(inst.due_date);
                      const isOverdue = dueDate < today && inst.status !== 'Paid';
                      return (
                        <tr key={inst.id} className={isOverdue ? 'overdue-row' : ''}>
                          <td className={isOverdue ? 'overdue-text' : ''} style={{direction: 'ltr', textAlign: 'right'}}>{dueDate.toLocaleDateString('ar-EG')}</td>
                          <td className={isOverdue ? 'overdue-text' : ''} style={{fontWeight: 800}}>{Number(inst.amount).toLocaleString()}</td>
                          <td>
                            <span style={{
                              background: inst.status === 'Paid' ? '#ECFDF5' : isOverdue ? '#FEE2E2' : '#FFFBEB',
                              color: inst.status === 'Paid' ? '#10B981' : isOverdue ? '#DC2626' : '#F59E0B',
                              padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800
                            }}>
                              {inst.status === 'Paid' ? '✓ مُسدد' : isOverdue ? '⚠️ متأخر' : '⏳ مستحق'}
                            </span>
                          </td>
                          <td>
                            {inst.status !== 'Paid' && <button className="btn-pay">تسديد</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <div className="card-section" style={{background: '#f8fafc'}}>
              <div className="section-title">📝 سجل النشاط والملاحظات</div>
              <form onSubmit={handleAddNote} style={{marginBottom: '20px'}}>
                <textarea
                  required
                  placeholder="أضف ملاحظة أو تحديث حول هذه الصفقة..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', minHeight: '80px', fontSize: '13px'}}
                />
                <button type="submit" style={{width: '100%', background: '#0f1c2e', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '10px'}}>
                  حفظ الملاحظة
                </button>
              </form>
              <div className="activity-log">
                {activities.length === 0 ? (
                  <div style={{color: '#94a3b8', fontSize: '12px', textAlign: 'center'}}>لا توجد نشاطات مسجلة بعد.</div>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="log-item">
                      <div className="log-date">{new Date(act.created_at).toLocaleString('ar-EG')}</div>
                      <div className="log-desc">{act.description}</div>
                      <div className="log-user">بواسطة: {act.user?.full_name ?? 'النظام'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
