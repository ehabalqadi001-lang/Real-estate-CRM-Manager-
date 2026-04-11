"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main-content { margin-left: 64px; flex: 1; display: flex; flex-direction: column; }
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;}
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  
  .content-body { padding: 30px; max-width: 1000px; width: 100%; margin: 0 auto; }
  
  /* Tabs */
  .tabs { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; overflow-x: auto;}
  .tab-btn { padding: 10px 16px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 8px; transition: 0.2s; white-space: nowrap;}
  .tab-btn:hover { background: #f1f5f9; }
  .tab-btn.active { background: #E6F1FB; color: #185FA5; }

  /* Message Cards */
  .msg-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: 0.2s;}
  .msg-card:hover { border-color: #25D366; box-shadow: 0 4px 12px rgba(37,211,102,0.1); }
  
  .msg-info { flex: 1; }
  .msg-target { font-size: 15px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; margin-bottom: 6px;}
  .msg-preview { font-size: 13px; color: #64748b; line-height: 1.5; background: #f8fafc; padding: 10px; border-radius: 8px; border-left: 3px solid #cbd5e1; margin-top: 10px;}
  
  .btn-whatsapp { background: #25D366; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; text-decoration: none; }
  .btn-whatsapp:hover { background: #1EBE57; }

  /* Broadcast Form */
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
  .form-input, .form-textarea { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit;}
  .form-textarea { min-height: 120px; resize: vertical; }
  .form-input:focus, .form-textarea:focus { border-color: #25D366; }
`;

export default function WhatsAppHubPage() {
  const [activeTab, setActiveTab] = useState('installments');
  const [deals, setDeals] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState('clients');
  const [broadcastMsg, setBroadcastMsg] = useState('أهلاً بك،\nيسعدنا إبلاغك بتوفر مشاريع جديدة بأسعار مميزة. تواصل معنا لمعرفة التفاصيل!');

  useEffect(() => {
    async function fetchData() {
      // Fetch Deals
      const { data: dealsData } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
      setDeals(dealsData || []);

      // Fetch pending installments
      const { data: instData } = await supabase.from('installments').select('*').eq('status', 'Pending');
      setInstallments(instData || []);

      // Fetch brokers/agents
      const { data: usersData } = await supabase.from('user_profiles').select('*');
      setUsers(usersData || []);

      setLoading(false);
    }
    fetchData();
  }, []);

  // Format Phone for WhatsApp (ensure it starts with country code, default to +20)
  const formatPhone = (phone: string) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('01')) return '2' + clean;
    return clean;
  };

  // Generate WhatsApp Link
  const generateWaLink = (phone: string, message: string) => {
    return `https://wa.me/${formatPhone(phone)}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar - Added WhatsApp Icon */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        
        {/* WhatsApp Icon */}
        <Link href="/dashboard/whatsapp" className="nav-item active" title="WhatsApp Notifications"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        
        <Link href="/dashboard/team" className="nav-item" title="Team"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item" title="Reports"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <svg width="24" height="24" fill="none" stroke="#25D366" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            WhatsApp Notification Center
          </div>
        </div>

        <div className="content-body" style={{ direction: 'rtl', textAlign: 'right' }}>
          
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'installments' ? 'active' : ''}`} onClick={() => setActiveTab('installments')}>1. تذكير الأقساط (Investors)</button>
            <button className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>2. الإعلانات والمشاريع (Broadcast)</button>
            <button className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => setActiveTab('commissions')}>3. إشعارات العمولات (Brokers)</button>
            <button className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>4. الموافقات والرفض (Status)</button>
          </div>

          {loading ? (
             <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>جاري تحميل البيانات...</div>
          ) : (
            <>
              {/* TAB 1: INSTALLMENTS */}
              {activeTab === 'installments' && (
                <div>
                  <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>الأقساط المستحقة (قريباً)</h3>
                  {installments.slice(0, 10).map((inst, idx) => {
                    // Find related deal manually for simplicity in UI
                    const relatedDeal = deals.find(d => d.id === inst.deal_id);
                    if (!relatedDeal) return null;
                    
                    const msg = `أهلاً بك أ. ${relatedDeal.buyer_name}،\n\nنود تذكيركم بموعد استحقاق القسط رقم (${inst.installment_number}) لوحدتكم في مشروع ${relatedDeal.compound}.\n\nقيمة القسط: ${Number(inst.amount).toLocaleString()} جنيه.\nتاريخ الاستحقاق: ${new Date(inst.due_date).toLocaleDateString('ar-EG')}\n\nشكراً لثقتكم بنا.`;

                    return (
                      <div className="msg-card" key={idx}>
                        <div className="msg-info">
                          <div className="msg-target">تذكير قسط: {relatedDeal.buyer_name}</div>
                          <div style={{fontSize: '12px', color: '#64748b', direction: 'ltr', textAlign: 'right'}}>{relatedDeal.buyer_phone}</div>
                          <div className="msg-preview">{msg}</div>
                        </div>
                        <a href={generateWaLink(relatedDeal.buyer_phone, msg)} target="_blank" rel="noreferrer" className="btn-whatsapp">
                          إرسال عبر واتساب
                        </a>
                      </div>
                    );
                  })}
                  {installments.length === 0 && <p style={{ color: '#64748b' }}>لا يوجد أقساط معلقة حالياً.</p>}
                </div>
              )}

              {/* TAB 2: BROADCAST / MARKETING */}
              {activeTab === 'broadcast' && (
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>إرسال إعلانات جماعية (مشاريع / Events)</h3>
                  
                  <div className="form-group">
                    <label className="form-label">الجمهور المستهدف</label>
                    <select className="form-input" value={broadcastTarget} onChange={(e) => setBroadcastTarget(e.target.value)}>
                      <option value="clients">جميع العملاء والمستثمرين</option>
                      <option value="brokers">مندوبي المبيعات والشركات (Brokers)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">نص الرسالة</label>
                    <textarea 
                      className="form-textarea" 
                      value={broadcastMsg} 
                      onChange={(e) => setBroadcastMsg(e.target.value)}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {(broadcastTarget === 'clients' ? deals : users).slice(0, 15).map((person, idx) => {
                      const phone = person.buyer_phone || person.phone;
                      const name = person.buyer_name || person.first_name;
                      if (!phone) return null;
                      
                      return (
                        <a key={idx} href={generateWaLink(phone, broadcastMsg)} target="_blank" rel="noreferrer" className="btn-whatsapp" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
                          إرسال لـ {name.split(' ')[0]}
                        </a>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>* لحماية رقمك من الحظر، يتم فتح نافذة الواتساب لكل شخص على حدة بدلاً من الإرسال العشوائي.</p>
                </div>
              )}

              {/* TAB 3: COMMISSIONS */}
              {activeTab === 'commissions' && (
                <div>
                  <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>تحديثات مسار العمولات للشركات والمندوبين</h3>
                  {deals.filter(d => d.finance_status).slice(0, 10).map((deal, idx) => {
                    const msg = `عزيزي شريك النجاح،\n\nنود إبلاغكم بأنه تم تحديث مسار العمولة الخاصة ببيعة مشروع (${deal.compound}) للعميل (${deal.buyer_name}).\n\nالحالة المالية الحالية: ${deal.finance_status}\n\nخالص التحيات،\nإدارة المبيعات`;

                    return (
                      <div className="msg-card" key={idx}>
                        <div className="msg-info">
                          <div className="msg-target">تحديث عمولة: بيعة {deal.compound}</div>
                          <div className="msg-preview">{msg}</div>
                        </div>
                        <a href={generateWaLink(deal.buyer_phone, msg)} target="_blank" rel="noreferrer" className="btn-whatsapp">
                          إرسال للمندوب
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: APPROVALS & STATUS */}
              {activeTab === 'approvals' && (
                <div>
                  <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>تنبيهات الموافقة أو الرفض للطلبات</h3>
                  {deals.slice(0, 10).map((deal, idx) => {
                    const isApproved = deal.status === 'Approved';
                    const msg = isApproved 
                      ? `أهلاً بك،\nيسعدنا إبلاغك بأنه تمت الموافقة النهائية (Verified) على بيعة مشروع ${deal.compound}. يمكنك الآن متابعة الإجراءات ومسار العمولة.`
                      : `أهلاً بك،\nنأسف لإبلاغك بأنه تم رفض أو تعليق بيعة مشروع ${deal.compound} حالياً. يرجى مراجعة إدارة المبيعات لمعرفة الأسباب واستكمال الأوراق.`;

                    return (
                      <div className="msg-card" key={idx}>
                        <div className="msg-info">
                          <div className="msg-target">حالة البيعة: {deal.status === 'Approved' ? '✅ موافقة' : '⏳ معلقة / مرفوضة'}</div>
                          <div className="msg-preview">{msg}</div>
                        </div>
                        <a href={generateWaLink(deal.buyer_phone, msg)} target="_blank" rel="noreferrer" className="btn-whatsapp">
                          إرسال التنبيه
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}