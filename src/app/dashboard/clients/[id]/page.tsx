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
  
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
  .back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; color: #0f172a; transition: 0.2s; }
  .back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .header-title { font-size: 20px; font-weight: 700; color: #0f172a; }
  
  .content-body { padding: 30px; max-width: 1100px; }
  
  .top-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; margin-bottom: 24px; }
  @media (max-width: 900px) { .top-grid { grid-template-columns: 1fr; } }
  
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .card-title::before { content: ''; display: block; width: 4px; height: 16px; background: #185FA5; border-radius: 4px; }
  
  .info-list { display: flex; flex-direction: column; gap: 16px; }
  .info-item { display: flex; flex-direction: column; gap: 4px; }
  .info-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 15px; color: #0f172a; font-weight: 500; }
  
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .stat-box { padding: 20px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .stat-label { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 8px; }
  .stat-value { font-size: 24px; font-weight: 700; color: #185FA5; }
  
  .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #f8fafc; }
  
  .status-pill { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; border: 1px solid; display: inline-block; }
  .status-approved { background: #EAF3DE; color: #3B6D11; border-color: #86EFAC; }
  .status-pending { background: #FFF7ED; color: #9A3412; border-color: #FDBA74; }
  
  .btn-link { color: #185FA5; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
  .btn-link:hover { text-decoration: underline; }
  
  .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #0f1c2e; color: #fff; }
`;

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientAndPortfolio() {
      // 1. جلب بيانات العميل
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (clientError || !clientData) {
        console.error(clientError);
        setLoading(false);
        return;
      }
      setClient(clientData);

      // 2. جلب صفقات العميل (بالـ ID أو بالتطابق مع رقم الهاتف للصفقات القديمة)
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .or(`client_id.eq.${params.id},buyer_phone.eq.${clientData.phone}`)
        .order('created_at', { ascending: false });

      setPortfolio(dealsData || []);
      setLoading(false);
    }

    if (params.id) fetchClientAndPortfolio();
  }, [params.id]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading Portfolio...</div>;
  if (!client) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Client not found.</div>;

  // الحسابات المالية للمحفظة
  const totalInvestment = portfolio.reduce((acc, deal) => acc + Number(deal.unit_value || 0), 0);
  const totalPaid = portfolio.reduce((acc, deal) => acc + Number(deal.amount_paid || 0), 0);
  const totalExpectedComm = totalInvestment * 0.05; // بناءً على عمولة 5%

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="back-btn" onClick={() => router.push('/dashboard/clients')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>
          <div className="header-title">{client.full_name}'s Profile</div>
        </div>

        <div className="content-body">
          <div className="top-grid">
            {/* Personal Details */}
            <div className="card">
              <div className="card-title">Client Information</div>
              <div className="info-list">
                <div className="info-item"><span className="info-label">Phone Number</span><span className="info-value" style={{direction:'ltr', textAlign:'left'}}>{client.phone}</span></div>
                <div className="info-item"><span className="info-label">Email Address</span><span className="info-value">{client.email || 'Not provided'}</span></div>
                <div className="info-item"><span className="info-label">Client Type</span><span className="info-value"><span className="badge">{client.client_type}</span></span></div>
                <div className="info-item"><span className="info-label">Budget Range</span><span className="info-value">{client.budget_range || 'Unknown'}</span></div>
                <div className="info-item"><span className="info-label">Registered On</span><span className="info-value">{new Date(client.created_at).toLocaleDateString()}</span></div>
              </div>
            </div>

            {/* Portfolio Summary */}
            <div className="card">
              <div className="card-title">Investment Portfolio Summary</div>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Total Properties</div>
                  <div className="stat-value" style={{ color: '#0f172a' }}>{portfolio.length}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Total Investment</div>
                  <div className="stat-value">EGP {totalInvestment.toLocaleString()}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Total Downpayments</div>
                  <div className="stat-value" style={{ color: '#3B6D11' }}>EGP {totalPaid.toLocaleString()}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '20px', padding: '16px', background: '#F1F5F9', borderRadius: '8px', borderLeft: '4px solid #185FA5' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>ESTIMATED AGENCY COMMISSION FROM THIS CLIENT</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#185FA5' }}>EGP {totalExpectedComm.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Deal History Table */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginTop: '10px' }}>Purchased Properties</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Property / Project</th>
                  <th>Value</th>
                  <th>Paid</th>
                  <th>Admin Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>No properties found for this client yet.</td></tr>
                ) : (
                  portfolio.map(deal => (
                    <tr key={deal.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{deal.compound}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{deal.developer} • {deal.property_type || 'Unit'}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>EGP {Number(deal.unit_value || 0).toLocaleString()}</td>
                      <td style={{ color: '#3B6D11', fontWeight: '500' }}>EGP {Number(deal.amount_paid || 0).toLocaleString()}</td>
                      <td>
                        <span className={`status-pill ${deal.status === 'Approved' ? 'status-approved' : 'status-pending'}`}>
                          {deal.status === 'Approved' ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/dashboard/deals/${deal.id}`} className="btn-link">View Deal ↗</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}