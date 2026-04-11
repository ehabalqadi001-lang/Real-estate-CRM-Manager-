"use client";
import React, { useState } from 'react';

// --- البيانات الوهمية للصيانة (Mock Data) ---
const initialDeals = [
  {id:16708,partner:'Fast Investment',agent:'Ehab Alqadi',compound:'Pyramids City',dev:'Pyramids Developments',stage:'Sale Claim',status:'Approved',comm:'442,700',commPct:'5%',value:'9,739,400',dp:'442,700',buyer:'Bakr Ibrahim Ahmed Shaaban',phone:'+201550809144',date:'29-05-2025'},
  {id:3700,partner:'Fast Investment',agent:'Ehab Alqadi',compound:'De Joya 3 Strip Mall',dev:'Taj Misr Developments',stage:'Sale Claim',status:'Approved',comm:'144,450',commPct:'4.5%',value:'3,210,000',dp:'481,000',buyer:'أ. محمود محمد عبد الرهاب',phone:'+201101160208',date:'09-02-2024'},
  {id:3383,partner:'Fast Investment',agent:'Ehab Alqadi',compound:'De Joya 1 Strip Mall',dev:'Taj Misr Developments',stage:'Sale Claim',status:'Rejected',comm:'90,900',commPct:'4.5%',value:'2,020,000',dp:'202,000',buyer:'Bassma Mohamed El Naboulsy',phone:'+201060078363',date:'13-02-2024'},
  {id:2939,partner:'Fast Investment',agent:'Ehab Alqadi',compound:'Ninety Avenue',dev:'TBK Developments',stage:'Sale Claim',status:'Approved',comm:'343,193',commPct:'2.25%',value:'15,253,000',dp:'1,525,300',buyer:'Bassma Mohamed El Naboulsy',phone:'+201060078363',date:'30-04-2024'},
];

export default function SalesPipelinePage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stage, setStage] = useState('EOI');

  const styles = `
    .pipeline-container { font-family: system-ui, sans-serif; background: #ffffff; border-radius: 12px; overflow: hidden; border: 0.5px solid #f1f5f9; }
    .topbar { background: #0f1c2e; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
    .topbar-title { color: #fff; font-size: 15px; font-weight: 500; }
    .tabs { display: flex; border-bottom: 0.5px solid #f1f5f9; background: #fff; padding: 0 20px; }
    .tab { padding: 12px 16px; font-size: 13px; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { color: #185FA5; border-bottom-color: #185FA5; font-weight: 500; }
    .filters { display: flex; gap: 8px; padding: 12px 20px; background: #f8fafc; align-items: center; }
    .filter-select { font-size: 12px; padding: 6px 10px; border: 0.5px solid #e2e8f0; border-radius: 6px; background: #fff; }
    .add-btn { margin-left: auto; background: #0f1c2e; color: #fff; font-size: 12px; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .summary-bar { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 0.5px solid #f1f5f9; }
    .summary-col { padding: 16px 20px; border-right: 0.5px solid #f1f5f9; }
    .summary-label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
    .summary-value { font-size: 18px; font-weight: 600; color: #0f172a; }
    .table-wrap { padding: 0 20px 20px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    th { text-align: left; padding: 10px; color: #64748b; font-weight: 400; border-bottom: 0.5px solid #f1f5f9; }
    td { padding: 12px 10px; border-bottom: 0.5px solid #f1f5f9; }
    .pill { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
    .pill-green { background: #EAF3DE; color: #3B6D11; border: 1px solid #97C459; }
    .pill-red { background: #FCEBEB; color: #A32D2D; border: 1px solid #F09595; }
    .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:100; }
    .modal { background:#fff; padding:24px; border-radius:12px; width:100%; max-width:500px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
    .form-group { margin-bottom: 12px; }
    .form-label { display:block; font-size:11px; color:#64748b; margin-bottom:4px; }
    .form-input { width:100%; padding:8px 12px; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; }
  `;

  return (
    <div className="pipeline-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="topbar">
        <div className="topbar-title">Sales Pipeline — FAST INVESTMENT</div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>Sales Pipeline</div>
        <div className={`tab ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>All Sales</div>
        <div className={`tab ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => setActiveTab('commissions')}>Commissions</div>
      </div>

      <div className="filters">
        <select className="filter-select"><option>Sale Stage — All</option></select>
        <select className="filter-select"><option>Status — All</option></select>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Add Deal</button>
      </div>

      <div className="summary-bar">
        <div className="summary-col">
          <div className="summary-label">EOIs</div>
          <div className="summary-value">EGP 0</div>
        </div>
        <div className="summary-col">
          <div className="summary-label">Reservations</div>
          <div className="summary-value">EGP 0</div>
        </div>
        <div className="summary-col">
          <div className="summary-label">Contracted (Claims)</div>
          <div className="summary-value">EGP 28.2M</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Agent</th>
              <th>Compound</th>
              <th>Stage</th>
              <th>Commission</th>
              <th>Value</th>
              <th>Buyer</th>
            </tr>
          </thead>
          <tbody>
            {initialDeals.map((d, i) => (
              <tr key={i}>
                <td style={{ color: '#185FA5', fontWeight: '500' }}>#{d.id}</td>
                <td>{d.agent}</td>
                <td>
                  <div style={{ fontWeight: '500' }}>{d.compound}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{d.dev}</div>
                </td>
                <td>
                  <span className={`pill ${d.status === 'Approved' ? 'pill-green' : 'pill-red'}`}>{d.stage}</span>
                </td>
                <td>
                  <div style={{ fontWeight: '600' }}>{d.comm}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{d.commPct}</div>
                </td>
                <td style={{ fontWeight: '500' }}>{d.value}</td>
                <td>
                   <div style={{ fontWeight: '500' }}>{d.buyer}</div>
                   <div style={{ fontSize: '10px', color: '#64748b' }}>{d.phone}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Add New Deal</h3>
            <div className="form-group">
              <label className="form-label">Buyer Name *</label>
              <input className="form-input" placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Compound *</label>
              <select className="form-input">
                <option>Pyramids City</option>
                <option>De Joya 3</option>
                <option>OIA Compound</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Unit Value (EGP)</label>
                <input className="form-input" type="number" />
              </div>
              <div className="form-group">
                <label className="form-label">Stage</label>
                <select className="form-input" value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="EOI">EOI</option>
                  <option value="Reservation">Reservation</option>
                  <option value="Sale Claim">Sale Claim</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: '#0f1c2e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save Deal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}