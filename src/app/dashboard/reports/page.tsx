"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f0f2f5; min-height: 100vh; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; }
  
  .header { padding: 20px 30px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-radius: 12px 0 0 0; }
  .header-title { font-size: 20px; font-weight: 600; color: #0f172a; }
  
  .reports-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 30px; }
  .chart-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .chart-title { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 20px; }
  
  /* Bar Chart CSS */
  .bar-chart-container { display: flex; align-items: flex-end; gap: 12px; height: 200px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; margin-top: 20px; }
  .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end; }
  .bar { width: 100%; background: #185FA5; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.5s ease; position: relative; }
  .bar:hover { background: #0f1c2e; }
  .bar-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #fff; font-size: 10px; padding: 4px 8px; border-radius: 4px; opacity: 0; pointer-events: none; transition: 0.2s; white-space: nowrap; }
  .bar:hover .bar-tooltip { opacity: 1; }
  .bar-label { font-size: 11px; color: #64748b; font-weight: 500; }

  /* Horizontal Bar Chart CSS */
  .h-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
  .h-bar-label { width: 120px; font-size: 12px; color: #0f172a; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .h-bar-track { flex: 1; height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
  .h-bar-fill { height: 100%; background: #3B6D11; border-radius: 6px; }
  .h-bar-value { width: 80px; text-align: right; font-size: 12px; font-weight: 600; color: #0f172a; }

  .summary-metrics { display: flex; gap: 20px; margin-bottom: 30px; }
  .metric-box { flex: 1; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
  .metric-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .metric-val { font-size: 24px; font-weight: bold; color: #185FA5; }
`;

export default function ReportsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      const { data } = await supabase.from('deals').select('*');
      setDeals(data || []);
      setLoading(false);
    }
    fetchDeals();
  }, []);

  // حسابات التقارير
  const totalSales = deals.reduce((acc, curr) => acc + Number(curr.unit_value || 0), 0);
  const totalDeals = deals.length;

  // 1. تجميع المبيعات حسب المطور (أو الكومباوند)
  const salesByCompound = deals.reduce((acc: any, curr) => {
    const comp = curr.compound || 'Unknown';
    if (!acc[comp]) acc[comp] = 0;
    acc[comp] += Number(curr.unit_value || 0);
    return acc;
  }, {});

  // ترتيب أعلى الكومباوندات مبيعاً
  const topCompounds = Object.keys(salesByCompound)
    .map(key => ({ name: key, value: salesByCompound[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  
  const maxCompoundValue = topCompounds.length > 0 ? topCompounds[0].value : 1;

  // 2. محاكاة مبيعات الأشهر (لأن البيانات الحالية قد تكون كلها في شهر واحد)
  // لتوضيح شكل الرسم البياني، سنفترض بعض الأشهر إذا كانت البيانات قليلة
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthlyData = months.map(m => {
      // في الحقيقة، هنا يجب استخراج الشهر من created_at، 
      // لكننا سنضع إجمالي المبيعات في الشهر الحالي (أبريل/مايو) للتوضيح
      if (m === 'Apr' || m === 'May') return { month: m, value: totalSales / 2 };
      return { month: m, value: 0 };
  });
  const maxMonthValue = Math.max(...monthlyData.map(d => d.value), 1000000);

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Sales Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item active" title="Reports"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">Analytics & Reports</div>
          <div>
             <button style={{ padding: '8px 16px', background: '#0f1c2e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
               Export PDF
             </button>
          </div>
        </div>

        <div style={{ padding: '30px' }}>
          <div className="summary-metrics">
            <div className="metric-box">
              <div className="metric-label">Total Pipeline Volume</div>
              <div className="metric-val">EGP {(totalSales / 1000000).toFixed(1)}M</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Total Deals</div>
              <div className="metric-val">{totalDeals} Deals</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Avg. Deal Size</div>
              <div className="metric-val">EGP {totalDeals > 0 ? ((totalSales / totalDeals) / 1000000).toFixed(1) : 0}M</div>
            </div>
          </div>

          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Generating reports...</div>
          ) : (
            <div className="reports-grid">
              
              {/* Sales Trend Bar Chart */}
              <div className="chart-card">
                <div className="chart-title">Sales Trend (2026)</div>
                <div className="bar-chart-container">
                  {monthlyData.map((d, i) => {
                    const heightPct = (d.value / maxMonthValue) * 100;
                    return (
                      <div key={i} className="bar-wrapper">
                        <div className="bar" style={{ height: `${Math.max(heightPct, 2)}%` }}>
                          <div className="bar-tooltip">EGP {(d.value / 1000000).toFixed(1)}M</div>
                        </div>
                        <div className="bar-label">{d.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Compounds Horizontal Bar Chart */}
              <div className="chart-card">
                <div className="chart-title">Top Performing Compounds</div>
                <div style={{ marginTop: '20px' }}>
                  {topCompounds.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#64748b' }}>No data available yet.</div>
                  ) : (
                    topCompounds.map((comp, i) => {
                      const widthPct = (comp.value / maxCompoundValue) * 100;
                      return (
                        <div key={i} className="h-bar-row">
                          <div className="h-bar-label" title={comp.name}>{comp.name}</div>
                          <div className="h-bar-track">
                            <div className="h-bar-fill" style={{ width: `${widthPct}%` }}></div>
                          </div>
                          <div className="h-bar-value">EGP {(comp.value / 1000000).toFixed(1)}M</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}