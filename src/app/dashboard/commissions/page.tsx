"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f0f2f5; min-height: 100vh; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; }
  
  .header { padding: 20px 30px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px 0 0 0; }
  .header-title { font-size: 20px; font-weight: 600; color: #0f172a; }

  .tabs { display: flex; border-bottom: 1px solid #e2e8f0; padding: 0 20px; }
  .tab { padding: 14px 16px; font-size: 13px; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; transition: 0.2s; }
  .tab:hover { color: #0f172a; }
  .tab.active { color: #185FA5; border-bottom-color: #185FA5; }
  
  .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e2e8f0; }
  .sum-col { padding: 20px 30px; border-right: 1px solid #e2e8f0; }
  .sum-label { font-size: 12px; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; font-weight: 500; }
  .sum-dot { width: 8px; height: 8px; border-radius: 50%; }
  .sum-val { font-size: 24px; font-weight: 600; color: #0f172a; }
  
  /* Timeline */
  .timeline { padding: 30px; max-width: 900px; }
  .tl-group-label { font-size: 12px; color: #64748b; font-weight: 600; padding: 15px 0 10px; margin-left: 28px; text-transform: uppercase; }
  .tl-item { display: flex; gap: 16px; padding: 12px 0; }
  .tl-indicator { display: flex; flex-direction: column; align-items: center; width: 12px; flex-shrink: 0; padding-top: 6px; }
  .tl-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #cbd5e1; z-index: 2; flex-shrink: 0; }
  .tl-line { width: 2px; background: #e2e8f0; flex: 1; min-height: 60px; margin-top: -2px; margin-bottom: -20px; }
  .tl-card { flex: 1; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .tl-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .tl-title { font-size: 14px; font-weight: 600; color: #0f172a; }
  .tl-date { font-size: 13px; color: #0f172a; font-weight: 500; }
  
  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 20px; color: #64748b; border-bottom: 1px solid #e2e8f0; background: #f8fafc; font-weight: 500; }
  td { padding: 14px 20px; border-bottom: 1px solid #e2e8f0; color: #0f172a; }
  .status-pill { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; border: 1px solid; }

  /* Dynamic Calendar */
  .cal-container { padding: 30px; }
  .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
  .cal-day-name { text-align: center; font-size: 12px; color: #64748b; font-weight: 600; padding-bottom: 10px; }
  .cal-day { aspect-ratio: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 14px; display: flex; flex-direction: column; gap: 4px; background: #fff; }
  .cal-day.empty { background: transparent; border: none; }
  .cal-day.today { border-color: #185FA5; background: #f8fafc; }
  .cal-event { font-size: 10px; padding: 4px 6px; background: #E6F1FB; color: #185FA5; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; border-left: 2px solid #185FA5; }
  .cal-event.collected { background: #EAF3DE; color: #3B6D11; border-left-color: #3B6D11; }
`;

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // إعدادات التقويم للشهر الحالي
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);
  const monthDays = Array.from({length: daysInMonth}, (_, i) => i + 1);

  useEffect(() => {
    async function fetchCommissionsData() {
      setLoading(true);
      const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
      
      const processedDeals = (data || []).map(deal => {
        const createdDate = new Date(deal.created_at);
        const dueDate = new Date(createdDate);
        dueDate.setDate(dueDate.getDate() + 60); // استحقاق بعد 60 يوم
        
        return {
          ...deal,
          expected_comm: Number(deal.unit_value || 0) * 0.05, 
          dueDate: dueDate,
          monthYear: dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          formattedDate: dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          daysAway: Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
        };
      });

      processedDeals.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      setDeals(processedDeals);
      setLoading(false);
    }
    fetchCommissionsData();
  }, []);

  const totalComm = deals.reduce((acc, curr) => acc + curr.expected_comm, 0);
  const collectedComm = deals.filter(d => d.status === 'Approved').reduce((acc, curr) => acc + curr.expected_comm, 0);
  const pendingComm = totalComm - collectedComm;

  const groupedDeals = deals.reduce((acc: any, deal) => {
    if (!acc[deal.monthYear]) acc[deal.monthYear] = [];
    acc[deal.monthYear].push(deal);
    return acc;
  }, {});

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
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

      <div className="main-content">
        <div className="header"><div className="header-title">Commissions & Notifications</div></div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Due Dates Timeline</div>
          <div className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar View</div>
          <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Payout History</div>
        </div>

        <div className="summary-strip">
          <div className="sum-col">
            <div className="sum-label"><div className="sum-dot" style={{ background: '#E24B4A' }}></div>Overdue</div>
            <div className="sum-val" style={{ color: '#A32D2D' }}>EGP 0</div>
          </div>
          <div className="sum-col">
            <div className="sum-label"><div className="sum-dot" style={{ background: '#BA7517' }}></div>Due this month</div>
            <div className="sum-val" style={{ color: '#633806' }}>EGP 0</div>
          </div>
          <div className="sum-col">
            <div className="sum-label"><div className="sum-dot" style={{ background: '#185FA5' }}></div>Upcoming</div>
            <div className="sum-val">EGP {pendingComm.toLocaleString()}</div>
          </div>
          <div className="sum-col" style={{ borderRight: 'none' }}>
            <div className="sum-label"><div className="sum-dot" style={{ background: '#3B6D11' }}></div>Collected</div>
            <div className="sum-val" style={{ color: '#3B6D11' }}>EGP {collectedComm.toLocaleString()}</div>
          </div>
        </div>

        {activeTab === 'timeline' && (
          <div className="timeline">
            {loading ? <div style={{ color: '#64748b' }}>Loading...</div> : 
             Object.keys(groupedDeals).length === 0 ? <div style={{ color: '#64748b' }}>No deals found.</div> :
             Object.keys(groupedDeals).map((month, groupIdx) => (
              <React.Fragment key={month}>
                <div className="tl-group-label">{month}</div>
                {groupedDeals[month].map((item: any, index: number) => {
                  const isCollected = item.status === 'Approved';
                  const colorTheme = isCollected ? '#3B6D11' : '#185FA5';
                  return (
                    <div className="tl-item" key={item.id}>
                      <div className="tl-indicator">
                        <div className="tl-dot" style={{ background: colorTheme, borderColor: colorTheme }}></div>
                        {(index < groupedDeals[month].length - 1 || groupIdx < Object.keys(groupedDeals).length - 1) && <div className="tl-line"></div>}
                      </div>
                      <div className="tl-card">
                        <div className="tl-header">
                          <div className="tl-title">{item.buyer_name}</div>
                          <div className="tl-date">{item.formattedDate}</div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{item.compound}</div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: '600', color: colorTheme }}>EGP {item.expected_comm.toLocaleString()}</span>
                          <span className="status-pill" style={{ background: isCollected ? '#EAF3DE' : '#E6F1FB', color: colorTheme, borderColor: colorTheme }}>
                            {isCollected ? 'Collected' : 'Upcoming'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="cal-container">
            <div className="cal-header">
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>{today.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="cal-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="cal-day-name">{day}</div>)}
              
              {emptyDays.map((_, i) => <div key={`empty-${i}`} className="cal-day empty"></div>)}
              
              {monthDays.map(day => {
                const dayDeals = deals.filter(d => d.dueDate.getDate() === day && d.dueDate.getMonth() === currentMonth && d.dueDate.getFullYear() === currentYear);
                const isToday = day === today.getDate();
                
                return (
                  <div key={day} className={`cal-day ${isToday ? 'today' : ''}`}>
                    <span style={{ fontWeight: isToday ? 'bold' : 'normal', color: isToday ? '#185FA5' : '#0f172a' }}>{day}</span>
                    {dayDeals.map((d, idx) => (
                      <div key={idx} className={`cal-event ${d.status === 'Approved' ? 'collected' : ''}`} title={`${d.buyer_name} - EGP ${d.expected_comm}`}>
                        {d.buyer_name}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ padding: '30px' }}>
            <table>
              <thead>
                <tr>
                  <th>Deal ID</th>
                  <th>Buyer</th>
                  <th>Compound</th>
                  <th>Commission</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={6}>Loading history...</td></tr> : deals.map((d, i) => (
                  <tr key={i}>
                    <td><Link href={`/dashboard/deals/${d.id}`} style={{ color: '#185FA5', fontWeight: '600', textDecoration: 'none' }}>#{d.deal_number}</Link></td>
                    <td style={{ fontWeight: '500' }}>{d.buyer_name}</td>
                    <td style={{ color: '#64748b' }}>{d.compound}</td>
                    <td style={{ fontWeight: '600', color: d.status === 'Approved' ? '#3B6D11' : '#0f172a' }}>EGP {d.expected_comm.toLocaleString()}</td>
                    <td>{d.formattedDate}</td>
                    <td>
                      <span className="status-pill" style={{ 
                        background: d.status === 'Approved' ? '#EAF3DE' : d.status === 'Rejected' ? '#FCEBEB' : '#FFF7ED', 
                        color: d.status === 'Approved' ? '#3B6D11' : d.status === 'Rejected' ? '#A32D2D' : '#9A3412',
                        borderColor: d.status === 'Approved' ? '#C5E1A5' : d.status === 'Rejected' ? '#F8B4B4' : '#FDBA74'
                      }}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}