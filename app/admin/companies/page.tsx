'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, Search, Copy, Activity, 
  Calendar, CreditCard, Users, TrendingUp
} from 'lucide-react'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('entreprises')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setCompanies(data)
    setLoading(false)
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    // Show toast
    const toast = document.createElement('div')
    toast.className = 'fixed bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-2xl z-50 animate-slideIn'
    toast.innerHTML = '✓ Token copied to clipboard'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  const filteredCompanies = companies.filter(c =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Futuristic Header */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Companies
          </h1>
          <p className="text-gray-400 text-lg">Manage all active client accounts</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies..."
            className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid gap-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="group bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 hover:border-green-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{company.nom}</h3>
                <p className="text-gray-400">{company.code_entreprise}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  company.subscription_status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {company.subscription_status}
                </span>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium">
                  {company.subscription_plan}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Email</p>
                <p className="text-white text-sm">{company.billing_email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Created</p>
                <p className="text-white text-sm">{new Date(company.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Last Login</p>
                <p className="text-white text-sm">
                  {company.last_login_at ? new Date(company.last_login_at).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Trial Ends</p>
                <p className="text-white text-sm">
                  {company.trial_ends_at ? new Date(company.trial_ends_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="flex gap-4">
                <button
                  onClick={() => copyToken(company.access_token)}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Copy size={16} />
                  Copy Token
                </button>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Activity size={16} />
                <span className="text-xs">{company.login_count || 0} logins</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}