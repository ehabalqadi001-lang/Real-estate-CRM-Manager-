import { getI18n } from '@/lib/i18n'
import { getProperties } from './actions'
import AddPropertyButton from '@/components/properties/AddPropertyButton'
import { Building2, MapPin, DollarSign, Percent, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const { dir } = await getI18n()
  const properties = await getProperties()

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50">
      
      {/* الهيدر العلوي */}
      <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">المخزون العقاري (Inventory)</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">إدارة المشاريع والوحدات المتاحة للعرض على العملاء</p>
        </div>
        <AddPropertyButton />
      </div>

      {/* الرادار: عرض العقارات */}
      {properties.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-800 mb-2">لا يوجد عقارات في المخزون حالياً</h3>
          <p className="text-slate-500 font-medium">قم بإضافة مشاريع ووحدات لتظهر لفريق المبيعات الخاص بك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden group">
              {/* رأس البطاقة */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                <div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg mb-2 inline-block">
                    {property.property_type}
                  </span>
                  <h3 className="font-black text-slate-900 text-lg">{property.property_name}</h3>
                </div>
                {property.status === 'متاح' && (
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
                    <CheckCircle2 size={14}/> متاح
                  </span>
                )}
              </div>

              {/* تفاصيل العقار */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">الموقع</p>
                    <p className="text-sm font-bold">{property.location}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><DollarSign size={12}/> السعر المتوقع</p>
                    <p className="text-md font-black text-slate-800">{Number(property.price).toLocaleString()} <span className="text-xs">ج.م</span></p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 justify-end"><Percent size={12}/> العمولة</p>
                    <p className="text-md font-black text-emerald-600">{property.commission_rate}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}