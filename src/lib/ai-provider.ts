/**
 * Unified AI provider — Claude (Anthropic) + Gemini (Google)
 * Usage:
 *   const ai = getAIProvider('claude')   // or 'gemini' or 'gemini-flash'
 *   const text = await ai.generate(prompt, { maxTokens: 1000 })
 */

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type AIModel =
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'

export interface AIGenerateOptions {
  maxTokens?: number
  systemPrompt?: string
  temperature?: number
}

export interface AIProvider {
  model: AIModel
  generate(prompt: string, options?: AIGenerateOptions): Promise<string>
}

// ── Claude (Anthropic) ────────────────────────────────────────
class ClaudeProvider implements AIProvider {
  model: AIModel
  private client: Anthropic

  constructor(model: AIModel = 'claude-sonnet-4-6') {
    this.model = model
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async generate(prompt: string, options: AIGenerateOptions = {}): Promise<string> {
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]
    const res = await this.client.messages.create({
      model:      this.model,
      max_tokens: options.maxTokens ?? 1500,
      system:     options.systemPrompt,
      messages,
    })
    return res.content[0].type === 'text' ? res.content[0].text : ''
  }
}

// ── Gemini (Google) ───────────────────────────────────────────
class GeminiProvider implements AIProvider {
  model: AIModel
  private genAI: GoogleGenerativeAI

  constructor(model: AIModel = 'gemini-2.0-flash') {
    this.model = model
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY ?? '')
  }

  async generate(prompt: string, options: AIGenerateOptions = {}): Promise<string> {
    const geminiModel = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 1500,
        temperature:     options.temperature ?? 0.7,
      },
      systemInstruction: options.systemPrompt,
    })

    const fullPrompt = options.systemPrompt ? prompt : prompt
    const result = await geminiModel.generateContent(fullPrompt)
    return result.response.text()
  }
}

// ── Factory ───────────────────────────────────────────────────
export function getAIProvider(modelOrProvider: AIModel | 'claude' | 'gemini' | 'gemini-flash' | 'gemini-pro'): AIProvider {
  switch (modelOrProvider) {
    case 'claude':
    case 'claude-sonnet-4-6':
      return new ClaudeProvider('claude-sonnet-4-6')

    case 'claude-haiku-4-5':
      return new ClaudeProvider('claude-haiku-4-5')

    case 'gemini-flash':
    case 'gemini-2.0-flash':
    case 'gemini-1.5-flash':
      return new GeminiProvider('gemini-2.0-flash')

    case 'gemini-pro':
    case 'gemini-1.5-pro':
    case 'gemini':
      return new GeminiProvider('gemini-1.5-pro')

    default:
      return new ClaudeProvider('claude-sonnet-4-6')
  }
}

export const MODEL_OPTIONS: { value: AIModel | 'claude' | 'gemini-flash' | 'gemini-pro'; label: string; badge: string }[] = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6',  badge: '🟣 Anthropic' },
  { value: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',   badge: '🟣 Fast' },
  { value: 'gemini-2.0-flash',  label: 'Gemini 2.0 Flash',   badge: '🔵 Google' },
  { value: 'gemini-1.5-pro',    label: 'Gemini 1.5 Pro',     badge: '🔵 Google' },
]
