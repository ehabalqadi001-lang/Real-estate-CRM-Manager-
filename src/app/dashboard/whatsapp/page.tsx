"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  
  .status-badge { display: flex; align-items: center; gap: 6px; background: #ECFDF5; color: #10B981; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid #A7F3D0;}
  .status-badge.offline { background: #FEF2F2; color: #DC2626; border-color: #FCA5A5; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor;}

  .content-body { padding: 30px; max-width: 1200px; width: 100%; margin: 0 auto; }
  
  .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;}
  @media(max-width: 900px) { .grid-container { grid-template-columns: 1fr; } }

  .automation-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;}
  .card-desc { font-size: 13px; color: #64748b; margin-bottom: 15px; }
  
  .template-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #0f172a; white-space: pre-wrap; line-height: 1.6; }
  .variable-tag { color: #185FA5; font-weight: 700; background: #EFF6FF; padding: 2px 4px; border-radius: 4px;}

  .toggle-switch { display: flex; align-items: center; gap: 10px; margin-top: 15px; cursor: pointer;}
  
  .logs-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .logs-header { padding: 20px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 12px 20px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 20px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600; }
  .msg-status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .status-sent { background: #EFF6FF; color: #3b82f6; }
  .status-delivered { background: #ECFDF5; color: #10B981; }
  .status-failed { background: #FEF2F2; color: #DC2626; }
`;

export default function WhatsAppHub() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApiConnected, setIsApiConnected] = useState(true); // محاكاة لاتصال Twilio

  useEffect(() => {
    async function fetchLogs() {
      // جلب سجلات الواتساب من القاعدة التي أنشأناها
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  const formatTemplate = (text: string) => {
    return text.split(/(\[.*?\])/g).map((part, index) => 
      part.startsWith('[') && part.endsWith(']') 
        ? <span key={index} className="variable-tag">{part}</span> 
        : part
    );
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/whatsapp" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        <Link href="/dashboard/settings" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <svg width="24" height="24" fill="none" stroke="#25D366" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            أتمتة الواتساب (WhatsApp Automation)
          </div>
          <div className={`status-badge ${!isApiConnected ? 'offline' : ''}`}>
            <div className="status-dot"></div>
            {isApiConnected ? 'Twilio API: متصل' : 'Twilio API: غير متصل'}
          </div>
        </div>

        <div className="content-body">
          <div className="grid-container">
            {/* Template 1 */}
            <div className="automation-card">
              <div className="card-title">
                1. رسالة تأكيد الحجز (Reservation)
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked style={{width:'18px', height:'18px', accentColor: '#185FA5'}} />
                  <span style={{fontSize:'12px', fontWeight:600, color:'#0f172a'}}>مفعل</span>
                </label>
              </div>
              <div className="card-desc">تُرسل تلقائياً للعميل بمجرد تغيير حالة صفقته في قمع المبيعات إلى "حجز".</div>
              <div className="template-box">
                {formatTemplate(`أهلاً بك أستاذ [اسم_العميل] ✨\n\nنهنئك! تم تأكيد حجز وحدتك بنجاح في مشروع [اسم_الكومباوند] مع المطور [اسم_المطور].\n\nإجمالي القيمة: [قيمة_الوحدة] جنيه.\nالمقدم المدفوع: [المقدم] جنيه.\n\nيسعدنا انضمامك لعائلة EHAB & ESLAM TEAM. لمزيد من الاستفسارات، نحن دائماً في خدمتك.`)}
              </div>
            </div>

            {/* Template 2 */}
            <div className="automation-card">
              <div className="card-title">
                2. تذكير بموعد الأقساط (Payment Reminder)
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked style={{width:'18px', height:'18px', accentColor: '#185FA5'}} />
                  <span style={{fontSize:'12px', fontWeight:600, color:'#0f172a'}}>مفعل</span>
                </label>
              </div>
              <div className="card-desc">تُرسل تلقائياً قبل 3 أيام من موعد استحقاق القسط المسجل في النظام.</div>
              <div className="template-box">
                {formatTemplate(`عزيزي [اسم_العميل] 📅\n\nتذكير ودي من فريق الحسابات بـ EHAB & ESLAM TEAM:\nقسط وحدتك في [اسم_الكومباوند] يحل موعده بتاريخ [تاريخ_الاستحقاق].\n\nقيمة القسط: [قيمة_القسط] جنيه.\n\nيرجى التواصل معنا في حال وجود أي استفسار.`)}
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="logs-card">
            <div className="logs-header">سجل الإرسال الحديث (Message Logs)</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>الوقت والتاريخ</th>
                    <th>رقم العميل</th>
                    <th>نوع الرسالة</th>
                    <th>حالة الإرسال</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '20px'}}>جاري التحميل...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>لا يوجد رسائل مرسلة حتى الآن.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{direction: 'ltr', textAlign: 'right'}}>{new Date(log.sent_at).toLocaleString('ar-EG')}</td>
                        <td style={{direction: 'ltr', textAlign: 'right', fontWeight: 'bold'}}>{log.client_phone}</td>
                        <td style={{color: '#64748b'}}>{log.message_body.includes('نهنئك') ? 'تأكيد حجز' : 'رسالة نظام'}</td>
                        <td>
                          <span className={`msg-status status-${log.status}`}>
                            {log.status === 'delivered' ? '✓ تم التوصيل' : log.status === 'sent' ? '✓ أُرسلت' : log.status === 'failed' ? '✕ فشل' : 'قيد الانتظار'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}