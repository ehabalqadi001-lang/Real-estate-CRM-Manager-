"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; }
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
  .pipeline-table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  .stage-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #FFF7ED; color: #9A3412; border: 1px solid #FDBA74; }
  .stage-contracted { background: #E6F1FB; color: #185FA5; border-color: #93C5FD; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
  .modal-content { background: #fff; width: 100%; max-width: 650px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; direction: rtl; }
  .modal-header { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
  .form-group { display: flex; flex-direction: column; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .form-input, .form-select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff;}
  .btn-submit { width: 100%; padding: 14px; background: #185FA5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; }
  .smart-source { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; border-right: 4px solid #185FA5;}
`;

export default function SalesPipelinePage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    inventory_id: '', client_id: '', compound: '', developer: '', property_type: 'Apartment', 
    unit_value: '', amount_paid: '', stage: 'Reservation'
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: dealsData } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    const { data: clientsData } = await supabase.from('clients').select('id, full_name, phone').order('full_name', { ascending: true });
    const { data: invData } = await supabase.from('inventory').select('*').eq('status', 'Available');
    const { data: devData } = await supabase.from('developers').select('*').order('name', { ascending: true });
    
    setDeals(dealsData || []);
    setClients(clientsData || []);
    setInventory(invData || []);
    setDevelopers(devData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleInventorySelect = (invId: string) => {
    if (invId) {
      const selectedUnit = inventory.find(u => u.id === invId);
      if (selectedUnit) {
        setFormData({
          ...formData,
          inventory_id: invId,
          compound: selectedUnit.compound,
          developer: selectedUnit.developer,
          property_type: selectedUnit.property_type,
          unit_value: selectedUnit.price.toString()
        });
      }
    } else {
      setFormData({ ...formData, inventory_id: '', compound: '', developer: '', property_type: 'Apartment', unit_value: '' });
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const selectedClient = clients.find(c => c.id === formData.client_id);
    if (!selectedClient) { alert("Please select a client"); setIsSubmitting(false); return; }

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
      if (formData.inventory_id) await supabase.from('inventory').update({ status: 'Reserved' }).eq('id', formData.inventory_id);
      setIsModalOpen(false);
      setFormData({ inventory_id: '', client_id: '', compound: '', developer: '', property_type: 'Apartment', unit_value: '', amount_paid: '', stage: 'Reservation' });
      fetchData();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">سجل المبيعات</div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>إضافة بيعة جديدة</button>
        </div>

        <div className="content-body">
          <div className="pipeline-table-container">
            <table>
              <thead>
                <tr>
                  <th>معلومات البيعة</th>
                  <th>العميل</th>
                  <th>القيمة</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{textAlign: 'center'}}>جاري التحميل...</td></tr> : deals.map((deal) => (
                  <tr key={deal.id}>
                    <td>{deal.compound}<div style={{fontSize:'12px', color:'#64748b'}}>{deal.developer}</div></td>
                    <td>{deal.buyer_name}</td>
                    <td>{Number(deal.unit_value).toLocaleString()} ج.م</td>
                    <td><span className={`stage-badge ${deal.stage==='Contracted'?'stage-contracted':''}`}>{deal.stage}</span></td>
                    <td><Link href={`/dashboard/deals/${deal.id}`} style={{color:'#185FA5', fontSize:'13px', fontWeight:'600'}}>عرض ↗</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span>تسجيل بيعة جديدة</span><button onClick={() => setIsModalOpen(false)}>✕</button></div>
            <form onSubmit={handleAddDeal}>
              <div className="form-group full"><label className="form-label">العميل *</label>
                <select required className="form-select" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                  <option value="">-- اختر من دليل العملاء --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div className="smart-source"><label className="form-label">سحب بيانات من المخزون</label>
                <select className="form-select" value={formData.inventory_id} onChange={(e) => handleInventorySelect(e.target.value)}>
                  <option value="">-- إدخال يدوي حر --</option>
                  {inventory.map(u => <option key={u.id} value={u.id}>{u.compound} - {u.price.toLocaleString()}</option>)}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">المطور *</label>
                  <select required className="form-select" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})}>
                    <option value="">-- اختر المطور --</option>
                    {developers.map(dev => <option key={dev.id} value={dev.name}>{dev.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">المشروع *</label><input required className="form-input" value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">السعر *</label><input required type="number" className="form-input" value={formData.unit_value} onChange={e => setFormData({...formData, unit_value: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">المقدم المدفوع *</label><input required type="number" className="form-input" value={formData.amount_paid} onChange={e => setFormData({...formData, amount_paid: e.target.value})} /></div>
              </div>
              <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? 'جاري التسجيل...' : 'تسجيل البيعة'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}