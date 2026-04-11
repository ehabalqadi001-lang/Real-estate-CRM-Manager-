"use client";
import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  // بيانات تجريبية (سيتم ربطها بـ Supabase لاحقاً)
  const deals = [
    { id: '#16708', buyer: 'Bakr Ibrahim', compound: 'Pyramids City', comm: '446,200', status: 'Approved' },
    { id: '#3700', buyer: 'أ. محمود عبد الرهاب', compound: 'De Joya 3', comm: '144,450', status: 'Approved' }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 20px; }
        .nav-item { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: rgba(255,255,255,0.4); }
        .nav-item.active { background: #185FA5; color: #fff; }
        .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        .topbar { background: #0f1c2e; padding: 12px 24px; color: #fff; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 20px; }
        .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; padding: 0 20px 20px; }
        .pill { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; background: #EAF3DE; color: #3B6D11; }
      `}} />

      {/* Sidebar */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
      </div>

      <div className="main">
        <div className="topbar">
          <div style={{ fontWeight: 'bold' }}>FAST INVESTMENT</div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>Building Wealth, Securing Futures</div>
        </div>

        {/* KPIs */}
        <div className="stats-grid">
          <div className="card">
            <div style={{ fontSize: '11px', color: '#64748b' }}>Total Sales Volume</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>EGP 28.2M</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '11px', color: '#64748b' }}>Commissions Earned</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3B6D11' }}>EGP 933,843</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '11px', color: '#64748b' }}>Collected</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3B6D11' }}>EGP 933,843</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '11px', color: '#64748b' }}>Next Payout</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#854F0B' }}>EGP 312,500</div>
          </div>
        </div>

        <div className="content-grid">
          {/* Recent Deals Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Sales Pipeline</div>
              <Link href="/dashboard/leads" style={{ fontSize: '11px', color: '#185FA5', textDecoration: 'none' }}>View all ↗</Link>
            </div>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '8px 0' }}>Buyer</th>
                  <th>Compound</th>
                  <th>Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 0', fontWeight: '500' }}>{deal.buyer}</td>
                    <td>{deal.compound}</td>
                    <td style={{ fontWeight: 'bold' }}>EGP {deal.comm}</td>
                    <td><span className="pill">{deal.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Commission Breakdown Summary */}
          <div className="card">
             <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '15px' }}>Breakdown</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Collected</span><span style={{ color: '#3B6D11', fontWeight: 'bold' }}>EGP 933k</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Upcoming</span><span style={{ color: '#185FA5', fontWeight: 'bold' }}>EGP 312k</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rejected</span><span style={{ color: '#A32D2D', fontWeight: 'bold' }}>EGP 90k</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}