"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CommissionChart({ data: _data }: { data: Record<string, unknown>[] }) {
  // معالجة البيانات لتجميعها حسب الأشهر (توضيحي)
  const chartData = [
    { name: 'يناير', earned: 40000, collected: 24000 },
    { name: 'فبراير', earned: 30000, collected: 13980 },
    { name: 'مارس', earned: 20000, collected: 9800 },
    { name: 'أبريل', earned: 27800, collected: 3908 },
    { name: 'مايو', earned: 18900, collected: 4800 },
    { name: 'يونيو', earned: 23900, collected: 3800 },
  ]; // في النظام الحقيقي سيتم بناء هذا المصفوفة من الـ data المُمررة

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip cursor={{fill: 'transparent'}} />
          <Legend />
          <Bar dataKey="earned" name="إجمالي مستحق" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="collected" name="تم تحصيله" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}