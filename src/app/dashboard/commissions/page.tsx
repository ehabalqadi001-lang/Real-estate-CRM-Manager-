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
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); position: fixed; left: 0; top: 48px; bottom: 0; }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main { margin-left: 64px; flex: 1; display: flex; flex-direction: column; background: var(--bg-primary); min-height: calc(100vh - 48px); }
  .header-section { padding: 20px 30px 0; }
  .page-title { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 20px; }
  
  .tabs { display: flex; border-bottom: 1px solid var(--border-main); }
  .tab { padding: 10px 20px; font-size: 14px; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; }
  .tab.active { color: #185FA5; border-bottom-color: #185FA5; }
  
  .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); padding: 20px 30px; border-bottom: 1px solid var(--border-main); }
  .sum-col { }
  .sum-label { font-size: 13px; color: var(--text-main); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-weight: 500; }
  .sum-dot { width: 8px; height: 8px; border-radius: 50%; }
  .sum-val { font-size: 22px; font-weight: 500; color: var(--text-main); }
  .sum-sub { font-size: 12px; color: var(--text-main); margin-top: 4px; }
  
  .toolbar { display: flex; gap: 15px; padding: 20px 30px; align-items: center; }
  .filter-select { font-size: 14px; padding: 8px 12px; border: none; background: transparent; color: var(--text-main); outline: none; cursor: pointer; font-weight: 500; }
  .search-box { flex: 1; min-width: 200px; padding: 8px 12px; border: none; background: transparent; font-size: 14px; outline: none; color: #64748b; }
  
  /* Timeline Styles matching your exact screenshot */
  .timeline { padding: 0 30px 30px; display: flex; flex-direction: column; max-width: 1000px; }
  .tl-group-label { font-size: 13px; color: #0f172a; font-weight: 500; padding: 20px 0 10px; margin-left: 28px; }
  .tl-item { display: flex; gap: 16px; align-items: flex-start; padding: 10px 0; }
  .tl-indicator { display: flex; flex-direction: column; align-items: center; width: 12px; flex-shrink: 0; padding-top: 6px; }
  .tl-dot { width: 10px; height: 10px; border-radius: 50%; z-index: 2; flex-shrink: 0; }
  .tl-content { flex: 1; padding-bottom: 20px; }
  
  .deal-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .deal-title { font-size: 15px; color: #0f172a; }
  .deal-date { font-size: 13px; color: #0f172a; }
  .deal-sub { font-size: 13px; color: #0f172a; margin-bottom: 10px; }
  
  .deal-meta { display: flex; align-items: center; gap: 10px; font-size: 13px; margin-bottom: 15px; }
  .meta-val { color: #3B6D11; font-weight: 500; }
  .status-pill { font-size: 11px; padding: 2px 10px; border-radius: 12px; font-weight: 500; border: 1px solid; }
  .status-upcoming { background: #E6F1FB; color: #185FA5; border-color: #93C5FD; }
  .status-collected { background: #EAF3DE; color: #3B6D11; border-color: #86EFAC; }
  
  .action-row { display: flex; gap: 15px; align-items: center; }
  .btn-link { font-size: 13px; color: #0f172a; text-decoration: none; cursor: pointer; display: flex; align-items: center; gap: 4px; }
  .btn-link:hover { text-decoration: underline; }
  .btn-dark { background: #0f1c2e; color: #fff; border: none; padding: 6px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; }
  .btn-dark:hover { background: #1e293b; }
  .btn-step { background: #fff; color: #0f1c2e; border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; }
  .btn-step:hover { background: #f8fafc; border-color: #94a3b8; }
`;

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommissions = async () => {
    setLoading(true);
    const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    
    // معالجة البيانات وإضافة تواريخ الاستحقاق
    const processed = (data || []).map(deal => {
      const createdDate = new Date(deal.created_at);
      const dueDate = new Date(createdDate);
      dueDate.setDate(dueDate.getDate() + 60);
      
      return {
        ...deal,
        expected_comm: Number(deal.unit_value || 0) * 0.05,
        dueDate: dueDate,
        monthYear: dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        formattedDate: dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        daysAway: Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
        // ضبط الحالة المالية الافتراضية إذا كانت فارغة
        finance_status: deal.finance_status || 'Pending Claim'
      };
    });

    processed.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    setDeals(processed);
    setLoading(false);
  };

  useEffect(() => { fetchCommissions(); }, []);

  // دالة تغيير مسار العمولة (Workflow Engine)
  const advanceFinanceStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('deals').update({ finance_status: newStatus }).eq('id', id);
    if (!error) fetchCommissions(); // تحديث فوري للواجهة
  };

  // الحسابات المالية (فصل التحصيل عن الموافقة)
  const isCollected = (status: string) => status === 'Commission Received' || status === 'Transferred to Agent';
  
  const upcomingComm = deals.filter(d => !isCollected(d.finance_status)).reduce((acc, curr) => acc + curr.expected_comm, 0);
  const collectedComm = deals.filter(d => isCollected(d.finance_status)).reduce((acc, curr) => acc + curr.expected_comm, 0);

  const groupedDeals = deals.reduce((acc: any, deal) => {
    if (!acc[deal.monthYear]) acc[deal.monthYear] = [];
    acc[deal.monthYear].push(deal);
    return acc;
  }, {});

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      <div className="topbar">
        <div style={{ color: '#fff', fontWeight: 'bold' }}>Commissions & Notifications</div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <div className="avatar">EA</div>
        </div>
      </div>

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

      <div className="main">
        <div className="header-section">
          <div className="tabs">
            <div className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Due Dates</div>
            <div className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar</div>
            <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Payout History</div>
          </div>
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
            <div className="sum-val">EGP {upcomingComm.toLocaleString()}</div>
            <div className="sum-sub">{deals.filter(d => !isCollected(d.finance_status)).length} deals</div>
          </div>
          <div className="sum-col">
            <div className="sum-label"><div className="sum-dot" style={{ background: '#3B6D11' }}></div>Collected</div>
            <div className="sum-val" style={{ color: '#3B6D11' }}>EGP {collectedComm.toLocaleString()}</div>
            <div className="sum-sub">{deals.filter(d => isCollected(d.finance_status)).length} deals</div>
          </div>
        </div>

        {activeTab === 'timeline' && (
          <>
            <div className="toolbar">
              <select className="filter-select"><option>All Statuses</option></select>
              <select className="filter-select"><option>All Developers</option></select>
              <input className="search-box" placeholder="Search buyer or deal ID..." />
            </div>
            
            <div className="timeline">
              {loading ? <div style={{ padding: '20px' }}>Loading timeline...</div> : 
               Object.keys(groupedDeals).length === 0 ? <div style={{ padding: '20px' }}>No deals found.</div> :
               Object.keys(groupedDeals).map((month) => (
                <React.Fragment key={month}>
                  <div className="tl-group-label">{month}</div>
                  {groupedDeals[month].map((item: any) => {
                    const collected = isCollected(item.finance_status);
                    const dotColor = collected ? '#3B6D11' : '#3b82f6';
                    
                    // تحويل الحالة المالية إلى نصوص واضحة للمستخدم
                    let displayStatus = item.finance_status;
                    if (displayStatus === 'Pending Claim') displayStatus = 'Pending Claim';
                    else if (displayStatus === 'Claim Submitted') displayStatus = 'Claim Submitted';
                    else if (displayStatus === 'Commission Received') displayStatus = 'Commission Received';
                    else if (displayStatus === 'Transferred to Agent') displayStatus = 'Paid to Agent';

                    return (
                      <div className="tl-item" key={item.id}>
                        <div className="tl-indicator">
                          <div className="tl-dot" style={{ background: dotColor }}></div>
                        </div>
                        <div className="tl-content">
                          <div className="deal-header">
                            <div className="deal-title">
                              {item.status === 'Approved' ? 'Verified' : 'Unverified'} — {item.buyer_name}
                            </div>
                            <div className="deal-date">{item.formattedDate}</div>
                          </div>
                          <div className="deal-sub">{item.compound} · {item.developer || 'Developer'}</div>
                          
                          <div className="deal-meta">
                            <span className={collected ? "meta-val" : ""} style={{ color: collected ? '#3B6D11' : '#185FA5' }}>EGP {item.expected_comm.toLocaleString()}</span>
                            <span style={{ color: '#64748b' }}>5%</span>
                            <span className={`status-pill ${collected ? 'status-collected' : 'status-upcoming'}`}>
                              {collected ? 'Collected' : 'Upcoming'}
                            </span>
                            {!collected && <span style={{ color: '#64748b' }}>{item.daysAway} days away</span>}
                            
                            {/* عرض المرحلة الحالية نصياً */}
                            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                              Stage: {displayStatus}
                            </span>
                          </div>
                          
                          <div className="action-row">
                            <Link href={`/dashboard/deals/${item.id}`} className="btn-link">View Deal ↗</Link>
                            
                            {/* أزرار مسار التحصيل (تتغير بناءً على المرحلة) */}
                            {item.finance_status === 'Pending Claim' && (
                              <button className="btn-step" onClick={() => advanceFinanceStatus(item.id, 'Claim Submitted')}>تقديم مطالبة</button>
                            )}
                            
                            {item.finance_status === 'Claim Submitted' && (
                              <button className="btn-dark" onClick={() => advanceFinanceStatus(item.id, 'Commission Received')}>استلام العمولة</button>
                            )}

                            {item.finance_status === 'Commission Received' && (
                              <button className="btn-step" onClick={() => advanceFinanceStatus(item.id, 'Transferred to Agent')}>تحويل للمستخدم</button>
                            )}

                            {!collected && <span className="btn-link" style={{ color: '#64748b' }}>Send Reminder</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}