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
  .main-content { margin-right: 64px; flex: 1; padding: 30px; max-width: 1400px; margin-left: auto; margin-right: auto;}
  
  .header-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }
  
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .kpi-card { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
  .kpi-title { font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 8px; }
  .kpi-value { font-size: 28px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right;}
  .kpi-trend { font-size: 12px; font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 4px; margin-top: 8px; background: #ECFDF5; width: fit-content; padding: 2px 8px; border-radius: 4px;}

  .report-section { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);}
  .section-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;}

  /* CSS Progress Bars */
  .bar-container { width: 100%; background: #f1f5f9; border-radius: 8px; height: 12px; overflow: hidden; margin-top: 8px;}
  .bar-fill { height: 100%; background: linear-gradient(90deg, #185FA5, #3b82f6); border-radius: 8px; transition: width 1s ease-in-out;}
  
  .dev-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .dev-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .dev-val { font-size: 14px; font-weight: 800; color: #185FA5; direction: ltr; }
`;

export default function ReportsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      // 💡 السحر هنا: نطلب الصفقات ونجلب اسم المطور عبر الـ JOIN باستخدام developer_id
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          developer:developers(name)
        `)
        .order('created_at', { ascending: false });

      if (data) setDeals(data);
      setLoading(false);
    }
    fetchReportData();
  }, []);

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>جاري تجميع البيانات التحليلية...</div>;

  // الحسابات المالية (KPIs)
  const totalSales = deals.reduce((sum, deal) => sum + Number(deal.unit_value || 0), 0);
  const totalCollected = deals.reduce((sum, deal) => sum + Number(deal.amount_paid || 0), 0);
  const closedDealsCount = deals.filter(d => ['Contracted', 'Registration', 'Handover'].includes(d.stage)).length;

  // تحليل أداء المطورين (تجميع المبيعات لكل مطور)
  const devPerformance: Record<string, number> = {};
  deals.forEach(deal => {
    // إذا لم يجد الربط، يضعه تحت "غير محدد" لتعرف أن هناك خطأ في إدخال هذه البيعة
    const devName = deal.developer?.name || deal.developer || 'غير محدد'; 
    if (!devPerformance[devName]) devPerformance[devName] = 0;
    devPerformance[devName] += Number(deal.unit_value || 0);
  });

  // ترتيب المطورين من الأعلى مبيعاً للأقل
  const sortedDevs = Object.entries(devPerformance).sort((a, b) => b[1] - a[1]);
  const maxDevSales = sortedDevs.length > 0 ? sortedDevs[0][1] : 1; // لحساب النسبة المئوية للأشرطة

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية المعتادة */}
      <div className="sidebar" style={{width:'64px', background:'#0f1c2e', position:'fixed', right:0, top:0, bottom:0}}>
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
      </div>

      <div className="main-content">
        <h1 className="header-title">
          <svg width="28" height="28" fill="none" stroke="#185FA5" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
          لوحة التقارير والتحليلات المالية
        </h1>

        {/* المؤشرات الرئيسية KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">إجمالي المبيعات (Total Sales Volume)</div>
            <div className="kpi-value">{totalSales.toLocaleString()} EGP</div>
            <div className="kpi-trend">↑ 12% نمو عن الشهر السابق</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">إجمالي التحصيلات (المقدمات المدفوعة)</div>
            <div className="kpi-value" style={{color: '#10B981'}}>{totalCollected.toLocaleString()} EGP</div>
            <div className="kpi-trend">سيولة نقدية محققة</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">نسبة الإغلاق (Closed Deals)</div>
            <div className="kpi-value" style={{color: '#8b5cf6'}}>{closedDealsCount} صفقات</div>
            <div className="kpi-trend">تمت كتابة العقود بنجاح</div>
          </div>
        </div>

        {/* التقرير الحرِج: أداء المطورين العقاريين */}
        <div className="report-section">
          <div className="section-title">تقرير أداء المطورين العقاريين (Developer Performance)</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sortedDevs.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center' }}>لا توجد بيانات مبيعات حتى الآن.</div>
            ) : (
              sortedDevs.map(([devName, sales]) => {
                const percentage = (sales / maxDevSales) * 100;
                return (
                  <div key={devName}>
                    <div className="dev-row">
                      <span className="dev-name">
                        {devName === 'غير محدد' && '⚠️ '} {devName}
                      </span>
                      <span className="dev-val">{sales.toLocaleString()} EGP</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${percentage}%`,
                          background: devName === 'غير محدد' ? '#DC2626' : 'linear-gradient(90deg, #185FA5, #3b82f6)'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* تنبيه للنظام */}
        {sortedDevs.some(([name]) => name === 'غير محدد') && (
           <div style={{background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '15px', borderRadius: '8px', color: '#DC2626', fontSize: '13px', fontWeight: 600}}>
             ⚠️ تنبيه: توجد مبيعات مسجلة تحت بند "غير محدد". يرجى العودة لصفحة المبيعات وتعديل هذه الصفقات لربطها بالمطور الصحيح لضمان دقة حسابات العمولات.
           </div>
        )}

      </div>
    </div>
  );
}