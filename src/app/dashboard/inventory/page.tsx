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
  
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  .btn-primary { background: #185FA5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-primary:hover { background: #124b82; }

  .content-body { padding: 30px; max-width: 1200px; width: 100%; margin: 0 auto; }
  
  .toolbar { display: flex; gap: 15px; margin-bottom: 25px; }
  .search-input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
  .filter-select { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; background: #fff; min-width: 150px; }

  /* Stats Row */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
  .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .stat-label { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
  .stat-val { font-size: 24px; font-weight: 700; color: #0f172a; }

  .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #f8fafc; }
  
  .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-available { background: #EAF3DE; color: #3B6D11; }
  .badge-reserved { background: #FFF7ED; color: #9A3412; }
  .badge-sold { background: #f1f5f9; color: #64748b; text-decoration: line-through; }

  /* Modal Styles */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
  .modal-content { background: #fff; width: 100%; max-width: 600px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
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

export default function InventoryPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    compound: '', developer: '', property_type: 'Apartment', area: '', price: '', status: 'Available'
  });

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    setUnits(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, area: Number(formData.area), price: Number(formData.price) };
    const { error } = await supabase.from('inventory').insert([payload]);
    
    if (!error) {
      setIsModalOpen(false);
      setFormData({ compound: '', developer: '', property_type: 'Apartment', area: '', price: '', status: 'Available' });
      fetchInventory();
    } else {
      alert("Error adding unit to inventory.");
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('inventory').update({ status: newStatus }).eq('id', id);
    fetchInventory();
  };

  const filteredUnits = units.filter(u => {
    const matchesSearch = u.compound.toLowerCase().includes(searchTerm.toLowerCase()) || u.developer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableValue = units.filter(u => u.status === 'Available').reduce((sum, u) => sum + Number(u.price), 0);

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar with New Inventory Icon (Layers) */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item" title="Dashboard"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item" title="Clients"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item" title="Pipeline"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        
        {/* Inventory Icon */}
        <Link href="/dashboard/inventory" className="nav-item active" title="Property Inventory"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        
        <Link href="/dashboard/commissions" className="nav-item" title="Commissions"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        <Link href="/dashboard/whatsapp" className="nav-item" title="WhatsApp Automation"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></Link>
        <Link href="/dashboard/team" className="nav-item" title="Team"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item" title="Reports"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <span>EHAB & ESLAM TEAM</span>
            <span style={{color: '#64748b', fontSize: '18px', fontWeight: '500'}}>| Inventory Management</span>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add New Property
          </button>
        </div>

        <div className="content-body">
          {/* Executive Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Listings</div>
              <div className="stat-val">{units.length} Units</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Available Value</div>
              <div className="stat-val" style={{color: '#185FA5'}}>EGP {availableValue.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sold / Reserved</div>
              <div className="stat-val" style={{color: '#9A3412'}}>{units.filter(u => u.status !== 'Available').length} Units</div>
            </div>
          </div>

          <div className="toolbar">
            <input type="text" className="search-input" placeholder="Search by compound or developer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Available">Available Only</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project / Developer</th>
                  <th>Unit Specs</th>
                  <th>Asking Price</th>
                  <th>Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px'}}>Loading inventory...</td></tr>
                ) : filteredUnits.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', color: '#64748b', padding: '30px'}}>No properties found. Click "Add New Property" to build your stock.</td></tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr key={unit.id} style={{ opacity: unit.status === 'Sold' ? 0.6 : 1 }}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{unit.compound}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{unit.developer}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{unit.property_type}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{unit.area} Sqm</div>
                      </td>
                      <td style={{ fontWeight: '700', color: '#185FA5' }}>EGP {Number(unit.price).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${unit.status === 'Available' ? 'badge-available' : unit.status === 'Reserved' ? 'badge-reserved' : 'badge-sold'}`}>
                          {unit.status}
                        </span>
                      </td>
                      <td>
                        <select 
                          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }}
                          value={unit.status}
                          onChange={(e) => updateStatus(unit.id, e.target.value)}
                        >
                          <option value="Available">Mark Available</option>
                          <option value="Reserved">Mark Reserved</option>
                          <option value="Sold">Mark Sold</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Unit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Register Property to Inventory</span>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUnit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Compound / Project *</label>
                  <input required type="text" className="form-input" placeholder="e.g. OIA Compound" value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Developer *</label>
                  <input required type="text" className="form-input" placeholder="e.g. Edge Holding" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select className="form-select" value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa / Townhouse</option>
                    <option value="Commercial">Commercial / Retail</option>
                    <option value="Medical">Medical Clinic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Area (Sqm) *</label>
                  <input required type="number" min="1" className="form-input" placeholder="e.g. 150" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Total Asking Price (EGP) *</label>
                  <input required type="number" min="1" className="form-input" placeholder="e.g. 5000000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-submit">Save to Inventory</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}