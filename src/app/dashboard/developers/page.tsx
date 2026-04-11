"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-title { color: #fff; font-size: 15px; font-weight: 500; letter-spacing: 0.5px; }
  .avatar { width: 30px; height: 30px; border-radius: 50%; background: #185FA5; display: flex; align-items: center; justify-content: center; color: #B5D4F4; font-size: 11px; font-weight: 500; }
  .tabs { display: flex; border-bottom: 1px solid #e2e8f0; background: #fff; padding: 0 20px; border-radius: 12px 0 0 0; }
  .tab { padding: 14px 16px; font-size: 13px; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; }
  .tab.active { color: #185FA5; border-bottom-color: #185FA5; }
  .toolbar { display: flex; gap: 8px; padding: 12px 20px; background: #f8fafc; align-items: center; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; }
  .search-box { flex: 1; min-width: 160px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; background: #fff; color: #0f172a; outline: none; }
  .search-box:focus { border-color: #185FA5; }
  .add-btn { background: #0f1c2e; color: #fff; font-size: 12px; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; font-weight: 500; }
  .filter-select { font-size: 12px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; color: #0f172a; outline: none; cursor: pointer; }
  .dev-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 20px; }
  .dev-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
  .dev-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .dev-card-header { padding: 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f1f5f9; }
  .dev-logo { width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; background: #E6F1FB; color: #185FA5; }
  .dev-name { font-size: 14px; font-weight: 600; color: #0f172a; }
  .dev-location { font-size: 11px; color: #64748b; margin-top: 2px; }
  .dev-card-body { padding: 12px 16px; }
  .rule-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; }
  .rule-row:last-child { border-bottom: none; }
  .rule-label { font-size: 12px; color: #475569; font-weight: 500; }
  .rule-val { font-size: 13px; font-weight: 600; color: #0f172a; }
  .rule-badge { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
  .badge-primary { background: #E6F1FB; color: #185FA5; }
  .badge-secondary { background: #EAF3DE; color: #3B6D11; }
  .badge-resale { background: #FAEEDA; color: #854F0B; }
  .dev-card-footer { padding: 12px 16px; display: flex; gap: 8px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .btn-edit { flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font-size: 12px; font-weight: 500; cursor: pointer; color: #475569; }
  .btn-edit:hover { background: #f1f5f9; }
  .btn-rules { flex: 1; padding: 8px; border: none; border-radius: 6px; background: #0f1c2e; font-size: 12px; font-weight: 500; cursor: pointer; color: #fff; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; margin-top: 1px; }
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 28, 46, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
  .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 550px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
  .modal-header { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
  .modal-title { font-size: 15px; font-weight: 600; color: #0f172a; }
  .modal-close { cursor: pointer; color: #64748b; font-size: 20px; line-height: 1; }
  .modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 12px; font-weight: 500; color: #475569; }
  .form-input { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: #185FA5; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc; }
  .btn-cancel { padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 500; color: #475569; }
  .btn-confirm { padding: 8px 16px; border: none; border-radius: 6px; background: #0f1c2e; color: #fff; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-confirm:disabled { opacity: 0.7; cursor: not-allowed; }
  .rules-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
  .rules-table th { background: transparent; padding: 8px 10px; text-align: left; }
  .rules-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  .rule-input { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
`;

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  
  const [developers, setDevelopers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '', city: 'New Administrative Capital', email: '', phone: '',
    primary_pct: '5', primary_days: '60',
    resale_pct: '2.5', resale_days: '45',
    comm_pct: '6', comm_days: '90'
  });

  const fetchDevelopers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('developers').select('*, commission_rules(*)');
      if (error) throw error;
      setDevelopers(data || []);
    } catch (err: any) {
      console.error('Error fetching developers:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleSaveDeveloper = async () => {
    if (!formData.name) {
      alert('الرجاء إدخال اسم المطور العقاري');
      return;
    }
    
    setIsSaving(true);
    try {
      const { data: devData, error: devError } = await supabase
        .from('developers')
        .insert([{ name: formData.name, city: formData.city, email: formData.email, phone: formData.phone }])
        .select();

      if (devError) throw devError;
      const devId = devData[0].id;

      const rules = [
        { developer_id: devId, sale_type: 'Primary', commission_pct: parseFloat(formData.primary_pct), payout_days: parseInt(formData.primary_days) },
        { developer_id: devId, sale_type: 'Resale', commission_pct: parseFloat(formData.resale_pct), payout_days: parseInt(formData.resale_days) },
        { developer_id: devId, sale_type: 'Commercial', commission_pct: parseFloat(formData.comm_pct), payout_days: parseInt(formData.comm_days) }
      ];

      const { error: rulesError } = await supabase.from('commission_rules').insert(rules);
      if (rulesError) throw rulesError;

      alert('تم حفظ المطور وقواعد العمولات بنجاح!');
      setIsModalOpen(false);
      setFormData({
        name: '', city: 'New Administrative Capital', email: '', phone: '',
        primary_pct: '5', primary_days: '60', resale_pct: '2.5', resale_days: '45', comm_pct: '6', comm_days: '90'
      });
      fetchDevelopers(); 
      
    } catch (error: any) {
      alert('حدث خطأ أثناء الحفظ: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDevs = developers.filter(d => 
    (cityFilter === 'all' || d.city === cityFilter) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div className="topbar-title">FAST INVESTMENT</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Ehab Alqadi</div>
          <div className="avatar">EA</div>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
       <div className="sidebar">
  {/* Dashboard */}
  <Link href="/dashboard" className="nav-item" title="Dashboard">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  </Link>
  
  {/* Clients Directory */}
  <Link href="/dashboard/clients" className="nav-item" title="Clients">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  </Link>
  
  {/* Sales Pipeline (Leads/Deals) */}
  <Link href="/dashboard/leads" className="nav-item" title="Pipeline">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  </Link>
  
  {/* Commissions */}
  <Link href="/dashboard/commissions" className="nav-item" title="Commissions">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  </Link>
  
  {/* Developers */}
  <Link href="/dashboard/developers" className="nav-item" title="Developers">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  </Link>

  {/* خط فاصل */}
  <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
  
  {/* Admin Approvals */}
  <Link href="/dashboard/admin" className="nav-item" title="Admin Approvals">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  </Link>
  
  {/* Settings */}
  <Link href="/dashboard/settings" className="nav-item" title="Settings">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  </Link>
</div>

        <div className="main">
          <div className="tabs">
            <div className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>All Developers</div>
            <div className={`tab ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>Commission Rules</div>
          </div>

          {activeTab === 'list' && (
            <div>
              <div className="toolbar">
                <input type="text" className="search-box" placeholder="Search developer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <select className="filter-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                  <option value="all">All Cities</option>
                  <option value="New Administrative Capital">New Administrative Capital</option>
                  <option value="6th of October">6th of October</option>
                  <option value="New Cairo">New Cairo</option>
                  <option value="North Coast">North Coast</option>
                </select>
                <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Add Developer</button>
              </div>

              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading developers...</div>
              ) : developers.length === 0 ? (
                 <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>لا يوجد مطورين مسجلين بعد. ابدأ بإضافة مطور جديد!</div>
              ) : (
                <div className="dev-grid">
                  {filteredDevs.map((dev) => (
                    <div key={dev.id} className="dev-card">
                      <div className="dev-card-header">
                        <div className="dev-logo">{dev.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}</div>
                        <div>
                          <div className="dev-name">{dev.name}</div>
                          <div className="dev-location">{dev.city}</div>
                        </div>
                      </div>
                      <div className="dev-card-body">
                        {dev.commission_rules?.map((rule: any, i: number) => (
                          <div key={i} className="rule-row">
                            <span className="rule-label">{rule.sale_type}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="rule-val">{rule.commission_pct}%</span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{rule.payout_days}d</span>
                              <span className={`rule-badge ${rule.sale_type === 'Primary' ? 'badge-primary' : rule.sale_type === 'Resale' ? 'badge-resale' : 'badge-secondary'}`}>{rule.sale_type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="dev-card-footer">
                        <button className="btn-edit" onClick={() => alert('ميزة التعديل سيتم تفعيلها قريباً')}>Edit</button>
                        <button className="btn-rules" onClick={() => setActiveTab('rules')}>Commission Rules</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div style={{ padding: '20px' }}>
               <h3 style={{ marginBottom: '15px' }}>جدول العمولات الشامل (قريباً)</h3>
               <p style={{ color: '#64748b', fontSize: '13px' }}>هنا سيتم عرض جدول مجمع لكل المطورين وقواعدهم ليسهل مقارنتها والبحث فيها.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add Developer to Database</div>
              <div className="modal-close" onClick={() => setIsModalOpen(false)}>×</div>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Developer Name *</label>
                  <input className="form-input" placeholder="e.g. Edge Holding" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">City / Location</label>
                  <select className="form-input" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}>
                    <option>New Administrative Capital</option>
                    <option>New Cairo</option>
                    <option>6th of October</option>
                    <option>North Coast</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Contact Email</label>
                  <input className="form-input" placeholder="sales@developer.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Contact Phone</label>
                  <input className="form-input" placeholder="+20 1xx xxx xxxx" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '24px 0 12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Commission Rules</div>
              <table className="rules-table">
                <thead>
                  <tr>
                    <th>Sale Type</th>
                    <th>Commission %</th>
                    <th>Payout (days)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="rule-badge badge-primary">Primary</span></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 5" value={formData.primary_pct} onChange={(e) => setFormData({...formData, primary_pct: e.target.value})} /></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 60" value={formData.primary_days} onChange={(e) => setFormData({...formData, primary_days: e.target.value})} /></td>
                  </tr>
                  <tr>
                    <td><span className="rule-badge badge-resale">Resale</span></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 2.5" value={formData.resale_pct} onChange={(e) => setFormData({...formData, resale_pct: e.target.value})} /></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 45" value={formData.resale_days} onChange={(e) => setFormData({...formData, resale_days: e.target.value})} /></td>
                  </tr>
                  <tr>
                    <td><span className="rule-badge badge-secondary">Commercial</span></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 6" value={formData.comm_pct} onChange={(e) => setFormData({...formData, comm_pct: e.target.value})} /></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 90" value={formData.comm_days} onChange={(e) => setFormData({...formData, comm_days: e.target.value})} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleSaveDeveloper} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Developer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}