'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface CyberKPICardProps {
  title: string
  value: number
  format: 'currency' | 'percent' | 'number' | 'decimal'
  icon: LucideIcon
  gradient: string
  alert?: boolean
  subtitle?: string
  size?: 'normal' | 'large'
}

const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'decimal':
      return value.toFixed(1)
    case 'number':
    default:
      return new Intl.NumberFormat('fr-FR').format(Math.round(value))
  }
}

export const CyberKPICard: React.FC<CyberKPICardProps> = React.memo(({ 
  title, 
  value, 
  format, 
  icon: Icon, 
  gradient, 
  alert = false,
  subtitle,
  size = 'normal'
}) => {
  const formattedValue = formatValue(value, format)
  const isLarge = size === 'large'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group border ${
        alert 
          ? 'border-red-500/40 bg-gradient-to-br from-red-900/20 via-slate-900/50 to-red-800/10' 
          : 'border-slate-700/50 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/20'
      } ${isLarge ? 'p-8' : 'p-6'}`}
    >
      {/* Animated background glow */}
      <div className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 ${gradient}`} />
      
      {/* Neon border effect */}
      <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Alert pulse */}
      {alert && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
        </div>
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ${gradient} ${
              isLarge ? 'w-16 h-16' : 'w-12 h-12'
            }`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon size={isLarge ? 28 : 24} className="text-white drop-shadow-lg" />
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <motion.p 
            className="text-slate-400 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.p>
          <motion.p 
            className={`font-bold text-white drop-shadow-md ${isLarge ? 'text-4xl' : 'text-2xl'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {formattedValue}
          </motion.p>
          {subtitle && (
            <motion.p 
              className="text-xs text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
})

CyberKPICard.displayName = 'CyberKPICard'