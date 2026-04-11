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
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
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
  .sum-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
  
  .toolbar { display: flex; gap: 8px; padding: 12px 20px; background: var(--bg-secondary); align-items: center; border-bottom: 1px solid var(--border-main); }
  .filter-select { font-size: 12px; padding: 8px 12px; border: 1px solid var(--border-main); border-radius: 6px; background: #fff; color: var(--text-main); outline: none; }
  .search-box { flex: 1; min-width: 160px; padding: 8px 12px; border: 1px solid var(--border-main); border-radius: 6px; font-size: 12px; outline: none; }
  
  /* Timeline Detailed Styles */
  .timeline { padding: 30px; display: flex; flex-direction: column; gap: 0; max-width: 900px; }
  .tl-group-label { font-size: 12px; color: var(--text-muted); font-weight: 600; padding: 15px 0 10px; margin-left: 28px; text-transform: uppercase; letter-spacing: 0.5px; }
  .tl-item { display: flex; gap: 16px; align-items: flex-start; padding: 12px 0; }
  .tl-indicator { display: flex; flex-direction: column; align-items: center; gap: 0; flex-shrink: 0; padding-top: 6px; width: 12px; height: 100%; }
  .tl-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--border-main); z-index: 2; flex-shrink: 0; }
  .tl-line { width: 2px; background: var(--border-main); flex: 1; min-height: 60px; margin-top: -2px; margin-bottom: -20px; }
  .tl-card { flex: 1; padding: 20px; border-radius: 12px; border: 1px solid var(--border-main); background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: 0.2s; }
  .tl-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .tl-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .tl-title { font-size: 14px; font-weight: 600; color: var(--text-main); }
  .tl-date { font-size: 13px; color: var(--text-main); font-weight: 500; }
  .tl-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
  .tl-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tl-amount { font-size: 15px; font-weight: 600; }
  .status-pill { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; border: 1px solid; }
  
  .action-row { display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border-main); align-items: center; }
  .btn-outline { font-size: 12px; padding: 8px 14px; border-radius: 6px; cursor: pointer; border: none; background: transparent; font-weight: 500; color: #185FA5; text-decoration: none; }
  .btn-outline:hover { text-decoration: underline; }
  .btn-primary { font-size: 12px; padding: 8px 16px; border-radius: 6px; cursor: pointer; border: none; background: #0f1c2e; color: #fff; font-weight: 500; transition: 0.2s; }
  .btn-primary:hover { background: #1e293b; }
`;

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommissionsData() {
      setLoading(true);
      // جلب الصفقات وترتيبها
      const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
      
      // معالجة البيانات لحساب تواريخ الاستحقاق (افتراضياً بعد 60 يوم من الإنشاء)
      const processedDeals = (data || []).map(deal => {
        const createdDate = new Date(deal.created_at);
        const dueDate = new Date(createdDate);
        dueDate.setDate(dueDate.getDate() + 60); // استحقاق بعد 60 يوم
        
        return {
          ...deal,
          expected_comm: Number(deal.unit_value || 0) * 0.05, // عمولة 5%
          dueDate: dueDate,
          monthYear: dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          formattedDate: dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          daysAway: Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
        };
      });

      // ترتيب حسب تاريخ الاستحقاق
      processedDeals.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      setDeals(processedDeals);
      setLoading(false);
    }
    fetchCommissionsData();
  }, []);

  // الحسابات العلوية المجمعة
  const totalComm = deals.reduce((acc, curr) => acc + curr.expected_comm, 0);
  const collectedComm = deals.filter(d => d.status === 'Approved').reduce((acc, curr) => acc + curr.expected_comm, 0);
  const pendingComm = totalComm - collectedComm;

  // تجميع الصفقات حسب الشهر لعرضها في الـ Timeline
  const groupedDeals = deals.reduce((acc: any, deal) => {
    if (!acc[deal.monthYear]) acc[deal.monthYear] = [];
    acc[deal.monthYear].push(deal);
    return acc;
  }, {});

  const handleMarkAsPaid = (id: string) => {
    alert("This will mark the commission as collected in the database.");
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="topbar">
        <div style={{ color: '#fff', fontWeight: 'bold' }}>FAST INVESTMENT</div>
        <div className="avatar">EA</div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <div className="sidebar">
          <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
          <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
          <Link href="/dashboard/commissions" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
          <Link href="/dashboard/reports" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/settings" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
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
              <div className="sum-label"><div className="sum-dot" style={{ background: '#185FA5' }}></div>Upcoming Expected</div>
              <div className="sum-val">EGP {pendingComm.toLocaleString()}</div>
              <div className="sum-sub">{deals.filter(d => d.status !== 'Approved').length} deals</div>
            </div>
            <div className="sum-col" style={{ borderRight: 'none' }}>
              <div className="sum-label"><div className="sum-dot" style={{ background: '#3B6D11' }}></div>Collected</div>
              <div className="sum-val" style={{ color: '#3B6D11' }}>EGP {collectedComm.toLocaleString()}</div>
              <div className="sum-sub">{deals.filter(d => d.status === 'Approved').length} deals</div>
            </div>
          </div>

          {activeTab === 'timeline' && (
            <div>
              <div className="toolbar">
                <select className="filter-select"><option>All Statuses</option><option>Upcoming</option><option>Collected</option></select>
                <select className="filter-select"><option>All Developers</option></select>
                <input className="search-box" placeholder="Search buyer or deal ID..." />
              </div>
              
              <div className="timeline">
                {loading ? <div style={{ color: '#64748b' }}>Loading timeline...</div> : 
                 Object.keys(groupedDeals).length === 0 ? <div style={{ color: '#64748b' }}>No commissions expected yet.</div> :
                 Object.keys(groupedDeals).map((month, groupIdx) => (
                  <React.Fragment key={month}>
                    <div className="tl-group-label">{month}</div>
                    {groupedDeals[month].map((item: any, index: number) => {
                      const isCollected = item.status === 'Approved';
                      const colorTheme = isCollected ? '#3B6D11' : '#185FA5';
                      const bgTheme = isCollected ? '#EAF3DE' : '#E6F1FB';
                      
                      return (
                        <div className="tl-item" key={item.id}>
                          <div className="tl-indicator">
                            <div className="tl-dot" style={{ background: colorTheme, borderColor: colorTheme }}></div>
                            {(index < groupedDeals[month].length - 1 || groupIdx < Object.keys(groupedDeals).length - 1) && <div className="tl-line"></div>}
                          </div>
                          <div className="tl-card">
                            <div className="tl-header">
                              <div className="tl-title">{isCollected ? 'Collected' : 'Pending'} — {item.buyer_name}</div>
                              <div className="tl-date">{item.formattedDate}</div>
                            </div>
                            <div className="tl-meta">{item.compound} · {item.property_type || 'Unit'}</div>
                            <div className="tl-footer">
                              <span className="tl-amount" style={{ color: colorTheme }}>EGP {item.expected_comm.toLocaleString()}</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Est. 5%</span>
                              <span className="status-pill" style={{ background: bgTheme, color: colorTheme, borderColor: colorTheme }}>
                                {isCollected ? 'Collected' : 'Upcoming'}
                              </span>
                              {!isCollected && <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>{item.daysAway} days away</span>}
                            </div>
                            <div className="action-row">
                              <Link href={`/dashboard/deals/${item.id}`} className="btn-outline">View Deal ↗</Link>
                              {!isCollected && <button className="btn-primary" onClick={() => handleMarkAsPaid(item.id)}>Mark as Paid</button>}
                              {!isCollected && <button className="btn-outline" style={{ color: '#64748b' }}>Send Reminder</button>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}