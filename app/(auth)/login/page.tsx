'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shield, Loader2, AlertCircle, Building2, Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react'

export default function CompanyLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect')
        }
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Erreur de connexion')
      }

      console.log('User authenticated:', authData.user.id)

      // Load company data for this user
      const { data: company, error: companyError } = await supabase
        .from('entreprises')
        .select(`
          *,
          etablissements (*)
        `)
        .eq('user_id', authData.user.id)
        .single()

      if (companyError || !company) {
        // User exists but no company - might be admin created account not yet set up
        throw new Error('Aucune entreprise associée à ce compte. Contactez le support.')
      }

      // Check subscription status
      if (company.subscription_status !== 'active') {
        if (company.trial_ends_at && new Date(company.trial_ends_at) < new Date()) {
          throw new Error('Votre période d\'essai a expiré. Contactez le support.')
        }
      }

      // Create session with company info
      const sessionData = {
        company_id: company.id,
        company_name: company.nom,
        user_id: authData.user.id,
        subscription_plan: company.subscription_plan,
        subscription_status: company.subscription_status,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      // Store session
      localStorage.setItem('company_session', JSON.stringify(sessionData))

      // Update last login tracking
      await supabase
        .from('entreprises')
        .update({ 
          last_login_at: new Date().toISOString(),
          login_count: (company.login_count || 0) + 1,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', company.id)

      console.log('Login successful, redirecting to dashboard')
      router.push('/dashboard')

    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-purple-500/20">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Espace Client
          </h1>
          <p className="text-slate-400">
            Connectez-vous à votre tableau de bord RH
          </p>
        </div>

        {/* Login form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Mail size={16} />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@entreprise.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Lock size={16} />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all pr-12"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-400">{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Accéder au Dashboard
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-400">
                Pas encore client ?
              </p>
              
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white font-medium transition-all"
              >
                <Building2 size={16} />
                Demander une démo
              </Link>

              <div className="pt-4">
                <Link
                  href="/forgot-password"
                  className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Connexion sécurisée • Données chiffrées • Conforme RGPD
          </p>
        </div>
      </div>
    </div>
  )
}