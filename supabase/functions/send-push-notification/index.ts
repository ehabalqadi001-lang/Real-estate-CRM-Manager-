import { createClient } from 'npm:@supabase/supabase-js@2'

type PushRequest = {
  userId: string
  title: string
  body: string
  data?: Record<string, unknown>
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Supabase environment is missing' }, { status: 500 })
  }

  const payload = await request.json() as Partial<PushRequest>
  if (!payload.userId || !payload.title || !payload.body) {
    return Response.json({ error: 'userId, title, and body are required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', payload.userId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!tokens?.length) return Response.json({ sent: 0 })

  const messages = tokens.map((token) => ({
    to: token.token,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default',
  }))

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
  })

  const result = await response.json()
  return Response.json({ sent: messages.length, result })
})
