'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Calendar, ChevronDown, Sparkles, Brain,
  AlertTriangle, RefreshCw, Zap, BarChart3, X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReactDOM from 'react-dom'

// Import optimized components
import { useOptimizedKPIData } from '@/lib/hooks/useOptimizedKPIData'
import { CyberWorkforceSection } from '@/components/dashboard/CyberWorkforceSection'
import { CyberPayrollSection } from '@/components/dashboard/CyberPayrollSection'
import { CyberAbsenceSection } from '@/components/dashboard/CyberAbsenceSection'
import { CyberDemographicsSection } from '@/components/dashboard/CyberDemographicsSection'
import type { Company, Establishment } from '@/lib/types/dashboard'

export default function CyberDashboard() {
  const [company, setCompany] = useState<Company | null>(null)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [periods, setPeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Use optimized KPI hook
  const { data: kpiData, loading: kpiLoading, error: kpiError } = useOptimizedKPIData(
    selectedEstablishment?.id || '',
    selectedPeriod
  )

  useEffect(() => {
    initializeData()
  }, [])

  useEffect(() => {
    if (showPeriodSelector) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [showPeriodSelector])

  const initializeData = async () => {
    try {
      setInitialLoading(true)
      setError(null)

// Replace the localStorage session logic with:
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  router.push('/login')
  return
}

const { data: companyData, error } = await supabase
  .from('entreprises')
  .select(`*, etablissements (*)`)
  .eq('user_id', user.id) // Use proper user relationship
  .single()

      setCompany(companyData)
      const establishments = companyData.etablissements || []
      
      const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
      if (defaultEst) {
        setSelectedEstablishment(defaultEst)
        await loadPeriodsForEstablishment(defaultEst.id)
      }
    } catch (err) {
      console.error('Initialize error:', err)
      setError('Erreur d\'initialisation')
    } finally {
      setInitialLoading(false)
    }
  }

  const loadPeriodsForEstablishment = async (establishmentId: string) => {
    try {
      // Try optimized tables first, fallback to original
      const { data: periodData, error } = await supabase
        .from('snapshots_workforce')
        .select('periode')
        .eq('etablissement_id', establishmentId)
        .order('periode', { ascending: false })

      if (error || !periodData?.length) {
        // Fallback to original table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('employes')
          .select('periode')
          .eq('etablissement_id', establishmentId)
          .order('periode', { ascending: false })

        if (fallbackError) throw fallbackError
        
        const uniquePeriods = [...new Set(fallbackData?.map(p => p.periode) || [])]
        setPeriods(uniquePeriods)
        
        if (uniquePeriods.length > 0) {
          setSelectedPeriod(uniquePeriods[0])
        } else {
          setError('Aucune donnée disponible. Veuillez importer des données.')
        }
        return
      }

      const uniquePeriods = [...new Set(periodData?.map(p => p.periode) || [])]
      setPeriods(uniquePeriods)

      if (uniquePeriods.length > 0) {
        setSelectedPeriod(uniquePeriods[0])
      } else {
        setError('Aucune donnée disponible. Veuillez importer des données.')
      }
    } catch (err) {
      console.error('Load periods error:', err)
      setError('Erreur lors du chargement des périodes')
    }
  }

  const formatPeriodDisplay = (periode: string): string => {
    if (!periode) return ''
    try {
      const date = new Date(periode)
      return date.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      })
    } catch {
      return periode
    }
  }

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    setShowPeriodSelector(false)
  }

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="w-20 h-20 border-4 border-purple-500/30 rounded-full mb-6 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 border-4 border-t-purple-500 rounded-full animate-spin"></div>
          </motion.div>
          <motion.p 
            className="text-white text-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Chargement Cyber Dashboard...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error && !kpiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-6">
        <motion.div 
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 max-w-lg text-center border border-red-500/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Erreur de chargement</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/import')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Importer des données
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950">
      {/* Animated cyberpunk background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '48px 48px']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-10 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Brain size={32} className="text-white drop-shadow-lg" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  RH Quantum Analytics
                </motion.h1>
                <motion.div 
                  className="flex items-center gap-3 text-sm text-slate-400 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Building2 size={14} />
                  <span>{company?.nom}</span>
                  <span>•</span>
                  <span>{selectedEstablishment?.nom}</span>
                  <span>•</span>
                  <span className="text-green-400">Cyber Mode</span>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Period selector */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 ${
                    showPeriodSelector 
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/20' 
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-white hover:border-purple-500/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calendar size={18} className="text-purple-400" />
                  <span className={showPeriodSelector ? 'text-purple-300' : 'text-white'}>
                    {selectedPeriod ? formatPeriodDisplay(selectedPeriod) : 'Sélectionner'}
                  </span>
                  <motion.div
                    animate={{ rotate: showPeriodSelector ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} className="text-slate-400" />
                  </motion.div>
                </motion.button>
              </div>

              <motion.button
                onClick={() => router.push('/import')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  Import
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Period Selector Portal */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(
        <AnimatePresence>
          {showPeriodSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-start justify-end pt-24 pr-8"
              onClick={() => setShowPeriodSelector(false)}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-80 max-h-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-purple-400" />
                      <span className="text-sm font-medium text-slate-300">Sélectionner une période</span>
                    </div>
                    <button
                      onClick={() => setShowPeriodSelector(false)}
                      className="p-1 hover:bg-slate-700/50 rounded"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {periods.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {periods.map(period => (
                        <motion.button
                          key={period}
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePeriodChange(period)
                          }}
                          className={`w-full px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                            period === selectedPeriod 
                              ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-white border border-purple-500/50 shadow-lg' 
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{formatPeriodDisplay(period)}</span>
                            {period === selectedPeriod && (
                              <motion.div 
                                className="w-3 h-3 bg-purple-400 rounded-full"
                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center text-slate-500">
                      <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-sm font-medium">Aucune période disponible</p>
                      <p className="text-xs mt-2 opacity-75">Importez vos données d'abord</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Main content */}
      <div className="relative z-10 p-8 space-y-12">
        <Suspense fallback={
          <div className="animate-pulse space-y-12">
            <div className="h-64 bg-slate-800 rounded-2xl"></div>
            <div className="h-64 bg-slate-800 rounded-2xl"></div>
            <div className="h-64 bg-slate-800 rounded-2xl"></div>
          </div>
        }>
          {kpiData ? (
            <>
              <CyberWorkforceSection 
                data={kpiData.workforce} 
                loading={kpiLoading} 
              />
              
              <CyberPayrollSection 
                data={kpiData.financials} 
                loading={kpiLoading} 
              />
              
              <CyberAbsenceSection 
                data={kpiData.absences} 
                loading={kpiLoading} 
              />
              
              <CyberDemographicsSection 
                data={kpiData.workforce} 
                loading={kpiLoading} 
              />
            </>
          ) : (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div 
                className="w-32 h-32 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <BarChart3 size={64} className="text-white drop-shadow-lg" />
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-6">
                Aucune donnée disponible
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Importez vos fichiers Excel RH pour générer automatiquement vos KPIs cyberpunk
              </p>
              <motion.button
                onClick={() => router.push('/import')}
                className="px-12 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={24} />
                  Commencer l'import
                  <Zap size={24} />
                </div>
              </motion.button>
            </motion.div>
          )}
        </Suspense>
        
        {/* Footer */}
        <motion.div 
          className="mt-16 p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Dashboard cyber en temps réel</span>
              </div>
              <span>Période: {formatPeriodDisplay(selectedPeriod)}</span>
              <span>Mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-purple-400" />
              <span>RH Quantum Analytics v5.0</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}