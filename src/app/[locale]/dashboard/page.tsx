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
  
  .welcome-section { background: linear-gradient(135deg, #0f1c2e 0%, #185FA5 100%); color: #fff; border-radius: 16px; padding: 30px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 15px -3px rgba(24,95,165,0.2);}
  .welcome-text h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .welcome-text p { font-size: 15px; color: #cbd5e1; }
  
  .quick-actions { display: flex; gap: 10px; }
  .btn-quick { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; transition: 0.2s; backdrop-filter: blur(4px);}
  .btn-quick:hover { background: #fff; color: #185FA5; }

  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .kpi-card { background: #fff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: flex-start; justify-content: space-between; transition: transform 0.2s; }
  .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
  .kpi-info { display: flex; flex-direction: column; gap: 5px; }
  .kpi-title { font-size: 13px; font-weight: 700; color: #64748b; }
  .kpi-value { font-size: 24px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right;}
  .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }

  .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
  @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
  
  .card-section { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; }
  .section-header { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;}
  .view-all { font-size: 13px; color: #185FA5; font-weight: 700; text-decoration: none; }
  
  .recent-deal { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f1f5f9; }
  .recent-deal:last-child { border-bottom: none; padding-bottom: 0; }
  .deal-agent { font-size: 14px; font-weight: 700; color: #0f172a; }
  .deal-compound { font-size: 12px; color: #64748b; }
  .deal-value { font-size: 14px; font-weight: 800; color: #10B981; direction: ltr;}
  
  .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
  .badge-blue { background: #EFF6FF; color: #3B82F6; }
`;

export default function MainDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{full_name: string, role: string} | null>(null);
  
  // الإحصائيات
  const [kpis, setKpis] = useState({
    monthlySales: 0,
    activeInventoryValue: 0,
    newClients: 0,
    pendingCommissions: 0
  });
  
  const [recentDeals, setRecentDeals] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      
      // 1. جلب بيانات المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        if (userProfile) setProfile(userProfile);
      }

      // تحديد بداية الشهر الحالي للحسابات
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 2. المبيعات هذا الشهر
      const { data: dealsMonth } = await supabase.from('deals').select('unit_value').gte('created_at', startOfMonth);
      const monthlySales = dealsMonth?.reduce((sum, d) => sum + Number(d.unit_value || 0), 0) || 0;

      // 3. قيمة المخزون المتاح
      const { data: inventoryData } = await supabase.from('inventory').select('price').eq('status', 'Available');
      const activeInventoryValue = inventoryData?.reduce((sum, item) => sum + Number(item.price || 0), 0) || 0;

      // 4. العملاء الجدد هذا الشهر
      const { count: clientsCount } = await supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth);

      // 5. العمولات المستحقة (للموظف أو للإدارة حسب الـ RLS)
      const { data: commsData } = await supabase.from('commissions').select('agent_commission_value').neq('status', 'Paid');
      const pendingCommissions = commsData?.reduce((sum, c) => sum + Number(c.agent_commission_value || 0), 0) || 0;

      setKpis({ monthlySales, activeInventoryValue, newClients: clientsCount || 0, pendingCommissions });

      // 6. آخر الصفقات المسجلة
      const { data: latestDeals } = await supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(5);
      if (latestDeals) setRecentDeals(latestDeals);

      setLoading(false);
    }
    loadDashboardData();
  }, []);

  const getRoleTitle = (role: string) => {
    if (role === 'super_admin') return 'المدير العام';
    if (role === 'sales_manager') return 'مدير المبيعات';
    if (role === 'accountant') return 'الإدارة المالية';
    return 'مستشار عقاري';
  };

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f8fafc', color:'#185FA5', fontWeight:800, fontSize:'20px'}}>جاري تحميل مركز القيادة... 🦅</div>;

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية (Sidebar) */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/whatsapp" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        <Link href="/dashboard/team" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
      </div>

      <div className="main-content">
        
        {/* الترحيب والإجراءات السريعة */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>أهلاً بك، {profile?.full_name?.split(' ')[0] || 'يا بطل'} 👋</h1>
            <p>الصفة التوظيفية: {getRoleTitle(profile?.role || 'agent')} | EHAB & ESLAM TEAM</p>
          </div>
          <div className="quick-actions">
            <Link href="/dashboard/leads" className="btn-quick">+ تسجيل بيعة</Link>
            <Link href="/dashboard/clients" className="btn-quick">+ إضافة عميل</Link>
          </div>
        </div>

        {/* مؤشرات الأداء الحية (KPIs) */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-info">
              <div className="kpi-title">مبيعات الشهر الحالي</div>
              <div className="kpi-value">{kpis.monthlySales.toLocaleString()} EGP</div>
            </div>
            <div className="kpi-icon" style={{background: '#EFF6FF', color: '#3B82F6'}}>📈</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-info">
              <div className="kpi-title">المخزون المتاح للبيع</div>
              <div className="kpi-value">{kpis.activeInventoryValue.toLocaleString()} EGP</div>
            </div>
            <div className="kpi-icon" style={{background: '#ECFDF5', color: '#10B981'}}>🏢</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <div className="kpi-title">العمولات المستحقة للتحصيل</div>
              <div className="kpi-value" style={{color: '#F59E0B'}}>{kpis.pendingCommissions.toLocaleString()} EGP</div>
            </div>
            <div className="kpi-icon" style={{background: '#FFFBEB', color: '#F59E0B'}}>💰</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <div className="kpi-title">عملاء جدد هذا الشهر</div>
              <div className="kpi-value" style={{color: '#8B5CF6'}}>{kpis.newClients} عميل</div>
            </div>
            <div className="kpi-icon" style={{background: '#F5F3FF', color: '#8B5CF6'}}>👥</div>
          </div>
        </div>

        {/* الأقسام السفلية */}
        <div className="dashboard-grid">
          {/* سجل أحدث المبيعات */}
          <div className="card-section">
            <div className="section-header">
              <span>آخر الصفقات المسجلة ⚡</span>
              <Link href="/dashboard/leads" className="view-all">عرض الكل</Link>
            </div>
            <div>
              {recentDeals.length === 0 ? (
                <div style={{color: '#64748b', textAlign: 'center', padding: '20px 0'}}>لا توجد مبيعات مسجلة حتى الآن.</div>
              ) : (
                recentDeals.map(deal => (
                  <div key={deal.id} className="recent-deal">
                    <div>
                      <div className="deal-agent">{deal.buyer_name}</div>
                      <div className="deal-compound">{deal.compound} - {deal.developer}</div>
                    </div>
                    <div style={{textAlign: 'left'}}>
                      <div className="deal-value">{Number(deal.unit_value).toLocaleString()} EGP</div>
                      <span className="badge badge-blue">{deal.stage}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* لوحة الإعلانات أو المهام */}
          <div className="card-section" style={{background: '#0f1c2e', color: '#fff', borderColor: '#0f1c2e'}}>
            <div className="section-header" style={{color: '#fff'}}>إعلانات الإدارة 📢</div>
            <div style={{background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '10px'}}>
              <div style={{fontSize: '13px', color: '#94a3b8', marginBottom: '5px'}}>من: الإدارة العليا</div>
              <div style={{fontSize: '14px', fontWeight: 700, lineHeight: '1.6'}}>
                تم إطلاق النظام المؤسسي الجديد! يرجى التأكد من تسجيل جميع العملاء وربط المبيعات بالمخزون العقاري.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}