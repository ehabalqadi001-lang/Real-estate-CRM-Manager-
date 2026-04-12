"use client";
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AddDealModal from './AddDealModal';
import { useRouter } from 'next/navigation';

export default function NewDealButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // هذه الدالة السحرية تجبر الـ Server Component على إعادة جلب البيانات من Supabase
  const handleRefresh = () => {
    router.refresh(); 
  };

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition"
      >
        <Plus size={16} /> صفقة جديدة
      </button>

      {/* استدعاء النافذة المنبثقة وإرسال أوامر الفتح والإغلاق والتحديث إليها */}
      <AddDealModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={handleRefresh} 
      />
    </>
  );
}