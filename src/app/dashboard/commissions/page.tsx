"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// CSS آمن (تمت إزالة dangerouslySetInnerHTML من مكانها الخطر)
const sidebarStyle = { width: '64px', background: '#0f1c2e', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '20px 0', gap: '15px', position: 'fixed' as const, right: 0, top: 0, bottom: 0, zIndex: 50, borderLeft: '1px solid rgba(255,255,255,0.05)' };
const navItemStyle = { width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', textDecoration: 'none', transition: '0.2s' };
const activeNavItemStyle = { ...navItemStyle, background: 'rgba(24,95,165,0.4)', color: '#fff', border: '1px solid #185FA5' };
const mainContentStyle = { marginRight: '64px', flex: 1, display: 'flex', flexDirection: 'column' as const, width: 'calc(100% - 64px)' };

// Types (لإزالة any)
type Deal = { id: string; client_id: string; buyer_name: string; compound: string; developer: string; property_type: string; unit_value: number; created_at: string; finance_status: string; };
type Developer = { id: string; name: string; payment_days: number; };
type CommissionRule = { developer_id: string; property_type: string; percentage: number; };

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('Due Dates');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dealsRes, devsRes, rulesRes] = await Promise.all([
        supabase.from('deals').select('*').in('status', ['Approved', 'Pending']), // نجلب الصفقات الموافق عليها أو في الانتظار
        supabase.from('developers').select('*'),
        supabase.from('commission_rules').select('*')
      ]);

      if (dealsRes.error) throw dealsRes.error;
      
      setDeals(dealsRes.data || []);
      setDevelopers(devsRes.data || []);
      setRules(rulesRes.data || []);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🧠 المنطق المالي المعقد: حساب العمولة وتاريخ الاستحقاق لكل بيعة
  const calculateCommissionData = (deal: Deal) => {
    // 1. إيجاد المطور
    const dev = developers.find(d => d.name === deal.developer);
    
    // 2. إيجاد نسبة العمولة الخاصة بهذا المطور وهذا النوع من العقارات (أو نسبة افتراضية 2.5%)
    let percentage = 0.025; 
    if (dev) {
      const rule = rules.find(r => r.developer_id === dev.id && r.property_type === deal.property_type);
      if (rule) percentage = rule.percentage / 100;
    }
    
    const amount = deal.unit_value * percentage;

    // 3. حساب تاريخ الاستحقاق بناءً على سياسة المطور (أو 60 يوم افتراضي)
    const paymentDays = dev?.payment_days || 60;
    const dueDate = new Date(deal.created_at);
    dueDate.setDate(dueDate.getDate() + paymentDays);

    // 4. حساب حالة الاستحقاق (هل تأخرت؟)
    const now = new Date();
    const daysAway = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    let urgency = 'Upcoming';
    if (daysAway < 0 && deal.finance_status !== 'Commission Received') urgency = 'Overdue';
    if (daysAway >= 0 && daysAway <= 30 && deal.finance_status !== 'Commission Received') urgency = 'Due This Month';

    return { amount, percentage: percentage * 100, dueDate, daysAway, urgency };
  };

  // دالة تحصيل العمولة مع Optimistic UI Update وتأكيد
  const markAsPaid = async (dealId: string) => {
    if (!window.confirm('هل أنت متأكد من تحصيل هذه العمولة؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    // Optimistic Update (تحديث الواجهة فوراً)
    setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? { ...d, finance_status: 'Commission Received' } : d));

    // تحديث قاعدة البيانات
    const { error } = await supabase.from('deals').update({ finance_status: 'Commission Received' }).eq('id', dealId);
    
    if (error) {
      alert('حدث خطأ أثناء التحديث، سيتم إعادة تحميل البيانات.');
      fetchData(); // إعادة التحميل إذا فشل الطلب
    }
  };

  // معالجة البيانات للعرض
  const processedDeals = deals.map(deal => ({ ...deal, ...calculateCommissionData(deal) }));
  
  // فلاتر البحث المتقدمة
  const filteredDeals = processedDeals.filter(d => {
    const matchesSearch = d.buyer_name.includes(searchTerm) || d.compound.includes(searchTerm) || d.developer.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' 
      || (statusFilter === 'Collected' && d.finance_status === 'Commission Received')
      || (statusFilter === 'Pending' && d.finance_status !== 'Commission Received');
    return matchesSearch && matchesStatus;
  });

  // حساب مؤشرات الأداء (KPIs)
  const totalCollected = processedDeals.filter(d => d.finance_status === 'Commission Received').reduce((acc, d) => acc + d.amount, 0);
  const totalUpcoming = processedDeals.filter(d => d.finance_status !== 'Commission Received' && d.urgency === 'Upcoming').reduce((acc, d) => acc + d.amount, 0);
  const totalDueMonth = processedDeals.filter(d => d.finance_status !== 'Commission Received' && d.urgency === 'Due This Month').reduce((acc, d) => acc + d.amount, 0);
  const totalOverdue = processedDeals.filter(d => d.finance_status !== 'Commission Received' && d.urgency === 'Overdue').reduce((acc, d) => acc + d.amount, 0);

  // Error Boundary بسيط
  if (error) return <div style={{padding: '50px', textAlign: 'center', color: '#DC2626'}}><h2>عذراً، حدث خطأ!</h2><p>{error}</p><button onClick={fetchData}>إعادة المحاولة</button></div>;

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Cairo', sans-serif", direction: 'rtl' }}>
      
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <Link href="/dashboard" style={navItemStyle} title="الرئيسية"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" style={navItemStyle} title="العملاء"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" style={navItemStyle} title="المبيعات"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" style={navItemStyle} title="المخزون"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" style={activeNavItemStyle} title="العمولات"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/whatsapp" style={navItemStyle} title="الواتساب"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        <Link href="/dashboard/reports" style={navItemStyle} title="التقارير"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
      </div>

      <div style={mainContentStyle}>
        <div style={{ padding: '20px 30px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>العمولات والمطالبات المالية</div>
        </div>

        <div style={{ padding: '30px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '25px' }}>
            {['Due Dates', 'Calendar', 'Payout History'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 16px', background: activeTab === tab ? '#185FA5' : 'transparent', color: activeTab === tab ? '#fff' : '#64748b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
              >
                {tab === 'Due Dates' ? 'مواعيد الاستحقاق' : tab === 'Calendar' ? 'التقويم' : 'سجل التحصيل'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>جاري تحميل البيانات المالية...</div>
          ) : (
            <>
              {/* TAB 1 & 3: Due Dates & History */}
              {(activeTab === 'Due Dates' || activeTab === 'Payout History') && (
                <>
                  {/* KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    {[
                      { label: 'متأخرة السداد', val: totalOverdue, color: '#DC2626', bg: '#FEF2F2' },
                      { label: 'مستحقة هذا الشهر', val: totalDueMonth, color: '#f59e0b', bg: '#FFFBEB' },
                      { label: 'قادمة (لم تستحق)', val: totalUpcoming, color: '#185FA5', bg: '#F8FAFC' },
                      { label: 'محصلة (تمت)', val: totalCollected, color: '#10b981', bg: '#ECFDF5' }
                    ].map((kpi, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderRight: `4px solid ${kpi.color}` }}>
                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{kpi.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: kpi.color, direction: 'ltr', textAlign: 'right' }}>
                          EGP {kpi.val.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Toolbar */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <input 
                      type="text" 
                      placeholder="بحث باسم العميل، المطور، المشروع..." 
                      style={{ flex: 1, padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                      style={{ padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#fff', minWidth: '150px' }}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">جميع الحالات</option>
                      <option value="Pending">قيد الانتظار</option>
                      <option value="Collected">مُحصلة</option>
                    </select>
                  </div>

                  {/* Data Table */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                          <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>المشروع والمطور</th>
                          <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>العميل</th>
                          <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>قيمة العمولة</th>
                          <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>موعد الاستحقاق</th>
                          <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeals.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>لا توجد بيانات مطابقة للبحث</td></tr>
                        ) : (
                          filteredDeals.map(deal => (
                            <tr key={deal.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{deal.compound}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{deal.developer}</div>
                              </td>
                              <td style={{ padding: '16px', fontWeight: 600 }}>{deal.buyer_name}</td>
                              <td style={{ padding: '16px' }}>
                                <div style={{ fontWeight: 700, color: '#185FA5', direction: 'ltr', textAlign: 'right' }}>EGP {deal.amount.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>النسبة: {deal.percentage}%</div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <div>{deal.dueDate.toLocaleDateString('ar-EG')}</div>
                                {deal.finance_status !== 'Commission Received' && (
                                  <div style={{ fontSize: '11px', color: deal.urgency === 'Overdue' ? '#DC2626' : '#f59e0b', fontWeight: 600 }}>
                                    {deal.daysAway < 0 ? `متأخرة منذ ${Math.abs(deal.daysAway)} يوم` : `تستحق بعد ${deal.daysAway} يوم`}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '16px' }}>
                                {deal.finance_status === 'Commission Received' ? (
                                  <span style={{ background: '#ECFDF5', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>مُحصلة</span>
                                ) : (
                                  <button onClick={() => markAsPaid(deal.id)} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>
                                    تأكيد التحصيل ✓
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* TAB 2: Calendar Component (تم إصلاح الخطأ 4) */}
              {activeTab === 'Calendar' && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px' }}>
                  <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>جدول المطالبات المالية القادمة</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {processedDeals.filter(d => d.finance_status !== 'Commission Received').sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()).map(deal => (
                      <div key={deal.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: deal.urgency === 'Overdue' ? '#DC2626' : deal.urgency === 'Due This Month' ? '#f59e0b' : '#185FA5' }}></div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>استحقاق: {deal.dueDate.toLocaleDateString('ar-EG')}</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{deal.developer} - {deal.compound}</div>
                        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>عميل: {deal.buyer_name}</div>
                        <div style={{ fontWeight: 700, color: '#185FA5', direction: 'ltr', textAlign: 'right', fontSize: '18px' }}>EGP {deal.amount.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}</div>
                      </div>
                    ))}
                    {processedDeals.filter(d => d.finance_status !== 'Commission Received').length === 0 && (
                      <div style={{ color: '#64748b' }}>لا يوجد مطالبات مالية قادمة.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}