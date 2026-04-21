import 'server-only'

import { openai } from '@ai-sdk/openai'

export const CRM_AI_MODEL = 'gpt-4o'

export function getCrmOpenAiModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY غير مضبوط في البيئة')
  }

  return openai(CRM_AI_MODEL)
}

export function extractJsonArray<T>(text: string, fallback: T[]): T[] {
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed as T[] : fallback
  } catch {
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start === -1 || end === -1 || end <= start) return fallback

    try {
      const parsed = JSON.parse(text.slice(start, end + 1))
      return Array.isArray(parsed) ? parsed as T[] : fallback
    } catch {
      return fallback
    }
  }
}

export function extractJsonObject<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    return parsed && typeof parsed === 'object' ? parsed as T : fallback
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return fallback

    try {
      const parsed = JSON.parse(text.slice(start, end + 1))
      return parsed && typeof parsed === 'object' ? parsed as T : fallback
    } catch {
      return fallback
    }
  }
}
