"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; left: 0; top: 0; bottom: 0; }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main-content { margin-left: 64px; flex: 1; display: flex; flex-direction: column; }
  
  .header { padding: 20px 30px; border-bottom: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 15px; position: sticky; top: 0; z-index: 10; }
  .back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; color: #0f172a; transition: 0.2s; }
  .back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .header-title { font-size: 20px; font-weight: 600; color: #0f172a; }
  
  .content-body { padding: 30px; max-width: 1000px; }
  
  .status-bar { display: flex; gap: 15px; margin-bottom: 25px; }
  .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid; }
  
  /* Administrative Status */
  .badge-pending { background: #FFF7ED; color: #9A3412; border-color: #FDBA74; }
  .badge-approved { background: #EAF3DE; color: #3B6D11; border-color: #86EFAC; }
  .badge-rejected { background: #FCEBEB; color: #A32D2D; border-color: #FCA5A5; }

  /* Financial Status */
  .finance-badge { background: #E6F1FB; color: #185FA5; border-color: #93C5FD; }
  .finance-collected { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .detail-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .card-title::before { content: ''; display: block; width: 4px; height: 16px; background: #185FA5; border-radius: 4px; }
  
  .info-row { display: flex; flex-direction: column; margin-bottom: 16px; }
  .info-row:last-child { margin-bottom: 0; }
  .info-label { font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-val { font-size: 14px; font-weight: 600; color: #0f172a; }
  .val-large { font-size: 24px; font-weight: 700; color: #185FA5; }
  
  .action-bar { margin-top: 30px; padding: 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 15px; }
  .action-title { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 5px; }
  .action-desc { font-size: 13px; color: #64748b; margin-bottom: 10px; }
  
  .btn-group { display: flex; gap: 12px; }
  .btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; border: 1px solid transparent; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
  .btn-verify { background: #0f1c2e; color: #fff; }
  .btn-verify:hover { background: #1e293b; }
  .btn-reject { background: #fff; color: #A32D2D; border-color: #FCA5A5; }
  .btn-reject:hover { background: #FCEBEB; }
  .btn-finance { background: #f8fafc; color: #185FA5; border-color: #cbd5e1; }
  .btn-finance:hover { background: #f1f5f9; border-color: #94a3b8; }
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
      
      if (error) console.error(error);
      else setDeal(data);
      
      setLoading(false);
    }
    if (params.id) fetchDeal();
  }, [params.id]);

  // دالة الموافقة الإدارية (تحديث الـ Status فقط دون المساس بالماليات)
  const updateAdminStatus = async (newStatus: string) => {
    const { error } = await supabase.from('deals').update({ status: newStatus }).eq('id', deal.id);
    if (!error) {
      setDeal({ ...deal, status: newStatus });
      alert(newStatus === 'Approved' 
        ? "✅ تم تأكيد صحة البيعة ومراجعتها بنجاح. يمكنك الآن متابعة التحصيل المالي من شاشة العمولات." 
        : "❌ تم رفض البيعة."
      );
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading deal details...</div>;
  if (!deal) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Deal not found.</div>;

  const commission = Number(deal.unit_value || 0) * 0.05;
  const isFinanceCollected = deal.finance_status === 'Commission Received' || deal.finance_status === 'Transferred to Agent';

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar */}
      <div className="sidebar">
  {/* Dashboard */}
  <Link href="/dashboard" className="nav-item" title="Dashboard">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  </Link>
  
  {/* Clients Directory */}
  <Link href="/dashboard/clients" className="nav-item" title="Clients">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  </Link>
  
  {/* Sales Pipeline (Leads/Deals) */}
  <Link href="/dashboard/leads" className="nav-item" title="Pipeline">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  </Link>
  
  {/* Commissions */}
  <Link href="/dashboard/commissions" className="nav-item" title="Commissions">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  </Link>
  
  {/* Developers */}
  <Link href="/dashboard/developers" className="nav-item" title="Developers">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  </Link>

  {/* خط فاصل */}
  <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
  
  {/* Admin Approvals */}
  <Link href="/dashboard/admin" className="nav-item" title="Admin Approvals">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  </Link>
  
  {/* Settings */}
  <Link href="/dashboard/settings" className="nav-item" title="Settings">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  </Link>
</div>

      <div className="main-content">
        <div className="header">
          <div className="back-btn" onClick={() => router.back()}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
          <div className="header-title">Deal #{deal.deal_number} / {deal.unit_id || 'N/A'}</div>
        </div>

        <div className="content-body">
          <div className="status-bar">
            <div className={`status-badge ${deal.status === 'Approved' ? 'badge-approved' : deal.status === 'Rejected' ? 'badge-rejected' : 'badge-pending'}`}>
              Admin Status: {deal.status === 'Approved' ? 'Verified' : deal.status === 'Rejected' ? 'Rejected' : 'Pending Verification'}
            </div>
            <div className={`status-badge ${isFinanceCollected ? 'finance-collected' : 'finance-badge'}`}>
              Finance Stage: {deal.finance_status || 'Pending Claim'}
            </div>
          </div>

          <div className="details-grid">
            {/* Client Info */}
            <div className="detail-card">
              <div className="card-title">Client Information</div>
              <div className="info-row"><div className="info-label">Full Name</div><div className="info-val">{deal.buyer_name}</div></div>
              <div className="info-row"><div className="info-label">Phone Number</div><div className="info-val" style={{direction: 'ltr', textAlign: 'left'}}>{deal.buyer_phone}</div></div>
              <div className="info-row"><div className="info-label">Submission Date</div><div className="info-val">{new Date(deal.created_at).toLocaleDateString('en-GB')}</div></div>
            </div>

            {/* Property Info */}
            <div className="detail-card">
              <div className="card-title">Property Details</div>
              <div className="info-row"><div className="info-label">Compound / Developer</div><div className="info-val">{deal.compound} • {deal.developer || 'Edge Holding'}</div></div>
              <div className="info-row"><div className="info-label">Property Type</div><div className="info-val">{deal.property_type || 'Unit'}</div></div>
              <div className="info-row"><div className="info-label">Deal Stage</div><div className="info-val">{deal.stage}</div></div>
            </div>

            {/* Financial Info */}
            <div className="detail-card" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', background: '#f8fafc' }}>
               <div className="info-row"><div className="info-label">Total Unit Value</div><div className="val-large">EGP {Number(deal.unit_value || 0).toLocaleString()}</div></div>
               <div className="info-row"><div className="info-label">Downpayment Paid</div><div className="info-val" style={{fontSize: '18px'}}>EGP {Number(deal.amount_paid || 0).toLocaleString()}</div></div>
               <div className="info-row"><div className="info-label">Expected Commission (5%)</div><div className="info-val" style={{fontSize: '18px', color: '#3B6D11'}}>EGP {commission.toLocaleString()}</div></div>
            </div>
          </div>

          {/* Control Panel: Separating Admin from Finance */}
          <div className="action-bar">
             <div>
               <div className="action-title">Step 1: Deal Verification</div>
               <div className="action-desc">Confirm with the developer that this contract is valid and signed. This does NOT mark the commission as paid.</div>
               <div className="btn-group">
                 <button className="btn btn-verify" onClick={() => updateAdminStatus('Approved')}>✓ Verify Deal (Technical)</button>
                 <button className="btn btn-reject" onClick={() => updateAdminStatus('Rejected')}>✕ Reject Deal</button>
               </div>
             </div>
             
             <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '10px 0' }}></div>
             
             <div>
               <div className="action-title">Step 2: Financial Workflow</div>
               <div className="action-desc">Manage claims, payouts, and developer collections for this verified deal.</div>
               <Link href="/dashboard/commissions" className="btn btn-finance">
                 Go to Commissions & Payouts ↗
               </Link>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}