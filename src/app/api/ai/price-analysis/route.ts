import { generateText } from 'ai'
import { getCurrentSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { extractJsonObject, getCrmOpenAiModel } from '@/lib/ai/openai'
import type { PriceAnalysisInput, PriceAnalysisResult } from '@/lib/ai/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const input = await request.json() as Partial<PriceAnalysisInput>
    if (!input.price || !input.areaSqm) {
      return Response.json({ error: 'بيانات السعر والمساحة مطلوبة' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('units')
      .select('id, unit_type, area_sqm, price, finishing, project_id, city, status')
      .neq('id', input.unitId ?? '00000000-0000-0000-0000-000000000000')
      .gte('area_sqm', Math.max(1, Number(input.areaSqm) * 0.8))
      .lte('area_sqm', Number(input.areaSqm) * 1.2)
      .limit(20)

    if (input.projectId) query = query.eq('project_id', input.projectId)
    if (input.unitType) query = query.eq('unit_type', input.unitType)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const comparables = (data ?? []).map((unit) => ({
      id: unit.id,
      type: unit.unit_type,
      area: Number(unit.area_sqm ?? 0),
      price: Number(unit.price ?? 0),
      pricePerMeter: unit.area_sqm ? Math.round(Number(unit.price ?? 0) / Number(unit.area_sqm)) : 0,
      finishing: unit.finishing,
      status: unit.status,
    }))

    const average = comparables.length
      ? comparables.reduce((sum, unit) => sum + unit.pricePerMeter, 0) / comparables.length
      : Number(input.price) / Number(input.areaSqm)
    const unitPricePerMeter = Number(input.price) / Number(input.areaSqm)
    const differencePercentage = average ? Math.round(((unitPricePerMeter - average) / average) * 100) : 0

    const fallback: PriceAnalysisResult = {
      verdict: differencePercentage > 8
        ? `السعر أعلى من المتوسط بـ ${Math.abs(differencePercentage)}%`
        : differencePercentage < -8
          ? `سعر تنافسي أقل من المتوسط بـ ${Math.abs(differencePercentage)}%`
          : 'السعر قريب من متوسط السوق للوحدات المماثلة',
      summary: `تمت المقارنة مع ${comparables.length} وحدة مماثلة. متوسط سعر المتر ${Math.round(average).toLocaleString('ar-EG')} ج.م.`,
      differencePercentage,
      comparableCount: comparables.length,
      recommendations: ['راجع خطة السداد والموقع قبل تثبيت السعر النهائي.'],
    }

    const { text } = await generateText({
      model: getCrmOpenAiModel(),
      system: 'أنت محلل تسعير عقاري في السوق المصري. أعد JSON فقط بدون Markdown.',
      prompt: `حلل سعر هذه الوحدة مقارنة بالوحدات المشابهة.
الوحدة: ${JSON.stringify(input)}
المقارنات: ${JSON.stringify(comparables)}
المؤشرات المحسوبة: ${JSON.stringify({ averagePricePerMeter: average, unitPricePerMeter, differencePercentage })}
أعد JSON بهذا الشكل:
{"verdict":"...","summary":"...","differencePercentage":0,"comparableCount":0,"recommendations":["..."]}`,
      temperature: 0.2,
    })

    return Response.json(extractJsonObject<PriceAnalysisResult>(text, fallback))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'تعذر تحليل السعر' }, { status: 500 })
  }
}
