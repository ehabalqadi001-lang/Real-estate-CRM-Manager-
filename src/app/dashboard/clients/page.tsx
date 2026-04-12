"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// 🛡️ جدار حماية Zod (للتحقق من الرقم القومي والبيانات)
const ClientSchema = z.object({
  full_name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  phone: z.string().min(10, "رقم الهاتف غير صالح"),
  phone_2: z.string().optional(),
  // الرقم القومي إما أن يكون فارغاً، أو 14 رقماً بالضبط
  national_id: z.string().regex(/^\d{14}$/, "الرقم القومي يجب أن يتكون من 14 رقماً صالحاً").optional().or(z.literal('')),
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة").optional().or(z.literal('')),
  address: z.string().optional(),
  source: z.enum(['Facebook', 'WhatsApp', 'Website', 'Referral', 'Exhibition', 'Other']).catch('Other'),
  client_type: z.enum(['Buyer', 'Seller', 'Investor']),
  budget: z.string().optional(),
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
  .btn-primary { background: #185FA5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-primary:hover { background: #124b82; }
  
  .content-body { padding: 30px; max-width: 1400px; width: 100%; margin: 0 auto; overflow-x: auto;}
  .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
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
  
  .search-bar { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 8px; width: 300px; font-size: 14px; outline: none;}
  .filters-row { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center;}
`;

export default function ClientsDirectory() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '', phone: '', phone_2: '', email: '', national_id: '',
    address: '', source: 'Other', client_type: 'Buyer', budget: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationResult = ClientSchema.safeParse(formData);

    if (!validationResult.success) {
      alert("⚠️ خطأ في الإدخال:\n" + validationResult.error.issues[0].message);
      setIsSubmitting(false);
      return; 
    }

    const { error } = await supabase.from('clients').insert([validationResult.data]);
    
    if (!error) {
      setIsModalOpen(false);
      setFormData({ full_name: '', phone: '', phone_2: '', email: '', national_id: '', address: '', source: 'Other', client_type: 'Buyer', budget: '' });
      fetchData();
      alert("✅ تم إضافة العميل بنجاح!");
    } else {
      alert("❌ حدث خطأ: " + error.message);
    }
    setIsSubmitting(false);
  };

  const filteredClients = clients.filter(c => 
    c.full_name.includes(searchTerm) || c.phone.includes(searchTerm) || (c.national_id && c.national_id.includes(searchTerm))
  );

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/clients" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">دليل العملاء (CRM)</div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + إضافة عميل جديد
          </button>
        </div>

        <div className="content-body">
          <div className="filters-row">
            <input 
              type="text" 
              className="search-bar" 
              placeholder="🔍 بحث بالاسم، رقم الهاتف، أو الرقم القومي..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div style={{fontSize: '14px', fontWeight: 'bold', color: '#185FA5'}}>
              إجمالي العملاء: {filteredClients.length}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>اسم العميل</th>
                  <th>بيانات الاتصال</th>
                  <th>الرقم القومي</th>
                  <th>مصدر العميل</th>
                  <th>الميزانية</th>
                  <th>تاريخ الإضافة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{textAlign: 'center', padding: '30px'}}>جاري التحميل...</td></tr>
                ) : filteredClients.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>لا يوجد عملاء مضافين حتى الآن أو لا توجد نتائج للبحث.</td></tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div style={{fontWeight: '700'}}>{client.full_name}</div>
                        <div style={{fontSize: '11px', color: '#64748b'}}>{client.client_type === 'Buyer' ? 'مشتري' : client.client_type === 'Seller' ? 'بائع' : 'مستثمر'}</div>
                      </td>
                      <td style={{direction: 'ltr', textAlign: 'right'}}>
                        <div style={{fontWeight: '600'}}>{client.phone}</div>
                        {client.phone_2 && <div style={{fontSize: '12px', color: '#64748b'}}>{client.phone_2}</div>}
                      </td>
                      <td>{client.national_id || <span style={{color: '#94a3b8', fontSize: '12px'}}>غير مسجل</span>}</td>
                      <td>
                        <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600}}>
                          {client.source === 'Referral' ? 'ترشيح (Referral)' : client.source === 'Exhibition' ? 'معرض عقاري' : client.source === 'WhatsApp' ? 'واتساب' : client.source === 'Facebook' ? 'فيسبوك' : client.source === 'Website' ? 'الموقع' : 'غير محدد'}
                        </span>
                      </td>
                      <td style={{fontWeight: '700', color: '#10b981', direction: 'ltr', textAlign: 'right'}}>{client.budget ? `${Number(client.budget).toLocaleString()} EGP` : '-'}</td>
                      <td style={{direction: 'ltr', textAlign: 'right'}}>{new Date(client.created_at).toLocaleDateString('ar-EG')}</td>
                      <td>
                        <Link href={`/dashboard/clients/${client.id}`} style={{color:'#185FA5', fontSize:'13px', fontWeight:'700', textDecoration:'none', border: '1px solid #185FA5', padding: '4px 10px', borderRadius: '6px'}}>
                          الملف الكامل ↗
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* نافذة الإضافة المحدثة */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span>إضافة عميل جديد</span><button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'}}>✕</button></div>
            <form onSubmit={handleAddClient}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">الاسم بالكامل *</label>
                  <input required className="form-input" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="form-group"><label className="form-label">الرقم القومي (14 رقم)</label>
                  <input type="text" maxLength={14} className="form-input" placeholder="اختياري" value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} />
                </div>
                
                <div className="form-group"><label className="form-label">رقم الهاتف الأساسي (WhatsApp) *</label>
                  <input required className="form-input" style={{direction: 'ltr'}} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group"><label className="form-label">رقم هاتف بديل</label>
                  <input className="form-input" style={{direction: 'ltr'}} value={formData.phone_2} onChange={e => setFormData({...formData, phone_2: e.target.value})} />
                </div>

                <div className="form-group"><label className="form-label">مصدر العميل (Lead Source)</label>
                  <select className="form-select" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                    <option value="Other">غير محدد</option>
                    <option value="Facebook">فيسبوك / انستجرام</option>
                    <option value="WhatsApp">تواصل واتساب</option>
                    <option value="Website">الموقع الإلكتروني</option>
                    <option value="Referral">ترشيح من عميل آخر</option>
                    <option value="Exhibition">معرض عقاري</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">نوع العميل</label>
                  <select className="form-select" value={formData.client_type} onChange={e => setFormData({...formData, client_type: e.target.value})}>
                    <option value="Buyer">مشتري (Buyer)</option>
                    <option value="Investor">مستثمر (Investor)</option>
                    <option value="Seller">بائع (Seller)</option>
                  </select>
                </div>

                <div className="form-group"><label className="form-label">الميزانية المتوقعة (EGP)</label>
                  <input type="number" className="form-input" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                </div>
                <div className="form-group"><label className="form-label">البريد الإلكتروني</label>
                  <input type="email" className="form-input" style={{direction: 'ltr'}} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="form-group full"><label className="form-label">العنوان التفصيلي / ملاحظات</label>
                  <textarea className="form-input" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات العميل'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}