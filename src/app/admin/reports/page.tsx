"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PAGE_CSS = `
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px; }
  .report-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .card-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
  
  .branch-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  .branch-name { font-size: 14px; font-weight: 700; color: #334155; }
  .branch-val { font-size: 14px; font-weight: 800; color: #185FA5; direction: ltr;}
  
  .bar-bg { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-top: 6px; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); border-radius: 4px; }
`;

export default function EnterpriseReports() {
  const [loading, setLoading] = useState(true);
  const [branchPerformance, setBranchPerformance] = useState<any[]>([]);

  useEffect(() => {
    async function loadReports() {
      // جلب جميع الصفقات مع بيانات الموظف والشركة الخاصة به
      const { data: deals } = await supabase
        .from('deals')
        .select(`
          unit_value,
          created_by,
          agent:user_profiles!deals_created_by_fkey(
             full_name,
             agents!inner(company_id, companies(name))
          )
        `);

      if (deals) {
        // تجميع المبيعات حسب الفروع برمجياً
        const branchTotals: Record<string, number> = {};
        let maxVal = 0;

        deals.forEach((deal: any) => {
          // استخراج اسم الشركة بأسلوب آمن
          const companyName = deal.agent?.agents?.[0]?.companies?.name || 'مبيعات مباشرة / غير مصنفة';
          const val = Number(deal.unit_value || 0);
          
          if (!branchTotals[companyName]) branchTotals[companyName] = 0;
          branchTotals[companyName] += val;
          
          if (branchTotals[companyName] > maxVal) maxVal = branchTotals[companyName];
        });

        // تحويل الكائن إلى مصفوفة للرسم
        const performanceArray = Object.keys(branchTotals).map(name => ({
          name,
          total: branchTotals[name],
          percentage: maxVal > 0 ? (branchTotals[name] / maxVal) * 100 : 0
        })).sort((a, b) => b.total - a.total); // الترتيب التنازلي

        setBranchPerformance(performanceArray);
      }
      setLoading(false);
    }
    
    loadReports();
  }, []);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <h1 style={{fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '25px'}}>التقارير المؤسسية (Enterprise Analytics)</h1>

      <div className="grid-2">
        {/* تقرير أداء الفروع */}
        <div className="report-card">
          <h2 className="card-title">🏆 أداء الفروع والمناطق (إجمالي المبيعات)</h2>
          {loading ? <p>جاري الحساب...</p> : branchPerformance.length === 0 ? <p>لا توجد بيانات مبيعات كافية.</p> : (
            <div>
              {branchPerformance.map((branch, idx) => (
                <div key={idx} style={{marginBottom: '20px'}}>
                  <div className="branch-row">
                    <span className="branch-name">{idx + 1}. {branch.name}</span>
                    <span className="branch-val">{branch.total.toLocaleString()} EGP</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{width: `${branch.percentage}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تقرير يمكن توسيعه مستقبلاً (مثل أفضل المطورين على مستوى المؤسسة) */}
        <div className="report-card">
          <h2 className="card-title">📊 تحليلات أخرى (قريباً)</h2>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8'}}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{marginBottom: '10px'}}><path d="M3 3v18h18"/><path d="M18 9l-5 5-3-3-5 5"/></svg>
            <p>سيتم تفعيل تقارير العمولات المجمعة قريباً.</p>
          </div>
        </div>
      </div>
    </div>
  );
}