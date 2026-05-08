"use client";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/components/RoleGuard';
import { useI18n } from '@/hooks/use-i18n'

export default function LiveNotifications() {
  const { isAdmin } = useRole();
  const { t, numLocale } = useI18n()

  useEffect(() => {
    const triggerSystemNotification = (title: string, body: string) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/icon-192x192.png',
        });

        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    };

    const channel = supabase.channel('enterprise-radar')

      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deals' },
        (payload) => {
          if (isAdmin) {
            triggerSystemNotification(
              t('💰 صفقة جديدة تم تسجيلها!', '💰 New deal registered!'),
              `${t('تم تسجيل بيعة بقيمة', 'A sale was recorded for')} ${Number(payload.new.unit_value).toLocaleString(numLocale)} ${t('ج.م', 'EGP')}.`
            );
          }
        }
      )

      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commissions' },
        (payload) => {
          if (payload.new.status === 'Paid' && payload.old.status !== 'Paid') {
            triggerSystemNotification(
              t('💸 تم صرف عمولتك!', '💸 Your commission was paid!'),
              `${t('تم اعتماد وصرف عمولة بقيمة', 'A commission of')} ${Number(payload.new.agent_commission_value).toLocaleString(numLocale)} ${t('ج.م لحسابك', 'EGP was approved for your account')}.`
            );
          }
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, t, numLocale]);

  return null;
}
