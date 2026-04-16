"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ClientRecord {
  id: string
  full_name: string
  phone: string
  national_id?: string
  source?: string
  address?: string
  client_type?: string
}

interface DealRecord {
  id: string
  compound?: string
  developer?: string
  property_type?: string
  unit_value?: number
  stage?: string
}

const CSS_STYLES = `
  .profile-header { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .client-avatar { width: 80px; height: 80px; background: #EFF6FF; color: #185FA5; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; }
  .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
  .info-item { display: flex; flex-direction: column; gap: 4px; }
  .info-label { font-size: 12px; color: #64748b; font-weight: 600; }
  .info-value { font-size: 15px; color: #0f172a; font-weight: 700; }

  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .stat-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
  .stat-num { font-size: 24px; font-weight: 800; color: #185FA5; }
  .stat-label { font-size: 13px; color: #64748b; font-weight: 600; }

  .section-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .deal-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; transition: 0.2s; border-right: 5px solid #185FA5; }
  .deal-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

  .btn-wa { background: #25D366; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
`;

export default function ClientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return
    let mounted = true
    async function getClientData() {
      setLoading(true)
      const { data: clientData } = await supabase.from('clients').select('*').eq('id', id).single()
      const { data: dealsData } = await supabase.from('deals').select('*').eq('client_id', id).order('created_at', { ascending: false })
      if (!mounted) return
      setClient(clientData)
      setDeals(dealsData || [])
      setLoading(false)
    }
    getClientData()
    return () => { mounted = false }
  }, [id]);

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>جاري تحميل ملف العميل...</div>;
  if (!client) return <div style={{padding: '50px', textAlign: 'center'}}>العميل غير موجود.</div>;

  const totalInvestment = deals.reduce((sum, deal) => sum + Number(deal.unit_value || 0), 0);

  return (
    <div className="dashboard-container" style={{ direction: 'rtl', background: '#f8fafc', minHeight: '100vh', padding: '30px' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#185FA5', cursor: 'pointer', fontWeight: 700 }}>
          ← العودة لدليل العملاء
        </button>
      </div>

      <div className="profile-header">
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className="client-avatar">{client.full_name[0]}</div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{client.full_name}</h1>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
              {client.client_type === 'Buyer' ? 'مشتري' : 'مستثمر'} • كود العميل: #{client.id.substring(0, 6)}
            </div>
            <div className="info-grid">
              <div className="info-item"><span className="info-label">رقم الهاتف</span><span className="info-value" dir="ltr">{client.phone}</span></div>
              <div className="info-item"><span className="info-label">الرقم القومي</span><span className="info-value">{client.national_id || 'غير مسجل'}</span></div>
              <div className="info-item"><span className="info-label">مصدر العميل</span><span className="info-value">{client.source}</span></div>
              <div className="info-item"><span className="info-label">العنوان</span><span className="info-value">{client.address || 'غير محدد'}</span></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href={`https://wa.me/${client.phone.replace('+', '')}`} target="_blank" className="btn-wa">
            واتساب 💬
          </a>
          <button style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            تعديل البيانات
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{deals.length}</div>
          <div className="stat-label">إجمالي الصفقات</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{totalInvestment.toLocaleString()} EGP</div>
          <div className="stat-label">قيمة الاستثمارات</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color: '#10b981'}}>{deals.filter(d => d.stage === 'Handover').length}</div>
          <div className="stat-label">صفقات مكتملة</div>
        </div>
      </div>

      <div className="section-title">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 3l-6.5 6.5M19 13l-3-3 3-3"/></svg>
        سجل الصفقات والمشتريات
      </div>

      {deals.length === 0 ? (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
          لم يقم هذا العميل بأي عمليات شراء حتى الآن.
        </div>
      ) : (
        deals.map(deal => (
          <div key={deal.id} className="deal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#185FA5' }}>{deal.compound}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>المطور: {deal.developer} • نوع الوحدة: {deal.property_type}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{Number(deal.unit_value).toLocaleString()} EGP</div>
                <div style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>{deal.stage}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
