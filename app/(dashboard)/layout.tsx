'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, Upload, Settings, LogOut,
  Menu, X, Building2, Shield, User, Loader2
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [company, setCompany] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [establishment, setEstablishment] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setLoading(true)

      // Get current Supabase user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        router.push('/login')
        return
      }

      if (!session?.user) {
        console.log('No active session found')
        router.push('/login')
        return
      }

      setUser(session.user)

      // Load company data for this user
      const { data: companyData, error: companyError } = await supabase
        .from('entreprises')
        .select(`
          *,
          etablissements (*)
        `)
        .eq('user_id', session.user.id)
        .single()

      if (companyError || !companyData) {
        console.error('Company load error:', companyError)
        // User authenticated but no company - redirect to setup or contact support
        router.push('/login?error=no-company')
        return
      }

      setCompany(companyData)

      // Set default establishment
      const establishments = companyData.etablissements || []
      const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
      if (defaultEst) {
        setEstablishment(defaultEst)
      }

      // Update company session in localStorage for compatibility
      const sessionData = {
        company_id: companyData.id,
        company_name: companyData.nom,
        user_id: session.user.id,
        subscription_plan: companyData.subscription_plan,
        subscription_status: companyData.subscription_status
      }
      localStorage.setItem('company_session', JSON.stringify(sessionData))

    } catch (error) {
      console.error('Auth initialization error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }

      // Clear local storage
      localStorage.removeItem('company_session')
      
      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      router.push('/login')
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Import', href: '/import', icon: Upload },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ]

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Chargement...</p>
        </div>
      </div>
    )
  }

  // Not authenticated or no company
  if (!user || !company) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Main Navigation Sidebar - Always Visible */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 transform transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold truncate">{company.nom}</h2>
              <p className="text-xs text-slate-400 capitalize">{company.subscription_plan}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-white border border-cyan-500/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          {/* User info */}
          <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-slate-800/30 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.email}</p>
              <p className="text-slate-400 text-xs">Connecté</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              {/* Trial warning */}
              {company.subscription_plan === 'trial' && company.trial_ends_at && (
                <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm">
                  Trial ends: {new Date(company.trial_ends_at).toLocaleDateString()}
                </div>
              )}

              {/* Subscription status */}
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                company.subscription_status === 'active' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {company.subscription_status}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}