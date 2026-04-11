"use client";
import React, { useState } from 'react';

// --- البيانات الوهمية (لتشغيل التصميم حتى نربطه بقاعدة البيانات) ---
const deals = [
  { id: '#16708', buyer: 'Bakr Ibrahim Ahmed', compound: 'Pyramids City', amount: 9739400, comm: 446200, stage: 'Contracted', status: 'Approved', ago: '10 months ago', avatarBg: '#E6F1FB', avatarTxt: '#185FA5', initials: 'BA' },
  { id: '#3700', buyer: 'أ. محمود عبد الرهاب', compound: 'De Joya 3 Strip Mall', amount: 3210000, comm: 144450, stage: 'Contracted', status: 'Approved', ago: '2 years ago', avatarBg: '#E1F5EE', avatarTxt: '#0F6E56', initials: 'مع' },
  { id: '#3383', buyer: 'Bassma Mohamed', compound: 'De Joya 1 Strip Mall', amount: 2020000, comm: 90900, stage: 'Contracted', status: 'Rejected', ago: '2 years ago', avatarBg: '#FCEBEB', avatarTxt: '#A32D2D', initials: 'BM' },
  { id: '#2939', buyer: 'Bassma Mohamed', compound: 'Ninety Avenue', amount: 15253000, comm: 343193, stage: 'Contracted', status: 'Approved', ago: '2 years ago', avatarBg: '#EEEDFE', avatarTxt: '#3C3489', initials: 'BM' },
];

const notifications = [
  { text: 'OIA Tower commission due in 73 days — EGP 312,500', time: 'Just now', color: '#BA7517' },
  { text: 'Deal #16708 commission collected successfully', time: '10 months ago', color: '#3B6D11' },
  { text: 'Deal #3383 rejected by Taj Misr Developments', time: '2 years ago', color: '#A32D2D' },
];

const activities = [
  { icon: 'check', bg: '#EAF3DE', stroke: '#3B6D11', text: 'Commission #16708 collected — EGP 446,200', time: '10 months ago' },
  { icon: 'file', bg: '#E6F1FB', stroke: '#185FA5', text: 'New deal contracted — Pyramids City, unit CP-B04-5008', time: '10 months ago' },
  { icon: 'dollar', bg: '#FAEEDA', stroke: '#854F0B', text: 'Commission due alert — OIA Tower EGP 312,500', time: 'Today' },
  { icon: 'x', bg: '#FCEBEB', stroke: '#A32D2D', text: 'Sale claim rejected — De Joya 1 Strip Mall', time: '2 years ago' },
];

// دالة مساعدة لتوليد أيقونات الأنشطة
const renderIcon = (type: string, stroke: string) => {
  let path = '';
  if (type === 'check') path = '<polyline points="20 6 9 17 4 12"/>';
  if (type === 'file') path = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>';
  if (type === 'dollar') path = '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>';
  if (type === 'x') path = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
  
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
  );
};

