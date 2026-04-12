"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// 🛡️ جدار حماية Zod للمواصفات الفنية
const InventorySchema = z.object({
  unit_number: z.string().min(1, "رقم الوحدة مطلوب"),
  compound: z.string().min(2, "اسم المشروع مطلوب"),
  developer: z.string().min(2, "اسم المطور مطلوب"),
  area: z.number().min(10, "المساحة غير منطقية"),
  floor: z.string().min(1, "رقم الطابق مطلوب"),
  rooms: z.number().min(1, "عدد الغرف لا يقل عن 1"),
  bathrooms: z.number().min(1, "عدد الحمامات لا يقل عن 1"),
  finishing_status: z.enum(['تشطيب كامل', 'نصف تشطيب', 'بدون تشطيب']),
  price: z.number().min(100000, "السعر يجب أن يكون 100 ألف فأكثر"),
  status: z.enum(['Available', 'Reserved', 'Sold']),
  delivery_date: z.string().optional(),
});

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  .main-content { margin-right: 64px; flex: 1; padding: 30px; }
  
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
`;

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    unit_number: '', compound: '', developer: '', area: 0, floor: 'الأرضي',
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
      setIsSubmitting(false); return;
    }

    const { error } = await supabase.from('inventory').insert([result.data]);
    if (!error) {
      setIsModalOpen(false);
      fetchData();
      alert("✅ تمت إضافة الوحدة للمخزون");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* Sidebar (نفس المكون السابق) */}
      <div className="sidebar" style={{width:'64px', background:'#0f1c2e', position:'fixed', right:0, top:0, bottom:0}}>
         {/* ... أيقونات التنقل ... */}
      </div>

      <div className="main-content">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
          <h1 style={{fontSize:'24px', fontWeight:800}}>إدارة المخزون العقاري 🏗️</h1>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{background:'#185FA5', color:'#fff', padding:'10px 20px', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700}}>
            + إضافة وحدة للمخزون
          </button>
        </div>

        {/* كروت الإحصائيات */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{items.length}</div>
            <div className="stat-label">إجمالي الوحدات</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{items.filter(i => i.status === 'Available').length}</div>
            <div className="stat-label">متاح للبيع</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{color:'#10B981'}}>
              {items.filter(i => i.status === 'Available').reduce((sum, i) => sum + i.price, 0).toLocaleString()} EGP
            </div>
            <div className="stat-label">قيمة المخزون المتاح</div>
          </div>
        </div>

        {/* الجدول العربي المطور */}
        <div style={{background:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden'}}>
          <table style={{width:'100%', borderCollapse:'collapse', textAlign:'right'}}>
            <thead>
              <tr style={{background:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                <th style={{padding:'15px'}}>الوحدة / المشروع</th>
                <th style={{padding:'15px'}}>المواصفات الفنية</th>
                <th style={{padding:'15px'}}>السعر المطلوب</th>
                <th style={{padding:'15px'}}>الحالة</th>
                <th style={{padding:'15px'}}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{textAlign:'center', padding:'30px'}}>جاري تحميل المخزون...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center', padding:'30px', color:'#64748b'}}>لا توجد وحدات في المخزون حالياً.</td></tr>
              ) : (
                items.map(unit => (
                  <tr key={unit.id} style={{borderBottom:'1px solid #e2e8f0'}}>
                    <td style={{padding:'15px'}}>
                      <div style={{fontWeight:800}}>شقة رقم {unit.unit_number}</div>
                      <div style={{fontSize:'12px', color:'#64748b'}}>{unit.compound} - {unit.developer}</div>
                    </td>
                    <td style={{padding:'15px'}}>
                      <div style={{fontSize:'13px', fontWeight:700}}>{unit.area} م² - الطابق {unit.floor}</div>
                      <div className="unit-specs-icon">
                        <span>🛏️ {unit.rooms} غرف</span>
                        <span>🚿 {unit.bathrooms} حمام</span>
                        <span style={{color:'#185FA5'}}>{unit.finishing_status}</span>
                      </div>
                    </td>
                    <td style={{padding:'15px', fontWeight:800, color:'#185FA5', direction:'ltr', textAlign:'right'}}>
                      {unit.price.toLocaleString()} EGP
                    </td>
                    <td style={{padding:'15px'}}>
                      <span className={`status-tag ${unit.status === 'Available' ? 'status-available' : unit.status === 'Reserved' ? 'status-reserved' : 'status-sold'}`}>
                        {unit.status === 'Available' ? 'متاحة' : unit.status === 'Reserved' ? 'محجوزة' : 'مباعة'}
                      </span>
                    </td>
                    <td style={{padding:'15px'}}>
                      <button style={{background:'none', border:'1px solid #e2e8f0', padding:'5px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'12px'}}>تعديل</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة الإضافة المحدثة بمواصفات 2030 */}
      {isModalOpen && (
        <div className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'#fff', width:'600px', borderRadius:'16px', padding:'30px', maxHeight:'90vh', overflowY:'auto'}}>
            <h2 style={{marginBottom:'20px'}}>إضافة وحدة جديدة للمخزون</h2>
            <form onSubmit={handleAddUnit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{fontSize:'13px', fontWeight:700}}>المشروع / الكومباوند *</label>
                <input required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} />
              </div><form onSubmit={handleAddUnit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{fontSize:'13px', fontWeight:700}}>المشروع / الكومباوند *</label>
                <input required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.compound} onChange={e => setFormData({...formData, compound: e.target.value})} />
              </div>

              {/* 🔥 الخانة المفقودة التي أضفناها هنا 🔥 */}
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{fontSize:'13px', fontWeight:700}}>المطور العقاري *</label>
                <input required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} placeholder="مثال: إعمار، بالم هيلز..." />
              </div>

              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>رقم الوحدة *</label>
                <input required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.unit_number} onChange={e => setFormData({...formData, unit_number: e.target.value})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>الطابق *</label>
                <input required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} placeholder="الأرضي / الثالث..." value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>المساحة (م²) *</label>
                <input type="number" required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.area} onChange={e => setFormData({...formData, area: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>عدد الغرف</label>
                <input type="number" style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.rooms} onChange={e => setFormData({...formData, rooms: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>حالة التشطيب</label>
                <select style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.finishing_status} onChange={e => setFormData({...formData, finishing_status: e.target.value as any})}>
                  <option value="بدون تشطيب">بدون تشطيب (Core & Shell)</option>
                  <option value="نصف تشطيب">نصف تشطيب</option>
                  <option value="تشطيب كامل">تشطيب كامل</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>السعر المطلوب (EGP) *</label>
                <input type="number" required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              
              <div style={{gridColumn:'1 / -1', marginTop:'10px'}}>
                <button type="submit" style={{width:'100%', background:'#185FA5', color:'#fff', padding:'14px', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700}}>حفظ الوحدة في المخزون</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{width:'100%', background:'none', border:'none', marginTop:'10px', color:'#64748b', cursor:'pointer'}}>إلغاء</button>
              </div>
            </form>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>رقم الوحدة *</label>
                <input required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.unit_number} onChange={e => setFormData({...formData, unit_number: e.target.value})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>الطابق *</label>
                <input required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} placeholder="الأرضي / الثالث..." value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>المساحة (م²) *</label>
                <input type="number" required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.area} onChange={e => setFormData({...formData, area: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>عدد الغرف</label>
                <input type="number" style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.rooms} onChange={e => setFormData({...formData, rooms: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>حالة التشطيب</label>
                <select style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.finishing_status} onChange={e => setFormData({...formData, finishing_status: e.target.value as any})}>
                  <option value="بدون تشطيب">بدون تشطيب (Core & Shell)</option>
                  <option value="نصف تشطيب">نصف تشطيب</option>
                  <option value="تشطيب كامل">تشطيب كامل</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:700}}>السعر المطلوب (EGP) *</label>
                <input type="number" required style={{width:'100%', padding:'10px', marginTop:'5px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div style={{gridColumn:'1 / -1', marginTop:'10px'}}>
                <button type="submit" style={{width:'100%', background:'#185FA5', color:'#fff', padding:'14px', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700}}>حفظ الوحدة في المخزون</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{width:'100%', background:'none', border:'none', marginTop:'10px', color:'#64748b', cursor:'pointer'}}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}