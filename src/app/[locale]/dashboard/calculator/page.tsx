"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const CSS_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; }
  .dashboard-container { display: flex; background: #f8fafc; min-height: 100vh; direction: rtl; }
  
  .sidebar { width: 64px; background: #0f1c2e; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; position: fixed; right: 0; top: 0; bottom: 0; z-index: 50;}
  .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.45); cursor: pointer; text-decoration: none; transition: 0.2s; }
  .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .nav-item.active { background: rgba(24,95,165,0.4); color: #fff; border: 1px solid #185FA5; }
  
  .main-content { margin-right: 64px; flex: 1; padding: 30px; max-width: 1400px; margin-left: auto; margin-right: auto;}
  .header-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }

  .calculator-grid { display: grid; grid-template-columns: 350px 1fr; gap: 25px; }
  @media (max-width: 1024px) { .calculator-grid { grid-template-columns: 1fr; } }

  .input-panel { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); height: fit-content; position: sticky; top: 30px;}
  .results-panel { display: flex; flex-direction: column; gap: 25px; }

  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
  .form-input, .form-select { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff; transition: 0.2s;}
  .form-input:focus, .form-select:focus { border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,0.1); }
  
  .input-with-symbol { position: relative; }
  .input-with-symbol input { padding-left: 45px; direction: ltr; text-align: right;}
  .input-symbol { position: absolute; left: 1px; top: 1px; bottom: 1px; background: #f1f5f9; padding: 0 15px; border-radius: 8px 0 0 8px; border-right: 1px solid #cbd5e1; display: flex; align-items: center; color: #64748b; font-weight: 700; font-size: 13px;}

  .range-slider { width: 100%; margin-top: 10px; accent-color: #185FA5; }

  .kpi-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
  .kpi-card { background: #0f1c2e; color: #fff; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; }
  .kpi-card.highlight { background: linear-gradient(135deg, #185FA5 0%, #3b82f6 100%); }
  .kpi-title { font-size: 13px; color: #94a3b8; font-weight: 600; margin-bottom: 5px; }
  .kpi-card.highlight .kpi-title { color: #bfdbfe; }
  .kpi-value { font-size: 24px; font-weight: 800; direction: ltr; text-align: right;}

  .schedule-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .schedule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .btn-print { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;}
  .btn-print:hover { background: #e2e8f0; }

  table { width: 100%; border-collapse: collapse; text-align: right; }
  th { padding: 12px 15px; background: #f8fafc; color: #64748b; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; direction: ltr; text-align: right;}
  
  @media print {
    .sidebar, .input-panel, .btn-print, .header-title { display: none !important; }
    .main-content { margin: 0 !important; padding: 0 !important; }
    .calculator-grid { display: block; }
    .schedule-card { border: none; box-shadow: none; }
  }
`;

export default function MortgageCalculator() {
  // حالات الإدخال
  const [propertyValue, setPropertyValue] = useState<number>(5000000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(10);
  const [years, setYears] = useState<number>(7);
  const [interestRate, setInterestRate] = useState<number>(0); // 0 = تمويل مطور
  const [frequency, setFrequency] = useState<number>(4); // 4 = ربع سنوي (شائع في مصر), 12 = شهري

  // حالات النتائج
  const [downPaymentValue, setDownPaymentValue] = useState<number>(0);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [schedule, setSchedule] = useState<any[]>([]);

  // محرك الحسابات الذكي
  useEffect(() => {
    const downPayment = propertyValue * (downPaymentPct / 100);
    const principal = propertyValue - downPayment;
    const totalPeriods = years * frequency;
    
    let pmt = 0;
    let totalInt = 0;

    if (interestRate === 0) {
      // تمويل مطورين (أقساط متساوية بدون فوائد)
      pmt = totalPeriods > 0 ? principal / totalPeriods : 0;
      totalInt = 0;
    } else {
      // تمويل بنكي (فائدة متناقصة - Amortization)
      const ratePerPeriod = (interestRate / 100) / frequency;
      if (ratePerPeriod > 0 && totalPeriods > 0) {
        pmt = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPeriods)) / (Math.pow(1 + ratePerPeriod, totalPeriods) - 1);
        totalInt = (pmt * totalPeriods) - principal;
      }
    }

    setDownPaymentValue(downPayment);
    setLoanAmount(principal);
    setInstallmentAmount(pmt);
    setTotalInterest(totalInt);

    // توليد جدول الأقساط (أول 20 قسط لتجنب الضغط على المتصفح إذا كانت المدة طويلة جداً)
    const newSchedule = [];
    let currentBalance = principal;
    let currentDate = new Date();
    
    // إضافة شهر واحد إذا كان الدفع شهري، أو 3 أشهر إذا كان ربع سنوي
    const monthsToAdd = 12 / frequency; 

    for (let i = 1; i <= Math.min(totalPeriods, 60); i++) {
      currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
      
      let interestForPeriod = 0;
      let principalForPeriod = pmt;

      if (interestRate > 0) {
        interestForPeriod = currentBalance * ((interestRate / 100) / frequency);
        principalForPeriod = pmt - interestForPeriod;
      }

      currentBalance -= principalForPeriod;

      newSchedule.push({
        period: i,
        date: new Date(currentDate),
        payment: pmt,
        principal: principalForPeriod,
        interest: interestForPeriod,
        balance: Math.max(currentBalance, 0)
      });
    }
    setSchedule(newSchedule);

  }, [propertyValue, downPaymentPct, years, interestRate, frequency]);

  const formatEGP = (val: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="dashboard-container">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
      
      {/* القائمة الجانبية */}
      <div className="sidebar">
        <Link href="/dashboard" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></Link>
        <Link href="/dashboard/leads" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></Link>
        <Link href="/dashboard/inventory" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></Link>
        <Link href="/dashboard/commissions" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></Link>
        <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '4px 0' }}></div>
        {/* أيقونة الحاسبة النشطة */}
        <Link href="/dashboard/calculator" className="nav-item active"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="16" y1="18" x2="16" y2="18"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="10" x2="12" y2="10"/><line x1="8" y1="18" x2="12" y2="18"/></svg></Link>
        <Link href="/dashboard/settings" className="nav-item"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></Link>
      </div>

      <div className="main-content">
        <h1 className="header-title">
          <svg width="28" height="28" fill="none" stroke="#185FA5" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="16" y1="18" x2="16" y2="18"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="10" x2="12" y2="10"/><line x1="8" y1="18" x2="12" y2="18"/></svg>
          حاسبة التمويل العقاري الذكية (Mortgage & Payment Plan)
        </h1>

        <div className="calculator-grid">
          
          {/* لوحة التحكم بالإدخالات */}
          <div className="input-panel">
            <h3 style={{fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#0f172a'}}>معطيات الصفقة</h3>
            
            <div className="form-group">
              <label className="form-label">إجمالي قيمة الوحدة</label>
              <div className="input-with-symbol">
                <div className="input-symbol">EGP</div>
                <input type="number" className="form-input" value={propertyValue || ''} onChange={(e) => setPropertyValue(Number(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">الدفعة المقدمة (Down Payment) - {downPaymentPct}%</label>
              <input type="range" min="0" max="100" step="1" className="range-slider" value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} />
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b', marginTop:'5px'}}>
                <span>0%</span>
                <span style={{fontWeight: 800, color: '#10B981'}}>{formatEGP(downPaymentValue)} EGP</span>
                <span>100%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">سنوات التقسيط: {years} سنة</label>
              <input type="range" min="1" max="20" step="1" className="range-slider" value={years} onChange={(e) => setYears(Number(e.target.value))} />
            </div>

            <div className="form-group">
              <label className="form-label">نظام الدفع (التواتر)</label>
              <select className="form-select" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))}>
                <option value={12}>أقساط شهرية</option>
                <option value={4}>أقساط ربع سنوية (شائع)</option>
                <option value={2}>أقساط نصف سنوية</option>
                <option value={1}>أقساط سنوية</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">معدل الفائدة السنوي (%)</label>
              <div className="input-with-symbol">
                <div className="input-symbol">%</div>
                <input type="number" step="0.1" className="form-input" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} />
              </div>
              <p style={{fontSize: '11px', color: '#64748b', marginTop: '5px'}}>* اتركها 0% لحساب تمويل المطورين (أقساط متساوية بدون فوائد).</p>
            </div>
          </div>

          {/* لوحة النتائج والجدول */}
          <div className="results-panel">
            <div className="kpi-cards">
              <div className="kpi-card highlight">
                <div className="kpi-title">قيمة القسط ({frequency === 12 ? 'الشهري' : frequency === 4 ? 'الربع سنوي' : 'السنوي'})</div>
                <div className="kpi-value">{formatEGP(installmentAmount)} EGP</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">المبلغ الممول (المتبقي)</div>
                <div className="kpi-value">{formatEGP(loanAmount)} EGP</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">إجمالي الفوائد البنكية</div>
                <div className="kpi-value" style={{color: interestRate > 0 ? '#ef4444' : '#10b981'}}>{formatEGP(totalInterest)} EGP</div>
              </div>
            </div>

            <div className="schedule-card">
              <div className="schedule-header">
                <h3 style={{fontSize: '18px', fontWeight: 800, color: '#0f172a'}}>جدول خطة السداد المقترحة</h3>
                <button onClick={() => window.print()} className="btn-print">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  طباعة العرض للعميل
                </button>
              </div>
              
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table>
                  <thead>
                    <tr>
                      <th># القسط</th>
                      <th>تاريخ الاستحقاق (تقريبي)</th>
                      <th>قيمة القسط</th>
                      {interestRate > 0 && <th>الفوائد</th>}
                      <th>الرصيد المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.period}>
                        <td style={{textAlign: 'center', direction: 'rtl'}}>{row.period}</td>
                        <td>{row.date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' })}</td>
                        <td style={{fontWeight: 800, color: '#185FA5'}}>{formatEGP(row.payment)}</td>
                        {interestRate > 0 && <td style={{color: '#ef4444'}}>{formatEGP(row.interest)}</td>}
                        <td>{formatEGP(row.balance)}</td>
                      </tr>
                    ))}
                    {years * frequency > 60 && (
                      <tr>
                        <td colSpan={interestRate > 0 ? 5 : 4} style={{textAlign: 'center', color: '#64748b', direction: 'rtl'}}>
                          ... يتم إخفاء باقي الأقساط لتسهيل العرض (يوجد {years * frequency} قسط إجمالاً).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}