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
  
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; }
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; }
  .btn-primary { background: #185FA5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-primary:hover { background: #124b82; }

  .content-body { padding: 30px; }
  
  .pipeline-table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #f8fafc; }
  
  .stage-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #FFF7ED; color: #9A3412; border: 1px solid #FDBA74; }
  .stage-contracted { background: #E6F1FB; color: #185FA5; border-color: #93C5FD; }
  .status-text { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 4px; }
  
  /* Modal Styles */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
  .modal-content { background: #fff; width: 100%; max-width: 600px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; }
  .modal-header { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
  .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; }
  
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
  .form-group { display: flex; flex-direction: column; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .form-input, .form-select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
  .form-input:focus, .form-select:focus { border-color: #185FA5; }
  .btn-submit { width: 100%; padding: 14px; background: #185FA5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; }
`;

export default function SalesPipelinePage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '', compound: '', developer: '', property_type: 'Unit', 
    unit_value: '', amount_paid: '', stage: 'Reservation'
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: dealsData } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    const { data: clientsData } = await supabase.from('clients').select('id, full_name, phone').order('full_name', { ascending: true });
    
    setDeals(dealsData || []);
    setClients(clientsData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedClient = clients.find(c => c.id === formData.client_id);
    if (!selectedClient) {
      alert("Please select a valid client.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      client_id: selectedClient.id,
      buyer_name: selectedClient.full_name,
      buyer_phone: selectedClient.phone,
      compound: formData.compound,
      developer: formData.developer,
      property_type: formData.property_type,
      unit_value: Number(formData.unit_value),
      amount_paid: Number(formData.amount_paid),
      stage: formData.stage,
      status: 'Pending',
      finance_status: 'Pending Claim'
    };

    const { error } = await supabase.from('deals').insert([payload]);
    
    if (!error) {
      setIsModalOpen(false);
      setFormData({ client_id: '', compound: '', developer: '', property_type: 'Unit', unit_value: '', amount_paid: '', stage: 'Reservation' });
      fetchData();
    } else {
      alert("Error adding deal: " + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item active" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <Link href="/dashboard/developers" className="nav-item" title="Developers"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/admin" className="nav-item" title="Admin Approvals"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">Sales Pipeline</div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add New Deal
          </button>
        </div>

        <div className="content-body">
          <div className="pipeline-table-container">
            <table>
              <thead>
                <tr>
                  <th>Deal Info</th>
                  <th>Client</th>
                  <th>Value</th>
                  <th>Stage & Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px'}}>Loading pipeline...</td></tr>
                ) : deals.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>No deals found. Click "Add New Deal" to register a sale.</td></tr>
                ) : (
                  deals.map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{deal.compound}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{deal.developer} • {deal.property_type || 'Unit'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{deal.buyer_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{deal.buyer_phone}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>EGP {Number(deal.unit_value || 0).toLocaleString()}</td>
                      <td>
                        <span className={`stage-badge ${deal.stage === 'Contracted' ? 'stage-contracted' : ''}`}>{deal.stage || 'Reservation'}</span>
                        <div className="status-text">{deal.status === 'Approved' ? '✅ Verified' : '⏳ Pending Admin'}</div>
                      </td>
                      <td>
                        <Link href={`/dashboard/deals/${deal.id}`} style={{ color: '#185FA5', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>Manage ↗</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Register New Deal</span>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddDeal}>
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Select Client *</label>
                  <select required className="form-select" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                    <option value="">-- Choose from Client Directory --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                    ))}
                  </select>
                  {clients.length === 0 && <span style={{fontSize:'11px', color:'#A32D2D', marginTop:'4px'}}>No clients found. Please add a client in the directory first.</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Compound / Project *</label>
                  <input required type="text" className="form-input" placeholder="e.g. OIA Compound" value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Developer *</label>
                  <input required type="text" className="form-input" placeholder="e.g. Edge Holding" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Unit Value (EGP) *</label>
                  <input required type="number" min="0" className="form-input" placeholder="e.g. 5000000" value={formData.unit_value} onChange={e => setFormData({...formData, unit_value: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Downpayment Paid (EGP) *</label>
                  <input required type="number" min="0" className="form-input" placeholder="e.g. 500000" value={formData.amount_paid} onChange={e => setFormData({...formData, amount_paid: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select className="form-select" value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa / Townhouse</option>
                    <option value="Commercial">Commercial / Retail</option>
                    <option value="Administrative">Administrative Office</option>
                    <option value="Medical">Medical Clinic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Deal Stage</label>
                  <select className="form-select" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                    <option value="EOI">EOI (Expression of Interest)</option>
                    <option value="Reservation">Reservation (استمارة حجز)</option>
                    <option value="Contracted">Contracted (تعاقد نهائي)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={isSubmitting || clients.length === 0}>
                {isSubmitting ? 'Registering...' : 'Register Deal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}