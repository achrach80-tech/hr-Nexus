'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Calculator, Target, Percent, Shield } from 'lucide-react'
import { CyberKPICard } from './CyberKPICard'
import { CyberSectionHeader } from './CyberSectionHeader'
import type { PayrollKPIs } from '@/lib/types/dashboard'

interface CyberPayrollSectionProps {
  data: PayrollKPIs | null
  loading?: boolean
}

export const CyberPayrollSection: React.FC<CyberPayrollSectionProps> = React.memo(({ 
  data, 
  loading = false 
}) => {
  if (loading) {
    return <PayrollSkeleton />
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <p className="text-slate-400">Aucune donnée payroll disponible</p>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <CyberSectionHeader 
        title="Masse Salariale" 
        icon={DollarSign} 
        gradient="bg-gradient-to-r from-emerald-500 to-cyan-600" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <CyberKPICard
          title="Masse Salariale Brute"
          value={data.masseBrute}
          format="currency"
          icon={DollarSign}
          gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
          subtitle="Total payroll mensuel"
        />

        <CyberKPICard
          title="Coût Total Employeur"
          value={data.coutTotal}
          format="currency"
          icon={Calculator}
          gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
          subtitle="Charges incluses"
        />

        <CyberKPICard
          title="Coût Moyen par ETP"
          value={data.coutMoyenFTE}
          format="currency"
          icon={Target}
          gradient="bg-gradient-to-r from-teal-500 to-teal-600"
          subtitle="Coût employeur unitaire"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberKPICard
          title="Part Variable"
          value={data.partVariable}
          format="percent"
          icon={Percent}
          gradient="bg-gradient-to-r from-indigo-500 to-indigo-600"
          subtitle="Motivation & performance"
        />

        <CyberKPICard
          title="Taux Charges Sociales"
          value={data.tauxCharges}
          format="percent"
          icon={Shield}
          gradient="bg-gradient-to-r from-violet-500 to-violet-600"
          subtitle="Cotisations + taxes"
        />
      </div>
    </motion.section>
  )
})

const PayrollSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-700 rounded w-64 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
  </div>
)

CyberPayrollSection.displayName = 'CyberPayrollSection'