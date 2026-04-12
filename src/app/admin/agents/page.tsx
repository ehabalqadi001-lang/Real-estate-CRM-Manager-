"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PAGE_CSS = `
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  th { background: #f8fafc; padding: 16px; text-align: right; color: #475569; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; }
  
  .role-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; }
  .role-super_admin { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
  .role-company_admin { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
  .role-branch_manager { background: #e0e7ff; color: #4f46e5; border: 1px solid #c7d2fe; }
  .role-agent { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
  .role-viewer { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
`;

export default function AgentsManagement() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      // دمج بيانات الموظف مع جدول الشركة وجدول الأدوار
      const { data } = await supabase
        .from('agents')
        .select(`
          id, full_name, email, created_at,
          company:companies(name),
          role:user_roles(role_name, description)
        `)
        .order('created_at', { ascending: false });
        
      if (data) setAgents(data);
      setLoading(false);
    }
    fetchAgents();
  }, []);

  const getRoleName = (roleStr: string) => {
    const roles: any = {
      'super_admin': 'مدير عام', 'company_admin': 'مدير شركة',
      'branch_manager': 'مدير فرع', 'senior_agent': 'مندوب أول',
      'agent': 'مندوب مبيعات', 'viewer': 'مراقب'
    };
    return roles[roleStr] || 'غير محدد';
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
        <h1 style={{fontSize: '24px', fontWeight: 800, color: '#0f172a'}}>إدارة الموظفين والصلاحيات</h1>
        <button style={{background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer'}}>
          + دعوة موظف جديد
        </button>
      </div>

      {loading ? <p>جاري تحميل قائمة الموظفين...</p> : (
        <table>
          <thead>
            <tr>
              <th>اسم الموظف</th>
              <th>البريد الإلكتروني</th>
              <th>الشركة / الفرع</th>
              <th>مستوى الصلاحية</th>
              <th>تاريخ الانضمام</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td>{agent.full_name}</td>
                <td style={{direction: 'ltr', textAlign: 'right'}}>{agent.email}</td>
                <td>{agent.company?.name || 'غير محدد'}</td>
                <td>
                  <span className={`role-badge role-${agent.role?.role_name}`}>
                    {getRoleName(agent.role?.role_name)}
                  </span>
                </td>
                <td style={{direction: 'ltr', textAlign: 'right'}}>{new Date(agent.created_at).toLocaleDateString('ar-EG')}</td>
                <td>
                  <button style={{background: 'none', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700}}>تعديل الصلاحية</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}