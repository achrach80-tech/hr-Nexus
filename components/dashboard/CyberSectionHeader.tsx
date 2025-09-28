'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface CyberSectionHeaderProps {
  title: string
  icon: LucideIcon
  gradient: string
}

export const CyberSectionHeader: React.FC<CyberSectionHeaderProps> = ({ title, icon: Icon, gradient }) => (
  <motion.div 
    className="flex items-center gap-4 mb-6"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-lg`}>
      <Icon size={24} className="text-white" />
    </div>
    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
      {title}
    </h2>
    <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent" />
  </motion.div>
)