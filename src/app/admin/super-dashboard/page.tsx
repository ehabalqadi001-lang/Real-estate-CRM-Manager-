import { Globe, Building2, Users, Wallet, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperDashboard() {
  return (
    <div className="w-full min-h-screen p-8">
      
      {/* الهيدر الإمبراطوري - Dark Theme */}
      <div className="relative overflow-hidden flex items-center gap-6 bg-navy-dark p-10 rounded-[2rem] shadow-2xl border border-navy-light mb-10">
        {/* تأثير إضاءة خلفية (Glow) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-gold to-gold-dark text-navy-dark flex items-center justify-center shadow-[0_0_40px_rgba(212,165,116,0.3)] z-10">
          <Globe size={48} strokeWidth={1.5} />
        </div>
        <div className="z-10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert size={24} className="text-gold animate-pulse" />
            <h1 className="text-4xl font-black text-white tracking-wide">القيادة العليا <span className="text-gold">(Super Admin)</span></h1>
          </div>
          <p className="text-lg font-bold text-slate-300">مركز السيطرة المركزي لشبكة FAST INVESTMENT</p>
        </div>
      </div>

      {/* شبكة الإحصائيات (Dark Premium Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* بطاقة الشركات */}
        <div className="bg-navy p-8 rounded-[2rem] shadow-xl border border-navy-light hover:border-gold/50 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute -right-10 -top-10 bg-gold/5 w-32 h-32 rounded-full blur-2xl group-hover:bg-gold/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-gold mb-3 uppercase tracking-wider">الشركات المسجلة</p>
              <h3 className="text-6xl font-black text-white">0</h3>
            </div>
            <div className="p-5 bg-navy-dark rounded-2xl border border-navy-light group-hover:border-gold/30 transition-all">
              <Building2 size={32} className="text-gold" />
            </div>
          </div>
        </div>

        {/* بطاقة الوكلاء */}
        <div className="bg-navy p-8 rounded-[2rem] shadow-xl border border-navy-light hover:border-teal/50 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute -right-10 -top-10 bg-teal/5 w-32 h-32 rounded-full blur-2xl group-hover:bg-teal/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-teal-light mb-3 uppercase tracking-wider">الوكلاء النشطين</p>
              <h3 className="text-6xl font-black text-white">1</h3>
            </div>
            <div className="p-5 bg-navy-dark rounded-2xl border border-navy-light group-hover:border-teal/30 transition-all">
              <Users size={32} className="text-teal-light" />
            </div>
          </div>
        </div>

        {/* بطاقة المبيعات */}
        <div className="bg-navy p-8 rounded-[2rem] shadow-xl border border-navy-light hover:border-white/50 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute -right-10 -top-10 bg-white/5 w-32 h-32 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">إجمالي التداول (EGP)</p>
              <h3 className="text-5xl font-black text-white mt-2">0 <span className="text-xl text-slate-400">ج.م</span></h3>
            </div>
            <div className="p-5 bg-navy-dark rounded-2xl border border-navy-light group-hover:border-white/30 transition-all">
              <Wallet size={32} className="text-white" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}