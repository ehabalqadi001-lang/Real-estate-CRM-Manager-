"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const CSS = `
  .mfa-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; direction: rtl; font-family: 'Cairo', sans-serif; }
  .mfa-card { background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); width: 100%; max-width: 450px; text-align: center; border-top: 5px solid #0f172a; }
  .mfa-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
  .mfa-desc { font-size: 14px; color: #64748b; margin-bottom: 25px; line-height: 1.6; }
  
  .qr-box { background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 20px; display: inline-block; border: 1px dashed #cbd5e1;}
  .qr-svg { width: 200px; height: 200px; }
  
  .form-input { width: 100%; padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 20px; text-align: center; letter-spacing: 5px; font-weight: 800; outline: none; transition: 0.2s; direction: ltr;}
  .form-input:focus { border-color: #3b82f6; }
  
  .btn-submit { width: 100%; background: #0f172a; color: #fff; border: none; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: 800; cursor: pointer; margin-top: 20px; transition: 0.2s; }
  .btn-submit:hover:not(:disabled) { background: #3b82f6; }
  .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
`;

export default function MFAPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      // إذا كان مستوى الأمان هو aal2، فهو مؤمن بالفعل ويدخل للوحة التحكم
      if (data?.currentLevel === 'aal2') {
        router.push('/dashboard');
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp[0];

      if (totpFactor && totpFactor.status === 'verified') {
        // المستخدم لديه 2FA مسبقاً، يحتاج فقط للإدخال (Challenge)
        setIsEnrolled(true);
        setFactorId(totpFactor.id);
      } else {
        // المستخدم جديد، يحتاج لإنشاء 2FA (Enroll)
        setupMFA();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) {
      setError(error.message);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code); // رمز الـ QR بصيغة SVG
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. طلب التحدي
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      // 2. التحقق من الكود المدخل
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode
      });
      if (verifyError) throw verifyError;

      alert("✅ تمت المصادقة بنجاح!");
      router.push('/dashboard'); // التوجيه بعد النجاح

    } catch (err: any) {
      setError("❌ الكود غير صحيح أو منتهي الصلاحية.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !qrCode && !isEnrolled) return <div className="mfa-container">جاري التحميل...</div>;

  return (
    <div className="mfa-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="mfa-card">
        <h1 className="mfa-title">🛡️ المصادقة الثنائية (2FA)</h1>
        
        {!isEnrolled ? (
          <>
            <p className="mfa-desc">لمزيد من الأمان، قم بمسح رمز الاستجابة السريعة (QR Code) باستخدام تطبيق <b>Google Authenticator</b> وأدخل الكود لربط حسابك.</p>
            {qrCode && (
              <div className="qr-box" dangerouslySetInnerHTML={{ __html: qrCode }} />
            )}
          </>
        ) : (
          <p className="mfa-desc">تم ربط حسابك مسبقاً. افتح تطبيق المصادقة وأدخل الكود المكون من 6 أرقام للمتابعة.</p>
        )}

        <form onSubmit={handleVerify}>
          <input 
            type="text" 
            maxLength={6} 
            placeholder="000000" 
            className="form-input"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} // قبول الأرقام فقط
            required
          />
          {error && <div style={{color: '#ef4444', fontSize: '13px', marginTop: '10px', fontWeight: 700}}>{error}</div>}
          
          <button type="submit" className="btn-submit" disabled={loading || verifyCode.length !== 6}>
            {loading ? 'جاري التحقق...' : 'تأكيد الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}