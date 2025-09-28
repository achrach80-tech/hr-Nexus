'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Clock, User } from 'lucide-react'
import { CyberSectionHeader } from './CyberSectionHeader'
import type { WorkforceKPIs } from '@/lib/types/dashboard'

interface CyberDemographicsSectionProps {
  data: WorkforceKPIs | null
  loading?: boolean
}

export const CyberDemographicsSection: React.FC<CyberDemographicsSectionProps> = React.memo(({ 
  data, 
  loading = false 
}) => {
  if (loading) {
    return <DemographicsSkeleton />
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <p className="text-slate-400">Aucune donnée démographiques disponible</p>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <CyberSectionHeader 
        title="Démographie" 
        icon={UserCheck} 
        gradient="bg-gradient-to-r from-violet-500 to-purple-600" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Age Moyen */}
        <motion.div 
          className="relative p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40"
          whileHover={{ y: -2 }}
        >
          <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Clock size={24} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-medium">Âge Moyen</p>
              <p className="text-2xl font-bold text-white">{data.ageMoyen.toFixed(1)} ans</p>
            </div>
          </div>
        </motion.div>

        {/* Ancienneté Moyenne */}
        <motion.div 
          className="relative p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40"
          whileHover={{ y: -2 }}
        >
          <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <UserCheck size={24} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-medium">Ancienneté Moyenne</p>
              <p className="text-2xl font-bold text-white">{(data.ancienneteMoyenne / 12).toFixed(1)} ans</p>
            </div>
          </div>
        </motion.div>

        {/* Répartition par Sexe - Cyberpunk */}
        <motion.div 
          className="col-span-1 md:col-span-2 relative p-6 rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl" />
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <User size={20} className="text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
                Répartition par Sexe
              </span>
            </h3>
            
            <div className="space-y-6">
              {/* Hommes */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg"
                      animate={{
                        boxShadow: [
                          '0 0 10px rgba(0,255,255,0.5)',
                          '0 0 25px rgba(0,255,255,0.8)',
                          '0 0 10px rgba(0,255,255,0.5)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-white font-semibold tracking-wide">HOMMES</span>
                  </div>
                  <div className="text-right">
                    <motion.div 
                      className="text-xl font-bold text-cyan-300"
                      animate={{
                        textShadow: [
                          '0 0 5px rgba(0,255,255,0.5)',
                          '0 0 15px rgba(0,255,255,0.8)',
                          '0 0 5px rgba(0,255,255,0.5)'
                        ]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      {data.pctHommes.toFixed(1)}%
                    </motion.div>
                  </div>
                </div>
                
                <div className="relative h-6 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/30">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.pctHommes}%` }}
                    transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Femmes */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg"
                      animate={{
                        boxShadow: [
                          '0 0 10px rgba(255,20,147,0.5)',
                          '0 0 25px rgba(255,20,147,0.8)',
                          '0 0 10px rgba(255,20,147,0.5)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    <span className="text-white font-semibold tracking-wide">FEMMES</span>
                  </div>
                  <div className="text-right">
                    <motion.div 
                      className="text-xl font-bold text-pink-300"
                      animate={{
                        textShadow: [
                          '0 0 5px rgba(255,20,147,0.5)',
                          '0 0 15px rgba(255,20,147,0.8)',
                          '0 0 5px rgba(255,20,147,0.5)'
                        ]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    >
                      {data.pctFemmes.toFixed(1)}%
                    </motion.div>
                  </div>
                </div>
                
                <div className="relative h-6 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/30">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.pctFemmes}%` }}
                    transition={{ delay: 1.0, duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
})

const DemographicsSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-700 rounded w-64 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
  </div>
)

CyberDemographicsSection.displayName = 'CyberDemographicsSection'