"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .admin-wrapper { display: flex; background: #f1f5f9; min-height: 100vh; direction: rtl; }
  
  /* قائمة جانبية إدارية مميزة (Dark Theme) */
  .admin-sidebar { width: 260px; background: #020617; color: #fff; display: flex; flex-direction: column; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50; border-left: 1px solid #1e293b;}
  .admin-brand { padding: 25px 20px; font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; color: #e2e8f0; display: flex; align-items: center; gap: 10px;}
  .admin-brand span { color: #3b82f6; }
  
  .admin-nav { display: flex; flex-direction: column; padding: 20px 15px; gap: 8px; flex: 1; }
  .admin-link { padding: 12px 15px; border-radius: 8px; color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 12px; transition: 0.2s; }
  .admin-link:hover { background: #1e293b; color: #fff; }
  .admin-link.active { background: #3b82f6; color: #fff; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);}
  
  .admin-main { margin-right: 260px; flex: 1; padding: 30px; max-width: 1600px; }
  
  .logout-btn { margin-top: auto; padding: 15px; border-top: 1px solid #1e293b; }
  .btn-exit { width: 100%; padding: 12px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .btn-exit:hover { background: #ef4444; color: #fff; }
`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="admin-wrapper">
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
      
      <div className="admin-sidebar">
        <div className="admin-brand">
          <svg width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          إدارة <span>المنظومة</span>
        </div>
        
        <div className="admin-nav">
          <Link href="/admin" className={`admin-link ${pathname === '/admin' ? 'active' : ''}`}>
            📊 النظرة العامة
          </Link>
          <Link href="/admin/agents" className={`admin-link ${pathname.includes('/admin/agents') ? 'active' : ''}`}>
            👥 إدارة الموظفين والأدوار
          </Link>
          <Link href="/admin/branches" className={`admin-link ${pathname.includes('/admin/branches') ? 'active' : ''}`}>
            🏢 الفروع والمناطق
          </Link>
          <Link href="/admin/commissions" className={`admin-link ${pathname.includes('/admin/commissions') ? 'active' : ''}`}>
            💰 الخزنة والعمولات
          </Link>
          <Link href="/admin/reports" className={`admin-link ${pathname.includes('/admin/reports') ? 'active' : ''}`}>
            📈 التقارير المؤسسية
          </Link>
          <Link href="/admin/settings" className={`admin-link ${pathname.includes('/admin/settings') ? 'active' : ''}`}>
            ⚙️ إعدادات النظام
          </Link>
        </div>

        <div className="logout-btn">
          <button onClick={handleLogout} className="btn-exit">تسجيل الخروج</button>
        </div>
      </div>

      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}