export default function MainDashboard() {
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('year');

  const kpiData = {
    month: { sales: 'EGP 9.7M', comm: 'EGP 446,200' },
    year: { sales: 'EGP 28.2M', comm: 'EGP 933,843' },
    all: { sales: 'EGP 28.2M', comm: 'EGP 933,843' },
  };

  // --- أكواد الـ CSS الأساسية لتعمل الواجهة بنفس الشكل الذي صممته ---
  const styles = `
    :root {
      --color-background-primary: #ffffff;
      --color-background-secondary: #f8fafc;
      --color-border-secondary: #e2e8f0;
      --color-border-tertiary: #f1f5f9;
      --color-text-primary: #0f172a;
      --color-text-secondary: #64748b;
      --border-radius-md: 8px;
      --border-radius-lg: 12px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .crm-container { font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; padding: 20px; min-height: 100vh; }
    .crm-wrapper { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; background: var(--color-background-primary); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 1400px; margin: 0 auto; }
    .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .topbar-logo { width: 28px; height: 28px; border-radius: 6px; background: #185FA5; display: flex; align-items: center; justify-content: center; }
    .topbar-logo svg { width: 15px; height: 15px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; }
    .topbar-title { color: #fff; font-size: 15px; font-weight: 500; line-height: 1.2; }
    .topbar-sub { color: rgba(255,255,255,0.45); font-size: 11px; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    .notif-wrap { position: relative; cursor: pointer; }
    .notif-icon { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
    .notif-icon svg { width: 14px; height: 14px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; }
    .notif-badge { position: absolute; top: -2px; right: -2px; background: #E24B4A; color: #fff; font-size: 9px; font-weight: 500; width: 15px; height: 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #0f1c2e; }
    .avatar { width: 30px; height: 30px; border-radius: 50%; background: #185FA5; display: flex; align-items: center; justify-content: center; color: #B5D4F4; font-size: 11px; font-weight: 500; }
    .avatar-name { color: rgba(255,255,255,0.7); font-size: 12px; }
    .sidebar { width: 52px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 4px; flex-shrink: 0; min-height: 800px; }
    .nav-item { width: 36px; height: 36px; border-radius: var(--border-radius-md); display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.45; }
    .nav-item:hover { opacity: 0.75; background: rgba(255,255,255,0.08); }
    .nav-item.active { opacity: 1; background: rgba(24,95,165,0.4); }
    .nav-item svg { width: 16px; height: 16px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .nav-divider { width: 28px; height: 0.5px; background: rgba(255,255,255,0.12); margin: 4px 0; }
    .main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
    .page-header { padding: 14px 20px 0; display: flex; align-items: flex-end; justify-content: space-between; }
    .page-title { font-size: 16px; font-weight: 500; }
    .page-date { font-size: 12px; color: var(--color-text-secondary); }
    .period-tabs { display: flex; gap: 0; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); overflow: hidden; }
    .period-tab { padding: 5px 12px; font-size: 11px; cursor: pointer; border: none; background: transparent; color: var(--color-text-secondary); }
    .period-tab.active { background: #0f1c2e; color: #fff; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 12px 20px; }
    .kpi-card { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px 14px; }
    .kpi-label { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
    .kpi-val { font-size: 18px; font-weight: 500; }
    .kpi-sub { font-size: 11px; color: var(--color-text-secondary); margin-top: 3px; }
    .kpi-change { font-size: 10px; padding: 1px 6px; border-radius: 20px; display: inline-flex; align-items: center; gap: 2px; }
    .change-up { background: #EAF3DE; color: #3B6D11; }
    .change-down { background: #FCEBEB; color: #A32D2D; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 20px 10px; }
    .three-col { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; padding: 0 20px 10px; }
    .card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; }
    .card-header { padding: 12px 14px 8px; display: flex; align-items: center; justify-content: space-between; border-bottom: 0.5px solid var(--color-border-tertiary); }
    .card-title { font-size: 13px; font-weight: 500; }
    .card-action { font-size: 11px; color: #185FA5; cursor: pointer; }
    .pipeline-bars { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
    .bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-label { font-size: 11px; color: var(--color-text-secondary); width: 70px; flex-shrink: 0; text-align: right; }
    .bar-track { flex: 1; height: 7px; background: var(--color-background-secondary); border-radius: 20px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 20px; }
    .bar-val { font-size: 11px; font-weight: 500; width: 60px; text-align: right; flex-shrink: 0; }
    .deal-list { padding: 8px 0; }
    .deal-row { display: flex; align-items: center; gap: 10px; padding: 8px 14px; cursor: pointer; }
    .deal-row:hover { background: var(--color-background-secondary); }
    .deal-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; flex-shrink: 0; }
    .deal-info { flex: 1; min-width: 0; }
    .deal-name { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .deal-meta { font-size: 11px; color: var(--color-text-secondary); }
    .deal-right { text-align: right; flex-shrink: 0; }
    .deal-amount { font-size: 12px; font-weight: 500; }
    .stage-pill { font-size: 10px; padding: 2px 7px; border-radius: 20px; }
    .pill-green { background: #EAF3DE; color: #3B6D11; }
    .pill-red { background: #FCEBEB; color: #A32D2D; }
    .notif-row { display: flex; gap: 10px; padding: 8px 14px; cursor: pointer; align-items: flex-start; }
    .notif-row:hover { background: var(--color-background-secondary); }
    .notif-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .notif-text { font-size: 12px; color: var(--color-text-primary); line-height: 1.5; }
    .notif-time { font-size: 10px; color: var(--color-text-secondary); }
    .comm-summary { padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
    .comm-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
    .comm-row:last-child { border-bottom: none; }
    .comm-label { font-size: 12px; color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; }
    .comm-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .comm-val { font-size: 12px; font-weight: 500; }
    .act-row { display: flex; gap: 10px; padding: 7px 14px; align-items: flex-start; }
    .act-row:hover { background: var(--color-background-secondary); cursor: pointer; }
    .act-icon { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .act-text { flex: 1; font-size: 12px; line-height: 1.5; }
    .act-time { font-size: 10px; color: var(--color-text-secondary); margin-top: 1px; }
    .placeholder-chart { height: 130px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; color: #94a3b8; font-size: 12px; }
  `;

  return (
    <div className="crm-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="crm-wrapper">
        
        {/* شريط القوائم العلوي */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-logo">
              <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <div className="topbar-title">Real Estate CRM</div>
              <div className="topbar-sub">EHAB & ESLAM TEAM</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="notif-wrap">
              <div className="notif-icon">
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div className="notif-badge">3</div>
            </div>
            <div className="avatar-name">Ehab Alqadi</div>
            <div className="avatar">EA</div>
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          
          {/* الشريط الجانبي */}
          <div className="sidebar">
            <div className="nav-item active" title="Dashboard">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div className="nav-item" title="Sales Pipeline">
              <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div className="nav-item" title="Commissions">
              <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div className="nav-divider"></div>
            <div className="nav-item" title="Developers">
              <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div className="nav-item" title="Reports">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
          </div>

          {/* محتوى الصفحة الرئيسي */}
          <div className="main">
            <div className="page-header">
              <div>
                <div className="page-title">Dashboard Overview</div>
                <div className="page-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="period-tabs">
                <button className={`period-tab ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Month</button>
                <button className={`period-tab ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>Year</button>
                <button className={`period-tab ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>All Time</button>
              </div>
            </div>

            {/* بطاقات الإحصائيات KPI */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Total sales value
                </div>
                <div className="kpi-val">{kpiData[period].sales}</div>
                <div className="kpi-sub"><span className="kpi-change change-up">↑ 4 deals</span></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Commissions earned
                </div>
                <div className="kpi-val" style={{ color: '#3B6D11' }}>{kpiData[period].comm}</div>
                <div className="kpi-sub"><span className="kpi-change change-up">↑ 100% collected</span></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Collected
                </div>
                <div className="kpi-val" style={{ color: '#3B6D11' }}>EGP 933,843</div>
                <div className="kpi-sub"><span className="kpi-change change-up">↑ 3 of 4 deals</span></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Next payout
                </div>
                <div className="kpi-val" style={{ color: '#854F0B' }}>EGP 312,500</div>
                <div className="kpi-sub">Due 15 Jun 2026 · <span style={{ color: '#185FA5' }}>73 days</span></div>
              </div>
            </div>

            {/* الأقسام الثلاثة */}
            <div className="three-col">
              {/* Sales Pipeline */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Sales Pipeline</div>
                  <div className="card-action">View all ↗</div>
                </div>
                <div className="pipeline-bars">
                  <div className="bar-row">
                    <div className="bar-label">EOIs</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: '0%', background: '#B5D4F4' }}></div></div>
                    <div className="bar-val" style={{ color: 'var(--color-text-secondary)' }}>0 · EGP 0</div>
                  </div>
                  <div className="bar-row">
                    <div className="bar-label">Reservations</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: '0%', background: '#9FE1CB' }}></div></div>
                    <div className="bar-val" style={{ color: 'var(--color-text-secondary)' }}>0 · EGP 0</div>
                  </div>
                  <div className="bar-row">
                    <div className="bar-label">Contracted</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: '100%', background: '#185FA5' }}></div></div>
                    <div className="bar-val" style={{ color: '#185FA5' }}>4 · EGP 28M</div>
                  </div>
                </div>
                <div className="deal-list">
                  {deals.map((d, i) => (
                    <div className="deal-row" key={i}>
                      <div className="deal-avatar" style={{ background: d.avatarBg, color: d.avatarTxt }}>{d.initials}</div>
                      <div className="deal-info">
                        <div className="deal-name">{d.buyer}</div>
                        <div className="deal-meta">{d.compound} · {d.ago}</div>
                      </div>
                      <div className="deal-right">
                        <div className="deal-amount">EGP {d.comm.toLocaleString()}</div>
                        <div><span className={`stage-pill ${d.status === 'Approved' ? 'pill-green' : 'pill-red'}`}>{d.status}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Commission Breakdown */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Commission breakdown</div>
                  </div>
                  <div className="comm-summary">
                    <div className="comm-row">
                      <div className="comm-label"><div className="comm-dot" style={{ background: '#3B6D11' }}></div>Collected</div>
                      <div className="comm-val" style={{ color: '#3B6D11' }}>EGP 933,843</div>
                    </div>
                    <div className="comm-row">
                      <div className="comm-label"><div className="comm-dot" style={{ background: '#185FA5' }}></div>Upcoming</div>
                      <div className="comm-val" style={{ color: '#185FA5' }}>EGP 312,500</div>
                    </div>
                    <div className="comm-row">
                      <div className="comm-label"><div className="comm-dot" style={{ background: '#A32D2D' }}></div>Rejected</div>
                      <div className="comm-val" style={{ color: '#A32D2D' }}>EGP 90,900</div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div className="placeholder-chart">Pie Chart Area (Next Step)</div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Notifications</div>
                    <div className="card-action">View all ↗</div>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {notifications.map((n, i) => (
                      <div className="notif-row" key={i}>
                        <div className="notif-dot" style={{ background: n.color }}></div>
                        <div>
                          <div className="notif-text">{n.text}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* القسم السفلي */}
            <div className="two-col" style={{ paddingTop: '0' }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Monthly performance</div>
                  <div className="card-action">2025 → 2026</div>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <div className="placeholder-chart" style={{ height: '150px' }}>Bar Chart Area (Next Step)</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Activity feed</div>
                </div>
                <div className="activity-feed">
                  {activities.map((a, i) => (
                    <div className="act-row" key={i}>
                      <div className="act-icon" style={{ background: a.bg }}>
                        {renderIcon(a.icon, a.stroke)}
                      </div>
                      <div>
                        <div className="act-text">{a.text}</div>
                        <div className="act-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}