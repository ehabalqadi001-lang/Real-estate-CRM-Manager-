"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function NotificationListener() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. طلب تصريح الإشعارات من المتصفح (عند فتح النظام لأول مرة)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // 2. جلب هوية المستخدم الحالي
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // 3. فتح قناة اتصال حية (Realtime Channel) مع قاعدة البيانات
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`, // استقبل الإشعارات المخصصة لي فقط!
        },
        (payload) => {
          const newNotification = payload.new;

          // 4. إطلاق إشعار ويندوز/ماك بصوت عند وصول إشعار جديد
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('EHAB & ESLAM TEAM 🏢', {
              body: newNotification.title + '\n' + newNotification.message,
              icon: '/favicon.ico', // يمكنك وضع مسار لوجو شركتك هنا
              dir: 'rtl',
            });

            // عند الضغط على الإشعار، يفتح نافذة النظام
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        }
      )
      .subscribe();

    // إغلاق القناة عند تسجيل الخروج أو إغلاق المتصفح
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // هذا المكون يعمل كـ "رادار" مخفي، لا يعرض أي شيء على الشاشة مباشرة
  return null; 
}