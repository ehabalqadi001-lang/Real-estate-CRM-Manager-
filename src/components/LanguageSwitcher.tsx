"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
// استخدمنا أيقونة الكرة الأرضية (إذا كنت تستخدم مكتبة lucide-react، وإلا يمكنك حذفها)
import { Globe } from 'lucide-react'; 

export default function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    
    // استبدال كود اللغة القديم بالجديد في الرابط الحالي
    let newPath = pathname;
    if (pathname.startsWith(`/${currentLocale}`)) {
      newPath = pathname.replace(`/${currentLocale}`, `/${nextLocale}`);
    } else {
      // احتياطي في حال كان الرابط الرئيسي لا يحتوي على لغة
      newPath = `/${nextLocale}${pathname}`;
    }

    // الانتقال للرابط الجديد مع عمل إنعاش للصفحة لتحديث الاتجاهات (RTL/LTR)
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg border border-slate-200">
      <Globe className="w-4 h-4 text-slate-600" />
      <select
        value={currentLocale}
        onChange={handleLanguageChange}
        className="bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer outline-none w-full"
        // إجبار القائمة المنسدلة على اتجاه محايد لكي لا تنعكس الكلمات الإنجليزية
        dir="ltr" 
      >
        <option value="ar">العربية (AR)</option>
        <option value="en">English (EN)</option>
        <option value="fr">Français (FR)</option>
      </select>
    </div>
  );
}