"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      // 1. التحقق من وجود الجلسة
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // استخدام التوجيه الجبري للمتصفح (أقوى من Next.js Router وأسرع في طرد المستخدم)
        window.location.href = '/login';
        return;
      }

      // 2. التحقق من موافقة الإدارة
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('id', session.user.id)
        .single();

      if (profile && profile.status !== 'approved') {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }

      // 3. السماح بالدخول فقط إذا اجتاز كل الاختبارات
      setIsAuthorized(true);
    };

    verifyAccess();
  }, []);

  // شاشة حماية صارمة (لن يرى المستخدم أي جزء من لوحة التحكم قبل التحقق)
  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f1c2e', color: '#fff', fontFamily: 'system-ui' }}>
        <h2 style={{ marginBottom: '10px', letterSpacing: '1px' }}>FAST INVESTMENT</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Verifying secure access...</p>
      </div>
    );
  }

  return <>{children}</>;
}