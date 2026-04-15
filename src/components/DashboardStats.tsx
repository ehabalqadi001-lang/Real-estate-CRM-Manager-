import { DollarSign, Briefcase, TrendingUp, CheckCircle } from 'lucide-react';

interface StatsProps {
  totalSales: number
  totalCommissions: number
  activeDeals: number
  closedDeals: number
}

export default function DashboardStats({ stats }: { stats: StatsProps }) {
  const items = [
    { label: 'إجمالي المبيعات', value: stats.totalSales, icon: <DollarSign />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'العمولات المتوقعة', value: stats.totalCommissions, icon: <TrendingUp />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'صفقات جارية', value: stats.activeDeals, icon: <Briefcase />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'صفقات مغلقة', value: stats.closedDeals, icon: <CheckCircle />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`${item.bg} ${item.color} p-3 rounded-lg`}>{item.icon}</div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{item.label}</p>
            <p className="text-xl font-bold text-gray-800">{item.value.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}