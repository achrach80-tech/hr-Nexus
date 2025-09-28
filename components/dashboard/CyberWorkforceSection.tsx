'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, UserMinus, RefreshCw, Award, Clock } from 'lucide-react'
import { CyberKPICard } from './CyberKPICard'
import { CyberSectionHeader } from './CyberSectionHeader'
import type { WorkforceKPIs } from '@/lib/types/dashboard'

interface CyberWorkforceSectionProps {
  data: WorkforceKPIs | null
  loading?: boolean
}

export const CyberWorkforceSection: React.FC<CyberWorkforceSectionProps> = React.memo(({ 
  data, 
  loading = false 
}) => {
  if (loading) {
    return <WorkforceSkeleton />
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <p className="text-slate-400">Aucune donnée workforce disponible</p>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <CyberSectionHeader 
        title="Effectif & Mouvements" 
        icon={Users} 
        gradient="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" 
      />
      
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <CyberKPICard
          title="ETP Total"
          value={data.etpTotal}
          format="decimal"
          icon={Users}
          gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
          subtitle="Équivalent Temps Plein"
        />

        <CyberKPICard
          title="Headcount Actif"
          value={data.headcountActif}
          format="number"
          icon={Users}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle="Salariés en poste"
        />

        <CyberKPICard
          title="Taux de Turnover"
          value={data.tauxTurnover}
          format="percent"
          icon={RefreshCw}
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle="Mouvement mensuel"
          alert={data.tauxTurnover > 15}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <CyberKPICard
          title="Entrées du Mois"
          value={data.nbEntrees}
          format="number"
          icon={UserPlus}
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
          subtitle="Nouveaux collaborateurs"
        />

        <CyberKPICard
          title="Sorties du Mois"
          value={data.nbSorties}
          format="number"
          icon={UserMinus}
          gradient="bg-gradient-to-r from-red-500 to-red-600"
          subtitle="Départs"
        />

        <CyberKPICard
          title="% CDI"
          value={data.pctCDI}
          format="percent"
          icon={Award}
          gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
          subtitle="Stabilité contractuelle"
        />

        <CyberKPICard
          title="Âge Moyen"
          value={data.ageMoyen}
          format="decimal"
          icon={Clock}
          gradient="bg-gradient-to-r from-violet-500 to-violet-600"
          subtitle="ans"
        />
      </div>
    </motion.section>
  )
})

const WorkforceSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-700 rounded w-64 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
  </div>
)

CyberWorkforceSection.displayName = 'CyberWorkforceSection'