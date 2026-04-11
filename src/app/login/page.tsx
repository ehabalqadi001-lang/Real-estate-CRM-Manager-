"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  body { background: #f8fafc; }
  .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .login-card { background: #fff; width: 100%; max-width: 450px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f1c2e; padding: 30px; text-align: center; color: #fff; }
  .header-title { font-size: 24px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
  .header-sub { font-size: 14px; color: #94a3b8; }
  
  .form-body { padding: 30px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; }
  .form-input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; background: #f8fafc; }
  .form-input:focus { border-color: #185FA5; background: #fff; }
  
  .submit-btn { width: 100%; padding: 14px; background: #185FA5; color: #fff; font-size: 15px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-top: 10px; }
  .submit-btn:hover { background: #124b82; }
  .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
  
  .alert { padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; font-weight: 500; text-align: center; }
  .alert-error { background: #FCEBEB; color: #A32D2D; border: 1px solid #F8B4B4; }
  .alert-success { background: #EAF3DE; color: #3B6D11; border: 1px solid #C5E1A5; }
`;

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // Email OR Phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [checkingSession, setCheckingSession] = useState(true);

  // الدخول التلقائي في حال كان المستخدم مسجلاً وموافقاً عليه
  useEffect(() => {
    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('user_profiles').select('status').eq('id', session.user.id).single();
        if (profile?.status === 'approved' || !profile) {
          router.push('/dashboard');
        } else {
          await supabase.auth.signOut();
          setCheckingSession(false);
        }
      } else {
        setCheckingSession(false);
      }
    }
    checkExistingSession();
  }, [router]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let targetEmail = identifier.trim();

      // 1. الذكاء البرمجي: إذا كان المدخل لا يحتوي على '@' فهذا يعني أنه رقم هاتف
      // نبحث عن الإيميل المرتبط برقم الهاتف هذا في قاعدة البيانات
      if (!targetEmail.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('phone', targetEmail)
          .single();

        if (profileError || !profileData) {
           throw new Error("لا يوجد حساب مسجل بهذا الرقم أو البريد الإلكتروني.");
        }
        // إذا وجدنا الرقم، نأخذ الإيميل المرتبط به لنقوم بتسجيل الدخول
        targetEmail = profileData.email;
      }

      // 2. تسجيل الدخول باستخدام الإيميل (سواء الذي كتبه أو الذي جلبناه برقم الهاتف)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: targetEmail, 
        password 
      });

      if (authError) throw new Error("بيانات الدخول غير صحيحة.");

      const userId = authData.user?.id;
      
      // 3. التحقق من حالة الموافقة (Admin Approval)
      if (userId) {
        const { data: profile } = await supabase.from('user_profiles').select('status').eq('id', userId).single();
        if (profile) {
          if (profile.status === 'pending') {
            await supabase.auth.signOut();
            throw new Error("حسابك لا يزال قيد المراجعة من الإدارة. يرجى الانتظار لحين التفعيل.");
          } else if (profile.status === 'rejected') {
            await supabase.auth.signOut();
            throw new Error("نأسف، تم رفض طلب التسجيل الخاص بك من قبل الإدارة.");
          }
        }
      }

      setMessage({ type: 'success', text: 'تم تسجيل الدخول بنجاح! جاري التوجيه...' });
      setTimeout(() => router.push('/dashboard'), 1000);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <div style={{height: '100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f8fafc', color:'#64748b'}}>Loading securely...</div>;

  return (
    <div className="login-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="login-card">
        <div className="header">
          <div className="header-title">FAST INVESTMENT</div>
          <div className="header-sub">Partner & Broker Portal</div>
        </div>
        
        <div className="form-body">
          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email or Phone Number</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                placeholder="e.g. 010xxxxxxxx or name@domain.com" 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Password</label>
                <Link href="#" style={{ fontSize: '12px', color: '#185FA5', textDecoration: 'none', fontWeight: '500' }}>Forgot password?</Link>
              </div>
              <input 
                required 
                type="password" 
                className="form-input" 
                placeholder="Enter your password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
            Don't have an account? <Link href="/register" style={{ color: '#185FA5', fontWeight: '600', textDecoration: 'none' }}>Apply now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}