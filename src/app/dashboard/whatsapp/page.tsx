"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  .automation-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 20px; }
  .status-online { color: #10b981; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px; }
  .template-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-top: 10px; font-family: monospace; font-size: 13px; color: #1e293b; white-space: pre-wrap; direction: rtl; }
  .btn-test { background: #25D366; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
`;

export default function WhatsAppAutomation() {
  const [isSyncing, setIsSyncing] = useState(false);

  // مثال لرسالة تأكيد الحجز التلقائية
  const reservationTemplate = `أهلاً يا [Client_Name]! ✨
مبروك! تم تسجيل حجز وحدتك في مشروع [Project_Name] بنجاح.
القيمة الإجمالية: [Value] EGP
المقدم المدفوع: [Paid] EGP
سعداء بكونك جزءاً من عائلة FAST INVESTMENT.`;

  return (
    <div className="dashboard-container" style={{direction: 'rtl'}}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="main-content">
        <div className="header">
          <div className="header-title">مركز أتمتة الواتساب (Business API) 💬</div>
          <div className="status-online">● النظام متصل بـ Twilio Gateway</div>
        </div>

        <div className="content-body">
          <div className="report-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
            
            {/* إشعار تأكيد الحجز */}
            <div className="automation-card">
              <div className="card-title">تأكيد الحجز التلقائي</div>
              <p style={{fontSize: '13px', color: '#64748b'}}>تُرسل فوراً عند تغيير حالة الصفقة إلى "Reservation".</p>
              <div className="template-box">{reservationTemplate}</div>
              <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                <button className="btn-test">تعديل الرسالة</button>
                <input type="checkbox" checked /> تفعيل الإرسال التلقائي
              </div>
            </div>

            {/* إشعار تذكير الدفع */}
            <div className="automation-card">
              <div className="card-title">تذكير الأقساط (نظام 2030)</div>
              <p style={{fontSize: '13px', color: '#64748b'}}>تُرسل تلقائياً قبل موعد الاستحقاق بـ 3 أيام.</p>
              <div className="template-box">عزيزي [Client_Name]، نذكرك بموعد قسطك القادم بتاريخ [Due_Date]...</div>
              <div style={{marginTop: '15px'}}>
                <span className="status-online">القسط القادم المجدول: 15/05/2026</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}