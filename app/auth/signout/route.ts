import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if we have a session to sign out
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
      }
    }

    return NextResponse.redirect(new URL('/', request.url), {
      status: 302,
    })
  } catch (error) {
    console.error('Sign out route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
