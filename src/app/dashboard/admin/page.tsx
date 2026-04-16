"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
  
  /* Sidebar styles */
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  /* Main content styles */
  .main-content { margin-left: 64px; flex: 1; display: flex; flex-direction: column; }
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; }
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; }
  .content-body { padding: 30px; }
  
  /* Table styles */
  .admin-table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #f8fafc; }
  
  /* Status & Buttons */
  .status-pill { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; border: 1px solid; display: inline-block; text-transform: capitalize;}
  .btn-approve { background: #3B6D11; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin-right: 8px; transition: 0.2s;}
  .btn-approve:hover { background: #2d540d; }
  .btn-reject { background: #fff; color: #A32D2D; border: 1px solid #FCA5A5; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s;}
  .btn-reject:hover { background: #FCEBEB; }
  
  .user-name { font-weight: 600; color: #0f172a; }
  .user-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
`;

interface AdminUser {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  account_type?: string
  status?: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
      if (mounted && !error) setUsers(data || []);
      if (mounted) setLoading(false);
    }
    fetchUsers();
    return () => { mounted = false; };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    if (confirm(`Are you sure you want to mark this account as ${newStatus}?`)) {
      const { error } = await supabase.from('user_profiles').update({ status: newStatus }).eq('id', id);
      if (!error) {
        // تحديث الواجهة محلياً بدون إعادة جلب
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
      }
    }
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar - Updated with all links */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        {/* Active state for Admin page */}
        <Link href="/dashboard/admin" className="nav-item active" title="Admin Approvals"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">System Admin: Partner Approvals</div>
        </div>

        <div className="content-body">
          <div className="admin-table-container">
            <table>
              <thead>
                <tr>
                  <th>Partner Info</th>
                  <th>Contact</th>
                  <th>Account Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px'}}>Loading accounts...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px'}}>No users found.</td></tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={i}>
                      <td>
                        <div className="user-name">{u.first_name} {u.last_name}</div>
                        <div className="user-sub">{u.company_name || 'Individual Broker'}</div>
                      </td>
                      <td>
                        <div style={{fontWeight: '500'}}>{u.email}</div>
                        <div className="user-sub" style={{direction: 'ltr', textAlign: 'left'}}>{u.phone}</div>
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'capitalize' }}>
                          {u.account_type || 'User'}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill" style={{ 
                            background: u.status === 'approved' ? '#EAF3DE' : u.status === 'rejected' ? '#FCEBEB' : '#FFF7ED', 
                            color: u.status === 'approved' ? '#3B6D11' : u.status === 'rejected' ? '#A32D2D' : '#9A3412',
                            borderColor: u.status === 'approved' ? '#C5E1A5' : u.status === 'rejected' ? '#FCA5A5' : '#FDBA74'
                          }}>
                          {u.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        {u.status === 'pending' && (
                          <>
                            <button className="btn-approve" onClick={() => updateStatus(u.id, 'approved')}>Approve</button>
                            <button className="btn-reject" onClick={() => updateStatus(u.id, 'rejected')}>Reject</button>
                          </>
                        )}
                        {u.status === 'approved' && (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}