interface RecentDeal { id: string; title: string; created_at: string; amount: number }

export default function RecentDeals({ deals }: { deals: RecentDeal[] }) {
  return (
    <div className="space-y-4">
      {deals.map((deal) => (
        <div key={deal.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition">
          <div>
            <p className="font-bold text-sm text-gray-800">{deal.title}</p>
            <p className="text-xs text-gray-500">{new Date(deal.created_at).toLocaleDateString()}</p>
          </div>
          <span className="text-sm font-bold text-blue-600">{Number(deal.amount).toLocaleString()} EGP</span>
        </div>
      ))}
    </div>
  );
}