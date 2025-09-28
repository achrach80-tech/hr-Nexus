'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Users, Building2, Clock, TrendingUp, 
  AlertCircle, Zap, ArrowRight, Activity, DollarSign,
  Sparkles, Target, Award, Gauge
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingDemos: 0,
    totalDemos: 0,
    activeCompanies: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    avgResponseTime: '24h'
  })
  const [recentDemos, setRecentDemos] = useState<any[]>([])
  const [recentCompanies, setRecentCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [demosResult, companiesResult] = await Promise.all([
        supabase.from('demo_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('entreprises').select('*').order('created_at', { ascending: false })
      ])

      if (demosResult.data) {
        const pending = demosResult.data.filter(d => d.status === 'pending').length
        const converted = demosResult.data.filter(d => d.status === 'converted').length
        const total = demosResult.data.length
        
        setStats(prev => ({
          ...prev,
          pendingDemos: pending,
          totalDemos: total,
          conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0
        }))
        
        setRecentDemos(demosResult.data.slice(0, 5))
      }

      if (companiesResult.data) {
        const active = companiesResult.data.filter(c => c.subscription_status === 'active').length
        const revenue = companiesResult.data
          .filter(c => c.subscription_status === 'active')
          .reduce((sum, c) => {
            const prices: any = { starter: 29, professional: 89, enterprise: 249 }
            return sum + (prices[c.subscription_plan] || 0)
          }, 0)
        
        setStats(prev => ({
          ...prev,
          activeCompanies: active,
          monthlyRevenue: revenue
        }))
        
        setRecentCompanies(companiesResult.data.slice(0, 3))
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const metrics = [
    {
      label: 'Pending Demos',
      value: stats.pendingDemos,
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
      href: '/admin/demos',
      urgent: stats.pendingDemos > 0
    },
    {
      label: 'Active Companies',
      value: stats.activeCompanies,
      icon: Building2,
      gradient: 'from-green-500 to-emerald-500',
      href: '/admin/companies'
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: Target,
      gradient: 'from-purple-500 to-pink-500',
      trend: stats.conversionRate > 30 ? 'up' : 'down'
    },
    {
      label: 'Monthly Revenue',
      value: `€${stats.monthlyRevenue}`,
      icon: DollarSign,
      gradient: 'from-blue-500 to-cyan-500'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Futuristic Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
              <Gauge size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 text-lg mt-1">Welcome back, Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Alert */}
      {stats.pendingDemos > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center animate-pulse">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Action Required</h3>
                <p className="text-orange-300">You have {stats.pendingDemos} pending demo requests to review</p>
              </div>
            </div>
            <Link
              href="/admin/demos"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-xl text-white font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              Review Now
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity rounded-full blur-2xl"
              style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
            />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${metric.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <metric.icon size={24} className="text-white" />
                </div>
                {metric.urgent && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
                {metric.trend && (
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    metric.trend === 'up' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {metric.trend === 'up' ? '↑' : '↓'}
                  </div>
                )}
              </div>
              
              <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-gray-400 text-sm">{metric.label}</div>
              
              {metric.href && (
                <Link
                  href={metric.href}
                  className="absolute inset-0 z-10"
                  aria-label={`View ${metric.label}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Demos */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Calendar className="text-purple-400" size={24} />
              Recent Demo Requests
            </h2>
            <Link href="/admin/demos" className="text-purple-400 hover:text-purple-300 text-sm">
              View all →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentDemos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No demo requests yet</p>
            ) : (
              recentDemos.map((demo) => (
                <div key={demo.id} className="group p-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-purple-400 transition-colors">
                        {demo.company_name}
                      </p>
                      <p className="text-gray-400 text-sm">{demo.contact_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      demo.status === 'pending' 
                        ? 'bg-orange-500/20 text-orange-400' 
                        : demo.status === 'converted'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {demo.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Building2 className="text-green-400" size={24} />
              Recent Companies
            </h2>
            <Link href="/admin/companies" className="text-green-400 hover:text-green-300 text-sm">
              View all →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentCompanies.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No companies yet</p>
            ) : (
              recentCompanies.map((company) => (
                <div key={company.id} className="group p-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-green-400 transition-colors">
                        {company.nom}
                      </p>
                      <p className="text-gray-400 text-sm">{company.code_entreprise}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 rounded-lg text-xs font-medium">
                        {company.subscription_plan}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-orange-900/20 rounded-2xl p-8 border border-purple-500/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">{stats.totalDemos}</div>
            <div className="text-gray-500 text-sm">Total Demos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400 mb-1">{stats.conversionRate}%</div>
            <div className="text-gray-500 text-sm">Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">{stats.avgResponseTime}</div>
            <div className="text-gray-500 text-sm">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">€{stats.monthlyRevenue}</div>
            <div className="text-gray-500 text-sm">MRR</div>
          </div>
        </div>
      </div>
    </div>
  )
}