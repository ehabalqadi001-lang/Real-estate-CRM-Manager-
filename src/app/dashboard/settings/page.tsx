"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f0f2f5; min-height: 100vh; }
  
  /* Sidebar with ALL 6 Icons */
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; z-index: 10; }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; }
  
  .header { padding: 20px 30px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px 0 0 0; }
  .header-title { font-size: 20px; font-weight: 600; color: #0f172a; }
  .header-desc { font-size: 13px; color: #64748b; margin-top: 4px; }

  .settings-layout { display: flex; padding: 30px; gap: 30px; }
  .settings-menu { width: 200px; display: flex; flex-direction: column; gap: 8px; }
  .menu-item { padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; color: #64748b; transition: 0.2s; }
  .menu-item:hover { background: #f1f5f9; color: #0f172a; }
  .menu-item.active { background: #E6F1FB; color: #185FA5; }

  .settings-panel { flex: 1; max-width: 600px; }
  .panel-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #fff; margin-bottom: 24px; }
  .panel-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
  
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px; }
  .form-input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none; transition: 0.2s; }
  .form-input:focus { border-color: #185FA5; }
  
  .save-btn { background: #0f1c2e; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; }
  .save-btn:hover { background: #1e293b; }

  .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-info { font-size: 14px; font-weight: 500; color: #0f172a; }
  .toggle-desc { font-size: 12px; color: #64748b; margin-top: 2px; }
  
  /* Simple CSS Toggle Switch */
  .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 24px; }
  .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
  input:checked + .slider { background-color: #185FA5; }
  input:checked + .slider:before { transform: translateX(20px); }
`;

export default function SettingsPage() {
  const [activeMenu, setActiveMenu] = useState('profile');

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar with ALL 6 Icons */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Sales Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item" title="Reports"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></Link>
        <Link href="/dashboard/settings" className="nav-item active" title="Settings"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">System Settings</div>
          <div className="header-desc">Manage your account preferences and application settings.</div>
        </div>

        <div className="settings-layout">
          <div className="settings-menu">
            <div className={`menu-item ${activeMenu === 'profile' ? 'active' : ''}`} onClick={() => setActiveMenu('profile')}>Profile Details</div>
            <div className={`menu-item ${activeMenu === 'notifications' ? 'active' : ''}`} onClick={() => setActiveMenu('notifications')}>Notifications</div>
            <div className={`menu-item ${activeMenu === 'team' ? 'active' : ''}`} onClick={() => setActiveMenu('team')}>Team Management</div>
          </div>

          <div className="settings-panel">
            {activeMenu === 'profile' && (
              <div className="panel-card">
                <div className="panel-title">Personal Information</div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" defaultValue="Ehab Alqadi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" defaultValue="ehab@fastinvestment.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" defaultValue="+20 110 116 0208" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role / Title</label>
                  <input type="text" className="form-input" defaultValue="Sales Manager" disabled style={{ background: '#f8fafc', color: '#94a3b8' }} />
                </div>
                <button className="save-btn" onClick={() => alert('Settings saved successfully!')}>Save Changes</button>
              </div>
            )}

            {activeMenu === 'notifications' && (
              <div className="panel-card">
                <div className="panel-title">Email Notifications</div>
                
                <div className="toggle-row">
                  <div>
                    <div className="toggle-info">New Deal Alerts</div>
                    <div className="toggle-desc">Get notified when a team member adds a new deal.</div>
                  </div>
                  <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
                </div>

                <div className="toggle-row">
                  <div>
                    <div className="toggle-info">Commission Payout Reminders</div>
                    <div className="toggle-desc">Receive an email 3 days before a commission is due.</div>
                  </div>
                  <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
                </div>

                <div className="toggle-row">
                  <div>
                    <div className="toggle-info">Weekly Analytics Report</div>
                    <div className="toggle-desc">Receive a summary of sales performance every Monday.</div>
                  </div>
                  <label className="switch"><input type="checkbox" /><span className="slider"></span></label>
                </div>
              </div>
            )}

            {activeMenu === 'team' && (
              <div className="panel-card">
                <div className="panel-title">Team Access</div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Manage who has access to your workspace and their permission levels.</p>
                <div style={{ padding: '16px', background: '#FFF7ED', borderLeft: '4px solid #F97316', borderRadius: '4px', fontSize: '13px', color: '#9A3412' }}>
                  <strong>Pro Feature:</strong> Team management is available in the Pro plan. Contact support to upgrade.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}