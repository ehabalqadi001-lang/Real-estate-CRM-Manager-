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
  
  .content-body { padding: 30px; max-width: 1200px; width: 100%; margin: 0 auto; }
  
  .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
  
  .member-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: 0.2s; }
  .member-card:hover { border-color: #185FA5; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  
  .member-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
  .avatar { width: 48px; height: 48px; border-radius: 50%; background: #E6F1FB; color: #185FA5; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
  .member-name { font-size: 16px; font-weight: 700; color: #0f172a; }
  .member-email { font-size: 12px; color: #64748b; margin-top: 2px; }
  
  .form-group { margin-bottom: 15px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; }
  .form-select, .form-input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; outline: none; background: #f8fafc; color: #0f172a; font-weight: 500;}
  .form-select:focus, .form-input:focus { border-color: #185FA5; background: #fff;}
  
  .role-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .role-admin { background: #0f1c2e; color: #fff; }
  .role-leader { background: #E6F1FB; color: #185FA5; }
  .role-agent { background: #f1f5f9; color: #475569; }

  .save-btn { width: 100%; padding: 10px; background: #fff; color: #185FA5; border: 1px solid #185FA5; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; margin-top: 10px;}
  .save-btn:hover { background: #185FA5; color: #fff; }
`;

export default function TeamManagementPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTeam = async () => {
    setLoading(true);
    // جلب المستخدمين المقبولين فقط (فريق العمل الفعلي)
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    
    setTeam(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleUpdateMember = async (id: string, field: string, value: string) => {
    // التحديث الفوري في الواجهة لتحسين تجربة المستخدم
    setTeam(team.map(member => member.id === id ? { ...member, [field]: value } : member));
  };

  const saveChanges = async (id: string, role: string, cell: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: role, work_cell: cell })
      .eq('id', id);
    
    if (!error) {
      alert("Team member updated successfully!");
    }
    setUpdatingId(null);
  };

  const getInitials = (first: string, last: string) => {
    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar - Added Team Icon */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        
        {/* Team Icon */}
        <Link href="/dashboard/team" className="nav-item active" title="Team Management"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/reports" className="nav-item" title="Reports & Analytics"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
        <Link href="/dashboard/admin" className="nav-item" title="Admin Approvals"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <span>EHAB & ESLAM TEAM</span>
            <span style={{color: '#64748b', fontSize: '18px', fontWeight: '500'}}>| Work Cells</span>
          </div>
        </div>

        <div className="content-body">
          {loading ? (
             <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Loading team members...</div>
          ) : (
            <div className="team-grid">
              {team.map((member) => (
                <div className="member-card" key={member.id}>
                  <div className="member-header">
                    <div className="avatar">{getInitials(member.first_name, member.last_name)}</div>
                    <div>
                      <div className="member-name">{member.first_name} {member.last_name}</div>
                      <div className="member-email">{member.email}</div>
                      <div style={{marginTop: '6px'}}>
                        <span className={`role-badge ${member.role === 'super_admin' ? 'role-admin' : member.role === 'team_leader' ? 'role-leader' : 'role-agent'}`}>
                          {member.role === 'super_admin' ? 'System Admin' : member.role === 'team_leader' ? 'Cell Leader' : 'Sales Agent'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Configuration */}
                  <div className="form-group">
                    <label className="form-label">System Role</label>
                    <select 
                      className="form-select" 
                      value={member.role || 'agent'} 
                      onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                    >
                      <option value="agent">Sales Agent</option>
                      <option value="team_leader">Work Cell Leader</option>
                      <option value="super_admin">System Admin</option>
                    </select>
                  </div>

                  {/* Work Cell Organization */}
                  <div className="form-group">
                    <label className="form-label">Work Cell Assignment</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Cell A, Primary Market..." 
                      value={member.work_cell || 'General'}
                      onChange={(e) => handleUpdateMember(member.id, 'work_cell', e.target.value)}
                    />
                  </div>

                  <button 
                    className="save-btn" 
                    onClick={() => saveChanges(member.id, member.role, member.work_cell)}
                    disabled={updatingId === member.id}
                  >
                    {updatingId === member.id ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}