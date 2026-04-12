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
  .btn-primary { background: #185FA5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-primary:hover { background: #124b82; }
  .content-body { padding: 30px; max-width: 1200px; width: 100%; margin: 0 auto; }
  
  .toolbar { display: flex; gap: 15px; margin-bottom: 25px; }
  .search-input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
  .filter-select { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; background: #fff; min-width: 150px; }

  .dev-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
  .dev-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: 0.2s; position: relative; overflow: hidden;}
  .dev-card:hover { border-color: #185FA5; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  
  .dev-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;}
  .dev-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .dev-region { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px;}
  
  .class-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;}
  .class-a { background: #ECFDF5; color: #10b981; border: 1px solid #A7F3D0; }
  .class-b { background: #EFF6FF; color: #3b82f6; border: 1px solid #BFDBFE; }
  .class-c { background: #F8FAFC; color: #64748b; border: 1px solid #E2E8F0; }

  .dev-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; background: #f8fafc; padding: 12px; border-radius: 8px;}
  .stat-box { display: flex; flex-direction: column; }
  .stat-label { font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
  .stat-val { font-size: 15px; font-weight: 700; color: #0f172a; direction: ltr; text-align: right;}
  
  .dev-info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: #475569; align-items: center;}
  .dev-info-val { font-weight: 600; color: #0f172a; }
  
  .alert-badge { background: #FEF2F2; color: #DC2626; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; border: 1px solid #FCA5A5;}

  .btn-secondary { width: 100%; padding: 10px; background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 15px;}
  .btn-secondary:hover { background: #e2e8f0; }

  /* Modal Styles */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
  .modal-content { background: #fff; width: 100%; max-width: 600px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; direction: rtl; }
  .modal-header { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
  .form-group { display: flex; flex-direction: column; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .form-input, .form-select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff;}
  .form-input:focus, .form-select:focus { border-color: #185FA5; }
  .btn-submit { width: 100%; padding: 14px; background: #185FA5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; }
`;

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedDev, setSelectedDev] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    name: '', region: 'القاهرة الجديدة', class_grade: 'B', license_number: '', payment_days: 60, contract_end_date: ''
  });

  // نموذج قواعد العمولة والعقد
  const [manageData, setManageData] = useState({
    contract_end_date: '', commission_percentage: 2.5
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: devData } = await supabase.from('developers').select('*').order('name', { ascending: true });
    const { data: dealsData } = await supabase.from('deals').select('developer, unit_value');
    const { data: rulesData } = await supabase.from('commission_rules').select('*');
    
    setDevelopers(devData || []);
    setDeals(dealsData || []);
    setRules(rulesData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('developers').insert([{
      name: formData.name,
      region: formData.region,
      class_grade: formData.class_grade,
      license_number: formData.license_number || 'غير مسجل',
      payment_days: Number(formData.payment_days),
      contract_end_date: formData.contract_end_date || null
    }]).select();
    
    if (!error && data) {
      // إنشاء قاعدة عمولة افتراضية للمطور الجديد
      await supabase.from('commission_rules').insert([{
        developer_id: data[0].id, property_type: 'All', percentage: 2.5
      }]);
      setIsAddModalOpen(false);
      setFormData({ name: '', region: 'القاهرة الجديدة', class_grade: 'B', license_number: '', payment_days: 60, contract_end_date: '' });
      fetchData();
    }
  };

  const openManageModal = (dev: any) => {
    setSelectedDev(dev);
    const devRule = rules.find(r => r.developer_id === dev.id);
    setManageData({
      contract_end_date: dev.contract_end_date || '',
      commission_percentage: devRule ? devRule.percentage : 2.5
    });
    setIsManageModalOpen(true);
  };

  const handleUpdateDevSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDev) return;

    // تحديث تاريخ العقد
    await supabase.from('developers').update({ contract_end_date: manageData.contract_end_date || null }).eq('id', selectedDev.id);

    // تحديث أو إدخال نسبة العمولة
    const existingRule = rules.find(r => r.developer_id === selectedDev.id);
    if (existingRule) {
      await supabase.from('commission_rules').update({ percentage: Number(manageData.commission_percentage) }).eq('id', existingRule.id);
    } else {
      await supabase.from('commission_rules').insert([{ developer_id: selectedDev.id, property_type: 'All', percentage: Number(manageData.commission_percentage) }]);
    }

    setIsManageModalOpen(false);
    fetchData();
    alert('تم تحديث العقد وقواعد العمولة بنجاح!');
  };

  // دمج البيانات وحساب التنبيهات
  const enrichedDevelopers = developers.map(dev => {
    const devDeals = deals.filter(d => d.developer === dev.name);
    const totalVolume = devDeals.reduce((sum, d) => sum + Number(d.unit_value || 0), 0);
    const devRule = rules.find(r => r.developer_id === dev.id);
    
    // حساب تنبيه انتهاء العقد
    let contractWarning = false;
    let daysToExpiry = null;
    if (dev.contract_end_date) {
      const expiry = new Date(dev.contract_end_date).getTime();
      const now = new Date().getTime();
      daysToExpiry = Math.ceil((expiry - now) / (1000 * 3600 * 24));
      if (daysToExpiry <= 30) contractWarning = true;
    }

    return { ...dev, dealsCount: devDeals.length, totalVolume, commission: devRule ? devRule.percentage : 2.5, contractWarning, daysToExpiry };
  });

  const filteredDevelopers = enrichedDevelopers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'All' || d.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

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
        <Link href="/dashboard/developers" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">سجل المطورين (Developer Profiles)</div>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>إضافة مطور جديد</button>
        </div>

        <div className="content-body">
          <div className="toolbar">
            <input type="text" className="search-input" placeholder="ابحث باسم المطور..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="filter-select" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="All">جميع المناطق</option>
              <option value="القاهرة الجديدة">القاهرة الجديدة</option>
              <option value="العاصمة الإدارية">العاصمة الإدارية</option>
              <option value="الساحل الشمالي">الساحل الشمالي</option>
              <option value="متعدد المناطق">متعدد المناطق</option>
            </select>
          </div>

          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px' }}>جاري التحميل...</div>
          ) : (
            <div className="dev-grid">
              {filteredDevelopers.map((dev) => (
                <div className="dev-card" key={dev.id}>
                  <div className="dev-header">
                    <div>
                      <div className="dev-name">{dev.name}</div>
                      <div className="dev-region">{dev.region}</div>
                    </div>
                    <div className={`class-badge ${dev.class_grade === 'A' ? 'class-a' : dev.class_grade === 'B' ? 'class-b' : 'class-c'}`}>
                      Class {dev.class_grade}
                    </div>
                  </div>

                  <div className="dev-stats">
                    <div className="stat-box">
                      <div className="stat-label">حجم المبيعات (Volume)</div>
                      <div className="stat-val" style={{color: '#185FA5'}}>{dev.totalVolume.toLocaleString('ar-EG')}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">نسبة العمولة الحالية</div>
                      <div className="stat-val" style={{color: '#10b981'}}>{dev.commission}%</div>
                    </div>
                  </div>

                  <div className="dev-info-row">
                    <span>رقم الترخيص:</span>
                    <span className="dev-info-val">{dev.license_number}</span>
                  </div>
                  <div className="dev-info-row">
                    <span>انتهاء التعاقد:</span>
                    <span className="dev-info-val" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                      {dev.contract_end_date ? new Date(dev.contract_end_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                      {dev.contractWarning && <span className="alert-badge">ينتهي قريباً!</span>}
                      {dev.daysAway < 0 && <span className="alert-badge">منتهي!</span>}
                    </span>
                  </div>

                  <button className="btn-secondary" onClick={() => openManageModal(dev)}>
                    إعدادات العقد والعمولة ⚙️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1. Modal إضافة مطور */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span>إضافة مطور عقاري</span><button className="close-btn" onClick={() => setIsAddModalOpen(false)}>✕</button></div>
            <form onSubmit={handleAddDeveloper}>
              <div className="form-group full"><label className="form-label">الاسم *</label><input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">المنطقة</label><select className="form-select" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}><option value="القاهرة الجديدة">القاهرة الجديدة</option><option value="العاصمة الإدارية">العاصمة الإدارية</option><option value="الساحل الشمالي">الساحل الشمالي</option><option value="متعدد المناطق">متعدد المناطق</option></select></div>
                <div className="form-group"><label className="form-label">تصنيف (A/B/C)</label><select className="form-select" value={formData.class_grade} onChange={e => setFormData({...formData, class_grade: e.target.value})}><option value="A">Class A</option><option value="B">Class B</option><option value="C">Class C</option></select></div>
                <div className="form-group"><label className="form-label">الترخيص</label><input className="form-input" value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">دورة الصرف (أيام)</label><input type="number" className="form-input" value={formData.payment_days} onChange={e => setFormData({...formData, payment_days: Number(e.target.value)})} /></div>
                <div className="form-group full"><label className="form-label">تاريخ انتهاء التعاقد المبرم (اختياري)</label><input type="date" className="form-input" value={formData.contract_end_date} onChange={e => setFormData({...formData, contract_end_date: e.target.value})} /></div>
              </div>
              <button type="submit" className="btn-submit">حفظ المطور</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal إدارة العقد والعمولة (الجديد) */}
      {isManageModalOpen && selectedDev && (
        <div className="modal-overlay" onClick={() => setIsManageModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span>تحديث إعدادات: {selectedDev.name}</span><button className="close-btn" onClick={() => setIsManageModalOpen(false)}>✕</button></div>
            <form onSubmit={handleUpdateDevSettings}>
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label" style={{color: '#185FA5'}}>نسبة العمولة المتفق عليها (%) *</label>
                  <input required type="number" step="0.1" min="0" className="form-input" style={{border: '2px solid #185FA5'}} value={manageData.commission_percentage} onChange={e => setManageData({...manageData, commission_percentage: Number(e.target.value)})} />
                  <p style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>سيتم استخدام هذه النسبة لحساب المطالبات المالية القادمة.</p>
                </div>
                <div className="form-group full">
                  <label className="form-label" style={{color: '#DC2626'}}>تاريخ انتهاء عقد التعاون (للتنبيهات)</label>
                  <input type="date" className="form-input" style={{border: '1px solid #DC2626'}} value={manageData.contract_end_date} onChange={e => setManageData({...manageData, contract_end_date: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-submit">حفظ التحديثات</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}