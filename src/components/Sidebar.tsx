// استدعاء المكون في الأعلى
import LanguageSwitcher from '@/components/LanguageSwitcher';

// ... داخل كود الـ Navbar الخاص بك، في منطقة الأزرار (أقصى اليسار في العربي):
<div className="flex items-center gap-4">
  
  {/* زر تبديل اللغة */}
  <LanguageSwitcher />
  
</div>