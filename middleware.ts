import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/demo',
    '/api/demo', // For demo form submissions
    '/favicon.ico',
    '/_next',
    '/api/health' // Health check endpoint
  ]

  // Admin paths
  const adminPaths = ['/admin']
  
  // Protected dashboard paths
  const protectedPaths = [
    '/dashboard',
    '/import',
    '/employees',
    '/settings',
    '/api/import' // Protected API routes
  ]

  // Check if path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath)
  )

  // Skip middleware for public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Handle admin routes
  const isAdminPath = adminPaths.some(adminPath => path.startsWith(adminPath))
  if (isAdminPath && path !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session')
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    try {
      const sessionData = JSON.parse(atob(adminSession.value))
      if (new Date(sessionData.expires_at) < new Date()) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.set('admin_session', '', { maxAge: 0 })
        return response
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    return NextResponse.next()
  }

  // Handle protected dashboard routes with token validation
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath)
  )

  if (isProtectedPath) {
    const companySession = request.cookies.get('company_session')
    
    if (!companySession) {
      console.log(`[Middleware] No session found for ${path}`)
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    try {
      const sessionData = JSON.parse(atob(companySession.value))
      
      // Check session expiry
      if (new Date(sessionData.expires_at) < new Date()) {
        console.log(`[Middleware] Session expired for ${path}`)
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.set('company_session', '', { maxAge: 0 })
        return response
      }

      // Validate required session fields
      if (!sessionData.company_id || !sessionData.access_token) {
        console.log(`[Middleware] Invalid session data for ${path}`)
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.set('company_session', '', { maxAge: 0 })
        return response
      }

      // Add company info to headers for API routes (optional)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-company-id', sessionData.company_id)
      requestHeaders.set('x-access-token', sessionData.access_token)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

    } catch (error) {
      console.error(`[Middleware] Session parsing error for ${path}:`, error)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('company_session', '', { maxAge: 0 })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/public|_next/static|_next/image|favicon.ico|public).*)',
  ],
}