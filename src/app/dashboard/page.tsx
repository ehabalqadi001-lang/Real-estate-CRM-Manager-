"use client";
import React from 'react';
import Link from 'next/link'; // استيراد مكتبة الروابط

export default function DashboardPage() {
  return (
    <div className="dashboard-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: system-ui, sans-serif; }
        .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 20px; }
        .nav-item { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: rgba(255,255,255,0.4); cursor: pointer; transition: 0.2s; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .nav-item.active { background: #185FA5; color: #fff; }
        .nav-item svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; }
        .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topbar { background: #0f1c2e; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; color: #fff; }
        .brand-info { display: flex; flex-direction: column; }
        .brand-name { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
        .brand-slogan { font-size: 11px; color: rgba(255,255,255,0.5); }
        .content-body { padding: 24px; overflow-y: auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .stat-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .stat-label { font-size: 12px; color: #64748b; margin-bottom: 8px; }
        .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; }
        .card-action { color: #185FA5; text-decoration: none; font-size: 12px; font-weight: 600; cursor: pointer; }
      `}} />

      {/* القائمة الجانبية المعدلة */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item active" title="الرئيسية">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </Link>
        <Link href="/dashboard/leads" className="nav-item" title="الصفقات">
          <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </Link>
      </div>

      <div className="main-content">
        <div className="topbar">
          <div className="brand-info">
            <div className="brand-name">FAST INVESTMENT</div>
            <div className="brand-slogan">Building Wealth, Securing Futures</div>
          </div>
        </div>

        <div className="content-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px' }}>Dashboard Overview</h2>
            {/* ربط زر View all بصفحة الصفقات */}
            <Link href="/dashboard/leads" className="card-action">View all Pipeline ↗</Link>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Sales Volume</div>
              <div className="stat-value">EGP 28.2M</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Expected Commissions</div>
              <div className="stat-value">EGP 933,843</div>
            </div>
          </div>
          
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
             لوحة التحكم جاهزة. اضغط على أيقونة النبض في اليسار للانتقال لصفحة الصفقات.
          </div>
        </div>
      </div>
    </div>
  );
}