// Burnout score algorithm:
// Inputs (0–10 each): workload, overtime_hours (normalized), absence_days, late_checkins, missed_targets
// Weights: workload*0.25 + overtime*0.20 + absence*0.20 + late*0.15 + targets*0.20
export function calculateBurnoutScore({
  workloadScore,
  overtimeHours,
  absenceDays,
  lateCheckIns,
  missedTargetsPct,
}: {
  workloadScore: number
  overtimeHours: number
  absenceDays: number
  lateCheckIns: number
  missedTargetsPct: number
}): number {
  const overtime = Math.min(10, overtimeHours / 4)
  const absence  = Math.min(10, absenceDays * 1.5)
  const late     = Math.min(10, lateCheckIns * 1.0)
  const targets  = Math.min(10, missedTargetsPct / 10)
  return Math.round(
    workloadScore * 0.25 +
    overtime      * 0.20 +
    absence       * 0.20 +
    late          * 0.15 +
    targets       * 0.20,
  )
}
