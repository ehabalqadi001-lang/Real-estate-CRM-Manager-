"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AddDealModalProps { isOpen: boolean; onClose: () => void; onRefresh: () => void }

export default function AddDealModal({ isOpen, onClose, onRefresh }: AddDealModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    amount: '',
    status: 'Lead',
    developer_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('deals').insert([
      { ...formData, amount: parseFloat(formData.amount) }
    ]);

    setLoading(false);
    if (!error) {
      onRefresh(); // لتحديث لوحة الكانبان فوراً
      onClose();   // إغلاق النافذة
    } else {
      alert("خطأ في الإضافة: " + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-4 sm:p-6 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold mb-4">إضافة صفقة جديدة 🚀</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            className="w-full p-3 border rounded-lg" 
            placeholder="عنوان الصفقة (مثال: شقة في ماونتن فيو)" 
            required
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <input 
              className="w-full p-3 border rounded-lg" 
              placeholder="اسم العميل" 
              required
              onChange={e => setFormData({...formData, client_name: e.target.value})}
            />
            <input 
              className="w-full p-3 border rounded-lg" 
              placeholder="المطور" 
              onChange={e => setFormData({...formData, developer_name: e.target.value})}
            />
          </div>
          <input 
            type="number" 
            className="w-full p-3 border rounded-lg" 
            placeholder="القيمة (EGP)" 
            required
            onChange={e => setFormData({...formData, amount: e.target.value})}
          />
          
          <div className="flex gap-2 mt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الصفقة'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 bg-slate-100 p-3 rounded-lg font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}