"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
  
  /* Sidebar */
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50; border-left: 1px solid rgba(255,255,255,0.05);}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  /* Main Content */
  .main-content { margin-right: 64px; flex: 1; display: flex; flex-direction: column; width: calc(100% - 64px); overflow-x: hidden;}
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;}
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px;}
  .content-body { padding: 30px; max-width: 1400px; width: 100%; margin: 0 auto; }
  
  /* Time Filters */
  .filter-group { display: flex; background: #f1f5f9; padding: 4px; border-radius: 8px; gap: 4px; }
  .filter-btn { padding: 8px 16px; border: none; background: transparent; border-radius: 6px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
  .filter-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  /* KPI Cards */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .kpi-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); position: relative; overflow: hidden;}
  .kpi-title { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 10px; display: flex; justify-content: space-between; }
  .kpi-value { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 8px; direction: ltr; text-align: right;}
  .kpi-target { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;}
  .text-success { color: #10b981; }
  .text-warning { color: #f59e0b; }
  .text-primary { color: #185FA5; }
  .progress-bg { height: 4px; background: #f1f5f9; border-radius: 2px; margin-top: 10px; overflow: hidden; }
  .progress-fill { height: 100%; background: #185FA5; border-radius: 2px; transition: width 1s ease-out; }

  /* Dashboard Grid */
  .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
  @media (max-width: 1024px) { .dash-grid { grid-template-columns: 1fr; } }
  
  .section-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .section-header { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .section-header::before { content: ''; display: block; width: 4px; height: 16px; background: #185FA5; border-radius: 4px; }

  /* CSS Chart */
  .chart-container { display: flex; align-items: flex-end; gap: 15px; height: 220px; padding-top: 20px; border-bottom: 1px solid #e2e8f0; }
  .chart-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 8px;}
  .chart-track { width: 100%; max-width: 40px; background: #f8fafc; border-radius: 4px 4px 0 0; display: flex; align-items: flex-end; height: 100%; position: relative;}
  .chart-fill { width: 100%; background: #185FA5; border-radius: 4px 4px 0 0; transition: 1s; position: relative; cursor: pointer;}
  .chart-fill:hover { background: #0f1c2e; }
  .chart-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #0f1c2e; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; opacity: 0; pointer-events: none; transition: 0.2s; white-space: nowrap; z-index: 10;}
  .chart-fill:hover .chart-tooltip { opacity: 1; }
  .chart-label { font-size: 11px; color: #64748b; font-weight: 600; }

  /* Lists */
  .list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .list-item:last-child { border-bottom: none; padding-bottom: 0; }
  .item-title { font-size: 14px; font-weight: 700; color: #0f172a; }
  .item-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
  .item-val { font-size: 14px; font-weight: 700; color: #185FA5; text-align: left; direction: ltr;}
  
  .badge-urgent { background: #FEF2F2; color: #DC2626; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }

  /* Skeletons */
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .skeleton { background: #e2e8f0; border-radius: 8px; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .sk-text { height: 20px; width: 60%; margin-bottom: 10px; }
  .sk-title { height: 14px; width: 40%; margin-bottom: 20px; }
  .sk-chart { height: 100%; width: 100%; border-radius: 4px 4px 0 0; }
`;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Month'); // Default to current month
  const [deals, setDeals] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const TARGET_MONTHLY = 50000000; // 50 Million EGP Target

  const fetchData = async () => {
    // جلب الصفقات والأقساط
    const { data: dealsData } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    const { data: instData } = await supabase.from('installments').select('*').order('due_date', { ascending: true });
    
    setDeals(dealsData || []);
    setInstallments(instData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // 🔴 السحر: تفعيل التحديث الفوري (Realtime Updates)
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchData(); // تحديث صامت عند حدوث أي تغيير في قاعدة البيانات
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 1. منطق التصفية الزمنية (Time Filtering Logic)
  const getFilteredDeals = () => {
    const now = new Date();
    return deals.filter(deal => {
      const dealDate = new Date(deal.created_at);
      if (timeFilter === 'Month') return dealDate.getMonth() === now.getMonth() && dealDate.getFullYear() === now.getFullYear();
      if (timeFilter === 'Year') return dealDate.getFullYear() === now.getFullYear();
      return true; // All Time
    });
  };

  const filteredDeals = getFilteredDeals();

  // 2. حساب المؤشرات (KPIs) بناءً على الفلتر
  const totalSales = filteredDeals.reduce((acc, d) => acc + Number(d.unit_value || 0), 0);
  const activeDeals = filteredDeals.filter(d => d.status === 'Pending').length;
  
  // حساب العمولات (5%)
  const totalComm = totalSales * 0.05;
  const collectedComm = filteredDeals
    .filter(d => d.finance_status === 'Commission Received' || d.finance_status === 'Transferred to Agent')
    .reduce((acc, d) => acc + (Number(d.unit_value || 0) * 0.05), 0);
  const pendingComm = totalComm - collectedComm;

  const targetPercentage = Math.min((totalSales / (timeFilter === 'Month' ? TARGET_MONTHLY : TARGET_MONTHLY * 12)) * 100, 100);

  // 3. تجهيز بيانات الرسم البياني (آخر 6 شهور)
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const chartData = Array.from({length: 6}).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const mDeals = deals.filter(deal => new Date(deal.created_at).getMonth() === d.getMonth() && new Date(deal.created_at).getFullYear() === d.getFullYear());
    const val = mDeals.reduce((acc, deal) => acc + Number(deal.unit_value || 0), 0);
    return { name: monthNames[d.getMonth()], value: val };
  });
  const maxChartVal = Math.max(...chartData.map(d => d.value), 1000000);

  // 4. الصفقات العاجلة (تنتظر الموافقة أو قسط مستحق قريباً)
  const actionNeeded = deals.filter(d => d.status === 'Pending').slice(0, 5);

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية كاملة */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item active" title="لوحة التحكم"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="العملاء"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="المبيعات"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item" title="المخزون"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="العمولات"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/whatsapp" className="nav-item" title="الواتساب"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        <Link href="/dashboard/team" className="nav-item" title="الفريق"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item" title="التقارير"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        <Link href="/dashboard/settings" className="nav-item" title="الإعدادات"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">المركز الرئيسي (Live) 🔴</div>
          
          {/* فلتر زمني حقيقي يتفاعل مع البيانات */}
          <div className="filter-group">
            <button className={`filter-btn ${timeFilter === 'Month' ? 'active' : ''}`} onClick={() => setTimeFilter('Month')}>هذا الشهر</button>
            <button className={`filter-btn ${timeFilter === 'Year' ? 'active' : ''}`} onClick={() => setTimeFilter('Year')}>هذا العام</button>
            <button className={`filter-btn ${timeFilter === 'All Time' ? 'active' : ''}`} onClick={() => setTimeFilter('All Time')}>كل الوقت</button>
          </div>
        </div>

        <div className="content-body">
          
          {/* شبكة المؤشرات (KPIs) */}
          <div className="kpi-grid">
            {loading ? (
              // Skeleton Loading State
              Array.from({length: 4}).map((_, i) => (
                <div className="kpi-card" key={i}>
                  <div className="skeleton sk-title"></div>
                  <div className="skeleton sk-text" style={{height:'30px'}}></div>
                  <div className="skeleton sk-title" style={{width:'80%', marginTop:'15px'}}></div>
                </div>
              ))
            ) : (
              <>
                <div className="kpi-card">
                  <div className="kpi-title">إجمالي المبيعات الموثقة <svg width="16" height="16" fill="none" stroke="#185FA5" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                  <div className="kpi-value text-primary">EGP {totalSales.toLocaleString()}</div>
                  <div className="kpi-target">
                    <span className={targetPercentage >= 100 ? 'text-success' : 'text-warning'}>{targetPercentage.toFixed(1)}% من التارجت</span>
                    <span style={{color: '#64748b'}}>({filteredDeals.length} بيعة)</span>
                  </div>
                  <div className="progress-bg"><div className="progress-fill" style={{width: `${targetPercentage}%`}}></div></div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">الصفقات النشطة / المعلقة <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                  <div className="kpi-value" style={{color: '#f59e0b'}}>{activeDeals} صفقات</div>
                  <div className="kpi-target" style={{color: '#64748b'}}>تنتظر اعتماد الإدارة</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">العمولات المحصلة <svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                  <div className="kpi-value text-success">EGP {collectedComm.toLocaleString()}</div>
                  <div className="kpi-target" style={{color: '#64748b'}}>تم تحويلها لحساب الشركة</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">العمولات المتوقعة <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                  <div className="kpi-value" style={{color: '#64748b'}}>EGP {pendingComm.toLocaleString()}</div>
                  <div className="kpi-target" style={{color: '#64748b'}}>متأخرة عند المطورين</div>
                </div>
              </>
            )}
          </div>

          <div className="dash-grid">
            
            {/* الرسم البياني التفاعلي (بدون مكتبات خارجية لتجنب الأخطاء) */}
            <div className="section-card">
              <div className="section-header">أداء المبيعات (آخر 6 شهور)</div>
              <div className="chart-container">
                {loading ? (
                   Array.from({length: 6}).map((_, i) => (
                    <div className="chart-bar-group" key={i}>
                      <div className="chart-track"><div className="skeleton sk-chart"></div></div>
                    </div>
                  ))
                ) : (
                  chartData.map((d, i) => {
                    const heightPercent = maxChartVal > 0 ? (d.value / maxChartVal) * 100 : 0;
                    return (
                      <div className="chart-bar-group" key={i}>
                        <div className="chart-track">
                          <div className="chart-fill" style={{ height: `${heightPercent}%` }}>
                            <div className="chart-tooltip">EGP {d.value.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="chart-label">{d.name}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* الصفقات التي تتطلب إجراء (Closing Soon / Pending) */}
            <div className="section-card">
              <div className="section-header">مهام عاجلة للمراجعة</div>
              <div>
                {loading ? (
                   Array.from({length: 3}).map((_, i) => (
                    <div className="list-item" key={i}>
                      <div style={{width:'100%'}}>
                        <div className="skeleton sk-title" style={{width:'50%', margin:0}}></div>
                        <div className="skeleton sk-text" style={{width:'30%', height:'10px', marginTop:'8px'}}></div>
                      </div>
                    </div>
                  ))
                ) : actionNeeded.length === 0 ? (
                  <div style={{padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px'}}>لا يوجد صفقات معلقة. عمل رائع!</div>
                ) : (
                  actionNeeded.map(deal => (
                    <div className="list-item" key={deal.id}>
                      <div>
                        <div className="item-title">{deal.buyer_name}</div>
                        <div className="item-sub">{deal.compound} - {deal.developer}</div>
                      </div>
                      <div style={{textAlign: 'left'}}>
                        <div className="badge-urgent">تحتاج اعتماد</div>
                        <Link href={`/dashboard/deals/${deal.id}`} style={{fontSize: '12px', color: '#185FA5', textDecoration: 'none', fontWeight: '700', display: 'block', marginTop: '6px', direction: 'ltr'}}>مراجعة ↗</Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}