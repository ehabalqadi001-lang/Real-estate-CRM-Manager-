"use client";
import { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // يمكن هنا ربط الخدمة بنظام تتبع الأخطاء لاحقاً
    console.error("Dashboard caught an error:", error);
  }, [error]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui' }}>
      <div style={{ padding: '40px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '450px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#FCEBEB', color: '#A32D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px' }}>
          ⚠️
        </div>
        <h2 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: '600' }}>Something went wrong!</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
          We encountered an unexpected network or database error. Don't worry, your data is safe.
        </p>
        <button 
          onClick={() => reset()} 
          style={{ padding: '12px 24px', backgroundColor: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: '0.2s' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}