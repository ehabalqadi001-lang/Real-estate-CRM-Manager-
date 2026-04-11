"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-title { color: #fff; font-size: 15px; font-weight: 500; }
  .avatar { width: 30px; height: 30px; border-radius: 50%; background: #185FA5; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; background: #f0f2f5; }
  .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
  .kpi-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
  .kpi-label { font-size: 12px; color: #64748b; margin-bottom: 8px; }
  .kpi-val { font-size: 24px; font-weight: bold; color: #0f172a; }
  .card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
  .card-header { padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .deal-row { padding: 12px 16px; border-bottom: 1px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; }
  .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; background: #EAF3DE; color: #3B6D11; }
`;

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalSales: 0, dealsCount: 0 });
  const [recentDeals, setRecentDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDashboardData() {
      try {
        setLoading(true);
        // 1. جلب إجمالي المبيعات
        const { data: dealsData } = await supabase.from('deals').select('unit_value');
        const total = dealsData?.reduce((acc, curr) => acc + Number(curr.unit_value), 0) || 0;
        
        setStats({ totalSales: total, dealsCount: dealsData?.length || 0 });

        // 2. جلب آخر 5 صفقات
        const { data: latest } = await supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(5);
        setRecentDeals(latest || []);

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }
    getDashboardData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="topbar">
        <div style={{ color: '#fff', fontWeight: 'bold' }}>FAST INVESTMENT</div>
        <div className="avatar">EA</div>
      </div>

      <div style={{ display: 'flex' }}>
        <div className="sidebar">
          <Link href="/dashboard" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
          <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
          <Link href="/dashboard/developers" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
        </div>

        <div className="main">
          <h1 style={{ fontSize: '20px' }}>Dashboard Overview</h1>
          
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Total Sales Volume (Real)</div>
              <div className="kpi-val">EGP {stats.totalSales.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: '#3B6D11', marginTop: '5px' }}>From {stats.dealsCount} active deals</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Active Leads</div>
              <div className="kpi-val">{stats.dealsCount}</div>
              <div style={{ fontSize: '11px', color: '#185FA5', marginTop: '5px' }}>Updated just now</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ fontWeight: 'bold' }}>Recent Pipeline Activity</div>
              <Link href="/dashboard/leads" style={{ fontSize: '12px', color: '#185FA5', textDecoration: 'none' }}>View all ↗</Link>
            </div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading activity...</div>
            ) : recentDeals.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No recent deals found.</div>
            ) : (
              recentDeals.map((deal, i) => (
                <div key={i} className="deal-row">
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{deal.buyer_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{deal.compound} • {deal.stage}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>EGP {Number(deal.unit_value).toLocaleString()}</div>
                    <span className="status-badge">{deal.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}