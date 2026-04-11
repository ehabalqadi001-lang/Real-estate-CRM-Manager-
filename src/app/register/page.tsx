"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; fontFamily: system-ui, sans-serif; }
  body { background: #f8fafc; }
  .register-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
  .register-card { background: #fff; width: 100%; max-width: 650px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f1c2e; padding: 30px; text-align: center; color: #fff; }
  .header-title { font-size: 24px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
  .header-sub { font-size: 14px; color: #94a3b8; }
  
  .form-body { padding: 30px; }
  
  .type-toggle { display: flex; background: #f1f5f9; border-radius: 8px; padding: 4px; margin-bottom: 24px; }
  .type-btn { flex: 1; text-align: center; padding: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border-radius: 6px; color: #64748b; transition: 0.2s; }
  .type-btn.active { background: #fff; color: #0f1c2e; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 13px; font-weight: 600; color: #475569; }
  .form-input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; background: #f8fafc; }
  .form-input:focus { border-color: #185FA5; background: #fff; }
  
  .file-upload-box { border: 2px dashed #cbd5e1; padding: 20px; border-radius: 8px; text-align: center; background: #f8fafc; transition: 0.2s; position: relative; }
  .file-upload-box:hover { border-color: #185FA5; background: #E6F1FB; }
  .file-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .file-label { font-size: 13px; font-weight: 600; color: #185FA5; }
  .file-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
  .file-list { font-size: 12px; color: #3B6D11; margin-top: 8px; font-weight: 500; }

  .submit-btn { width: 100%; padding: 14px; background: #185FA5; color: #fff; font-size: 15px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-top: 10px; }
  .submit-btn:hover { background: #124b82; }
  .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
  
  .alert { padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: 500; text-align: center; }
  .alert-success { background: #EAF3DE; color: #3B6D11; border: 1px solid #C5E1A5; }
  .alert-error { background: #FCEBEB; color: #A32D2D; border: 1px solid #F8B4B4; }
`;

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('company');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // بيانات النص (Text Data)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', companyName: ''
  });

  // بيانات الملفات (Files)
  const [files, setFiles] = useState<any>({
    commercial: [], tax: [], vat: null, idFront: null, idBack: null
  });

  const handleFileChange = (e: any, type: string, maxFiles: number = 1) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > maxFiles) {
      alert(`الحد الأقصى للملفات هنا هو ${maxFiles}`);
      return;
    }
    setFiles({ ...files, [type]: maxFiles === 1 ? selectedFiles[0] : selectedFiles });
  };

  const uploadFileToSupabase = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. إنشاء حساب في المصادقة (Auth)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      const userId = authData.user?.id;

      if (!userId) throw new Error("فشل في إنشاء الحساب، الرجاء المحاولة لاحقاً.");

      // 2. رفع الملفات إلى المخزن (Storage)
      let uploadedData: any = {
        commercial_register_images: [],
        tax_card_images: [],
        vat_image: null,
        id_front_image: null,
        id_back_image: null
      };

      if (accountType === 'company') {
        if (files.commercial.length > 0) {
          for (const f of files.commercial) {
            uploadedData.commercial_register_images.push(await uploadFileToSupabase(f, 'commercial'));
          }
        }
        if (files.tax.length > 0) {
          for (const f of files.tax) {
            uploadedData.tax_card_images.push(await uploadFileToSupabase(f, 'tax'));
          }
        }
        if (files.vat) {
          uploadedData.vat_image = await uploadFileToSupabase(files.vat, 'vat');
        }
      } else {
        if (files.idFront) uploadedData.id_front_image = await uploadFileToSupabase(files.idFront, 'id');
        if (files.idBack) uploadedData.id_back_image = await uploadFileToSupabase(files.idBack, 'id');
      }

      // 3. حفظ باقي البيانات في جدول Profiles
      const { error: profileError } = await supabase.from('user_profiles').insert([
        {
          id: userId,
          email: formData.email,
          account_type: accountType,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          company_name: accountType === 'company' ? formData.companyName : null,
          commercial_register_images: uploadedData.commercial_register_images,
          tax_card_images: uploadedData.tax_card_images,
          vat_image: uploadedData.vat_image,
          id_front_image: uploadedData.id_front_image,
          id_back_image: uploadedData.id_back_image,
          status: 'pending' // بانتظار موافقة المدير
        }
      ]);

      if (profileError) throw profileError;

      setMessage({ type: 'success', text: 'تم استلام طلب التسجيل بنجاح! حسابك الآن قيد المراجعة من الإدارة وسيتم تفعيله قريباً.' });
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      <div className="register-card">
        <div className="header">
          <div className="header-title">FAST INVESTMENT</div>
          <div className="header-sub">Partner Registration Portal</div>
        </div>
        
        <div className="form-body">
          {message.text && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message.text}
            </div>
          )}

          {message.type !== 'success' && (
            <form onSubmit={handleSubmit}>
              <div className="type-toggle">
                <div className={`type-btn ${accountType === 'company' ? 'active' : ''}`} onClick={() => setAccountType('company')}>Company / Agency</div>
                <div className={`type-btn ${accountType === 'individual' ? 'active' : ''}`} onClick={() => setAccountType('individual')}>Individual Broker</div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input required className="form-input" placeholder="John" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input required className="form-input" placeholder="Doe" onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                
                <div className="form-group full">
                  <label className="form-label">Email Address *</label>
                  <input required type="email" className="form-input" placeholder="name@domain.com" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input required className="form-input" placeholder="+20 1xxxxxxxxx" onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input required type="password" className="form-input" placeholder="Create a password" onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

              {/* Company Specific Fields */}
              {accountType === 'company' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input required className="form-input" placeholder="Fast Investment LLC" onChange={e => setFormData({...formData, companyName: e.target.value})} />
                  </div>
                  
                  <div className="form-grid" style={{ marginTop: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Commercial Register</label>
                      <div className="file-upload-box">
                        <input type="file" multiple accept="image/*,.pdf" className="file-input" onChange={e => handleFileChange(e, 'commercial', 3)} />
                        <div className="file-label">Upload CR (Up to 3 files)</div>
                        <div className="file-list">{files.commercial.length > 0 ? `${files.commercial.length} file(s) selected` : ''}</div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tax Card</label>
                      <div className="file-upload-box">
                        <input type="file" multiple accept="image/*,.pdf" className="file-input" onChange={e => handleFileChange(e, 'tax', 2)} />
                        <div className="file-label">Upload Tax Card (Up to 2 files)</div>
                        <div className="file-list">{files.tax.length > 0 ? `${files.tax.length} file(s) selected` : ''}</div>
                      </div>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">VAT Certificate</label>
                      <div className="file-upload-box">
                        <input type="file" accept="image/*,.pdf" className="file-input" onChange={e => handleFileChange(e, 'vat', 1)} />
                        <div className="file-label">Upload VAT Certificate (1 file)</div>
                        <div className="file-list">{files.vat ? `1 file selected` : ''}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Individual Specific Fields */}
              {accountType === 'individual' && (
                <div className="form-grid" style={{ marginTop: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">National ID (Front) *</label>
                    <div className="file-upload-box">
                      <input required type="file" accept="image/*" className="file-input" onChange={e => handleFileChange(e, 'idFront', 1)} />
                      <div className="file-label">Upload Front Image</div>
                      <div className="file-list">{files.idFront ? `1 file selected` : ''}</div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">National ID (Back) *</label>
                    <div className="file-upload-box">
                      <input required type="file" accept="image/*" className="file-input" onChange={e => handleFileChange(e, 'idBack', 1)} />
                      <div className="file-label">Upload Back Image</div>
                      <div className="file-list">{files.idBack ? `1 file selected` : ''}</div>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting Registration...' : 'Submit Application'}
              </button>
            </form>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
            Already have an account? <Link href="/login" style={{ color: '#185FA5', fontWeight: '600', textDecoration: 'none' }}>Log in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}