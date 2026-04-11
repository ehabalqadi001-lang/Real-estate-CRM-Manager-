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
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px;}
  
  .content-body { padding: 30px; max-width: 900px; width: 100%; margin: 0 auto; }
  
  .settings-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .card-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
  
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .form-group { display: flex; flex-direction: column; margin-bottom: 15px;}
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
  .form-input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; color: #0f172a;}
  .form-input:focus { border-color: #185FA5; background: #fff;}
  .form-input:disabled { opacity: 0.6; cursor: not-allowed; }
  
  .btn-save { background: #185FA5; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; margin-top: 10px;}
  .btn-save:hover { background: #124b82; }
  .btn-save:disabled { background: #94a3b8; cursor: not-allowed; }

  .avatar-section { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
  .avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: #0f1c2e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }
  .avatar-info h3 { font-size: 18px; color: #0f172a; margin-bottom: 4px; }
  .avatar-info p { font-size: 13px; color: #64748b; }
`;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAuth, setSavingAuth] = useState(false);
  
  const [profile, setProfile] = useState({
    id: '', first_name: '', last_name: '', phone: '', email: '', company_name: '', role: ''
  });

  const [authData, setAuthData] = useState({
    new_password: '', confirm_password: ''
  });

  useEffect(() => {
    async function loadProfile() {
      // 1. Get current logged in user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Get profile details from user_profiles table
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
        } else {
          // Fallback if profile not found but user is logged in
          setProfile(prev => ({ ...prev, id: user.id, email: user.email || '' }));
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        company_name: profile.company_name
      })
      .eq('id', profile.id);

    if (!error) {
      alert("✅ Profile updated successfully!");
    } else {
      alert("❌ Error updating profile.");
    }
    setSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authData.new_password !== authData.confirm_password) {
      alert("❌ Passwords do not match!");
      return;
    }
    
    setSavingAuth(true);
    const { error } = await supabase.auth.updateUser({
      password: authData.new_password
    });

    if (!error) {
      alert("✅ Password changed successfully!");
      setAuthData({ new_password: '', confirm_password: '' });
    } else {
      alert("❌ Error changing password: " + error.message);
    }
    setSavingAuth(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getInitials = () => {
    return `${(profile.first_name || '').charAt(0)}${(profile.last_name || '').charAt(0)}`.toUpperCase() || '👤';
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading Profile...</div>;

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar - Final Complete Version */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item" title="Inventory"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/whatsapp" className="nav-item" title="WhatsApp Automation"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item" title="Reports"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        <Link href="/dashboard/team" className="nav-item" title="Team"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        
        {/* Settings Icon - Active */}
        <Link href="/dashboard/settings" className="nav-item active" title="Settings"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">Account Settings</div>
          <button onClick={handleSignOut} style={{background: 'transparent', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', color: '#A32D2D', fontWeight: '600', cursor: 'pointer'}}>
            Sign Out
          </button>
        </div>

        <div className="content-body">
          
          <div className="avatar-section">
            <div className="avatar-circle">{getInitials()}</div>
            <div className="avatar-info">
              <h3>{profile.first_name} {profile.last_name}</h3>
              <p>{profile.email} • {profile.role === 'super_admin' ? 'System Administrator' : 'Sales Member'}</p>
            </div>
          </div>

          {/* Personal Information Form */}
          <div className="settings-card">
            <div className="card-title">Personal Information</div>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address (Cannot be changed)</label>
                  <input type="email" className="form-input" value={profile.email} disabled />
                </div>
                <div className="form-group full">
                  <label className="form-label">Company / Agency Name</label>
                  <input type="text" className="form-input" value={profile.company_name} onChange={e => setProfile({...profile, company_name: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-save" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Security & Password Form */}
          <div className="settings-card">
            <div className="card-title">Security & Password</div>
            <form onSubmit={handleUpdatePassword}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" minLength={6} className="form-input" placeholder="Enter new password" value={authData.new_password} onChange={e => setAuthData({...authData, new_password: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" minLength={6} className="form-input" placeholder="Confirm new password" value={authData.confirm_password} onChange={e => setAuthData({...authData, confirm_password: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="btn-save" style={{background: '#0f1c2e'}} disabled={savingAuth}>
                {savingAuth ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}