"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [period, setPeriod] = useState('year');

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

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
        .topbar-logo { width: 28px; height: 28px; border-radius: 6px; background: #185FA5; display: flex; align-items: center; justify-content: center; }
        .topbar-title { color: #fff; font-size: 15px; font-weight: 500; letter-spacing: 0.5px; }
        .topbar-sub { color: rgba(255,255,255,0.45); font-size: 11px; }
        .avatar { width: 30px; height: 30px; border-radius: 50%; background: #185FA5; display: flex; align-items: center; justify-content: center; color: #B5D4F4; font-size: 11px; font-weight: 500; }
        .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); }
        .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; transition: 0.2s; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
        .main { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .kpi-card { background: #fff; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .kpi-label { font-size: 12px; color: #64748b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .kpi-val { font-size: 22px; font-weight: 600; color: #0f172a; }
        .kpi-sub { font-size: 11px; color: #64748b; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
        .pill-up { background: #EAF3DE; color: #3B6D11; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
        .three-col { display: grid; grid-template-columns: 2fr 1fr; gap: 15px; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .card-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
        .card-title { font-size: 14px; font-weight: 600; color: #0f172a; }
        .card-link { font-size: 12px; color: #185FA5; text-decoration: none; font-weight: 500; }
        .pipeline-bar { height: 8px; border-radius: 4px; background: #f1f5f9; overflow: hidden; margin: 8px 0; }
        .pipeline-fill { height: 100%; border-radius: 4px; }
        .deal-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f8fafc; }
        .deal-row:hover { background: #f8fafc; }
        .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; }
        .status-green { background: #EAF3DE; color: #3B6D11; }
        .status-red { background: #FCEBEB; color: #A32D2D; }
        .comm-row { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
        .act-row { display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f8fafc; }
      `}} />

      {/* Topbar */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="topbar-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div>
            <div className="topbar-title">FAST INVESTMENT</div>
            <div className="topbar-sub">Building Wealth, Securing Futures.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#E24B4A', color: '#fff', fontSize: '9px', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Ehab Alqadi</div>
          <div className="avatar">EA</div>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Navigation Sidebar (4 Links) */}
        <div className="sidebar">
          <Link href="/dashboard" className="nav-item active" title="Dashboard">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </Link>
          <Link href="/dashboard/leads" className="nav-item" title="Sales Pipeline">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <Link href="/dashboard/commissions" className="nav-item" title="Commissions">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </Link>
          <div style={{ width: '30px', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <Link href="/dashboard/developers" className="nav-item" title="Developers">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="main">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Dashboard Overview</h1>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Saturday, 11 April 2026</p>
            </div>
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
              <button style={{ padding: '6px 16px', fontSize: '12px', border: 'none', background: 'transparent', cursor: 'pointer' }}>Month</button>
              <button style={{ padding: '6px 16px', fontSize: '12px', border: 'none', background: '#0f1c2e', color: '#fff', cursor: 'pointer' }}>Year</button>
              <button style={{ padding: '6px 16px', fontSize: '12px', border: 'none', background: 'transparent', cursor: 'pointer' }}>All Time</button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Total sales value</div>
              <div className="kpi-val">EGP 28.2M</div>
              <div className="kpi-sub"><span className="pill-up">↑ 4 deals</span></div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Commissions earned</div>
              <div className="kpi-val" style={{ color: '#3B6D11' }}>EGP 933,843</div>
              <div className="kpi-sub"><span className="pill-up">↑ 100% collected</span></div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Collected</div>
              <div className="kpi-val" style={{ color: '#3B6D11' }}>EGP 933,843</div>
              <div className="kpi-sub"><span className="pill-up">↑ 3 of 4 deals</span></div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Next payout</div>
              <div className="kpi-val" style={{ color: '#854F0B' }}>EGP 312,500</div>
              <div className="kpi-sub">Due 15 Jun 2026 · <span style={{ color: '#185FA5', fontWeight: 'bold' }}>73 days</span></div>
            </div>
          </div>

          <div className="three-col">
            {/* Sales Pipeline Section */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Sales Pipeline</div>
                <Link href="/dashboard/leads" className="card-link">View all ↗</Link>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#64748b' }}>
                  <div style={{ width: '70px' }}>EOIs</div>
                  <div style={{ flex: 1 }}><div className="pipeline-bar"><div className="pipeline-fill" style={{ width: '0%', background: '#B5D4F4' }}></div></div></div>
                  <div style={{ width: '60px', textAlign: 'right' }}>0 · EGP 0</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#64748b' }}>
                  <div style={{ width: '70px' }}>Reservations</div>
                  <div style={{ flex: 1 }}><div className="pipeline-bar"><div className="pipeline-fill" style={{ width: '0%', background: '#9FE1CB' }}></div></div></div>
                  <div style={{ width: '60px', textAlign: 'right' }}>0 · EGP 0</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#185FA5', fontWeight: '500' }}>
                  <div style={{ width: '70px' }}>Contracted</div>
                  <div style={{ flex: 1 }}><div className="pipeline-bar"><div className="pipeline-fill" style={{ width: '100%', background: '#185FA5' }}></div></div></div>
                  <div style={{ width: '60px', textAlign: 'right' }}>4 · EGP 28M</div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e2e8f0' }}>
                {deals.map((d, i) => (
                  <div key={i} className="deal-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: d.avatarBg, color: d.avatarTxt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{d.initials}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{d.buyer}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{d.compound} · {d.ago}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>EGP {d.comm.toLocaleString()}</div>
                      <span className={`status-pill ${d.status === 'Approved' ? 'status-green' : 'status-red'}`}>{d.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Breakdown & Notifications) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Commission breakdown</div>
                </div>
                <div>
                  <div className="comm-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B6D11' }}></div> Collected</div>
                    <div style={{ fontWeight: '600', color: '#3B6D11' }}>EGP 933,843</div>
                  </div>
                  <div className="comm-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#185FA5' }}></div> Upcoming</div>
                    <div style={{ fontWeight: '600', color: '#185FA5' }}>EGP 312,500</div>
                  </div>
                  <div className="comm-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A32D2D' }}></div> Rejected</div>
                    <div style={{ fontWeight: '600', color: '#A32D2D' }}>EGP 90,900</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ flex: 1 }}>
                <div className="card-header">
                  <div className="card-title">Notifications</div>
                  <Link href="/dashboard/commissions" className="card-link">View all ↗</Link>
                </div>
                <div>
                  {notifications.map((n, i) => (
                    <div key={i} style={{ padding: '12px 16px', display: 'flex', gap: '10px', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.color, marginTop: '5px', flexShrink: 0 }}></div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#0f172a', lineHeight: '1.4' }}>{n.text}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Row Activity Feed */}
          <div className="card">
             <div className="card-header"><div className="card-title">Activity feed</div></div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px' }}>
                {activities.map((act, i) => (
                  <div key={i} className="act-row">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                       {act.icon === 'dollar' && <svg width="14" height="14" fill="none" stroke={act.stroke} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                       {act.icon === 'check' && <svg width="14" height="14" fill="none" stroke={act.stroke} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                       {act.icon === 'file' && <svg width="14" height="14" fill="none" stroke={act.stroke} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                       {act.icon === 'x' && <svg width="14" height="14" fill="none" stroke={act.stroke} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#0f172a' }}>{act.text}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{act.time}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}