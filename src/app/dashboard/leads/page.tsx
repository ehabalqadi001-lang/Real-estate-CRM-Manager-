"use client";
import React from 'react';
import Link from 'next/link';

export default function LeadsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; alignItems: center; padding: 20px 0; gap: 20px; }
        .nav-item { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: rgba(255,255,255,0.4); }
        .nav-item.active { background: #185FA5; color: #fff; }
        .main { flex: 1; padding: 24px; overflow-y: auto; }
        .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
        .filter-select { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; background: #fff; }
        .add-btn { background: #0f1c2e; color: #fff; padding: 6px 16px; border-radius: 6px; border: none; font-size: 12px; cursor: pointer; margin-left: auto; }
        .summary-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .sum-card { background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
      `}} />

      {/* Sidebar */}
      <div className="sidebar" style={{ alignItems: 'center' }}>
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
      </div>

      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Sales Pipeline</h1>
          <Link href="/dashboard" style={{ fontSize: '12px', color: '#185FA5', textDecoration: 'none' }}>← Back Home</Link>
        </div>

        <div className="toolbar">
          <select className="filter-select"><option>All Stages</option></select>
          <select className="filter-select"><option>All Status</option></select>
          <button className="add-btn">+ Add Deal</button>
        </div>

        <div className="summary-bar">
          <div className="sum-card"><div style={{ fontSize: '10px', color: '#64748b' }}>EOIs</div><div style={{ fontWeight: 'bold' }}>EGP 0</div></div>
          <div className="sum-card"><div style={{ fontSize: '10px', color: '#64748b' }}>Reservations</div><div style={{ fontWeight: 'bold' }}>EGP 0</div></div>
          <div className="sum-card"><div style={{ fontSize: '10px', color: '#64748b' }}>Claims</div><div style={{ fontWeight: 'bold', color: '#185FA5' }}>EGP 28.2M</div></div>
        </div>

        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
           جدول الصفقات الكامل سيظهر هنا بمجرد ربط قاعدة البيانات.
        </div>
      </div>
    </div>
  );
}