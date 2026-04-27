import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ad_id } = await request.json()

    if (!ad_id) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('saved_properties')
      .insert({ user_id: user.id, ad_id })

    if (error) {
       if (error.code === '23505') { // Unique violation
          return NextResponse.json({ message: 'Property already saved' }, { status: 200 })
       }
       throw error
    }

    return NextResponse.json({ message: 'Property saved successfully' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ad_id = searchParams.get('ad_id')

    if (!ad_id) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .match({ user_id: user.id, ad_id })

    if (error) throw error

    return NextResponse.json({ message: 'Property removed from saved' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
