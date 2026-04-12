"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// 🛡️ جدار حماية Zod للمواصفات الفنية
const InventorySchema = z.object({
  unit_number: z.string().min(1, "رقم الوحدة مطلوب"),
  compound: z.string().min(2, "اسم المشروع مطلوب"),
  developer: z.string().min(2, "اسم المطور مطلوب"), // ✅ تم تأمين حقل المطور هنا
  area: z.number().min(10, "المساحة غير منطقية"),
  floor: z.string().min(1, "رقم الطابق مطلوب"),
  rooms: z.number().min(1, "عدد الغرف لا يقل عن 1"),
  bathrooms: z.number().optional(),
  finishing_status: z.enum(['تشطيب كامل', 'نصف تشطيب', 'بدون تشطيب']),
  price: z.number().min(50000, "السعر يجب أن يكون 50 ألف فأكثر"),
  status: z.enum(['Available', 'Reserved', 'Sold']),
  delivery_date: z.string().optional(),
});

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main-content { margin-right: 64px; flex: 1; padding: 30px; max-width: 1400px; margin-left: auto; margin-right: auto;}
  
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .stat-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
  .stat-val { font-size: 22px; font-weight: 800; color: #185FA5; }
  .stat-label { font-size: 12px; color: #64748b; font-weight: 700; margin-top: 5px; }

  .status-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
  .status-available { background: #ECFDF5; color: #10B981; }
  .status-reserved { background: #FFFBEB; color: #F59E0B; }
  .status-sold { background: #FEF2F2; color: #DC2626; }

  .unit-specs-icon { display: flex; gap: 10px; color: #64748b; font-size: 12px; margin-top: 5px; }
  .spec-item { display: flex; align-items: center; gap: 4px; }

  /* Modal Styles */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
  .modal-content { background: #fff; width: 100%; max-width: 600px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto; }
  .form-label { font-size: 13px; font-weight: 700; color: #475569; display: block; margin-bottom: 5px; }
  .form-input, .form-select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s;}
  .form-input:focus, .form-select:focus { border-color: #185FA5; }
  .btn-submit { width: 100%; background: #185FA5; color: #fff; padding: 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; margin-top: 15px; transition: 0.2s;}
  .btn-submit:hover:not(:disabled) { background: #124b82; }
  .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
`;

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    unit_number: '', compound: '', developer: '', area: 0, floor: '',
    rooms: 3, bathrooms: 2, finishing_status: 'نصف تشطيب', price: 0,
    status: 'Available', delivery_date: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = InventorySchema.safeParse(formData);
    if (!result.success) {
      alert("⚠️ خطأ:\n" + result.error.issues[0].message);
      setIsSubmitting(false); 
      return;
    }

    const { error } = await supabase.from('inventory').insert([result.data]);
    if (!error) {
      setIsModalOpen(false);
      // تصفير النموذج
      setFormData({
        unit_number: '', compound: '', developer: '', area: 0, floor: '',
        rooms: 3, bathrooms: 2, finishing_status: 'نصف تشطيب', price: 0,
        status: 'Available', delivery_date: ''
      });
      fetchData();
      alert("✅ تمت إضافة الوحدة للمخزون بنجاح");
    } else {
      alert("❌ حدث خطأ في النظام: " + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/reports" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></Link>
      </div>

      <div className="main-content">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
          <h1 style={{fontSize:'24px', fontWeight:800, color: '#0f172a'}}>إدارة المخزون العقاري 🏢</h1>
          <button onClick={() => setIsModalOpen(true)} style={{background:'#185FA5', color:'#fff', padding:'10px 20px', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700}}>
            + إضافة وحدة للمخزون
          </button>
        </div>

        {/* كروت الإحصائيات */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{items.length}</div>
            <div className="stat-label">إجمالي الوحدات المسجلة</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{items.filter(i => i.status === 'Available').length}</div>
            <div className="stat-label">متاح للبيع</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{color:'#10B981'}}>
              {items.filter(i => i.status === 'Available').reduce((sum, i) => sum + Number(i.price || 0), 0).toLocaleString()} EGP
            </div>
            <div className="stat-label">قيمة المخزون المتاح</div>
          </div>
        </div>

        {/* الجدول */}
        <div style={{background:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden'}}>
          <table style={{width:'100%', borderCollapse:'collapse', textAlign:'right'}}>
            <thead>
              <tr style={{background:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                <th style={{padding:'15px', color: '#64748b', fontSize: '13px'}}>الوحدة / المشروع</th>
                <th style={{padding:'15px', color: '#64748b', fontSize: '13px'}}>المواصفات الفنية</th>
                <th style={{padding:'15px', color: '#64748b', fontSize: '13px'}}>السعر المطلوب</th>
                <th style={{padding:'15px', color: '#64748b', fontSize: '13px'}}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'30px'}}>جاري تحميل المخزون...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'30px', color:'#64748b'}}>لا توجد وحدات في المخزون حالياً.</td></tr>
              ) : (
                items.map(unit => (
                  <tr key={unit.id} style={{borderBottom:'1px solid #e2e8f0'}}>
                    <td style={{padding:'15px'}}>
                      <div style={{fontWeight:800, color: '#0f172a'}}>شقة رقم {unit.unit_number}</div>
                      <div style={{fontSize:'12px', color:'#64748b', marginTop: '4px'}}>{unit.compound} - {unit.developer}</div>
                    </td>
                    <td style={{padding:'15px'}}>
                      <div style={{fontSize:'13px', fontWeight:700, color: '#0f172a'}}>{unit.area} م² - الطابق {unit.floor}</div>
                      <div className="unit-specs-icon">
                        <span>🛏️ {unit.rooms} غرف</span>
                        <span>🚿 {unit.bathrooms} حمام</span>
                        <span style={{color:'#185FA5'}}>{unit.finishing_status}</span>
                      </div>
                    </td>
                    <td style={{padding:'15px', fontWeight:800, color:'#10b981', direction:'ltr', textAlign:'right'}}>
                      {Number(unit.price).toLocaleString()} EGP
                    </td>
                    <td style={{padding:'15px'}}>
                      <span className={`status-tag ${unit.status === 'Available' ? 'status-available' : unit.status === 'Reserved' ? 'status-reserved' : 'status-sold'}`}>
                        {unit.status === 'Available' ? 'متاحة للبيع' : unit.status === 'Reserved' ? 'محجوزة (Reservation)' : 'مباعة'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة الإضافة المحدثة */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom:'20px', color: '#0f172a', fontWeight: 800}}>إضافة وحدة جديدة للمخزون</h2>
            
            {/* بداية النموذج الذي يحتوي على حقل المطور */}
            <form onSubmit={handleAddUnit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              
              <div style={{gridColumn:'1 / -1'}}>
                <label className="form-label">المشروع / الكومباوند *</label>
                <input required className="form-input" value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} placeholder="مثال: تاج سيتي..." />
              </div>

              {/* ✅ الحقل الجديد المضاف للمطور العقاري */}
              <div style={{gridColumn:'1 / -1'}}>
                <label className="form-label">المطور العقاري *</label>
                <input required className="form-input" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} placeholder="مثال: مدينة نصر للإسكان، إعمار..." />
              </div>

              <div>
                <label className="form-label">رقم الوحدة *</label>
                <input required className="form-input" value={formData.unit_number} onChange={e => setFormData({...formData, unit_number: e.target.value})} />
              </div>
              <div>
                <label className="form-label">الطابق *</label>
                <input required className="form-input" placeholder="الأرضي / الثالث..." value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
              </div>
              <div>
                <label className="form-label">المساحة (م²) *</label>
                <input type="number" required className="form-input" value={formData.area || ''} onChange={e => setFormData({...formData, area: Number(e.target.value)})} />
              </div>
              <div>
                <label className="form-label">عدد الغرف</label>
                <input type="number" className="form-input" value={formData.rooms} onChange={e => setFormData({...formData, rooms: Number(e.target.value)})} />
              </div>
              <div>
                <label className="form-label">حالة التشطيب</label>
                <select className="form-select" value={formData.finishing_status} onChange={e => setFormData({...formData, finishing_status: e.target.value as any})}>
                  <option value="بدون تشطيب">بدون تشطيب (Core & Shell)</option>
                  <option value="نصف تشطيب">نصف تشطيب</option>
                  <option value="تشطيب كامل">تشطيب كامل</option>
                </select>
              </div>
              <div>
                <label className="form-label">السعر المطلوب (EGP) *</label>
                <input type="number" required className="form-input" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              
              <div style={{gridColumn:'1 / -1', marginTop:'10px'}}>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الوحدة في المخزون'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{width:'100%', background:'none', border:'none', marginTop:'10px', color:'#64748b', cursor:'pointer', fontWeight: 700}}>
                  إلغاء
                </button>
              </div>
            </form>
            {/* نهاية النموذج */}

          </div>
        </div>
      )}
    </div>
  );
}