'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, Brain, Shield, BarChart3, Users, TrendingUp, 
  Sparkles, Building2, Euro, Check, Play, ChevronRight,
  Activity, PieChart, Calendar, Clock, Award, Zap,
  LineChart, Target, Gauge, Database, Lock, Globe
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [activeMetric, setActiveMetric] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Animated metrics for the dashboard preview
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const animatedMetrics = [
    { label: 'Turnover Rate', value: '8.2%', trend: -2.3, color: '#10b981' },
    { label: 'Absenteeism', value: '4.7%', trend: -1.2, color: '#06b6d4' },
    { label: 'Headcount', value: '1,247', trend: 3.5, color: '#8b5cf6' },
    { label: 'Payroll Cost', value: '€4.2M', trend: 2.1, color: '#f59e0b' }
  ]

  const clients = [
    { name: 'TechCorp', employees: '2,500+' },
    { name: 'FinanceHub', employees: '1,200+' },
    { name: 'RetailMax', employees: '5,000+' },
    { name: 'HealthPlus', employees: '800+' }
  ]

  const benefits = [
    {
      icon: Clock,
      title: "Décisions 10x plus rapides",
      description: "Visualisez tous vos KPIs RH en temps réel sur un seul dashboard"
    },
    {
      icon: Target,
      title: "Prédiction du turnover",
      description: "IA qui identifie les risques de départ 3 mois à l'avance"
    },
    {
      icon: Euro,
      title: "ROI en 30 jours",
      description: "Économisez jusqu'à 15% sur vos coûts RH dès le premier mois"
    },
    {
      icon: Shield,
      title: "100% RGPD Compliant",
      description: "Sécurité niveau bancaire avec chiffrement AES-256"
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Enhanced Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.1),transparent_50%)]" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Brain size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  RH Quantum
                </h1>
                <p className="text-xs text-gray-500">Enterprise Analytics Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors"
              >
                Espace Client
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105"
              >
                Demander une Démo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animated Dashboard */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-full mb-8">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300">Trusted by 50+ enterprises</span>
              </div>
              
              <h1 className="text-6xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  L'Analytics RH qui
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  transforme vos décisions
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Tableau de bord temps réel, prédictions IA, et insights actionnables. 
                Réduisez votre turnover de 40% et optimisez vos coûts RH instantanément.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/demo')}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105 flex items-center justify-center gap-3"
                >
                  Voir la Démo Live
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="px-8 py-4 bg-white/5 backdrop-blur border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <Play size={20} />
                  Regarder (2 min)
                </button>
              </div>

              {/* Trust Signals */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Shield className="text-green-500" size={20} />
                  <span className="text-sm text-gray-400">RGPD Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="text-green-500" size={20} />
                  <span className="text-sm text-gray-400">ISO 27001</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="text-green-500" size={20} />
                  <span className="text-sm text-gray-400">Multi-sites</span>
                </div>
              </div>
            </div>

            {/* Right: Animated Dashboard Preview */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-3xl" />
              
              {/* Dashboard Card */}
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Dashboard Analytics</h3>
                    <p className="text-sm text-gray-400">Temps réel • Janvier 2025</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>

                {/* Animated Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {animatedMetrics.map((metric, index) => (
                    <div
                      key={metric.label}
                      className={`p-4 rounded-xl transition-all duration-500 ${
                        activeMetric === index 
                          ? 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 scale-105' 
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <p className="text-xs text-gray-400 mb-2">{metric.label}</p>
                      <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} style={{ color: metric.color }} />
                        <span className="text-xs" style={{ color: metric.color }}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Chart Animation */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">Évolution Effectifs</span>
                    <Activity className="text-green-500 animate-pulse" size={16} />
                  </div>
                  <div className="h-32 flex items-end gap-2">
                    {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-cyan-500 rounded-t opacity-80"
                        style={{
                          height: `${height}%`,
                          animation: `grow 0.5s ease-out ${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-sm font-semibold shadow-lg animate-bounce">
                Live Demo →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-16 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-500 mb-8">Plus de 50 entreprises font confiance à RH Quantum</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {clients.map((client) => (
              <div key={client.name} className="flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-600 mb-1">{client.name}</div>
                <div className="text-xs text-gray-500">{client.employees} employés</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Pourquoi les DRH choisissent RH Quantum
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Une plateforme conçue par des experts RH pour transformer vos données en avantage compétitif
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="text-purple-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-32 px-6 bg-gradient-to-b from-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Un Dashboard qui pense comme vous
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur rounded-2xl border border-purple-500/20 p-8">
              <Gauge className="text-purple-400 mb-4" size={32} />
              <h3 className="text-2xl font-semibold mb-4">KPIs Temps Réel</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Turnover & Absentéisme
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Masse Salariale
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Pyramide des âges
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Index égalité H/F
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-transparent backdrop-blur rounded-2xl border border-cyan-500/20 p-8">
              <Brain className="text-cyan-400 mb-4" size={32} />
              <h3 className="text-2xl font-semibold mb-4">IA Prédictive</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Risque de départ
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Tendances salariales
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Besoins en recrutement
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Alertes automatiques
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-transparent backdrop-blur rounded-2xl border border-green-500/20 p-8">
              <Database className="text-green-400 mb-4" size={32} />
              <h3 className="text-2xl font-semibold mb-4">Import Simple</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Import Excel direct
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  API REST disponible
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Synchronisation SIRH
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="text-green-500" size={16} />
                  Validation automatique
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">ROI Garanti en 30 jours</h2>
          <p className="text-xl text-gray-400 mb-12">
            Nos clients économisent en moyenne 2,800€ par mois
          </p>
          
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur rounded-3xl border border-white/10 p-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">-40%</div>
                <p className="text-gray-400">Réduction turnover</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">-25%</div>
                <p className="text-gray-400">Temps d'analyse</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">+15%</div>
                <p className="text-gray-400">Productivité RH</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/demo')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105"
            >
              Calculer votre ROI personnalisé →
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Prêt à transformer vos RH ?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Rejoignez les entreprises qui ont déjà optimisé leur gestion RH avec RH Quantum
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => router.push('/demo')}
              className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-semibold text-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              Réserver ma démo personnalisée
              <Calendar className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
          
          <p className="mt-8 text-gray-500 text-sm">
            ✓ Démo de 30 minutes • ✓ Analyse de vos besoins • ✓ Sans engagement
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Brain size={24} className="text-white" />
              </div>
              <span className="text-lg font-semibold">RH Quantum</span>
            </div>
            
            <div className="flex gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-white transition-colors">RGPD</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="/login" className="hover:text-white transition-colors">Espace Client</a>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2025 RH Quantum. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes grow {
          from {
            height: 0;
          }
        }
      `}</style>
    </div>
  )
}