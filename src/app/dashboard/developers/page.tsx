"use client";
import React from 'react';
import Link from 'next/link';

export default function DevelopersPage() {
  const developers = [
    { name: 'Pyramids Developments', projects: 5, city: 'New Capital', status: 'Active' },
    { name: 'Taj Misr Developments', projects: 3, city: 'New Capital', status: 'Active' },
    { name: 'Masa Developments', projects: 2, city: 'New Capital', status: 'Pending Review' }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 20px; }
        .nav-item { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: rgba(255,255,255,0.4); }
        .nav-item.active { background: #185FA5; color: #fff; }
        .main { flex: 1; padding: 24px; overflow-y: auto; }
        .dev-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #EAF3DE; color: #3B6D11; }
        .btn-add { background: #0f1c2e; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; }
      `}} />

      {/* Sidebar */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </Link>
        <Link href="/dashboard/leads" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </Link>
        <Link href="/dashboard/developers" className="nav-item active">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="8" r="3"/></svg>
        </Link>
      </div>

      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>Developers Management</h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>إدارة المطورين العقاريين ونسب العمولات</p>
          </div>
          <button className="btn-add">+ Add Developer</button>
        </div>

        {developers.map((dev, index) => (
          <div key={index} className="dev-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#185FA5' }}>
                {dev.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{dev.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{dev.projects} Active Projects • {dev.city}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span className="status-pill">{dev.status}</span>
              <button style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>Edit Rules</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}