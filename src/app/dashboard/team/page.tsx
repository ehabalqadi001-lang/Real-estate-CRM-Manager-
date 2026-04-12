"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// 🛡️ جدار الحماية لبيانات الموظف الجديد
const InviteSchema = z.object({
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة"),
  full_name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  role: z.enum(['super_admin', 'sales_manager', 'accountant', 'agent']),
});

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  .main-content { margin-right: 64px; flex: 1; padding: 30px; max-width: 1200px; margin-left: auto; margin-right: auto;}
  
  .header-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; }
  .btn-primary { background: #0f1c2e; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
  .btn-primary:hover { background: #185FA5; }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .stat-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px;}
  .stat-val { font-size: 28px; font-weight: 800; color: #185FA5; }
  .stat-label { font-size: 13px; color: #64748b; font-weight: 700; }

  .team-table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; vertical-align: middle; }
  
  .role-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; }
  .role-super_admin { background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5;}
  .role-sales_manager { background: #FFFBEB; color: #F59E0B; border: 1px solid #FDE68A;}
  .role-accountant { background: #F3E8FF; color: #9333EA; border: 1px solid #D8B4FE;}
  .role-agent { background: #EFF6FF; color: #3B82F6; border: 1px solid #BFDBFE;}
  
  .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-left: 6px; }
  .status-active { background: #10B981; box-shadow: 0 0 6px #10B981;}
  .status-suspended { background: #94A3B8; }

  /* Modal Styles */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,28,46,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
  .modal-content { background: #fff; width: 100%; max-width: 500px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
  .form-group { margin-bottom: 15px; }
  .form-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
  .form-input, .form-select { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: border 0.2s;}
  .form-input:focus, .form-select:focus { border-color: #185FA5; }
`;

export default function TeamManagementPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '', full_name: '', role: 'agent'
  });

  const fetchTeam = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: true });
    if (data) setTeam(data);
    setLoading(false);
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const validationResult = InviteSchema.safeParse(formData);
    if (!validationResult.success) {
      alert("⚠️ خطأ:\n" + validationResult.error.issues[0].message);
      setIsSubmitting(false); return;
    }

    // إرسال دعوة فعلية عبر Supabase Auth
    // ملاحظة: يتطلب هذا إعداد إيميل الشركة في Supabase، ولكن سيعمل آلياً كإنشاء حساب مؤقتاً
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: 'TemporaryPassword123!', // كلمة مرور مؤقتة يغيرها الموظف لاحقاً
      options: {
        data: {
          full_name: formData.full_name,
          role: formData.role
        }
      }
    });

    if (error) {
      alert("❌ فشل إرسال الدعوة: " + error.message);
    } else {
      alert("✅ تم إرسال الدعوة بنجاح وإنشاء ملف الموظف!");
      setIsModalOpen(false);
      setFormData({ email: '', full_name: '', role: 'agent' });
      fetchTeam(); // تحديث الجدول
    }
    setIsSubmitting(false);
  };

  const getRoleTitle = (role: string) => {
    switch(role) {
      case 'super_admin': return 'مدير عام';
      case 'sales_manager': return 'مدير مبيعات';
      case 'accountant': return 'محاسب / مالية';
      default: return 'مندوب مبيعات';
    }
  };

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية */}
      <div className="sidebar" style={{width:'64px', background:'#0f1c2e', position:'fixed', right:0, top:0, bottom:0}}>
        {/* الأيقونات المعتادة... */}
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/team" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></Link>
      </div>

      <div className="main-content">
        <div className="header-title">
          <span>إدارة فريق العمل والصلاحيات (Work Cells) 👥</span>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + دعوة موظف جديد
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">إجمالي الفريق</div>
            <div className="stat-val">{team.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">المندوبين (Agents)</div>
            <div className="stat-val" style={{color: '#3B82F6'}}>{team.filter(t => t.role === 'agent').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">الإدارة العليا</div>
            <div className="stat-val" style={{color: '#DC2626'}}>{team.filter(t => t.role === 'super_admin' || t.role === 'sales_manager').length}</div>
          </div>
        </div>

        <div className="team-table-container">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>البريد الإلكتروني</th>
                <th>الصلاحية (Role)</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px'}}>جاري تحميل بيانات الفريق...</td></tr>
              ) : team.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>لا يوجد موظفين حالياً.</td></tr>
              ) : (
                team.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{fontWeight: 800, color: '#0f172a'}}>{member.full_name}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>انضم {new Date(member.created_at).toLocaleDateString('ar-EG')}</div>
                    </td>
                    <td style={{direction: 'ltr', textAlign: 'right', fontWeight: 600, color: '#475569'}}>{member.email}</td>
                    <td>
                      <span className={`role-badge role-${member.role}`}>
                        {getRoleTitle(member.role)}
                      </span>
                    </td>
                    <td>
                      <span style={{fontSize: '13px', fontWeight: 700, color: member.status === 'active' ? '#10B981' : '#94A3B8'}}>
                        <span className={`status-dot status-${member.status}`}></span> {member.status === 'active' ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td>
                      <button style={{background: 'none', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700}}>
                        تعديل الصلاحية
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة دعوة موظف جديد */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize: '20px', fontWeight: 800, marginBottom: '20px'}}>دعوة موظف جديد للمنظومة</h2>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">الاسم بالكامل (كما سيظهر للعملاء) *</label>
                <input required className="form-input" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="مثال: إسلام محمد" />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني المؤسسي *</label>
                <input required type="email" className="form-input" style={{direction: 'ltr'}} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="name@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">مستوى الصلاحية (Access Level) *</label>
                <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="agent">مندوب مبيعات (وصول محدود للمبيعات فقط)</option>
                  <option value="accountant">محاسب / مالية (وصول للعمولات والتحصيلات)</option>
                  <option value="sales_manager">مدير مبيعات (وصول لتقارير الفريق والمخزون)</option>
                  <option value="super_admin">مدير عام (صلاحيات كاملة لكل النظام)</option>
                </select>
                <p style={{fontSize: '11px', color: '#64748b', marginTop: '6px'}}>
                  * سيتم تطبيق قواعد الـ Middleware لمنع هذا الموظف من الدخول لصفحات غير مصرح له بها.
                </p>
              </div>
              <div style={{display: 'flex', gap: '10px', marginTop: '25px'}}>
                <button type="submit" className="btn-primary" style={{flex: 1, justifyContent: 'center'}} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الدعوة'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', color: '#475569'}}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}