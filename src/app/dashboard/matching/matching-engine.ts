interface Lead {
  id: string
  expected_value?: number | null
  temperature?: string | null
  source?: string | null
}

interface Unit {
  id: string
  project_name?: string | null
  unit_type?: string | null
  price?: number | null
  floor?: number | null
  area?: number | null
}

interface MatchResult {
  unit: Unit
  score: number
  reasons: string[]
}

export function matchLeadToUnits(lead: Lead, units: Unit[]): MatchResult[] {
  const budget = Number(lead.expected_value || 0)

  const scored = units.map(unit => {
    let score = 0
    const reasons: string[] = []
    const price = Number(unit.price || 0)

    // Budget match (40 pts max)
    if (budget > 0 && price > 0) {
      const ratio = price / budget
      if (ratio >= 0.8 && ratio <= 1.0) {
        score += 40; reasons.push('ضمن الميزانية')
      } else if (ratio >= 0.6 && ratio < 0.8) {
        score += 30; reasons.push('أقل من الميزانية')
      } else if (ratio > 1.0 && ratio <= 1.15) {
        score += 20; reasons.push('قريب من الميزانية')
      }
    } else {
      score += 20 // no budget specified — neutral
    }

    // Temperature bonus (20 pts)
    if (lead.temperature === 'hot') {
      score += 20; reasons.push('عميل ساخن')
    } else if (lead.temperature === 'warm') {
      score += 10
    }

    // Floor preference heuristic (10 pts)
    if (unit.floor && unit.floor >= 3 && unit.floor <= 8) {
      score += 10; reasons.push('دور مميز')
    }

    // Area coverage (10 pts)
    if (unit.area && unit.area >= 100) {
      score += 10; reasons.push('مساحة كبيرة')
    }

    // Price per sqm efficiency (20 pts)
    if (price > 0 && unit.area && unit.area > 0) {
      const ppm = price / unit.area
      if (ppm < 15000) { score += 20; reasons.push('سعر ممتاز/م²') }
      else if (ppm < 25000) { score += 10; reasons.push('سعر جيد/م²') }
    }

    return { unit, score: Math.min(100, score), reasons }
  })

  return scored
    .filter(m => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}
