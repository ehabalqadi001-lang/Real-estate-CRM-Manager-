"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const CSS_STYLES = `
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --border-main: #e2e8f0;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --radius-lg: 12px;
    --radius-md: 8px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-title { color: #fff; font-size: 15px; font-weight: 500; letter-spacing: 0.5px; }
  .avatar { width: 30px; height: 30px; border-radius: 50%; background: #185FA5; display: flex; align-items: center; justify-content: center; color: #B5D4F4; font-size: 11px; font-weight: 500; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: var(--bg-primary); border-radius: 12px 0 0 0; border: 1px solid var(--border-main); border-right: none; margin-top: 1px; }
  
  .tabs { display: flex; border-bottom: 1px solid var(--border-main); background: var(--bg-primary); padding: 0 20px; border-radius: 12px 0 0 0; }
  .tab { padding: 14px 16px; font-size: 13px; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; }
  .tab.active { color: #185FA5; border-bottom-color: #185FA5; }
  
  .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--border-main); background: var(--bg-primary); }
  .sum-col { padding: 16px 20px; border-right: 1px solid var(--border-main); }
  .sum-col:last-child { border-right: none; }
  .sum-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; font-weight: 500; }
  .sum-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .sum-val { font-size: 22px; font-weight: 600; color: var(--text-main); }
  .sum-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
  
  .toolbar { display: flex; gap: 8px; padding: 12px 20px; background: var(--bg-secondary); align-items: center; border-bottom: 1px solid var(--border-main); }
  .filter-select { font-size: 12px; padding: 8px 12px; border: 1px solid var(--border-main); border-radius: 6px; background: #fff; color: var(--text-main); outline: none; }
  .search-box { flex: 1; min-width: 160px; padding: 8px 12px; border: 1px solid var(--border-main); border-radius: 6px; font-size: 12px; outline: none; }
  
  .timeline { padding: 20px; display: flex; flex-direction: column; gap: 0; }
  .tl-group-label { font-size: 12px; color: var(--text-muted); font-weight: 600; padding: 10px 0 6px; margin-left: 28px; text-transform: uppercase; letter-spacing: 0.5px; }
  .tl-item { display: flex; gap: 16px; align-items: flex-start; padding: 12px 0; }
  .tl-indicator { display: flex; flex-direction: column; align-items: center; gap: 0; flex-shrink: 0; padding-top: 6px; width: 12px; }
  .tl-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--border-main); z-index: 2; }
  .tl-line { width: 2px; background: var(--border-main); flex: 1; min-height: 40px; margin-top: -2px; margin-bottom: -16px; }
  .tl-card { flex: 1; padding: 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-main); background: var(--bg-primary); transition: box-shadow 0.2s; }
  .tl-card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-color: #cbd5e1; }
  .tl-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .tl-title { font-size: 14px; font-weight: 600; color: var(--text-main); }
  .tl-date { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .tl-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
  .tl-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tl-amount { font-size: 15px; font-weight: 600; }
  .status-pill { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; border: 1px solid; }
  
  .action-row { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border-main); }
  .btn-outline { font-size: 11px; padding: 6px 12px; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-main); background: transparent; font-weight: 500; color: var(--text-main); }
  .btn-outline:hover { background: var(--bg-secondary); }
  .btn-primary { font-size: 11px; padding: 6px 12px; border-radius: 6px; cursor: pointer; border: none; background: #0f1c2e; color: #fff; font-weight: 500; }
  
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 20px; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border-main); font-size: 12px; background: var(--bg-secondary); }
  td { padding: 14px 20px; border-bottom: 1px solid var(--border-main); color: var(--text-main); vertical-align: middle; }
  tr:hover td { background: var(--bg-secondary); }
  
  .cal-container { padding: 24px; }
  .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  .cal-day-name { text-align: center; font-size: 11px; color: var(--text-muted); font-weight: 600; padding-bottom: 8px; }
  .cal-day { aspect-ratio: 1; border: 1px solid var(--border-main); border-radius: 8px; padding: 8px; font-size: 13px; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
  .cal-day:hover { border-color: #185FA5; background: #f8fafc; }
  .cal-day.today { background: #0f1c2e; color: #fff; border-color: #0f1c2e; }
  .cal-day.muted { color: #cbd5e1; background: #f8fafc; border-color: #f1f5f9; cursor: default; }
  .event-dot { width: 6px; height: 6px; border-radius: 50%; }
`;

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('timeline');

  // بيانات توضيحية للـ Timeline
  const timelineData = [
    { id: 'C005', month: 'June 2026', buyer: 'Pending — OIA Tower Studio', dev: 'Edge Holding', compound: 'OIA Compound', amount: '312,500', date: '15-06-2026', status: 'Upcoming', days: '73 days away', bg: '#E6F1FB', text: '#185FA5', border: '#85B7EB' },
    { id: 'C001', month: 'July 2025', buyer: 'Bakr Ibrahim Ahmed', dev: 'Pyramids Dev', compound: 'Pyramids City', amount: '446,200', date: '30-07-2025', status: 'Collected', days: 'Paid', bg: '#EAF3DE', text: '#3B6D11', border: '#97C459' },
    { id: 'C002', month: 'July 2024', buyer: 'Bassma Mohamed', dev: 'TBK Developments', compound: 'Ninety Avenue', amount: '343,193', date: '10-07-2024', status: 'Collected', days: 'Paid', bg: '#EAF3DE', text: '#3B6D11', border: '#97C459' },
    { id: 'C004', month: 'May 2024', buyer: 'Bassma Mohamed', dev: 'Taj Misr', compound: 'De Joya 1', amount: '90,900', date: '13-05-2024', status: 'Rejected', days: 'Cancelled', bg: '#FCEBEB', text: '#A32D2D', border: '#F09595' },
  ];

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div className="topbar-title">FAST INVESTMENT</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#E24B4A', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #0f1c2e' }}></div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginLeft: '10px' }}>Ehab Alqadi</div>
          <div className="avatar">EA</div>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* القائمة الجانبية الكاملة */}
        <div className="sidebar">
          <Link href="/dashboard" className="nav-item" title="Dashboard">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </Link>
          <Link href="/dashboard/leads" className="nav-item" title="Sales Pipeline">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <Link href="/dashboard/commissions" className="nav-item active" title="Commissions">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/developers" className="nav-item" title="Developers">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </Link>
          <Link href="/dashboard/reports" className="nav-item" title="Reports">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/settings" className="nav-item" title="Settings">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </Link>
        </div>

        <div className="main">
          <div className="tabs">
            <div className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Due Dates</div>
            <div className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar</div>
            <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Payout History</div>
          </div>

          <div className="summary-strip">
            <div className="sum-col">
              <div className="sum-label"><div className="sum-dot" style={{ background: '#E24B4A' }}></div>Overdue</div>
              <div className="sum-val" style={{ color: '#A32D2D' }}>EGP 0</div>
              <div className="sum-sub">0 deals</div>
            </div>
            <div className="sum-col">
              <div className="sum-label"><div className="sum-dot" style={{ background: '#BA7517' }}></div>Due this month</div>
              <div className="sum-val" style={{ color: '#633806' }}>EGP 0</div>
              <div className="sum-sub">0 deals</div>
            </div>
            <div className="sum-col">
              <div className="sum-label"><div className="sum-dot" style={{ background: '#185FA5' }}></div>Upcoming</div>
              <div className="sum-val">EGP 312,500</div>
              <div className="sum-sub">1 deals</div>
            </div>
            <div className="sum-col">
              <div className="sum-label"><div className="sum-dot" style={{ background: '#3B6D11' }}></div>Collected</div>
              <div className="sum-val" style={{ color: '#3B6D11' }}>EGP 933,843</div>
              <div className="sum-sub">3 deals</div>
            </div>
          </div>

          {activeTab === 'timeline' && (
            <div>
              <div className="toolbar">
                <select className="filter-select"><option>All Statuses</option><option>Upcoming</option><option>Paid</option></select>
                <select className="filter-select"><option>All Developers</option><option>Pyramids Dev</option><option>Taj Misr</option></select>
                <input className="search-box" placeholder="Search buyer or deal ID..." />
              </div>
              <div className="timeline">
                {timelineData.map((item, index) => (
                  <React.Fragment key={index}>
                    {index === 0 || timelineData[index - 1].month !== item.month ? (
                      <div className="tl-group-label">{item.month}</div>
                    ) : null}
                    <div className="tl-item">
                      <div className="tl-indicator">
                        <div className="tl-dot" style={{ background: item.text }}></div>
                        {index < timelineData.length - 1 && <div className="tl-line"></div>}
                      </div>
                      <div className="tl-card">
                        <div className="tl-header">
                          <div className="tl-title">{item.buyer}</div>
                          <div className="tl-date">{item.date}</div>
                        </div>
                        <div className="tl-meta">{item.compound} · {item.dev}</div>
                        <div className="tl-footer">
                          <span className="tl-amount" style={{ color: item.status === 'Rejected' ? '#A32D2D' : '#3B6D11' }}>EGP {item.amount}</span>
                          <span className="status-pill" style={{ background: item.bg, color: item.text, borderColor: item.border }}>{item.status}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>{item.days}</span>
                        </div>
                        <div className="action-row">
                          <button className="btn-outline">View Deal ↗</button>
                          {item.status === 'Upcoming' && <button className="btn-primary">Mark as Paid</button>}
                          {item.status === 'Upcoming' && <button className="btn-outline">Send Reminder</button>}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="cal-container">
              <div className="cal-header">
                <h2 style={{ fontSize: '16px', fontWeight: '600' }}>April 2026</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-outline">‹ Prev</button>
                  <button className="btn-outline">Next ›</button>
                </div>
              </div>
              <div className="cal-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="cal-day-name">{day}</div>)}
                {[...Array(30)].map((_, i) => (
                  <div key={i} className={`cal-day ${i + 1 === 11 ? 'today' : ''} ${i < 3 ? 'muted' : ''}`}>
                    {i + 1}
                    {i === 14 && <div className="event-dot" style={{ background: '#185FA5' }}></div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#185FA5' }}></div>
                <div style={{ flex: 1, fontSize: '13px' }}><strong>Pending — OIA Tower Studio</strong> · Edge Holding</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#185FA5' }}>EGP 312,500</div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ padding: '0 20px 20px', overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Buyer</th>
                    <th>Developer</th>
                    <th>Commission</th>
                    <th>Due Date</th>
                    <th>Paid Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '500' }}>#16708</td>
                    <td>Bakr Ibrahim Ahmed</td>
                    <td style={{ color: '#64748b' }}>Pyramids Dev.</td>
                    <td style={{ fontWeight: '600', color: '#3B6D11' }}>EGP 446,200</td>
                    <td>30-07-2025</td>
                    <td>15-08-2025</td>
                    <td><span className="status-pill" style={{ background: '#EAF3DE', color: '#3B6D11', borderColor: '#97C459' }}>Collected</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '500' }}>#2939</td>
                    <td>Bassma Mohamed</td>
                    <td style={{ color: '#64748b' }}>TBK Developments</td>
                    <td style={{ fontWeight: '600', color: '#3B6D11' }}>EGP 343,193</td>
                    <td>10-07-2024</td>
                    <td>22-07-2024</td>
                    <td><span className="status-pill" style={{ background: '#EAF3DE', color: '#3B6D11', borderColor: '#97C459' }}>Collected</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '500' }}>#3383</td>
                    <td>Bassma Mohamed</td>
                    <td style={{ color: '#64748b' }}>Taj Misr Dev.</td>
                    <td style={{ fontWeight: '600', color: '#A32D2D' }}>EGP 90,900</td>
                    <td>13-05-2024</td>
                    <td style={{ color: '#cbd5e1' }}>—</td>
                    <td><span className="status-pill" style={{ background: '#FCEBEB', color: '#A32D2D', borderColor: '#F09595' }}>Rejected</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}