"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f0f2f5; min-height: 100vh; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; }
  
  .header { padding: 20px 30px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px 0 0 0; display: flex; align-items: center; gap: 15px; }
  .back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; color: #0f172a; transition: 0.2s; }
  .back-btn:hover { background: #f1f5f9; }
  .header-title { font-size: 20px; font-weight: 600; color: #0f172a; }
  
  .content-body { padding: 30px; max-width: 900px; }
  .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
  .badge-pending { background: #FFF7ED; color: #9A3412; border: 1px solid #FDBA74; }
  .badge-approved { background: #EAF3DE; color: #3B6D11; border: 1px solid #C5E1A5; }
  .badge-rejected { background: #FCEBEB; color: #A32D2D; border: 1px solid #F8B4B4; }

  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .detail-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #fff; }
  .card-title { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
  
  .info-row { display: flex; flex-direction: column; margin-bottom: 16px; }
  .info-row:last-child { margin-bottom: 0; }
  .info-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .info-val { font-size: 14px; font-weight: 500; color: #0f172a; }
  .val-large { font-size: 20px; font-weight: 700; color: #185FA5; }
  
  .action-bar { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; }
  .btn { padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; border: none; }
  .btn-approve { background: #3B6D11; color: #fff; }
  .btn-approve:hover { background: #27500A; }
  .btn-reject { background: #fff; color: #A32D2D; border: 1px solid #F8B4B4; }
  .btn-reject:hover { background: #FCEBEB; }
`;

export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeal() {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) {
        console.error(error);
      } else {
        setDeal(data);
      }
      setLoading(false);
    }
    
    if (params.id) fetchDeal();
  }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from('deals').update({ status: newStatus }).eq('id', deal.id);
    if (!error) {
      setDeal({ ...deal, status: newStatus });
      alert(`Deal marked as ${newStatus}`);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading deal details...</div>;
  if (!deal) return <div style={{ padding: '50px', textAlign: 'center' }}>Deal not found.</div>;

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/settings" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="back-btn" onClick={() => router.back()}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
          <div className="header-title">Deal #{deal.deal_number} / {deal.unit_id}</div>
        </div>

        <div className="content-body">
          <div className={`status-badge ${deal.status === 'Approved' ? 'badge-approved' : deal.status === 'Rejected' ? 'badge-rejected' : 'badge-pending'}`}>
            Status: {deal.status}
          </div>

          <div className="details-grid">
            {/* Client Info */}
            <div className="detail-card">
              <div className="card-title">Client Information</div>
              <div className="info-row"><div className="info-label">Full Name</div><div className="info-val">{deal.buyer_name}</div></div>
              <div className="info-row"><div className="info-label">Phone Number</div><div className="info-val" style={{direction: 'ltr', textAlign: 'left'}}>{deal.buyer_phone}</div></div>
            </div>

            {/* Property Info */}
            <div className="detail-card">
              <div className="card-title">Property Details</div>
              <div className="info-row"><div className="info-label">Compound / Developer</div><div className="info-val">{deal.compound}</div></div>
              <div className="info-row"><div className="info-label">Property Type</div><div className="info-val">{deal.property_type || 'N/A'}</div></div>
              <div className="info-row"><div className="info-label">Unit ID</div><div className="info-val">{deal.unit_id || 'N/A'}</div></div>
              <div className="info-row"><div className="info-label">Deal Stage</div><div className="info-val">{deal.stage}</div></div>
            </div>

            {/* Financial Info */}
            <div className="detail-card" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
               <div className="info-row"><div className="info-label">Total Unit Value</div><div className="val-large">EGP {Number(deal.unit_value).toLocaleString()}</div></div>
               <div className="info-row"><div className="info-label">Amount Paid (Downpayment)</div><div className="info-val" style={{fontSize: '18px'}}>EGP {Number(deal.amount_paid).toLocaleString()}</div></div>
               <div className="info-row"><div className="info-label">Expected Commission (5%)</div><div className="info-val" style={{fontSize: '18px', color: '#3B6D11'}}>EGP {(Number(deal.unit_value) * 0.05).toLocaleString()}</div></div>
            </div>
          </div>

          {/* Actions */}
          <div className="action-bar">
             <button className="btn btn-approve" onClick={() => updateStatus('Approved')}>Mark as Approved</button>
             <button className="btn btn-reject" onClick={() => updateStatus('Rejected')}>Mark as Rejected</button>
          </div>

        </div>
      </div>
    </div>
  );
}