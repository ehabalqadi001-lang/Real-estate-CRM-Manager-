"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main-content { margin-left: 64px; flex: 1; display: flex; flex-direction: column; }
  
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; }
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; }
  .btn-primary { background: #185FA5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-primary:hover { background: #124b82; }

  .content-body { padding: 30px; }
  
  .toolbar { display: flex; gap: 15px; margin-bottom: 25px; }
  .search-input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
  .filter-select { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; background: #fff; min-width: 150px; }

  .clients-table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  
  /* Row Hover & Link effect */
  .clickable-row { transition: background 0.2s; cursor: pointer; }
  .clickable-row:hover { background: #f1f5f9; }
  
  .client-name { font-weight: 600; color: #185FA5; display: flex; align-items: center; gap: 10px; transition: color 0.2s; }
  .clickable-row:hover .client-name { color: #0f1c2e; text-decoration: underline; }
  
  .client-avatar { width: 32px; height: 32px; border-radius: 50%; background: #E6F1FB; color: #185FA5; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; text-decoration: none !important;}
  .client-sub { font-size: 12px; color: #64748b; margin-top: 4px; text-decoration: none !important; }
  
  .type-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .type-investor { background: #FFF7ED; color: #9A3412; }
  .type-enduser { background: #EAF3DE; color: #3B6D11; }
  .type-reseller { background: #F3E8FF; color: #6B21A8; }

  /* Modal Styles */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
  .modal-content { background: #fff; width: 100%; max-width: 500px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
  .modal-header { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
  .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; }
  .form-group { margin-bottom: 15px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .form-input, .form-select { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
  .form-input:focus, .form-select:focus { border-color: #185FA5; }
  .btn-submit { width: 100%; padding: 14px; background: #185FA5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; }
`;

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', client_type: 'End User', budget_range: ''
  });

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('clients').insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ full_name: '', phone: '', email: '', client_type: 'End User', budget_range: '' });
      fetchClients();
    } else {
      alert("Error adding client. Phone number might already exist.");
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesType = filterType === 'All' || c.client_type === filterType;
    return matchesSearch && matchesType;
  });

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar - Updated with ALL icons including Reports */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item active" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        
        {/* Reports Icon */}
        <Link href="/dashboard/reports" className="nav-item" title="Reports & Analytics"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
        
        <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
        <Link href="/dashboard/admin" className="nav-item" title="Admin Approvals"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">Client Directory</div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add New Client
          </button>
        </div>

        <div className="content-body">
          <div className="toolbar">
            <input type="text" className="search-input" placeholder="Search by name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Client Types</option>
              <option value="End User">End Users</option>
              <option value="Investor">Investors</option>
              <option value="Reseller">Resellers</option>
            </select>
          </div>

          <div className="clients-table-container">
            <table>
              <thead>
                <tr>
                  <th>Client Details</th>
                  <th>Contact Info</th>
                  <th>Client Type</th>
                  <th>Budget Range</th>
                  <th>Added On</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px'}}>Loading clients...</td></tr>
                ) : filteredClients.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', color: '#64748b', padding: '30px'}}>No clients found. Click "Add New Client" to start building your database.</td></tr>
                ) : (
                  filteredClients.map((client) => (
                    // تم تحويل الصف بالكامل ليكون قابلاً للضغط (Clickable Row)
                    <tr key={client.id} className="clickable-row" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                      <td>
                        <div className="client-name">
                          <div className="client-avatar">{getInitials(client.full_name)}</div>
                          <div>
                            {client.full_name}
                            <div className="client-sub">{client.national_id ? `ID: ${client.national_id}` : 'No ID provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{fontWeight: '500'}}>{client.phone}</div>
                        <div className="client-sub">{client.email || 'No email'}</div>
                      </td>
                      <td>
                        <span className={`type-badge ${client.client_type === 'Investor' ? 'type-investor' : client.client_type === 'Reseller' ? 'type-reseller' : 'type-enduser'}`}>
                          {client.client_type}
                        </span>
                      </td>
                      <td style={{fontWeight: '500'}}>{client.budget_range || '-'}</td>
                      <td style={{color: '#64748b'}}>{new Date(client.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Add New Client</span>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddClient}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input required type="text" className="form-input" placeholder="e.g. Ahmed Hassan" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input required type="text" className="form-input" placeholder="e.g. 010xxxxxxxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="ahmed@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Client Type</label>
                  <select className="form-select" value={formData.client_type} onChange={e => setFormData({...formData, client_type: e.target.value})}>
                    <option value="End User">End User (مستخدم نهائي)</option>
                    <option value="Investor">Investor (مستثمر)</option>
                    <option value="Reseller">Reseller (مشتري بغرض إعادة البيع)</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Budget Range</label>
                  <select className="form-select" value={formData.budget_range} onChange={e => setFormData({...formData, budget_range: e.target.value})}>
                    <option value="">Select Range</option>
                    <option value="2M - 5M EGP">2M - 5M EGP</option>
                    <option value="5M - 10M EGP">5M - 10M EGP</option>
                    <option value="10M - 20M EGP">10M - 20M EGP</option>
                    <option value="20M+ EGP">20M+ EGP</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-submit">Save Client Profile</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}