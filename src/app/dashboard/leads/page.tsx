"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// 🛡️ جدار الحماية (تم تحديثه ليقبل معرف المخزون)
const DealSchema = z.object({
  inventory_id: z.string().optional(), // المعرف الذكي للمخزون
  client_id: z.string().min(1, "يجب اختيار العميل من القائمة"),
  buyer_name: z.string().min(2, "اسم العميل غير صالح"),
  buyer_phone: z.string().min(10, "رقم هاتف العميل غير صالح"),
  compound: z.string().min(2, "يجب كتابة اسم المشروع/الكومباوند"),
  developer: z.string().min(2, "يجب تحديد اسم المطور العقاري"),
  property_type: z.enum(['شقة', 'فيلا', 'تجاري', 'طبي']).default('شقة'),
  unit_value: z.number().min(50000, "قيمة الوحدة يجب أن تكون 50 ألف على الأقل"), 
  amount_paid: z.number().min(0, "المقدم لا يمكن أن يكون سلبياً"),
  stage: z.enum(['EOI', 'Reservation', 'Contracted', 'Registration', 'Handover']),
  governorate: z.string().min(2, "يجب تحديد المحافظة"),
  registration_status: z.string().min(2, "يجب تحديد حالة الشهر العقاري"),
});

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  .main-content { margin-right: 64px; flex: 1; display: flex; flex-direction: column; width: calc(100% - 64px); }
  .header { padding: 20px 30px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;}
  .header-title { font-size: 22px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  .action-buttons { display: flex; gap: 10px; }
  .btn-primary { background: #185FA5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-primary:hover { background: #124b82; }
  .content-body { padding: 30px; max-width: 1400px; width: 100%; margin: 0 auto; overflow-x: auto;}
  .view-toggle { display: flex; background: #e2e8f0; padding: 4px; border-radius: 8px; width: fit-content; margin-bottom: 20px; }
  .toggle-btn { padding: 8px 16px; border: none; background: transparent; border-radius: 6px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s;}
  .toggle-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .kanban-board { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; align-items: flex-start; }
  .kanban-col { background: #f1f5f9; border-radius: 12px; width: 300px; min-width: 300px; flex-shrink: 0; display: flex; flex-direction: column; max-height: 75vh; }
  .col-header { padding: 16px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;}
  .col-count { background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 20px; font-size: 12px; }
  .col-body { padding: 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 150px;}
  .kanban-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: grab; transition: 0.2s; border-right: 4px solid #185FA5;}
  .kanban-card:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-color: #cbd5e1; }
  .card-title { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px; }
  .card-sub { font-size: 12px; color: #64748b; margin-bottom: 10px; }
  .card-price { font-weight: 700; color: #10b981; font-size: 14px; direction: ltr; text-align: right;}
  
  .pipeline-table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
  .modal-content { background: #fff; width: 100%; max-width: 700px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; }
  .modal-header { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
  .form-group { display: flex; flex-direction: column; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .form-input, .form-select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff;}
  .form-input:focus, .form-select:focus { border-color: #185FA5; }
  .btn-submit { width: 100%; padding: 14px; background: #185FA5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; }
  .smart-badge { display: inline-block; background: #EFF6FF; color: #185FA5; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-right: 8px; font-weight: bold;}
`;

const KANBAN_STAGES = [
  { id: 'EOI', title: 'اهتمام (EOI)', color: '#94a3b8' },
  { id: 'Reservation', title: 'حجز (Reservation)', color: '#f59e0b' },
  { id: 'Contracted', title: 'تعاقد (Contracted)', color: '#3b82f6' },
  { id: 'Registration', title: 'شهر عقاري (Registration)', color: '#8b5cf6' },
  { id: 'Handover', title: 'تسليم (Handover)', color: '#10b981' }
];

export default function SalesPipelinePage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [deals, setDeals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    inventory_id: '', client_id: '', compound: '', developer: '', property_type: 'شقة', 
    unit_value: '', amount_paid: '', stage: 'Reservation', governorate: 'القاهرة', registration_status: 'غير مسجل'
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: dealsData } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    const { data: clientsData } = await supabase.from('clients').select('id, full_name, phone').order('full_name', { ascending: true });
    // جلب الوحدات المتاحة فقط من المخزون الذكي
    const { data: invData } = await supabase.from('inventory').select('*').eq('status', 'Available');
    const { data: devData } = await supabase.from('developers').select('*').order('name', { ascending: true });
    
    setDeals(dealsData || []);
    setClients(clientsData || []);
    setInventory(invData || []);
    setDevelopers(devData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 🧠 دالة الربط الذكي: عندما يختار المندوب وحدة من المخزون، نملأ البيانات تلقائياً
  const handleInventorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUnitId = e.target.value;
    const unit = inventory.find(u => u.id === selectedUnitId);
    
    if (unit) {
      setFormData({
        ...formData,
        inventory_id: unit.id,
        compound: unit.compound,
        developer: unit.developer,
        unit_value: unit.price.toString(),
        property_type: 'شقة', // افتراضي
      });
    } else {
      setFormData({ ...formData, inventory_id: '' });
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const selectedClient = clients.find(c => c.id === formData.client_id);
    if (!selectedClient) { alert("❌ رجاء اختيار عميل"); setIsSubmitting(false); return; }

    const rawData = {
      inventory_id: formData.inventory_id || undefined,
      client_id: selectedClient.id,
      buyer_name: selectedClient.full_name,
      buyer_phone: selectedClient.phone,
      compound: formData.compound,
      developer: formData.developer,
      property_type: formData.property_type,
      unit_value: Number(formData.unit_value),
      amount_paid: Number(formData.amount_paid),
      stage: formData.stage,
      governorate: formData.governorate,
      registration_status: formData.registration_status,
    };

    const validationResult = DealSchema.safeParse(rawData);

    if (!validationResult.success) {
      const firstErrorMessage = validationResult.error?.issues[0]?.message || "بيانات غير صالحة";
      alert("⚠️ خطأ في الإدخال:\n" + firstErrorMessage);
      setIsSubmitting(false);
      return; 
    }

    const payload = { ...validationResult.data, status: 'Pending', finance_status: 'Pending Claim' };

    // 1. تسجيل البيعة في جدول المبيعات
    const { error } = await supabase.from('deals').insert([payload]);
    
    if (!error) {
      // 2. تحديث المخزون (تغيير الحالة إلى محجوزة) إذا تم اختيار وحدة
      if (formData.inventory_id) {
        await supabase.from('inventory').update({ status: 'Reserved' }).eq('id', formData.inventory_id);
      }
      
      setIsModalOpen(false);
      setFormData({ inventory_id: '', client_id: '', compound: '', developer: '', property_type: 'شقة', unit_value: '', amount_paid: '', stage: 'Reservation', governorate: 'القاهرة', registration_status: 'غير مسجل' });
      fetchData(); // جلب البيانات المحدثة
      alert("✅ تم تسجيل البيعة وحجز الوحدة من المخزون بنجاح!");
    } else {
      alert("❌ حدث خطأ في النظام: " + error.message);
    }
    setIsSubmitting(false);
  };

  // وظائف السحب والإفلات (Kanban Drag & Drop)
  const handleDragStart = (e: React.DragEvent, dealId: string) => { e.dataTransfer.setData('dealId', dealId); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (!dealId) return;
    setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    await supabase.from('deals').update({ stage: newStage }).eq('id', dealId);
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
          <div className="header-title">إدارة مسار المبيعات (Pipeline)</div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + إضافة بيعة جديدة
          </button>
        </div>

        <div className="content-body">
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>لوحة كانبان</button>
            <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>عرض الجدول</button>
          </div>

          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>جاري التحميل...</div>
          ) : viewMode === 'kanban' ? (
            <div className="kanban-board">
              {KANBAN_STAGES.map(stage => {
                const stageDeals = deals.filter(d => (d.stage || 'EOI') === stage.id);
                return (
                  <div key={stage.id} className="kanban-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage.id)}>
                    <div className="col-header" style={{borderBottomColor: stage.color}}>
                      <span>{stage.title}</span><span className="col-count">{stageDeals.length}</span>
                    </div>
                    <div className="col-body">
                      {stageDeals.map(deal => (
                        <div key={deal.id} className="kanban-card" style={{borderRightColor: stage.color}} draggable onDragStart={(e) => handleDragStart(e, deal.id)}>
                          <div className="card-title">{deal.buyer_name}</div>
                          <div className="card-sub">{deal.compound} - {deal.developer}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link href={`/dashboard/deals/${deal.id}`} style={{fontSize: '11px', color: '#185FA5', textDecoration: 'none', fontWeight: 'bold'}}>تفاصيل ↗</Link>
                            <div className="card-price">EGP {Number(deal.unit_value).toLocaleString('ar-EG')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="pipeline-table-container">
              {/* نفس الجدول السابق */}
              <table>
                <thead>
                  <tr><th>العميل</th><th>المشروع</th><th>القيمة</th><th>المرحلة</th></tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id}>
                      <td><div style={{fontWeight: '600'}}>{deal.buyer_name}</div></td>
                      <td><div>{deal.compound}</div><div style={{fontSize:'12px', color:'#64748b'}}>{deal.developer}</div></td>
                      <td style={{fontWeight: '700', color: '#185FA5', direction: 'ltr', textAlign: 'right'}}>EGP {Number(deal.unit_value).toLocaleString('ar-EG')}</td>
                      <td><span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600}}>{deal.stage}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* نافذة الإضافة المحدثة (الربط الذكي) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span>تسجيل بيعة جديدة</span><button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', fontSize:'20px', cursor:'pointer'}}>✕</button></div>
            <form onSubmit={handleAddDeal}>
              
              {/* 🧠 الربط الذكي بالمخزون */}
              <div className="form-group full" style={{background: '#EFF6FF', padding: '15px', borderRadius: '8px', border: '1px solid #BFDBFE', marginBottom: '15px'}}>
                <label className="form-label" style={{color: '#1E3A8A'}}><span className="smart-badge">ميزة ذكية</span>اختر الوحدة من المخزون المتاح (اختياري)</label>
                <select className="form-select" value={formData.inventory_id} onChange={handleInventorySelect}>
                  <option value="">-- تسجيل بيعة خارجية (غير موجودة في المخزون) --</option>
                  {inventory.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      شقة {unit.unit_number} - مشروع {unit.compound} ({unit.price.toLocaleString()} EGP)
                    </option>
                  ))}
                </select>
                <div style={{fontSize: '11px', color: '#3B82F6', marginTop: '6px'}}>* اختيار وحدة سيقوم بتعبئة السعر والمطور تلقائياً وحجزها فوراً في المخزون لمنع تكرار البيع.</div>
              </div>

              <div className="form-group full"><label className="form-label">العميل المشتري *</label>
                <select required className="form-select" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                  <option value="">-- اختر من دليل العملاء --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              
              <div className="form-grid">
                <div className="form-group"><label className="form-label">المطور العقاري *</label>
                  <select required className="form-select" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})}>
  <option value="">-- اختر المطور --</option>
  {developers.map(dev => <option key={dev.id} value={dev.id}>{dev.name}</option>)}
</select>
                </div>
                <div className="form-group"><label className="form-label">المشروع / الكومباوند *</label>
                  <input required className="form-input" value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} />
                </div>
                
                <div className="form-group"><label className="form-label">نوع الوحدة</label>
                  <select className="form-select" value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                    <option value="شقة">شقة (Apartment)</option>
                    <option value="فيلا">فيلا (Villa)</option>
                    <option value="تجاري">تجاري (Commercial)</option>
                    <option value="طبي">طبي (Medical)</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">مرحلة البيع</label>
                  <select className="form-select" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                    {KANBAN_STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                <div className="form-group"><label className="form-label">السعر الإجمالي (EGP) *</label>
                  <input required type="number" className="form-input" value={formData.unit_value} onChange={e => setFormData({...formData, unit_value: e.target.value})} />
                </div>
                <div className="form-group"><label className="form-label">المقدم المدفوع (EGP) *</label>
                  <input required type="number" className="form-input" value={formData.amount_paid} onChange={e => setFormData({...formData, amount_paid: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? 'جاري التسجيل...' : 'تسجيل البيعة'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}