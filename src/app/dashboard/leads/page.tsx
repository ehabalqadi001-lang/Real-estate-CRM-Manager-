"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // استدعاء قاعدة البيانات

// تم عزل أكواد التصميم هنا في الأعلى
const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-title { color: #fff; font-size: 15px; font-weight: 500; letter-spacing: 0.5px; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 30px; height: 30px; border-radius: 50%; background: #185FA5; display: flex; align-items: center; justify-content: center; color: #B5D4F4; font-size: 11px; font-weight: 500; }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #E24B4A; display: inline-block; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; min-height: calc(100vh - 48px); }
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #fff; border-radius: 12px 0 0 0; border: 1px solid #e2e8f0; border-right: none; margin-top: 1px; }
  .tabs { display: flex; gap: 0; border-bottom: 1px solid #e2e8f0; background: #fff; padding: 0 20px; border-radius: 12px 0 0 0; }
  .tab { padding: 14px 16px; font-size: 13px; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; }
  .tab.active { color: #185FA5; border-bottom-color: #185FA5; }
  .filters { display: flex; gap: 8px; padding: 12px 20px; background: #f8fafc; align-items: center; border-bottom: 1px solid #e2e8f0; }
  .filter-select { font-size: 12px; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; color: #0f172a; outline: none; }
  .filter-tag { display: flex; align-items: center; gap: 4px; font-size: 12px; padding: 5px 10px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; color: #64748b; }
  .add-btn { margin-left: auto; background: #0f1c2e; color: #fff; font-size: 12px; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
  .summary-bar { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid #e2e8f0; }
  .summary-col { padding: 16px 20px; border-right: 1px solid #e2e8f0; }
  .summary-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .summary-value { font-size: 20px; font-weight: 600; color: #0f172a; }
  .summary-count { font-size: 11px; color: #64748b; margin-top: 4px; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 20px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; font-size: 12px; background: #f8fafc; white-space: nowrap; }
  td { padding: 14px 20px; border-bottom: 1px solid #e2e8f0; color: #0f172a; vertical-align: middle; }
  tr:hover td { background: #f8fafc; }
  .pill { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; border: 1px solid transparent; display: inline-block; }
  .pill-blue { background: #E6F1FB; color: #185FA5; border-color: #B5D4F4; }
  .pill-green { background: #EAF3DE; color: #3B6D11; border-color: #C5E1A5; }
  .pill-red { background: #FCEBEB; color: #A32D2D; border-color: #F8B4B4; }
  .agent-name { font-weight: 600; color: #0f172a; }
  .agent-sub { font-size: 11px; color: #64748b; }
  .id-link { color: #185FA5; text-decoration: none; font-weight: 600; }
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 28, 46, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
  .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 550px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
  .modal-header { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
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
`;

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // حالات تخزين بيانات الإدخال (Form State)
  const [formData, setFormData] = useState({
    unit_id: '',
    buyer_name: '',
    buyer_phone: '',
    compound: 'Pyramids City',
    property_type: 'Apartment',
    unit_value: '',
    amount_paid: '',
    stage: 'EOI',
    contract_date: '',
    installment_years: ''
  });

  const dummyDeals = [
    { id: 16708, partner: 'Fast Investment', agent: 'Ehab Alqadi', compound: 'Pyramids City', dev: 'Pyramids Developments', stage: 'Sale Claim', status: 'Approved', comm: '442,700', commPct: '5%', value: '9,739,400', dp: '442,700', buyer: 'Bakr Ibrahim Ahmed', phone: '+201550809144' },
    { id: 3700, partner: 'Fast Investment', agent: 'Ehab Alqadi', compound: 'De Joya 3 Strip Mall', dev: 'Taj Misr Developments', stage: 'Sale Claim', status: 'Approved', comm: '144,450', commPct: '4.5% Normal', value: '3,210,000', dp: '481,000', buyer: 'أ. محمود محمد عبد الرهاب', phone: '+201101160208' },
  ];

  // دالة لحفظ البيانات في Supabase
  const handleSaveDeal = async () => {
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from('deals')
        .insert([
          {
            unit_id: formData.unit_id,
            buyer_name: formData.buyer_name,
            buyer_phone: formData.buyer_phone,
            compound: formData.compound,
            property_type: formData.property_type,
            unit_value: parseFloat(formData.unit_value) || 0,
            amount_paid: parseFloat(formData.amount_paid) || 0,
            stage: formData.stage,
            contract_date: formData.contract_date || null,
            installment_years: parseInt(formData.installment_years) || null,
            status: formData.stage === 'Sale Claim' ? 'Pending' : 'Pending'
          }
        ]);

      if (error) throw error;

      alert('تم حفظ الصفقة بنجاح في قاعدة البيانات!');
      setIsModalOpen(false);
      
      // تفريغ الحقول بعد الحفظ
      setFormData({
        unit_id: '', buyer_name: '', buyer_phone: '', compound: 'Pyramids City', property_type: 'Apartment', unit_value: '', amount_paid: '', stage: 'EOI', contract_date: '', installment_years: ''
      });

    } catch (error: any) {
      alert('حدث خطأ أثناء الحفظ: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="topbar-right">
          <div style={{ position: 'relative' }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div className="notif-dot" style={{ position: 'absolute', top: 0, right: 0 }}></div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginLeft: '10px' }}>Ehab Alqadi</div>
          <div className="avatar">EA</div>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <div className="sidebar">
          <Link href="/dashboard" className="nav-item" title="Dashboard">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </Link>
          <Link href="/dashboard/leads" className="nav-item active" title="Sales Pipeline">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <Link href="/dashboard/commissions" className="nav-item" title="Commissions">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </Link>
          <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
          <Link href="/dashboard/developers" className="nav-item" title="Developers">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </Link>
        </div>

        <div className="main">
          <div className="tabs">
            <div className={`tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>Sales Pipeline</div>
          </div>

          {activeTab === 'pipeline' && (
            <div>
              <div className="filters">
                <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Add Deal</button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Partner & Agent</th>
                      <th>Compound</th>
                      <th>Sale Stage</th>
                      <th>Property Value</th>
                      <th>Buyer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dummyDeals.map((d, i) => (
                      <tr key={i}>
                        <td><a className="id-link" href="#">#{d.id}</a></td>
                        <td>
                          <div className="agent-name">{d.partner}</div>
                          <div className="agent-sub">{d.agent}</div>
                        </td>
                        <td>
                          <div className="agent-name">{d.compound}</div>
                          <div className="agent-sub">{d.dev}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                            <span className={`pill ${d.status === 'Approved' ? 'pill-green' : 'pill-red'}`}>{d.stage}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '600' }}>{d.value}</td>
                        <td>
                          <div className="agent-name">{d.buyer}</div>
                          <div className="agent-sub">{d.phone}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Add Deal to Supabase */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Deal to Database</h2>
              <div className="modal-close" onClick={() => setIsModalOpen(false)}>×</div>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Unit ID *</label>
                  <input className="form-input" placeholder="e.g. CP-B04-5008" value={formData.unit_id} onChange={(e) => setFormData({...formData, unit_id: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Compound *</label>
                  <select className="form-input" value={formData.compound} onChange={(e) => setFormData({...formData, compound: e.target.value})}>
                    <option>Pyramids City</option>
                    <option>De Joya 3</option>
                    <option>OIA Compound</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Buyer Name *</label>
                  <input className="form-input" placeholder="Full name" value={formData.buyer_name} onChange={(e) => setFormData({...formData, buyer_name: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Buyer Phone *</label>
                  <input className="form-input" placeholder="010xxxxxxxx" value={formData.buyer_phone} onChange={(e) => setFormData({...formData, buyer_phone: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Unit Value * (EGP)</label>
                  <input className="form-input" type="number" placeholder="0" value={formData.unit_value} onChange={(e) => setFormData({...formData, unit_value: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Amount Paid * (EGP)</label>
                  <input className="form-input" type="number" placeholder="0" value={formData.amount_paid} onChange={(e) => setFormData({...formData, amount_paid: e.target.value})} />
                </div>
              </div>
              <div className="form-field" style={{ marginBottom: '16px' }}>
                <label className="form-label">Deal Stage *</label>
                <select className="form-input" value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})}>
                  <option value="EOI">EOI</option>
                  <option value="Reservation">Reservation</option>
                  <option value="Sale Claim">Sale Claim (Contracted)</option>
                </select>
              </div>

              {formData.stage === 'Sale Claim' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Contract Date *</label>
                      <input className="form-input" type="date" value={formData.contract_date} onChange={(e) => setFormData({...formData, contract_date: e.target.value})} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Installment Years</label>
                      <input className="form-input" type="number" placeholder="e.g. 8" value={formData.installment_years} onChange={(e) => setFormData({...formData, installment_years: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleSaveDeal} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Deal to DB'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}