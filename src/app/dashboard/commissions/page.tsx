"use client";
import React from 'react';
import Link from 'next/link';

export default function CommissionsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar { width: 64px; background: #0f1c2e; display: flex; flexDirection: column; alignItems: center; padding: 20px 0; gap: 20px; }
        .nav-item { width: 40px; height: 40px; display: flex; alignItems: center; justifyContent: center; border-radius: 8px; color: rgba(255,255,255,0.4); }
        .nav-item.active { background: #185FA5; color: #fff; }
        .main { flex: 1; padding: 24px; }
        .sum-grid { display: grid; gridTemplateColumns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .sum-card { background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
      `}} />

      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
      </div>

      <div className="main">
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Commissions & Notifications</h1>
        
        <div className="sum-grid">
          <div className="sum-card" style={{ borderLeft: '4px solid #A32D2D' }}>Overdue<div style={{ fontSize: '18px', fontWeight: 'bold', color: '#A32D2D' }}>EGP 0</div></div>
          <div className="sum-card" style={{ borderLeft: '4px solid #BA7517' }}>Due this month<div style={{ fontSize: '18px', fontWeight: 'bold', color: '#BA7517' }}>EGP 0</div></div>
          <div className="sum-card" style={{ borderLeft: '4px solid #185FA5' }}>Upcoming<div style={{ fontSize: '18px', fontWeight: 'bold' }}>EGP 933k</div></div>
          <div className="sum-card" style={{ borderLeft: '4px solid #3B6D11' }}>Collected<div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3B6D11' }}>EGP 933k</div></div>
        </div>

        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
           شاشة التقويم وسجل العمولات جاهزة للعرض[cite: 616].
        </div>
      </div>
    </div>
  );
}