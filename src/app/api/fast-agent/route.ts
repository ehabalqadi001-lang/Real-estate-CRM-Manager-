import { NextResponse } from 'next/server'
import { runFastAgent, type FastAgentMessage } from '@/lib/fast-agent/context'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { messages?: FastAgentMessage[] } | null
    const messages = Array.isArray(body?.messages)
      ? body.messages
        .filter((message) => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
        .slice(-12)
      : []

    const result = await runFastAgent(messages)
    return NextResponse.json(result)
  } catch (error) {
    console.error('FAST agent route failed', error)
    return NextResponse.json(
      {
        reply: 'تعذر تشغيل FAST الآن. حاول مرة أخرى بعد لحظات.',
        mode: 'fallback',
        role: 'guest',
        tools: [],
      },
      { status: 500 },
    )
  }
}
