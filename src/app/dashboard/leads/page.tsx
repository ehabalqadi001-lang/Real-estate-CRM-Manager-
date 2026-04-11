"use client";
import React from 'react';
import Link from 'next/link';

export default function LeadsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      {/* القائمة الجانبية */}
      <div style={{ width: '64px', background: '#0f1c2e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px' }}>
        <Link href="/dashboard" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'rgba(255,255,255,0.4)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </Link>
        <Link href="/dashboard/leads" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: '#185FA5', color: '#fff' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </Link>
      </div>

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Sales Pipeline</h1>
          <Link href="/dashboard" style={{ color: '#185FA5', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Home
          </Link>
        </div>
        
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            تم تفعيل الربط بنجاح! هذه هي شاشة إدارة الصفقات.
          </p>
        </div>
      </div>
    </div>
  );
}