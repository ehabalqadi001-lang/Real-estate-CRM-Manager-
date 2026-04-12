"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PAGE_CSS = `
  .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
  .btn-dark { background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .btn-dark:hover { background: #3b82f6; }
  
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  th { background: #f8fafc; padding: 16px; text-align: right; color: #475569; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; }
  
  .status-active { background: #dcfce7; color: #16a34a; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid #bbf7d0;}
  .status-inactive { background: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid #fecaca;}

  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(2, 6, 23, 0.7); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
  .modal-content { background: #fff; width: 100%; max-width: 450px; border-radius: 16px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
  .form-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; margin-top: 8px; margin-bottom: 20px;}
  .form-input:focus { border-color: #3b82f6; }
`;

export default function BranchesManagement() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    // جلب الفروع مع عدد الموظفين في كل فرع
    const { data } = await supabase
      .from('companies')
      .select('*, agents(count)')
      .order('created_at', { ascending: true });
      
    if (data) setBranches(data);
    setLoading(false);
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setSaving(true);
    
    const { error } = await supabase.from('companies').insert([{ name: newBranchName }]);
    
    if (!error) {
      setNewBranchName('');
      setIsModalOpen(false);
      fetchBranches();
      alert("✅ تم إضافة الفرع الجديد بنجاح.");
    } else {
      alert("❌ خطأ: " + error.message);
    }
    setSaving(false);
  };

  const toggleBranchStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('companies').update({ active: !currentStatus }).eq('id', id);
    if (!error) fetchBranches();
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="header-flex">
        <h1 style={{fontSize: '24px', fontWeight: 800, color: '#0f172a'}}>إدارة الفروع والمناطق (Branches)</h1>
        <button className="btn-dark" onClick={() => setIsModalOpen(true)}>+ إضافة فرع جديد</button>
      </div>

      {loading ? <p>جاري تحميل قائمة الفروع...</p> : (
        <table>
          <thead>
            <tr>
              <th>كود الفرع</th>
              <th>اسم الفرع / الشركة</th>
              <th>عدد الموظفين (Agents)</th>
              <th>تاريخ التأسيس</th>
              <th>الحالة (Status)</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id}>
                <td style={{fontSize: '12px', color: '#64748b', fontFamily: 'monospace'}}>{branch.id.substring(0,8)}</td>
                <td style={{fontWeight: 800, color: '#185FA5'}}>{branch.name}</td>
                <td>{branch.agents?.[0]?.count || 0} موظف</td>
                <td style={{direction: 'ltr', textAlign: 'right'}}>{new Date(branch.created_at).toLocaleDateString('ar-EG')}</td>
                <td>
                  <span className={branch.active ? 'status-active' : 'status-inactive'}>
                    {branch.active ? '🟢 نشط' : '🔴 موقوف'}
                  </span>
                </td>
                <td>
                  <button onClick={() => toggleBranchStatus(branch.id, branch.active)} style={{background: 'none', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700}}>
                    {branch.active ? 'إيقاف الفرع' : 'تفعيل الفرع'}
                  </button>
                </td>
              </tr>
            ))}
            {branches.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', padding: '20px'}}>لا توجد فروع مسجلة.</td></tr>}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom: '20px', color: '#0f172a', fontWeight: 800}}>إضافة فرع أو كيان جديد</h2>
            <form onSubmit={handleAddBranch}>
              <label style={{fontSize: '13px', fontWeight: 700, color: '#475569'}}>اسم الفرع / الشركة *</label>
              <input required autoFocus className="form-input" placeholder="مثال: فرع زايد، شركة الأفق..." value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
              
              <div style={{display: 'flex', gap: '10px'}}>
                <button type="submit" className="btn-dark" style={{flex: 1}} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ وإنشاء'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'}}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}