'use client'

import { useState } from 'react'
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react'
import { jsPDF } from 'jspdf'

export default function ProposalGenerator({ lead, property }: { lead: any, property: any }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    
    // إنشاء مستند PDF جديد (A4)
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    })

    // إعدادات التصميم (Branding)
    const companyName = "FAST INVESTMENT"
    const teamName = "EHAB & ESLAM TEAM"
    const date = new Date().toLocaleDateString('ar-EG')

    // 1. تصميم الهيدر (Header)
    doc.setFillColor(10, 17, 40) // اللون الكحلي الخاص بالهوية
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text(companyName, 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text("ENTERPRISE REAL ESTATE SOLUTIONS", 105, 30, { align: 'center' })

    // 2. بيانات العرض (Body)
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(16)
    doc.text("PROPOSAL / عرض سعر استثماري", 200, 60, { align: 'right' })
    
    doc.setFontSize(12)
    doc.text(`التاريخ: ${date}`, 200, 75, { align: 'right' })
    doc.text(`إلى السيد/ة: ${lead.client_name}`, 200, 85, { align: 'right' })

    // 3. تفاصيل الوحدة العقارية
    doc.setDrawColor(226, 232, 240)
    doc.line(10, 100, 200, 100)
    
    doc.setFontSize(14)
    doc.text("تفاصيل العقار المستهدف:", 200, 115, { align: 'right' })
    
    doc.setFontSize(11)
    doc.text(`المشروع: ${property?.name || 'مشروع متميز'}`, 200, 130, { align: 'right' })
    doc.text(`الموقع: ${property?.location || 'العاصمة الإدارية الجديدة'}`, 200, 140, { align: 'right' })
    doc.text(`نوع الوحدة: ${property?.type || lead.property_type}`, 200, 150, { align: 'right' })
    
    // 4. القيمة المالية
    doc.setFillColor(248, 250, 252)
    doc.rect(10, 165, 190, 25, 'F')
    doc.setTextColor(16, 185, 129)
    doc.setFontSize(16)
    const price = Number(lead.expected_value).toLocaleString()
    doc.text(`القيمة الاستثمارية المتوقعة: ${price} ج.م`, 105, 182, { align: 'center' })

    // 5. التوقيع والختم (Footer)
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(10)
    doc.text("هذا العرض ساري لمدة 7 أيام من تاريخ إصداره.", 105, 260, { align: 'center' })
    
    doc.setTextColor(10, 17, 40)
    doc.setFontSize(12)
    doc.text(`إدارة المبيعات: ${teamName}`, 20, 280)

    // حفظ الملف
    doc.save(`Proposal_${lead.client_name}_${Date.now()}.pdf`)
    setIsGenerating(false)
  }

  return (
    <button 
      onClick={generatePDF}
      disabled={isGenerating}
      className="flex items-center gap-2 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white px-4 py-2.5 rounded-xl font-black transition-all border border-slate-200"
    >
      {isGenerating ? (
        <><Loader2 size={18} className="animate-spin" /> جاري صياغة العرض...</>
      ) : (
        <><FileText size={18} /> توليد عرض سعر PDF</>
      )}
    </button>
  )
}