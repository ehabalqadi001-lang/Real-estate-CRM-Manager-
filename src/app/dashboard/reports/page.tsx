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
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; }
  
  .content-body { padding: 30px; max-width: 1200px; width: 100%; margin: 0 auto; }
  
  /* KPI Cards */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .kpi-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .kpi-title { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .kpi-value { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .kpi-sub { font-size: 12px; font-weight: 500; }
  .text-green { color: #3B6D11; }
  .text-blue { color: #185FA5; }
  
  /* Charts Area */
  .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
  @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
  .chart-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .chart-header { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
  .chart-header::before { content: ''; display: block; width: 4px; height: 16px; background: #185FA5; border-radius: 4px; }
  
  /* CSS Bar Chart */
  .bar-chart { display: flex; align-items: flex-end; gap: 12px; height: 250px; padding-top: 20px; border-bottom: 1px solid #e2e8f0; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end; }
  .bar-track { width: 100%; max-width: 40px; background: #f1f5f9; border-radius: 4px 4px 0 0; display: flex; align-items: flex-end; height: 100%; position: relative; }
  .bar-fill { width: 100%; background: #185FA5; border-radius: 4px 4px 0 0; transition: height 1s ease-out; position: relative; }
  .bar-fill:hover { background: #0f1c2e; }
  .bar-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #0f1c2e; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap; opacity: 0; transition: 0.2s; pointer-events: none; }
  .bar-fill:hover .bar-tooltip { opacity: 1; }
  .bar-label { font-size: 11px; color: #64748b; font-weight: 600; }
  
  /* Funnel Chart */
  .funnel-stage { margin-bottom: 15px; }
  .funnel-label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 6px; }
  .funnel-track { height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
  .funnel-fill { height: 100%; background: #185FA5; border-radius: 6px; }
`;

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    expectedComm: 0,
    collectedComm: 0,
    activeClients: 0,
    dealsCount: 0
  });
  const [pipeline, setPipeline] = useState({ eoi: 0, res: 0, contract: 0, total: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      // 1. Fetch Deals
      const { data: deals } = await supabase.from('deals').select('*');
      // 2. Fetch Clients
      const { data: clients } = await supabase.from('clients').select('id');
      
      if (deals) {
        let sales = 0;
        let expComm = 0;
        let colComm = 0;
        let stages = { eoi: 0, res: 0, contract: 0, total: deals.length };
        
        // Data for monthly chart
        const monthsMap: Record<string, number> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        deals.forEach(deal => {
          const val = Number(deal.unit_value || 0);
          sales += val;
          const comm = val * 0.05; // 5% comm
          expComm += comm;
          
          if (deal.finance_status === 'Commission Received' || deal.finance_status === 'Transferred to Agent') {
            colComm += comm;
          }

          if (deal.stage === 'EOI') stages.eoi++;
          else if (deal.stage === 'Reservation') stages.res++;
          else if (deal.stage === 'Contracted') stages.contract++;

          // Group by month
          const date = new Date(deal.created_at);
          const monthKey = monthNames[date.getMonth()];
          monthsMap[monthKey] = (monthsMap[monthKey] || 0) + val;
        });

        // Format chart data (last 6 months logic simplified for UI)
        const chartData = monthNames.map(m => ({
          name: m,
          value: monthsMap[m] || 0
        })).filter(m => m.value > 0); // Only show months with sales

        // If no data, show placeholder
        if (chartData.length === 0) {
          chartData.push({ name: 'This Month', value: 0 });
        }

        const maxVal = Math.max(...chartData.map(d => d.value), 1);
        const formattedChartData = chartData.map(d => ({
          ...d,
          height: `${(d.value / maxVal) * 100}%`,
          displayValue: d.value > 1000000 ? `${(d.value / 1000000).toFixed(1)}M` : d.value
        }));

        setStats({
          totalSales: sales,
          expectedComm: expComm,
          collectedComm: colComm,
          activeClients: clients?.length || 0,
          dealsCount: deals.length
        });
        setPipeline(stages);
        setMonthlyData(formattedChartData);
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Compiling Analytics...</div>;

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar - Added Reports Icon */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        {/* Reports Icon */}
        <Link href="/dashboard/reports" className="nav-item active" title="Reports & Analytics"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">Performance Analytics</div>
        </div>

        <div className="content-body">
          {/* Executive KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Total Sales Volume</div>
              <div className="kpi-value text-blue">EGP {stats.totalSales.toLocaleString()}</div>
              <div className="kpi-sub text-blue">Across {stats.dealsCount} registered deals</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Total Commission Pipeline</div>
              <div className="kpi-value">EGP {stats.expectedComm.toLocaleString()}</div>
              <div className="kpi-sub text-green">Collected: EGP {stats.collectedComm.toLocaleString()}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Client Database</div>
              <div className="kpi-value">{stats.activeClients}</div>
              <div className="kpi-sub" style={{color: '#64748b'}}>Active investor profiles</div>
            </div>
          </div>

          <div className="charts-grid">
            {/* Sales Bar Chart */}
            <div className="chart-card">
              <div className="chart-header">Sales Performance by Month</div>
              <div className="bar-chart">
                {monthlyData.map((d, i) => (
                  <div className="bar-col" key={i}>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: d.height }}>
                        <div className="bar-tooltip">EGP {d.value.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="bar-label">{d.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Funnel */}
            <div className="chart-card">
              <div className="chart-header">Conversion Funnel</div>
              <div style={{ marginTop: '30px' }}>
                <div className="funnel-stage">
                  <div className="funnel-label"><span>EOI (Expression of Interest)</span> <span>{pipeline.eoi} Deals</span></div>
                  <div className="funnel-track">
                    <div className="funnel-fill" style={{ width: pipeline.total ? `${(pipeline.eoi / pipeline.total) * 100}%` : '0%', background: '#94a3b8' }}></div>
                  </div>
                </div>
                <div className="funnel-stage">
                  <div className="funnel-label"><span>Reservation</span> <span>{pipeline.res} Deals</span></div>
                  <div className="funnel-track">
                    <div className="funnel-fill" style={{ width: pipeline.total ? `${(pipeline.res / pipeline.total) * 100}%` : '0%', background: '#BA7517' }}></div>
                  </div>
                </div>
                <div className="funnel-stage">
                  <div className="funnel-label"><span>Contracted (Final)</span> <span>{pipeline.contract} Deals</span></div>
                  <div className="funnel-track">
                    <div className="funnel-fill" style={{ width: pipeline.total ? `${(pipeline.contract / pipeline.total) * 100}%` : '0%', background: '#3B6D11' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}