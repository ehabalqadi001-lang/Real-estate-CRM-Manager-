"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  /* زر خروج محترف في أسفل القائمة الجانبية */
  .logout-container { margin-top: auto; padding-bottom: 20px; }
  .btn-logout-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; cursor: pointer; border: none; background: rgba(239, 68, 68, 0.1); transition: 0.2s; }
  .btn-logout-icon:hover { background: #ef4444; color: #fff; }

  .main-content { margin-right: 64px; flex: 1; padding: 30px; max-width: 1000px; margin-left: auto; margin-right: auto;}
  .header-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 25px; }

  .settings-layout { display: flex; gap: 30px; }
  @media (max-width: 768px) { .settings-layout { flex-direction: column; } }

  /* تبويبات الإعدادات */
  .settings-tabs { width: 240px; display: flex; flex-direction: column; gap: 5px; }
  .tab-btn { padding: 12px 16px; border: none; background: transparent; text-align: right; border-radius: 8px; font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
  .tab-btn.active { background: #fff; color: #185FA5; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

  .settings-content { flex: 1; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
  .form-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
  .form-input:focus { border-color: #185FA5; }

  .toggle-container { display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #f8fafc; border-radius: 12px; margin-bottom: 10px; border: 1px solid #f1f5f9; }
  .toggle-info h4 { font-size: 14px; font-weight: 800; color: #0f172a; }
  .toggle-info p { font-size: 12px; color: #64748b; margin-top: 2px; }

  .btn-save { background: #185FA5; color: #fff; border: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 20px; }
`;

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  
  // بيانات الإعدادات (كمثال)
  const [settings, setSettings] = useState({
    companyName: 'EHAB & ESLAM TEAM',
    address: 'القاهرة، التجمع الخامس',
    vatRate: '14',
    pushEnabled: true,
    whatsappAlerts: true
  });

  const handleLogout = async () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const handleSave = () => {
    setLoading(true);
    // محاكاة حفظ البيانات
    setTimeout(() => {
      setLoading(false);
      alert("✅ تم حفظ الإعدادات بنجاح.");
    }, 800);
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar المحدث بوضع زر الخروج في الأسفل */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/settings" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
        
        {/* زر الخروج المدمج في القائمة */}
        <div className="logout-container">
          <button className="btn-logout-icon" onClick={handleLogout} title="تسجيل الخروج">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      <div className="main-content">
        <h1 className="header-title">إعدادات المنظومة</h1>

        <div className="settings-layout">
          {/* الجانب الأيمن: التبويبات */}
          <div className="settings-tabs">
            <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>عام</button>
            <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>الإشعارات</button>
            <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>الأمان والخصوصية</button>
            <button className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>ملفي الشخصي</button>
          </div>

          {/* الجانب الأيسر: المحتوى المتغير */}
          <div className="settings-content">
            {activeTab === 'general' && (
              <div>
                <h3 style={{marginBottom: '20px'}}>إعدادات الشركة</h3>
                <div className="form-group">
                  <label className="form-label">اسم الشركة المؤسسي</label>
                  <input className="form-input" value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">عنوان المقر الرئيسي</label>
                  <input className="form-input" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">ضريبة القيمة المضافة (VAT %)</label>
                  <input type="number" className="form-input" value={settings.vatRate} onChange={e => setSettings({...settings, vatRate: e.target.value})} />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 style={{marginBottom: '20px'}}>تفضيلات التنبيهات</h3>
                <div className="toggle-container">
                  <div className="toggle-info">
                    <h4>إشعارات المتصفح (Web Push)</h4>
                    <p>تنبيهك فوراً عند وصول Lead جديد أو استحقاق عمولة.</p>
                  </div>
                  <input type="checkbox" checked={settings.pushEnabled} onChange={e => setSettings({...settings, pushEnabled: e.target.checked})} style={{width:'20px', height:'20px', accentColor: '#185FA5'}} />
                </div>
                <div className="toggle-container">
                  <div className="toggle-info">
                    <h4>تنبيهات WhatsApp الآلية</h4>
                    <p>إرسال رسائل آلية للعملاء عند الحجز أو تذكير الأقساط.</p>
                  </div>
                  <input type="checkbox" checked={settings.whatsappAlerts} onChange={e => setSettings({...settings, whatsappAlerts: e.target.checked})} style={{width:'20px', height:'20px', accentColor: '#185FA5'}} />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 style={{marginBottom: '20px'}}>الأمان</h3>
                <div className="form-group">
                  <label className="form-label">تغيير كلمة المرور</label>
                  <input type="password" placeholder="كلمة المرور الجديدة" className="form-input" />
                </div>
                <button className="btn-save" style={{background: '#64748b'}}>تحديث كلمة المرور</button>
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <h3 style={{marginBottom: '20px'}}>بياناتي الشخصية</h3>
                <div className="form-group">
                  <label className="form-label">الاسم الكامل</label>
                  <input className="form-input" value="EHAB MOHAMED ALQADI" disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">المسمى الوظيفي</label>
                  <input className="form-input" value="المدير العام (Super Admin)" disabled />
                </div>
              </div>
            )}

            <button className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}