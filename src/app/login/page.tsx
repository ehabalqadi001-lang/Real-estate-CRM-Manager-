"use client";
import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { z } from 'zod';

// 🛡️ جدار حماية Zod للتحقق من صحة المدخلات
const LoginSchema = z.object({
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .login-container { display: flex; min-height: 100vh; background: #f8fafc; direction: rtl; align-items: center; justify-content: center;}
  
  .login-card { background: #fff; width: 100%; max-width: 420px; border-radius: 16px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;}
  
  .logo-section { text-align: center; margin-bottom: 30px; }
  .logo-title { font-size: 24px; font-weight: 800; color: #0f1c2e; letter-spacing: -0.5px;}
  .logo-subtitle { font-size: 13px; color: #64748b; font-weight: 600; margin-top: 4px; letter-spacing: 2px;}

  .form-group { display: flex; flex-direction: column; margin-bottom: 20px; }
  .form-label { font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
  .form-input { padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; background: #f8fafc; color: #0f172a;}
  .form-input:focus { border-color: #185FA5; background: #fff; box-shadow: 0 0 0 3px rgba(24,95,165,0.1); }
  
  .btn-submit { width: 100%; padding: 14px; background: #0f1c2e; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 8px;}
  .btn-submit:hover { background: #185FA5; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(24,95,165,0.2);}
  .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none;}

  .error-message { background: #FEF2F2; color: #DC2626; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 20px; border: 1px solid #FCA5A5; display: flex; align-items: center; gap: 8px;}
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // استخدام متصل المتصفح الآمن الذي أنشأناه
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // 1. التحقق من صحة المدخلات باستخدام Zod قبل إرهاق السيرفر
    const validationResult = LoginSchema.safeParse({ email, password });
    
    if (!validationResult.success) {
      setErrorMsg(validationResult.error?.issues[0]?.message || "بيانات غير صالحة");
      setLoading(false);
      return;
    }

    // 2. إرسال طلب تسجيل الدخول إلى Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    if (error) {
      // ترجمة رسائل الخطأ الشائعة للعربية
      if (error.message.includes("Invalid login credentials")) {
        setErrorMsg("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        setErrorMsg("حدث خطأ في النظام. الرجاء المحاولة لاحقاً.");
      }
      setLoading(false);
    } else {
      // 3. 🟢 تسجيل الدخول ناجح! توجيه المستخدم للوحة التحكم
      // نستخدم window.location لعمل تحديث كامل ليتمكن الـ Middleware من قراءة الكوكيز الجديدة
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="login-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-title">FAST INVESTMENT</div>
          <div className="logo-subtitle">ENTERPRISE CRM SYSTEM</div>
        </div>

        {errorMsg && (
          <div className="error-message">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني المؤسسي</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>كلمة المرور</span>
            </label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              dir="ltr"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              'جاري التحقق من الهوية...'
            ) : (
              <>
                تسجيل الدخول الدخول
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
              </>
            )}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#94a3b8' }}>
          للحصول على صلاحيات الدخول، يرجى مراجعة إدارة النظام.
        </div>
      </div>
    </div>
  );
}