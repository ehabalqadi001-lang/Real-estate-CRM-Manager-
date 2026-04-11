"use client";
import React, { useState } from 'react';
import Link from 'next/link';

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
  .dev-logo { width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; }
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
  .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e2e8f0; }
  .sum-col { padding: 16px 20px; border-right: 1px solid #e2e8f0; }
  .sum-col:last-child { border-right: none; }
  .sum-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .sum-val { font-size: 20px; font-weight: 600; color: #0f172a; }
  
  /* Sidebar styles */
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; margin-top: 1px; }

  /* Modal styles */
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
  
  /* Table styles */
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 20px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; font-size: 12px; background: #f8fafc; }
  td { padding: 14px 20px; border-bottom: 1px solid #e2e8f0; color: #0f172a; vertical-align: middle; }
  tr:hover td { background: #f8fafc; }
  
  .rules-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
  .rules-table th { background: transparent; padding: 8px 10px; }
  .rules-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  .rule-input { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
`;

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const devsData = [
    { id: 1, name: 'Pyramids Developments', city: '6th of October', rules: [{ type: 'Primary', pct: 5, days: 60 }, { type: 'Resale', pct: 2.5, days: 45 }, { type: 'Commercial', pct: 6, days: 90 }], deals: 1, totalComm: 446200, bg: '#E6F1FB', txt: '#0C447C' },
    { id: 2, name: 'Taj Misr Developments', city: 'New Administrative Capital', rules: [{ type: 'Primary', pct: 4.5, days: 60 }, { type: 'Resale', pct: 2.5, days: 45 }, { type: 'Commercial', pct: 5, days: 75 }], deals: 2, totalComm: 235350, bg: '#E1F5EE', txt: '#085041' },
    { id: 3, name: 'TBK Developments', city: 'New Cairo', rules: [{ type: 'Primary', pct: 2.25, days: 60 }, { type: 'Resale', pct: 2, days: 30 }, { type: 'Commercial', pct: 3, days: 60 }], deals: 1, totalComm: 343193, bg: '#FAEEDA', txt: '#633806' },
    { id: 4, name: 'Edge Holding Urban Dev', city: 'New Administrative Capital', rules: [{ type: 'Primary', pct: 5, days: 60 }, { type: 'Resale', pct: 3, days: 45 }, { type: 'Commercial', pct: 6, days: 90 }], deals: 0, totalComm: 0, bg: '#EEEDFE', txt: '#3C3489' },
    { id: 5, name: 'Inertia Egypt', city: 'North Coast', rules: [{ type: 'Primary', pct: 4, days: 90 }, { type: 'Resale', pct: 2, days: 60 }, { type: 'Commercial', pct: 5, days: 90 }], deals: 0, totalComm: 0, bg: '#EAF3DE', txt: '#27500A' },
  ];

  const filteredDevs = devsData.filter(d => 
    (cityFilter === 'all' || d.city === cityFilter) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      {/* Topbar */}
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
        {/* Sidebar */}
        <div className="sidebar">
          <Link href="/dashboard" className="nav-item" title="Dashboard">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </Link>
          <Link href="/dashboard/leads" className="nav-item" title="Sales Pipeline">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <Link href="/dashboard/commissions" className="nav-item" title="Commissions">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/developers" className="nav-item active" title="Developers">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </Link>
          <Link href="/dashboard/reports" className="nav-item" title="Reports">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/settings" className="nav-item" title="Settings">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </Link>
        </div>

        {/* Main Content */}
        <div className="main">
          <div className="tabs">
            <div className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>All Developers</div>
            <div className={`tab ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>Commission Rules</div>
            <div className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Performance</div>
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

              <div className="summary-strip">
                <div className="sum-col"><div className="sum-label">Total developers</div><div className="sum-val">{filteredDevs.length}</div></div>
                <div className="sum-col"><div className="sum-label">Avg. primary comm.</div><div className="sum-val">4.05%</div></div>
                <div className="sum-col"><div className="sum-label">Avg. payout (days)</div><div className="sum-val">62</div></div>
                <div className="sum-col" style={{ borderRight: 'none' }}><div className="sum-label">Active deals</div><div className="sum-val">4</div></div>
              </div>

              <div className="dev-grid">
                {filteredDevs.map((dev) => (
                  <div key={dev.id} className="dev-card">
                    <div className="dev-card-header">
                      <div className="dev-logo" style={{ background: dev.bg, color: dev.txt }}>{dev.name.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>
                      <div>
                        <div className="dev-name">{dev.name}</div>
                        <div className="dev-location">{dev.city}</div>
                      </div>
                    </div>
                    <div className="dev-card-body">
                      {dev.rules.map((rule, i) => (
                        <div key={i} className="rule-row">
                          <span className="rule-label">{rule.type}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="rule-val">{rule.pct}%</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{rule.days}d</span>
                            <span className={`rule-badge ${rule.type === 'Primary' ? 'badge-primary' : rule.type === 'Resale' ? 'badge-resale' : 'badge-secondary'}`}>{rule.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="dev-card-footer">
                      <button className="btn-edit" onClick={() => setIsModalOpen(true)}>Edit</button>
                      <button className="btn-rules" onClick={() => setActiveTab('rules')}>Commission Rules</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div>
              <div className="toolbar">
                <input className="search-box" placeholder="Filter by developer..." />
                <select className="filter-select">
                  <option>All Sale Types</option>
                  <option>Primary</option>
                  <option>Resale</option>
                  <option>Commercial</option>
                </select>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Developer</th>
                      <th>Sale Type</th>
                      <th>Commission %</th>
                      <th>Payout Days</th>
                      <th>Effective From</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devsData.flatMap(dev => dev.rules.map((rule, idx) => (
                      <tr key={`${dev.id}-${idx}`}>
                        <td style={{ fontWeight: '600' }}>{dev.name}</td>
                        <td><span className={`rule-badge ${rule.type === 'Primary' ? 'badge-primary' : rule.type === 'Resale' ? 'badge-resale' : 'badge-secondary'}`}>{rule.type}</span></td>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>{rule.pct}%</td>
                        <td>{rule.days} days</td>
                        <td style={{ color: '#64748b' }}>Jan 2026</td>
                        <td><span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: '#EAF3DE', color: '#3B6D11' }}>Active</span></td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {devsData.map(dev => (
                  <div key={dev.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: dev.bg, color: dev.txt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{dev.name.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{dev.name}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Total deals</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{dev.deals}</div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Primary %</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{dev.rules.find(r => r.type === 'Primary')?.pct || '—'}%</div>
                      </div>
                      <div style={{ background: '#EAF3DE', borderRadius: '8px', padding: '10px', gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '11px', color: '#3B6D11' }}>Total commissions earned</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#27500A' }}>EGP {dev.totalComm.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Add/Edit Developer */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add / Edit Developer</div>
              <div className="modal-close" onClick={() => setIsModalOpen(false)}>×</div>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Developer Name *</label>
                  <input className="form-input" placeholder="e.g. Edge Holding" />
                </div>
                <div className="form-field">
                  <label className="form-label">City / Location</label>
                  <select className="form-input">
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
                  <input className="form-input" placeholder="sales@developer.com" />
                </div>
                <div className="form-field">
                  <label className="form-label">Contact Phone</label>
                  <input className="form-input" placeholder="+20 1xx xxx xxxx" />
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
                    <td><input className="rule-input" type="number" placeholder="e.g. 4.5" defaultValue="5" /></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 60" defaultValue="60" /></td>
                  </tr>
                  <tr>
                    <td><span className="rule-badge badge-resale">Resale</span></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 2.5" defaultValue="2.5" /></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 45" defaultValue="45" /></td>
                  </tr>
                  <tr>
                    <td><span className="rule-badge badge-secondary">Commercial</span></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 5.0" defaultValue="6" /></td>
                    <td><input className="rule-input" type="number" placeholder="e.g. 90" defaultValue="90" /></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>Commission preview on EGP 10,000,000 deal</div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Primary</div><div style={{ fontSize: '14px', fontWeight: '600', color: '#3B6D11' }}>EGP 500,000</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Resale</div><div style={{ fontSize: '14px', fontWeight: '600', color: '#854F0B' }}>EGP 250,000</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Commercial</div><div style={{ fontSize: '14px', fontWeight: '600', color: '#185FA5' }}>EGP 600,000</div></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={() => setIsModalOpen(false)}>Save Developer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}