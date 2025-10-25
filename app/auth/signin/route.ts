import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return handleAuthRequest(request)
}

export async function POST(request: Request) {
  return handleAuthRequest(request)
}

async function handleAuthRequest(request: Request) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider') as 'google'
  const next = searchParams.get('next') ?? '/content'

  console.log('Auth signin request:', { provider, next, origin: request.nextUrl.origin })

  if (provider) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${request.nextUrl.origin}/auth/callback?next=${next}`,
        },
      })

      console.log('Supabase OAuth response:', { data, error })

      if (error) {
        console.error('OAuth error:', error)
        return NextResponse.json(
          { error: `Failed to initiate OAuth: ${error.message}` },
          { status: 400 }
        )
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url)
        return NextResponse.redirect(data.url)
      } else {
        console.error('No redirect URL provided by Supabase')
        return NextResponse.json(
          { error: 'No redirect URL provided by OAuth provider' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Unexpected error in auth signin:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Provider not supported' },
    { status: 400 }
  )
}
