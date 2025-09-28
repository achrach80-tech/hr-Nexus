import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths
  const isPublicPath = path === '/' || path === '/login' || path === '/demo'
  
  // Admin paths
  const isAdminPath = path.startsWith('/admin')
  
  // Dashboard paths
  const isDashboardPath = path.startsWith('/dashboard') || 
                         path.startsWith('/import') || 
                         path.startsWith('/employees') ||
                         path.startsWith('/settings')

  // Check company session for dashboard
  if (isDashboardPath) {
    const companySession = request.cookies.get('company_session')
    
    if (!companySession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    try {
      const sessionData = JSON.parse(atob(companySession.value))
      if (new Date(sessionData.expires_at) < new Date()) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check admin session for admin panel
  if (isAdminPath && path !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session')
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}