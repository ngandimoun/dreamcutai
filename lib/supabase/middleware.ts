import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Logs pour diagnostiquer
  console.log('Middleware:', {
    pathname: request.nextUrl.pathname,
    hasUser: !!user,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries())
  })

  // Définir les routes publiques (accessibles sans authentification)
  const publicRoutes = ['/', '/auth/auth-code-error']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname) || 
                       request.nextUrl.pathname.startsWith('/auth/')

  // Rediriger vers la page d'accueil si pas d'utilisateur et route protégée
  if (!user && !isPublicRoute) {
    console.log('Redirecting to / (no user, protected route)')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Rediriger vers /content si utilisateur connecté et sur la page d'accueil
  // Mais seulement si ce n'est pas une requête de callback d'authentification
  if (user && request.nextUrl.pathname === '/' && !request.nextUrl.searchParams.has('code')) {
    console.log('Redirecting to /content (user on home page)')
    const url = request.nextUrl.clone()
    url.pathname = '/content'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}
