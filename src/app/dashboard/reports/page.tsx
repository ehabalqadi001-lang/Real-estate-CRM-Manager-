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
  
  .action-buttons { display: flex; gap: 10px; }
  .btn-export { background: #10b981; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-export:hover { background: #059669; }
  .btn-print { background: #0f1c2e; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-print:hover { background: #1e3a5f; }

  .content-body { padding: 30px; max-width: 1400px; width: 100%; margin: 0 auto; }
  
  .filter-group { display: flex; background: #e2e8f0; padding: 4px; border-radius: 8px; width: fit-content; margin-bottom: 30px; }
  .filter-btn { padding: 8px 16px; border: none; background: transparent; border-radius: 6px; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
  .filter-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  @media(max-width: 1024px) { .report-grid { grid-template-columns: 1fr; } }
  
  .report-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 25px; display: flex; align-items: center; gap: 8px; }
  .card-title::before { content: ''; display: block; width: 4px; height: 16px; background: #185FA5; border-radius: 4px; }

  /* Funnel Styles */
  .funnel-container { display: flex; flex-direction: column; gap: 8px; align-items: center; }
  .funnel-stage { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; color: #fff; font-weight: 700; font-size: 14px; border-radius: 4px; }
  
  /* Target Styles */
  .target-val { font-size: 36px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right; margin-bottom: 15px;}
  .progress-bg { height: 16px; background: #f1f5f9; border-radius: 8px; overflow: hidden; margin-bottom: 12px; border: 1px solid #e2e8f0;}
  .progress-fill { height: 100%; border-radius: 8px; transition: width 1s ease-out; }

  /* Table Styles */
  .table-container { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 14px 16px; background: #f8fafc; color: #475569; font-size: 13px; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
  td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; }
  
  /* Print Styles */
  @media print {
    .sidebar, .filter-group, .action-buttons { display: none !important; }
    .main-content { margin: 0 !important; width: 100% !important; }
    .dashboard-container { background: #fff; }
    .report-card { box-shadow: none; border: 1px solid #cbd5e1; break-inside: avoid; }
    body { background: #fff; }
  }
`;

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Month'); // Month, Quarter, Year
  const [deals, setDeals] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);

  // الأهداف الافتراضية للمبيعات (Targets) - يمكن ربطها بجدول الإعدادات لاحقاً
  const TARGETS = { Month: 50000000, Quarter: 150000000, Year: 600000000 };

  useEffect(() => {
    async function fetchReportsData() {
      const { data: dealsData } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
      const { data: rulesData } = await supabase.from('commission_rules').select('*');
      const { data: devData } = await supabase.from('developers').select('*');
      
      setDeals(dealsData || []);
      setRules(rulesData || []);
      setDevelopers(devData || []);
      setLoading(false);
    }
    fetchReportsData();
  }, []);

  // 1. فلترة المبيعات حسب الوقت
  const getFilteredDeals = () => {
    const now = new Date();
    return deals.filter(deal => {
      const dDate = new Date(deal.created_at);
      if (timeFilter === 'Month') return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
      if (timeFilter === 'Year') return dDate.getFullYear() === now.getFullYear();
      if (timeFilter === 'Quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const dealQuarter = Math.floor(dDate.getMonth() / 3);
        return currentQuarter === dealQuarter && dDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredDeals = getFilteredDeals();

  // 2. حسابات التارجت والأداء
  const totalSales = filteredDeals.reduce((acc, d) => acc + Number(d.unit_value || 0), 0);
  const currentTarget = TARGETS[timeFilter as keyof typeof TARGETS];
  const progressPercent = Math.min((totalSales / currentTarget) * 100, 100);
  const progressColor = progressPercent >= 100 ? '#10b981' : progressPercent >= 50 ? '#f59e0b' : '#ef4444';

  // 3. قمع المبيعات (Sales Funnel) بناءً على المراحل المصرية
  const funnelData = {
    total_leads: filteredDeals.length,
    eoi: filteredDeals.filter(d => ['EOI', 'Reservation', 'Contracted', 'Registration', 'Handover'].includes(d.stage)).length,
    reservation: filteredDeals.filter(d => ['Reservation', 'Contracted', 'Registration', 'Handover'].includes(d.stage)).length,
    contracted: filteredDeals.filter(d => ['Contracted', 'Registration', 'Handover'].includes(d.stage)).length,
    registration: filteredDeals.filter(d => ['Registration', 'Handover'].includes(d.stage)).length,
    handover: filteredDeals.filter(d => ['Handover'].includes(d.stage)).length,
  };

  // 4. تقرير المطورين والعمولات المتقدم (يقرأ نسبة العمولة الحقيقية من الداتابيز)
  const devStats = filteredDeals.reduce((acc, deal) => {
    const devName = deal.developer || 'غير محدد';
    if (!acc[devName]) acc[devName] = { volume: 0, count: 0, est_commission: 0 };
    
    acc[devName].volume += Number(deal.unit_value || 0);
    acc[devName].count += 1;
    
    // البحث عن نسبة العمولة الخاصة بهذا المطور
    const developerObj = developers.find(d => d.name === devName);
    let devPercentage = 0.025; // افتراضي 2.5%
    if (developerObj) {
      const devRule = rules.find(r => r.developer_id === developerObj.id);
      if (devRule) devPercentage = devRule.percentage / 100;
    }
    
    acc[devName].est_commission += Number(deal.unit_value || 0) * devPercentage;
    return acc;
  }, {} as Record<string, any>);

  const sortedDevs = Object.entries(devStats).sort((a: any, b: any) => b[1].volume - a[1].volume);

  // تصدير Excel
  const exportToExcel = () => {
    const BOM = "\uFEFF";
    const headers = ['المطور العقاري', 'عدد الصفقات', 'حجم المبيعات (جنيه)', 'العمولة المتوقعة (جنيه)'];
    const rows = sortedDevs.map((item: any) => [item[0], item[1].count, item[1].volume, item[1].est_commission]);
    const csvContent = BOM + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FastInvestment_Reports_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // طباعة PDF
  const printPDF = () => { window.print(); };

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
        <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        <Link href="/dashboard/settings" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">التقارير التحليلية (Analytics & Reports)</div>
          <div className="action-buttons">
            <button className="btn-print" onClick={printPDF}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              تصدير إلى PDF
            </button>
            <button className="btn-export" onClick={exportToExcel}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              تصدير إلى Excel
            </button>
          </div>
        </div>

        <div className="content-body">
          
          <div className="filter-group">
            <button className={`filter-btn ${timeFilter === 'Month' ? 'active' : ''}`} onClick={() => setTimeFilter('Month')}>تقرير الشهر الحالي</button>
            <button className={`filter-btn ${timeFilter === 'Quarter' ? 'active' : ''}`} onClick={() => setTimeFilter('Quarter')}>تقرير الربع السنوي</button>
            <button className={`filter-btn ${timeFilter === 'Year' ? 'active' : ''}`} onClick={() => setTimeFilter('Year')}>تقرير العام الحالي</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>جاري استخراج التقارير...</div>
          ) : (
            <>
              <div className="report-grid">
                {/* 1. تقرير الأهداف والمبيعات */}
                <div className="report-card">
                  <div className="card-title">نسبة تحقيق الهدف (Target Tracking)</div>
                  <div className="target-val">EGP {totalSales.toLocaleString('ar-EG')}</div>
                  <div className="progress-bg"><div className="progress-fill" style={{width: `${progressPercent}%`, background: progressColor}}></div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', fontWeight: 700 }}>
                    <span>المستهدف: {currentTarget.toLocaleString('ar-EG')}</span>
                    <span style={{color: progressColor}}>{progressPercent.toFixed(1)}% تم إنجازه</span>
                  </div>
                </div>

                {/* 2. قمع المبيعات (Funnel) */}
                <div className="report-card">
                  <div className="card-title">قمع مسار المبيعات (Sales Funnel)</div>
                  <div className="funnel-container">
                    <div className="funnel-stage" style={{width: '100%', background: '#94a3b8'}}>
                      <span>1. إجمالي الفرص (Leads)</span><span>{funnelData.total_leads}</span>
                    </div>
                    <div className="funnel-stage" style={{width: '85%', background: '#64748b'}}>
                      <span>2. إبداء اهتمام (EOI)</span><span>{funnelData.eoi}</span>
                    </div>
                    <div className="funnel-stage" style={{width: '70%', background: '#f59e0b'}}>
                      <span>3. حجز وحدة (Reservation)</span><span>{funnelData.reservation}</span>
                    </div>
                    <div className="funnel-stage" style={{width: '55%', background: '#3b82f6'}}>
                      <span>4. تعاقد مبدئي (Contracted)</span><span>{funnelData.contracted}</span>
                    </div>
                    <div className="funnel-stage" style={{width: '40%', background: '#8b5cf6'}}>
                      <span>5. شهر عقاري (Registration)</span><span>{funnelData.registration}</span>
                    </div>
                    <div className="funnel-stage" style={{width: '25%', background: '#10b981'}}>
                      <span>6. تسليم نهائي (Handover)</span><span>{funnelData.handover}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. تقرير المطورين والعمولات */}
              <div className="report-card">
                <div className="card-title">تقرير أداء المطورين والعمولات المتوقعة</div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>اسم المطور العقاري</th>
                        <th>عدد الصفقات المنفذة</th>
                        <th>إجمالي حجم المبيعات (EGP)</th>
                        <th>العمولة المتوقعة (EGP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDevs.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>لا يوجد صفقات لهذه الفترة الزمنية.</td></tr>
                      ) : (
                        sortedDevs.map(([dev, data]: any) => (
                          <tr key={dev}>
                            <td style={{ color: '#185FA5', fontWeight: 700 }}>{dev}</td>
                            <td>{data.count} صفقات</td>
                            <td style={{ direction: 'ltr', textAlign: 'right', fontWeight: 700 }}>{data.volume.toLocaleString('ar-EG')}</td>
                            <td style={{ color: '#10b981', direction: 'ltr', textAlign: 'right', fontWeight: 700 }}>{data.est_commission.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}