"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// استخدام كود CSS آمن بداخل Component
const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main-content { margin-right: 64px; flex: 1; display: flex; flex-direction: column; width: calc(100% - 64px); }
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;}
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  .content-body { padding: 30px; max-width: 1000px; width: 100%; margin: 0 auto; }
  
  /* Tabs */
  .tabs-container { display: flex; gap: 10px; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; overflow-x: auto; }
  .tab-btn { padding: 10px 20px; border: none; background: transparent; font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; border-radius: 8px; transition: 0.2s; white-space: nowrap; }
  .tab-btn:hover { background: #f1f5f9; color: #0f172a; }
  .tab-btn.active { background: #185FA5; color: #fff; }

  /* Cards & Forms */
  .settings-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; display: flex; align-items: center; gap: 8px;}
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .form-group { display: flex; flex-direction: column; margin-bottom: 15px;}
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
  .form-input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff; color: #0f172a; transition: 0.2s;}
  .form-input:focus { border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,0.1);}
  .form-input:disabled { background: #f8fafc; cursor: not-allowed; }
  
  .toggle-switch { display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; }
  
  .btn-save { background: #185FA5; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 10px; }
  .btn-save:hover { background: #124b82; }
  .btn-danger { background: #DC2626; color: #fff; }
  .btn-danger:hover { background: #B91C1C; }
  .btn-success { background: #10B981; color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px;}
  .btn-success:hover { background: #059669; }

  .backup-box { background: #F0FDF4; border: 1px solid #BBF7D0; padding: 20px; border-radius: 8px; text-align: center; }
`;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States
  const [settings, setSettings] = useState({ id: '', company_name: '', address: '', tax_rate: 14, currency: 'EGP', email_notifications: true, whatsapp_notifications: true });
  const [profile, setProfile] = useState({ first_name: '', last_name: '', phone: '' });
  const [backupStatus, setBackupStatus] = useState('');

  useEffect(() => {
    async function loadData() {
      // جلب إعدادات الشركة
      const { data: compData } = await supabase.from('company_settings').select('*').limit(1).single();
      if (compData) setSettings(compData);

      // جلب بيانات المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profData } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        if (profData) setProfile(profData);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('company_settings').update(settings).eq('id', settings.id);
    if (!error) alert("✅ تم حفظ إعدادات الشركة بنجاح!");
    else alert("❌ خطأ في الحفظ");
    setSaving(false);
  };

  const handleBackup = async () => {
    setBackupStatus('جاري تجميع البيانات...');
    try {
      // 1. جلب جميع البيانات الحساسة (العملاء والصفقات)
      const { data: clients } = await supabase.from('clients').select('*');
      const { data: deals } = await supabase.from('deals').select('*');
      const { data: inventory } = await supabase.from('inventory').select('*');

      // 2. تجميعها في ملف JSON
      const backupData = {
        backup_date: new Date().toISOString(),
        total_records: (clients?.length || 0) + (deals?.length || 0) + (inventory?.length || 0),
        data: { clients, deals, inventory }
      };

      // 3. إنشاء ملف للتحميل (Download)
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `FastInvestment_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setBackupStatus('✅ اكتملت النسخة الاحتياطية بنجاح وتم التحميل!');
      setTimeout(() => setBackupStatus(''), 5000);
    } catch (err) {
      setBackupStatus('❌ فشل إنشاء النسخة الاحتياطية.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Cairo' }}>جاري تحميل الإعدادات...</div>;

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/whatsapp" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        <Link href="/dashboard/team" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        <Link href="/dashboard/settings" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">إعدادات النظام (System Settings)</div>
          <button onClick={handleSignOut} style={{background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 16px', borderRadius: '6px', color: '#DC2626', fontWeight: '700', cursor: 'pointer'}}>
            تسجيل الخروج
          </button>
        </div>

        <div className="content-body">
          
          <div className="tabs-container">
            <button className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>إعدادات الشركة والضرائب</button>
            <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>التنبيهات والإشعارات</button>
            <button className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>النسخ الاحتياطي والأمان</button>
            <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>الملف الشخصي</button>
          </div>

          <form onSubmit={handleSaveCompany}>
            
            {/* Tab 1: Company & Financials */}
            {activeTab === 'company' && (
              <>
                <div className="settings-card">
                  <div className="card-title">الهوية المؤسسية (Company Profile)</div>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">الاسم التجاري للشركة</label>
                      <input type="text" className="form-input" value={settings.company_name} onChange={e => setSettings({...settings, company_name: e.target.value})} required />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">العنوان الرئيسي (سيظهر في الفواتير)</label>
                      <input type="text" className="form-input" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-title">الإعدادات المالية والضرائب (Financials)</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">العملة الافتراضية</label>
                      <select className="form-input" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})}>
                        <option value="EGP">جنيه مصري (EGP)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                        <option value="SAR">ريال سعودي (SAR)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">ضريبة القيمة المضافة (VAT %)</label>
                      <input type="number" step="0.1" className="form-input" value={settings.tax_rate} onChange={e => setSettings({...settings, tax_rate: Number(e.target.value)})} required />
                      <span style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>القيمة الافتراضية في مصر هي 14%</span>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات العامة'}</button>
              </>
            )}

            {/* Tab 2: Notifications */}
            {activeTab === 'notifications' && (
              <div className="settings-card">
                <div className="card-title">إعدادات الإشعارات (Notification Preferences)</div>
                <div className="toggle-switch">
                  <div>
                    <div style={{fontWeight: 700, color: '#0f172a'}}>إشعارات الواتساب (WhatsApp Automation)</div>
                    <div style={{fontSize: '12px', color: '#64748b'}}>تفعيل إرسال تذكير الأقساط والمطالبات عبر الواتساب.</div>
                  </div>
                  <input type="checkbox" style={{width: '20px', height: '20px'}} checked={settings.whatsapp_notifications} onChange={e => setSettings({...settings, whatsapp_notifications: e.target.checked})} />
                </div>
                <div className="toggle-switch">
                  <div>
                    <div style={{fontWeight: 700, color: '#0f172a'}}>إشعارات البريد الإلكتروني (Email Alerts)</div>
                    <div style={{fontSize: '12px', color: '#64748b'}}>تلقي ملخص أسبوعي عن أداء المبيعات والمطالبات المتأخرة.</div>
                  </div>
                  <input type="checkbox" style={{width: '20px', height: '20px'}} checked={settings.email_notifications} onChange={e => setSettings({...settings, email_notifications: e.target.checked})} />
                </div>
                <button type="submit" className="btn-save" disabled={saving}>حفظ تفضيلات الإشعارات</button>
              </div>
            )}
          </form>

          {/* Tab 3: Backup & Security */}
          {activeTab === 'backup' && (
            <div className="settings-card">
              <div className="card-title">النسخ الاحتياطي للبيانات (Data Backup)</div>
              <p style={{fontSize: '13px', color: '#475569', marginBottom: '20px'}}>
                تعتبر بيانات العملاء والمبيعات الممتلك الأهم لشركتك. يتيح لك هذا الخيار سحب نسخة كاملة (Export) من قاعدة البيانات بصيغة JSON آمنة ومحفوظة.
              </p>
              
              <div className="backup-box">
                <div style={{marginBottom: '15px', fontWeight: 700, color: '#0f172a'}}>تصدير قاعدة البيانات بالكامل</div>
                <button className="btn-save btn-success" onClick={handleBackup}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  تحميل نسخة احتياطية الآن (Download Backup)
                </button>
                {backupStatus && <div style={{marginTop: '15px', fontSize: '13px', fontWeight: 700, color: backupStatus.includes('فشل') ? '#DC2626' : '#10B981'}}>{backupStatus}</div>}
              </div>
            </div>
          )}

          {/* Tab 4: Profile (Read Only info for context) */}
          {activeTab === 'profile' && (
            <div className="settings-card">
              <div className="card-title">الملف الشخصي (My Profile)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">الاسم</label>
                  <input type="text" className="form-input" value={`${profile.first_name} ${profile.last_name}`} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <input type="text" className="form-input" value={profile.phone} disabled />
                </div>
              </div>
              <p style={{fontSize: '12px', color: '#64748b', marginTop: '10px'}}>لتعديل الصلاحيات والأدوار (Roles)، يرجى التوجه إلى شاشة "إدارة الفريق" (Team).</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}