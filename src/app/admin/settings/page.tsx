"use client";
import React, { useState } from 'react';

const PAGE_CSS = `
  .settings-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 30px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;}
  
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
  .form-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; font-family: monospace; direction: ltr; }
  .form-input:focus { border-color: #3b82f6; background: #fff; }
  
  .btn-save { background: #0f172a; color: #fff; border: none; padding: 12px 25px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s;}
  .btn-save:hover { background: #3b82f6; }
`;

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // محاكاة حفظ مفاتيح الـ API (في بيئة الإنتاج يتم حفظها في Edge Config أو قواعد بيانات مشفرة)
    setTimeout(() => {
      alert("✅ تم تشفير وحفظ مفاتيح التكامل بنجاح.");
      setSaving(false);
    }, 1000);
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <h1 style={{fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '25px'}}>إعدادات النظام والـ API</h1>

      <form onSubmit={handleSave}>
        <div className="settings-card">
          <div className="card-title">💬 إعدادات بوابة الواتساب (Twilio Gateway)</div>
          <div className="form-group">
            <label className="form-label">Twilio Account SID</label>
            <input className="form-input" type="password" defaultValue="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div className="form-group">
            <label className="form-label">Twilio Auth Token</label>
            <input className="form-input" type="password" defaultValue="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div className="form-group">
            <label className="form-label">رقم الهاتف المرسل (WhatsApp Sender Number)</label>
            <input className="form-input" type="text" defaultValue="+14155238886" />
          </div>
        </div>

        <div className="settings-card">
          <div className="card-title">🛡️ إعدادات الأمان (Security & Audit)</div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
            <div>
              <div style={{fontWeight: 700, color: '#0f172a'}}>فرض تسجيل الخروج التلقائي</div>
              <div style={{fontSize: '12px', color: '#64748b'}}>تسجيل خروج الموظفين بعد 30 دقيقة من الخمول</div>
            </div>
            <input type="checkbox" defaultChecked style={{width: '20px', height: '20px', accentColor: '#0f172a'}} />
          </div>
        </div>

        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? 'جاري تشفير وحفظ البيانات...' : 'حفظ التحديثات'}
        </button>
      </form>
    </div>
  );
}