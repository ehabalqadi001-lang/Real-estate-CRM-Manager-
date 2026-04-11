"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main-content { margin-left: 64px; flex: 1; display: flex; flex-direction: column; }
  
  .header { padding: 20px 30px; border-bottom: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 15px; position: sticky; top: 0; z-index: 10; }
  .back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; color: #0f172a; transition: 0.2s; }
  .back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .header-title { font-size: 20px; font-weight: 600; color: #0f172a; }
  
  .content-body { padding: 30px; max-width: 1000px; }
  
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;}
  .detail-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .card-title::before { content: ''; display: block; width: 4px; height: 16px; background: #185FA5; border-radius: 4px; }
  
  .info-row { display: flex; flex-direction: column; margin-bottom: 16px; }
  .info-label { font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; }
  .info-val { font-size: 14px; font-weight: 600; color: #0f172a; }
  
  /* Installments Section */
  .installments-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-top: 24px; }
  .calc-controls { display: flex; gap: 15px; align-items: flex-end; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
  .form-group { display: flex; flex-direction: column; flex: 1; }
  .form-input, .form-select { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; outline: none; }
  .btn-generate { background: #0f1c2e; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { padding: 12px 16px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; }
  .badge-pending { background: #FFF7ED; color: #9A3412; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-paid { background: #EAF3DE; color: #3B6D11; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .btn-mark-paid { background: #fff; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; color: #0f172a; font-weight: 600; }
  .btn-mark-paid:hover { background: #f8fafc; }
`;

export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculator State
  const [years, setYears] = useState('7');
  const [frequency, setFrequency] = useState('Quarterly');
  const [generating, setGenerating] = useState(false);

  const fetchDealData = async () => {
    const { data: dealData } = await supabase.from('deals').select('*').eq('id', params.id).single();
    if (dealData) setDeal(dealData);
    
    const { data: instData } = await supabase.from('installments').select('*').eq('deal_id', params.id).order('due_date', { ascending: true });
    setInstallments(instData || []);
    
    setLoading(false);
  };

  useEffect(() => { if (params.id) fetchDealData(); }, [params.id]);

  // محرك توليد الأقساط الذكي
  const generateInstallments = async () => {
    if (!confirm(`Are you sure? This will delete existing installments and generate a new ${years}-year schedule.`)) return;
    setGenerating(true);

    const totalValue = Number(deal.unit_value || 0);
    const downpayment = Number(deal.amount_paid || 0);
    const remainingBalance = totalValue - downpayment;

    const numYears = parseInt(years);
    const paymentsPerYear = frequency === 'Monthly' ? 12 : frequency === 'Quarterly' ? 4 : 1;
    const totalPayments = numYears * paymentsPerYear;
    
    const amountPerPayment = remainingBalance / totalPayments;
    
    // مسح الأقساط القديمة
    await supabase.from('installments').delete().eq('deal_id', deal.id);

    // تجهيز المصفوفة
    let newInstallments = [];
    let currentDate = new Date();
    
    for (let i = 1; i <= totalPayments; i++) {
      // إضافة المدة حسب النوع
      if (frequency === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
      else if (frequency === 'Quarterly') currentDate.setMonth(currentDate.getMonth() + 3);
      else if (frequency === 'Annually') currentDate.setFullYear(currentDate.getFullYear() + 1);

      newInstallments.push({
        deal_id: deal.id,
        installment_number: i,
        amount: amountPerPayment,
        due_date: currentDate.toISOString().split('T')[0],
        status: 'Pending'
      });
    }

    // إدخال الأقساط الجديدة
    const { error } = await supabase.from('installments').insert(newInstallments);
    if (!error) {
      alert('Installment schedule generated successfully!');
      fetchDealData();
    }
    setGenerating(false);
  };

  const markAsPaid = async (id: string) => {
    await supabase.from('installments').update({ status: 'Paid', paid_date: new Date().toISOString() }).eq('id', id);
    fetchDealData();
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading Deal...</div>;
  if (!deal) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Deal not found.</div>;

  const remainingBalance = Number(deal.unit_value || 0) - Number(deal.amount_paid || 0);

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="back-btn" onClick={() => router.back()}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
          <div className="header-title">Deal #{deal.deal_number || deal.id.substring(0,6).toUpperCase()}</div>
        </div>

        <div className="content-body">
          <div className="details-grid">
            <div className="detail-card">
              <div className="card-title">Client & Property</div>
              <div className="info-row"><div className="info-label">Client Name</div><div className="info-val">{deal.buyer_name}</div></div>
              <div className="info-row"><div className="info-label">Property</div><div className="info-val">{deal.compound} • {deal.developer}</div></div>
              <div className="info-row"><div className="info-label">Contract Date</div><div className="info-val">{new Date(deal.created_at).toLocaleDateString()}</div></div>
            </div>

            <div className="detail-card" style={{ background: '#f8fafc' }}>
               <div className="info-row"><div className="info-label">Total Unit Value</div><div className="info-val" style={{fontSize:'20px'}}>EGP {Number(deal.unit_value || 0).toLocaleString()}</div></div>
               <div className="info-row"><div className="info-label">Downpayment Paid</div><div className="info-val" style={{fontSize:'16px', color:'#3B6D11'}}>EGP {Number(deal.amount_paid || 0).toLocaleString()}</div></div>
               <div className="info-row" style={{borderTop:'1px solid #e2e8f0', paddingTop:'10px', marginTop:'5px'}}><div className="info-label" style={{color:'#0f172a'}}>Remaining Balance</div><div className="info-val" style={{fontSize:'18px', color:'#A32D2D'}}>EGP {remainingBalance.toLocaleString()}</div></div>
            </div>
          </div>

          {/* Installment Plan Manager */}
          <div className="installments-card">
            <div className="card-title">Installment Plan Manager</div>
            
            {installments.length === 0 && (
              <div className="calc-controls">
                <div className="form-group">
                  <label className="info-label">Payment Plan Years</label>
                  <input type="number" min="1" max="15" className="form-input" value={years} onChange={e => setYears(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="info-label">Payment Frequency</label>
                  <select className="form-select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly (كل 3 شهور)</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
                <button className="btn-generate" onClick={generateInstallments} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Schedule'}
                </button>
              </div>
            )}

            {installments.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Inst. #</th>
                      <th>Due Date</th>
                      <th>Amount (EGP)</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map(inst => (
                      <tr key={inst.id}>
                        <td style={{ fontWeight: '600' }}>#{inst.installment_number}</td>
                        <td>{new Date(inst.due_date).toLocaleDateString('en-GB')}</td>
                        <td style={{ fontWeight: '500' }}>EGP {Number(inst.amount).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                        <td><span className={inst.status === 'Paid' ? 'badge-paid' : 'badge-pending'}>{inst.status}</span></td>
                        <td>
                          {inst.status === 'Pending' && (
                            <button className="btn-mark-paid" onClick={() => markAsPaid(inst.id)}>Mark as Paid</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748b' }}>No installment schedule generated yet. Use the calculator above to create one based on the remaining balance.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}