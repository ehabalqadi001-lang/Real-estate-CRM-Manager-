"use client";
import React from 'react';
import Link from 'next/link';

export default function DevelopersPage() {
  const devs = [
    { name: 'Pyramids Developments', city: '6th of October', rules: '5% Primary', projects: 5 },
    { name: 'Taj Misr Developments', city: 'New Administrative Capital', rules: '4.5% Primary', projects: 3 },
    { name: 'Edge Holding', city: 'New Administrative Capital', rules: '5% Primary', projects: 2 }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar { width: 64px; background: #0f1c2e; display: flex; flexDirection: column; alignItems: center; padding: 20px 0; gap: 20px; }
        .nav-item { width: 40px; height: 40px; display: flex; alignItems: center; justifyContent: center; border-radius: 8px; color: rgba(255,255,255,0.4); }
        .nav-item.active { background: #185FA5; color: #fff; }
        .main { flex: 1; padding: 24px; overflowY: auto; }
        .dev-grid { display: grid; gridTemplateColumns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 20px; }
        .dev-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
        .btn-add { background: #0f1c2e; color: #fff; padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; cursor: pointer; }
      `}} />

      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
      </div>

      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Developers Management</h1>
          <button className="btn-add">+ Add Developer</button>
        </div>

        <div className="dev-grid">
          {devs.map((d, i) => (
            <div key={i} className="dev-card">
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{d.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{d.city}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Rules: <strong>{d.rules}</strong></span>
                <span>Projects: <strong>{d.projects}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}