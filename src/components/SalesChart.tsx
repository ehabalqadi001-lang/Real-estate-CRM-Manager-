"use client";
import { useI18n } from '@/hooks/use-i18n'

export default function SalesChart({ data: _data }: { data: Record<string, unknown>[] }) {
  const { t } = useI18n()
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <p className="text-gray-400">{t('الرسم البياني للمبيعات (قيد التحميل...)', 'Sales chart (loading...)')}</p>
    </div>
  );
}