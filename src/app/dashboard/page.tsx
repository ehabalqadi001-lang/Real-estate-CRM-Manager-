"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f0f2f5; min-height: 100vh; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; }
  
  .header { padding: 20px 30px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #e2e8f0; }
  .header-title { font-size: 24px; font-weight: 600; color: #0f172a; }
  .header-date { font-size: 14px; color: #64748b; margin-top: 4px; }
  .filter-group { display: flex; gap: 8px; }
  .filter-btn { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; cursor: pointer; background: #fff; color: #64748b; }
  .filter-btn.active { background: #0f1c2e; color: #fff; border-color: #0f1c2e; }

  .kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e2e8f0; }
  .kpi-box { padding: 20px 30px; border-right: 1px solid #e2e8f0; }
  .kpi-box:last-child { border-right: none; }
  .kpi-title { font-size: 13px; color: #64748b; margin-bottom: 8px; }
  .kpi-value { font-size: 26px; font-weight: 600; color: #0f172a; }
  .kpi-sub { font-size: 12px; margin-top: 8px; display: inline-block; padding: 2px 8px; border-radius: 4px; }
  .sub-green { background: #EAF3DE; color: #3B6D11; }
  .sub-blue { color: #185FA5; }

  .content-grid { display: grid; grid-template-columns: 2fr 1fr; }
  .left-col { padding: 30px; border-right: 1px solid #e2e8f0; }
  .right-col { padding: 30px; }
  .section-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .view-all { font-size: 12px; color: #185FA5; text-decoration: none; font-weight: 500; }

  .pipeline-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; }
  .pipeline-label { width: 100px; color: #0f172a; }
  .pipeline-bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; margin: 0 15px; overflow: hidden; }
  .pipeline-bar-fill { height: 100%; background: #185FA5; border-radius: 4px; }
  .pipeline-stats { width: 80px; text-align: right; color: #64748b; }

  .deal-item { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #f1f5f9; }
  .deal-avatar { width: 36px; height: 36px; border-radius: 50%; background: #E6F1FB; color: #185FA5; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; }
  .deal-info { flex: 1; }
  .deal-name { font-size: 14px; font-weight: 600; color: #0f172a; }
  .deal-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
  .deal-value { text-align: right; font-size: 14px; font-weight: 600; color: #0f172a; }
  .status-pill { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; margin-top: 4px; display: inline-block; }
  .pill-green { background: #EAF3DE; color: #3B6D11; }
  .pill-red { background: #FCEBEB; color: #A32D2D; }

  .donut-chart { width: 180px; height: 180px; margin: 0 auto 30px; display: block; }
  .legend-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; }
  .legend-label { display: flex; align-items: center; gap: 8px; color: #0f172a; font-weight: 500; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
`;

export default function EnhancedDashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
      setDeals(data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // الحسابات الذكية (Smart Calculations)
  const totalSales = deals.reduce((acc, curr) => acc + Number(curr.unit_value || 0), 0);
  const totalComm = totalSales * 0.05; // متوسط 5% للتبسيط لحين تغذية جدول العمولات
  const collectedComm = deals.filter(d => d.status === 'Approved').reduce((acc, curr) => acc + (Number(curr.unit_value || 0) * 0.05), 0);
  const upcomingComm = totalComm - collectedComm;

  const contractedDeals = deals.filter(d => d.stage === 'Sale Claim');

  // إعدادات الرسم البياني (Donut Chart)
  const collectPct = totalComm > 0 ? (collectedComm / totalComm) * 100 : 0;
  const strokeDasharray = `${collectPct} ${100 - collectPct}`;

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar */}
      <div className="sidebar">
  <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
  <Link href="/dashboard/leads" className="nav-item" title="Sales Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
  <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
  <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
  <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
  <Link href="/dashboard/reports" className="nav-item" title="Reports"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></Link>
  <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
  <Link href="/dashboard/settings" className="nav-item" title="Settings"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
</div>

      <div className="main-content">
        <div className="header">
          <div>
            <div className="header-title">Dashboard</div>
            <div className="header-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="filter-group">
            <button className="filter-btn">Month</button>
            <button className="filter-btn active">Year</button>
            <button className="filter-btn">All Time</button>
          </div>
        </div>

        <div className="kpi-strip">
          <div className="kpi-box">
            <div className="kpi-title">Total sales value</div>
            <div className="kpi-value">{loading ? '...' : `EGP ${(totalSales / 1000000).toFixed(1)}M`}</div>
            <div className="kpi-sub sub-green">↑ {deals.length} deals</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-title">Commissions earned</div>
            <div className="kpi-value" style={{ color: '#3B6D11' }}>{loading ? '...' : `EGP ${totalComm.toLocaleString()}`}</div>
            <div className="kpi-sub sub-green">Expected</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-title">Collected</div>
            <div className="kpi-value" style={{ color: '#3B6D11' }}>{loading ? '...' : `EGP ${collectedComm.toLocaleString()}`}</div>
            <div className="kpi-sub sub-green">{Math.round(collectPct)}% collected</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-title">Next payout</div>
            <div className="kpi-value">{loading ? '...' : `EGP ${upcomingComm.toLocaleString()}`}</div>
            <div className="kpi-sub sub-blue">Pending collection</div>
          </div>
        </div>

        <div className="content-grid">
          <div className="left-col">
            <div className="section-title">Sales Pipeline <Link href="/dashboard/leads" className="view-all">View all ↗</Link></div>
            
            <div className="pipeline-row">
              <div className="pipeline-label">EOIs</div>
              <div className="pipeline-bar-bg"><div className="pipeline-bar-fill" style={{ width: '0%', background: '#cbd5e1' }}></div></div>
              <div className="pipeline-stats">0 · EGP 0</div>
            </div>
            <div className="pipeline-row">
              <div className="pipeline-label">Reservations</div>
              <div className="pipeline-bar-bg"><div className="pipeline-bar-fill" style={{ width: '10%', background: '#F59E0B' }}></div></div>
              <div className="pipeline-stats">{deals.filter(d => d.stage === 'Reservation').length} deals</div>
            </div>
            <div className="pipeline-row">
              <div className="pipeline-label">Contracted</div>
              <div className="pipeline-bar-bg"><div className="pipeline-bar-fill" style={{ width: '80%' }}></div></div>
              <div className="pipeline-stats">{contractedDeals.length} deals</div>
            </div>

            <div style={{ marginTop: '40px' }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading deals skeleton...</div>
              ) : deals.slice(0, 4).map((deal, i) => (
                <div key={i} className="deal-item">
                  <div className="deal-avatar">{deal.buyer_name.substring(0, 2).toUpperCase()}</div>
                  <div className="deal-info">
                    <div className="deal-name">{deal.buyer_name}</div>
                    <div className="deal-meta">{deal.compound} • {deal.stage}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="deal-value">EGP {Number(deal.unit_value).toLocaleString()}</div>
                    <div className={`status-pill ${deal.status === 'Approved' ? 'pill-green' : deal.status === 'Rejected' ? 'pill-red' : ''}`}>{deal.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="right-col">
            <div className="section-title">Commission breakdown</div>
            
            {/* SVG Donut Chart */}
            <svg viewBox="0 0 36 36" className="donut-chart">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <path strokeDasharray={strokeDasharray} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B6D11" strokeWidth="4" />
              {upcomingComm > 0 && <path strokeDasharray={`${(upcomingComm/totalComm)*100} ${100 - (upcomingComm/totalComm)*100}`} strokeDashoffset={`-${collectPct}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#185FA5" strokeWidth="4" />}
            </svg>

            <div className="legend-item">
              <div className="legend-label"><div className="dot" style={{ background: '#3B6D11' }}></div> Collected</div>
              <div style={{ color: '#3B6D11', fontWeight: '600' }}>EGP {collectedComm.toLocaleString()}</div>
            </div>
            <div className="legend-item">
              <div className="legend-label"><div className="dot" style={{ background: '#185FA5' }}></div> Upcoming</div>
              <div style={{ color: '#185FA5', fontWeight: '600' }}>EGP {upcomingComm.toLocaleString()}</div>
            </div>

            <div className="section-title" style={{ marginTop: '40px' }}>Notifications <Link href="#" className="view-all">View all ↗</Link></div>
            <div style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
               <div className="dot" style={{ background: '#BA7517', marginTop: '5px', flexShrink: 0 }}></div>
               <div>
                 <strong>System sync complete.</strong> 
                 <div style={{ color: '#64748b', marginTop: '4px', fontSize: '12px' }}>Just now</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}