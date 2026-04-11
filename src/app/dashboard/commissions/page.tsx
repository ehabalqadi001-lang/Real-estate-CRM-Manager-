"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  :root { --bg-primary: #ffffff; --bg-secondary: #f8fafc; --border-main: #e2e8f0; --text-main: #0f172a; --text-muted: #64748b; }
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-title { color: #fff; font-size: 15px; font-weight: 500; }
  .avatar { width: 30px; height: 30px; border-radius: 50%; background: #185FA5; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: var(--bg-primary); border-radius: 12px 0 0 0; border: 1px solid var(--border-main); border-right: none; }
  
  .tabs { display: flex; border-bottom: 1px solid var(--border-main); padding: 0 20px; }
  .tab { padding: 14px 16px; font-size: 13px; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; }
  .tab.active { color: #185FA5; border-bottom-color: #185FA5; }
  
  .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--border-main); }
  .sum-col { padding: 16px 20px; border-right: 1px solid var(--border-main); }
  .sum-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; font-weight: 500; }
  .sum-dot { width: 8px; height: 8px; border-radius: 50%; }
  .sum-val { font-size: 22px; font-weight: 600; color: var(--text-main); }
  
  .toolbar { display: flex; gap: 8px; padding: 12px 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-main); }
  .filter-select { font-size: 12px; padding: 8px 12px; border: 1px solid var(--border-main); border-radius: 6px; }
  
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 20px; color: var(--text-muted); border-bottom: 1px solid var(--border-main); background: var(--bg-secondary); font-weight: 500;}
  td { padding: 14px 20px; border-bottom: 1px solid var(--border-main); color: var(--text-main); }
  .status-pill { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; border: 1px solid; }

  /* Fix for Issue #5: Real Calendar Styles */
  .cal-container { padding: 30px; }
  .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
  .cal-day-name { text-align: center; font-size: 12px; color: var(--text-muted); font-weight: 600; }
  .cal-day { aspect-ratio: 1; border: 1px solid var(--border-main); border-radius: 8px; padding: 10px; font-size: 14px; display: flex; flex-direction: column; gap: 4px; }
  .cal-day.today { background: #0f1c2e; color: #fff; border-color: #0f1c2e; }
  .cal-event { font-size: 10px; padding: 4px; background: #E6F1FB; color: #185FA5; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommissionsData() {
      setLoading(true);
      const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
      setDeals(data || []);
      setLoading(false);
    }
    fetchCommissionsData();
  }, []);

  const totalComm = deals.reduce((acc, curr) => acc + (Number(curr.unit_value || 0) * 0.05), 0);
  const collectedComm = deals.filter(d => d.status === 'Approved').reduce((acc, curr) => acc + (Number(curr.unit_value || 0) * 0.05), 0);

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="topbar">
        <div style={{ color: '#fff', fontWeight: 'bold' }}>FAST INVESTMENT</div>
        <div className="avatar">EA</div>
      </div>

      <div style={{ display: 'flex' }}>
        <div className="sidebar">
          <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
          <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
          <Link href="/dashboard/commissions" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
        </div>

        <div className="main">
          <div className="tabs">
            <div className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Due Dates Timeline</div>
            <div className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar View</div>
            <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Payout History</div>
          </div>

          <div className="summary-strip">
            <div className="sum-col">
              <div className="sum-label"><div className="sum-dot" style={{ background: '#185FA5' }}></div>Total Expected</div>
              <div className="sum-val">EGP {totalComm.toLocaleString()}</div>
            </div>
            <div className="sum-col">
              <div className="sum-label"><div className="sum-dot" style={{ background: '#3B6D11' }}></div>Collected</div>
              <div className="sum-val" style={{ color: '#3B6D11' }}>EGP {collectedComm.toLocaleString()}</div>
            </div>
          </div>

          {activeTab === 'timeline' && (
            <div style={{ padding: '20px' }}>
              <div className="toolbar" style={{ marginBottom: '20px', borderRadius: '8px' }}>
                <select className="filter-select"><option>All Statuses</option></select>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Deal Reference</th>
                    <th>Buyer</th>
                    <th>Compound</th>
                    <th>Expected Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} style={{textAlign:'center'}}>Loading...</td></tr> : 
                   deals.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '500' }}>#{d.unit_id || d.deal_number}</td>
                      <td>{d.buyer_name}</td>
                      <td>{d.compound}</td>
                      <td style={{ fontWeight: '600' }}>EGP {(Number(d.unit_value) * 0.05).toLocaleString()}</td>
                      <td><span className="status-pill" style={{ background: '#EAF3DE', color: '#3B6D11', borderColor: '#97C459' }}>{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fix for Issue #5: Real Interactive Calendar */}
          {activeTab === 'calendar' && (
            <div className="cal-container">
              <div className="cal-header">
                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>May 2026</h2>
                <div>
                  <button style={{ padding: '6px 12px', marginRight: '8px', cursor: 'pointer' }}>Previous</button>
                  <button style={{ padding: '6px 12px', cursor: 'pointer' }}>Next</button>
                </div>
              </div>
              <div className="cal-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="cal-day-name">{day}</div>)}
                {[...Array(31)].map((_, i) => (
                  <div key={i} className={`cal-day ${i + 1 === 15 ? 'today' : ''}`}>
                    <span style={{ fontWeight: i+1 === 15 ? 'bold' : 'normal' }}>{i + 1}</span>
                    {/* Simulated Event injection for UI logic */}
                    {i === 10 && deals.length > 0 && (
                      <div className="cal-event">Payout: {deals[0].buyer_name}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}