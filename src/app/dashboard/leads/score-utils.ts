export function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-slate-500 bg-slate-50 border-slate-200'
}

export function scoreLabel(score: number): string {
  if (score >= 70) return 'ساخن'
  if (score >= 40) return 'دافئ'
  return 'بارد'
}
