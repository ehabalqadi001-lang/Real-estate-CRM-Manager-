"use client";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/components/RoleGuard';

export default function LiveNotifications() {
  const { isAdmin } = useRole();

  useEffect(() => {
    // 1. طلب الإذن من المستخدم لإرسال إشعارات (تظهر نافذة Allow/Block في المتصفح)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    // دالة إطلاق الإشعار المدمج في نظام التشغيل (ويندوز، ماك، أندرويد)
    const triggerSystemNotification = (title: string, body: string) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/icon-192x192.png', // أيقونة التطبيق التي أضفناها في خطوة الـ PWA
        });
        
        // اهتزاز خفيف للموبايل باستخدام Vibration API
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        
        // تشغيل صوت تنبيه خفيف (اختياري، يتطلب ملف صوت في مجلد public)
        // const audio = new Audio('/notification-sound.mp3');
        // audio.play().catch(e => console.log('Audio play blocked by browser'));
      }
    };

    // 2. فتح قناة اتصال حية مع Supabase (Realtime Channel)
    const channel = supabase.channel('enterprise-radar')
      
      // مراقبة الصفقات الجديدة (تعمل للمديرين فقط)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deals' },
        (payload) => {
          if (isAdmin) {
            triggerSystemNotification(
              '💰 صفقة جديدة تم تسجيلها!',
              `تم تسجيل بيعة بقيمة ${Number(payload.new.unit_value).toLocaleString()} EGP.`
            );
          }
        }
      )
      
      // مراقبة تحديث حالة العمولات (לيسمعها المندوب عندما يعتمد المدير عمولته)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commissions' },
        (payload) => {
          if (payload.new.status === 'Paid' && payload.old.status !== 'Paid') {
            triggerSystemNotification(
              '💸 تم صرف عمولتك!',
              `تم اعتماد وصرف عمولة بقيمة ${Number(payload.new.agent_commission_value).toLocaleString()} EGP لحسابك.`
            );
          }
        }
      )
      
      .subscribe();

    // إغلاق الرادار عند الخروج من النظام توفيراً للموارد
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // هذا المكون يعمل في الخلفية ولا يعرض أي شيء على الشاشة
  return null; 
}