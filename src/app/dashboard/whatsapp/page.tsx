"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AIAssistantChat from '@/components/whatsapp/AIAssistantChat';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main-content { margin-right: 64px; flex: 1; display: flex; flex-direction: column; width: calc(100% - 64px); }
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;}
  .header-title { font-size: 22px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  
  .status-badge { display: flex; align-items: center; gap: 6px; background: #ECFDF5; color: #10B981; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid #A7F3D0;}
  
  .content-body { padding: 30px; max-width: 1400px; width: 100%; margin: 0 auto; }
  
  .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;}
  @media(max-width: 1024px) { .grid-container { grid-template-columns: 1fr; } }

  .automation-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: 0.2s; border-right: 4px solid #185FA5;}
  .automation-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
  .automation-card.warning { border-right-color: #DC2626; }
  .automation-card.success { border-right-color: #10B981; }

  .card-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;}
  .card-desc { font-size: 13px; color: #64748b; margin-bottom: 15px; }
  
  .template-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #0f172a; white-space: pre-wrap; line-height: 1.6; }
  .variable-tag { color: #185FA5; font-weight: 800; background: #EFF6FF; padding: 2px 6px; border-radius: 4px; font-family: 'Cairo', sans-serif;}
  .variable-tag.money { color: #10B981; background: #ECFDF5; }

  .toggle-switch { display: flex; align-items: center; gap: 10px; margin-top: 15px; cursor: pointer;}
  
  .logs-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .logs-header { padding: 20px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a; font-size: 18px;}
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 12px 20px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 20px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600; }
  .msg-status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
  .status-sent { background: #EFF6FF; color: #3b82f6; }
  .status-delivered { background: #ECFDF5; color: #10B981; }
  .status-failed { background: #FEF2F2; color: #DC2626; }
`;

interface WhatsAppLog {
  id: string
  sent_at: string
  client_phone: string
  message_body: string
  status: string
}

export default function WhatsAppHub() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchLogs() {
      const { data } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      if (!mounted) return;
      if (data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
    return () => { mounted = false; };
  }, []);

  // دالة لتلوين المتغيرات داخل النص لتمييزها
  const formatTemplate = (text: string) => {
    return text.split(/(\[.*?\])/g).map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const isMoney = part.includes('قيمة') || part.includes('مبلغ') || part.includes('رصيد') || part.includes('مقدم');
        return <span key={index} className={`variable-tag ${isMoney ? 'money' : ''}`}>{part}</span>;
      }
      return part;
    });
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
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <svg width="24" height="24" fill="none" stroke="#25D366" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            مركز الأتمتة والرسائل (WhatsApp Business API)
          </div>
          <div className="status-badge">
            <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'currentColor', boxShadow:'0 0 8px currentColor'}}></div>
            Gateway: متصل ويعمل
          </div>
        </div>

        <div className="content-body">
          <div className="grid-container">
            
            {/* Template 1: Reservation */}
            <div className="automation-card">
              <div className="card-title">
                1. تأكيد الحجز (Reservation)
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked style={{width:'16px', height:'16px', accentColor: '#185FA5'}} />
                  <span style={{fontSize:'12px', fontWeight:700}}>مفعل</span>
                </label>
              </div>
              <div className="card-desc">تُرسل فور تحويل حالة الصفقة إلى &ldquo;حجز&rdquo;.</div>
              <div className="template-box">
                {formatTemplate(`أهلاً بك أستاذ [اسم_العميل] ✨\n\nنهنئك! تم تأكيد حجز وحدتك بنجاح في مشروع [اسم_الكومباوند] مع المطور [اسم_المطور].\n\nإجمالي القيمة: [قيمة_الوحدة] جنيه.\nالمقدم المدفوع: [المقدم_المدفوع] جنيه.\n\nيسعدنا انضمامك لعائلة EHAB & ESLAM TEAM.`)}
              </div>
            </div>

            {/* Template 2: Payment Reminder (تمت ترقيته) */}
            <div className="automation-card">
              <div className="card-title">
                2. تذكير بموعد الأقساط (Reminder)
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked style={{width:'16px', height:'16px', accentColor: '#185FA5'}} />
                  <span style={{fontSize:'12px', fontWeight:700}}>مفعل</span>
                </label>
              </div>
              <div className="card-desc">تُرسل تلقائياً قبل 3 أيام من موعد استحقاق القسط.</div>
              <div className="template-box">
                {formatTemplate(`عزيزي [اسم_العميل] 📅\n\nتذكير ودي من الإدارة المالية بـ EHAB & ESLAM TEAM:\nقسط وحدتك في [اسم_الكومباوند] يحل موعده بتاريخ [تاريخ_الاستحقاق].\n\nقيمة القسط المستحق: [قيمة_القسط] جنيه.\nإجمالي الرصيد المتبقي للوحدة: [الرصيد_المتبقي] جنيه.\n\nيرجى التواصل معنا لتأكيد السداد.`)}
              </div>
            </div>

            {/* Template 3: Overdue Payment (جديد ومهم) */}
            <div className="automation-card warning">
              <div className="card-title">
                3. مطالبة بقسط متأخر (Overdue)
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked style={{width:'16px', height:'16px', accentColor: '#185FA5'}} />
                  <span style={{fontSize:'12px', fontWeight:700}}>مفعل</span>
                </label>
              </div>
              <div className="card-desc">تُرسل إذا تجاوز القسط تاريخ استحقاقه بـ 48 ساعة.</div>
              <div className="template-box">
                {formatTemplate(`أستاذ [اسم_العميل] المحترم ⚠️\n\nنود إفادتكم بأنه يوجد قسط متأخر السداد على وحدتكم في [اسم_الكومباوند].\n\nتاريخ الاستحقاق كان: [تاريخ_الاستحقاق]\nالمبلغ المتأخر: [قيمة_القسط] جنيه.\n\nنرجو سرعة السداد تجنباً لتطبيق أي غرامات تأخير من قبل المطور [اسم_المطور].`)}
              </div>
            </div>

            {/* Template 4: Handover (جديد) */}
            <div className="automation-card success">
              <div className="card-title">
                4. التهنئة بالتسليم (Handover)
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked style={{width:'16px', height:'16px', accentColor: '#185FA5'}} />
                  <span style={{fontSize:'12px', fontWeight:700}}>مفعل</span>
                </label>
              </div>
              <div className="card-desc">تُرسل عند تحويل مرحلة الصفقة إلى &ldquo;تسليم&rdquo;.</div>
              <div className="template-box">
                {formatTemplate(`ألف مبروك أستاذ [اسم_العميل]! 🎉🔑\n\nيُسعدنا في EHAB & ESLAM TEAM تهنئتكم بوصول وحدتكم في [اسم_الكومباوند] لمرحلة التسليم النهائي.\n\nنتمنى لكم أوقاتاً سعيدة في عقاركم الجديد، ونتشرف دائماً بخدمتكم في استثماراتكم القادمة.`)}
              </div>
            </div>

          </div>

          {/* سجل الإرسال */}
          <div className="logs-card">
            <div className="logs-header">سجل الرسائل الصادرة (Outgoing Logs)</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>الوقت والتاريخ</th>
                    <th>هاتف العميل</th>
                    <th>نوع الرسالة (Template)</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '30px'}}>جاري مزامنة السجل...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>لا يوجد نشاط إرسال حتى الآن.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{direction: 'ltr', textAlign: 'right'}}>{new Date(log.sent_at).toLocaleString('ar-EG')}</td>
                        <td style={{direction: 'ltr', textAlign: 'right', fontWeight: '800', color: '#185FA5'}}>{log.client_phone}</td>
                        <td style={{color: '#475569'}}>{log.message_body.includes('متأخر') ? 'مطالبة متأخرات' : log.message_body.includes('مبروك') ? 'تهنئة تسليم' : 'تذكير / حجز'}</td>
                        <td>
                          <span className={`msg-status status-${log.status}`}>
                            {log.status === 'delivered' ? '✓ تم الاستلام' : log.status === 'sent' ? '✓ أُرسلت' : '✕ فشل الإرسال'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* المساعد الذكي */}
          <div style={{marginTop: '30px'}}>
            <h2 style={{fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px'}}>
              🤖 المساعد الذكي — تجربة محادثة مع عميل
            </h2>
            <AIAssistantChat />
          </div>

        </div>
      </div>
    </div>
  );
}