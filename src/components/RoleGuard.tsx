"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Hook مخصص لجلب الصلاحيات بسهولة
export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('agents').select('user_roles(role_name)').eq('id', user.id).single();
          setRole(data?.user_roles?.[0]?.role_name || 'agent');
      }
      setLoading(false);
    }
    fetchRole();
  }, []);

  return { 
    role, 
    loading,
    isAdmin: role === 'super_admin' || role === 'company_admin',
    canEdit: role === 'super_admin' || role === 'company_admin' || role === 'branch_manager' || role === 'senior_agent',
    isViewer: role === 'viewer'
  };
}

// مكون HOC لتغليف وإخفاء أجزاء الـ UI
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { role, loading } = useRole();

  if (loading) return null; // أو إرجاع Skeleton
  
  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}