"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // 1. هل المستخدم مسجل دخول أصلاً؟
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // إذا لم يكن هناك جلسة، اطرده إلى صفحة الدخول
        router.push('/login');
        return;
      }

      // 2. هل حسابه موافق عليه من الإدارة؟
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('id', session.user.id)
        .single();

      // استثناء: لا تمنع الدخول إذا لم يكن هناك بروفايل (لأنك الإدمن الأساسي الذي أنشأ الحساب يدوياً)
      if (profile && profile.status !== 'approved') {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      // إذا مر من كل الفحوصات، اسمح له بالدخول
      setIsAuthorized(true);
    }

    checkAuth();
  }, [pathname, router]);

  // شاشة تحميل بيضاء بسيطة أثناء فحص الحساب في جزء من الثانية
  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#64748b', fontFamily: 'system-ui' }}>
        Verifying secure connection...
      </div>
    );
  }

  // عرض محتوى لوحة التحكم إذا كان مصرحاً له
  return <>{children}</>;
}