'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, Users, Building2, Calendar, LogOut, 
  Menu, X, BarChart3, Plus, Eye, Settings,
  Activity, Sparkles, Bell, ChevronRight
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check auth on mount
    if (pathname !== '/admin/login') {
      const session = localStorage.getItem('admin_session')
      if (!session) {
        router.push('/admin/login')
        return
      }
      
      try {
        const data = JSON.parse(session)
        if (new Date(data.expires_at) < new Date()) {
          localStorage.removeItem('admin_session')
          router.push('/admin/login')
        }
      } catch {
        router.push('/admin/login')
      }
    }

    // Load pending count
    loadPendingCount()
  }, [pathname])

  const loadPendingCount = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { count } = await supabase
        .from('demo_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      setPendingCount(count || 0)
    } catch (error) {
      console.error('Error loading pending count:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    document.cookie = 'admin_session=; path=/; max-age=0'
    router.push('/admin/login')
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      name: 'Demo Requests', 
      href: '/admin/demos', 
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500',
      badge: pendingCount > 0 ? pendingCount : null
    },
    { 
      name: 'All Companies', 
      href: '/admin/companies', 
      icon: Building2,
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      name: 'Create Company', 
      href: '/admin/create-company', 
      icon: Plus,
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/40 backdrop-blur-2xl border-r border-white/10 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center border-b border-white/10 -mx-6 px-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Shield size={28} className="text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Admin Portal
                </h2>
                <p className="text-xs text-gray-500">RH Quantum Control</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all ${
                            isActive 
                              ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <item.icon 
                            className={`h-6 w-6 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} 
                          />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <ChevronRight className="ml-auto h-5 w-5 text-white/50" />
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
              
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="group w-full flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <LogOut className="h-6 w-6 shrink-0 text-gray-500 group-hover:text-red-400" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${isSidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button onClick={() => setIsSidebarOpen(false)} className="-m-2.5 p-2.5">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/95 backdrop-blur-2xl px-6 pb-4">
              {/* Same content as desktop sidebar */}
              <div className="flex h-20 shrink-0 items-center">
                <div className="flex items-center gap-3">
                  <Shield size={32} className="text-red-500" />
                  <h2 className="text-xl font-bold text-white">Admin</h2>
                </div>
              </div>
              
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`group flex gap-x-3 rounded-xl p-3 text-sm font-semibold ${
                                isActive 
                                  ? `bg-gradient-to-r ${item.gradient} text-white` 
                                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <item.icon className="h-6 w-6 shrink-0" />
                              {item.name}
                              {item.badge && (
                                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
          <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden -m-2.5 p-2.5 text-gray-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1 items-center">
                <h1 className="text-white font-semibold">
                  {navigation.find(n => n.href === pathname)?.name || 'Admin'}
                </h1>
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button className="relative p-2.5 text-gray-400 hover:text-white">
                  <Bell className="h-6 w-6" />
                  {pendingCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}