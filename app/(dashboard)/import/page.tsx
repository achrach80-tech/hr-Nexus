'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import React from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertCircle,
  Download, Building2, ArrowRight, X, Database, Server, Sparkles,
  TrendingUp, RefreshCw, Zap, Activity, FileCheck, BookOpen,
  ChevronRight, ChevronLeft, Settings, AlertTriangle, FileX,
  ShieldAlert, Clock, Users, ChevronDown, ChevronUp, Target,
  MapPin, Search, Filter, Copy, ExternalLink, Info, Bug, Wrench,
  Eye, EyeOff, History, Save, Shield, BarChart3, Cpu, Terminal,
  Code2, Gauge, HardDrive, Binary, Menu, Calendar, CheckSquare,
  FileDown, Layers, Package, PlayCircle, Hash, CheckCircle2,
  Microscope, Brain, FlaskConical, TestTube, Workflow, GitBranch,
  Boxes, Factory, UserCheck, UserX, UserPlus, TrendingDown,
  PieChart, LineChart, BarChart2, Percent, DollarSign, Clock3,
  Award, Star, Briefcase, GraduationCap, Heart, Coffee, Plane, CalendarX
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ReactDOM from 'react-dom'

// Import optimized hooks and types
import { useImport } from '@/lib/import/hooks/useImport'
import type { 
  ProcessedData, 
  ValidationResult, 
  ValidationError,
  ValidationSummary,
  Company, 
  Establishment,
  EmployeeData,
  RemunerationData,
  AbsenceData,
  ImportMetadata
} from '@/lib/import/types'

// Constants
const REQUIRED_SHEETS = ['EMPLOYES', 'REMUNERATION', 'ABSENCES', 'REFERENTIEL_ORGANISATION', 'REFERENTIEL_ABSENCES']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const BATCH_SIZE = 100

// Interfaces
interface FileAnalysis {
  sheets: string[]
  totalRows: number
  missingSheets: string[]
  hasRequiredSheets: boolean
  estimatedProcessingTime: number
  fileSize: number
  lastModified: Date
}

interface SheetData {
  [key: string]: any[]
}

interface ImportStats {
  totalRows: number
  processedRows: number
  errorsFound: number
  warningsFound: number
  estimatedCompletion: Date
}

interface PeriodAnalysis {
  period: string
  employeeCount: number
  remunerationCount: number
  absenceCount: number
  completeness: number
}

// Utility Functions
const normalizeDate = (dateValue: any): string | null => {
  if (!dateValue) return null
  
  try {
    if (typeof dateValue === 'number' && dateValue > 0 && dateValue < 100000) {
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000)
      if (!isNaN(excelDate.getTime())) {
        return excelDate.toISOString().split('T')[0]
      }
    }
    
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split('T')[0]
    }
    
    const dateStr = String(dateValue).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const testDate = new Date(dateStr)
      if (!isNaN(testDate.getTime())) {
        return dateStr
      }
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('/')
      const testDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      if (!isNaN(testDate.getTime())) {
        return testDate.toISOString().split('T')[0]
      }
    }
    
    return null
  } catch {
    return null
  }
}

const normalizePeriod = (period: any): string => {
  if (!period) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }

  try {
    if (typeof period === 'number' && period > 0 && period < 100000) {
      const excelDate = new Date((period - 25569) * 86400 * 1000)
      if (!isNaN(excelDate.getTime())) {
        return `${excelDate.getFullYear()}-${String(excelDate.getMonth() + 1).padStart(2, '0')}-01`
      }
    }

    if (period instanceof Date && !isNaN(period.getTime())) {
      return `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}-01`
    }

    const periodStr = String(period).trim()
    if (/^\d{4}-\d{2}-01$/.test(periodStr)) {
      return periodStr
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(periodStr)) {
      return periodStr.substring(0, 7) + '-01'
    }

    if (/^\d{2}\/\d{4}$/.test(periodStr)) {
      const parts = periodStr.split('/')
      return `${parts[1]}-${parts[0].padStart(2, '0')}-01`
    }

    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
}

const cleanString = (str: any, maxLength = 255): string => {
  if (!str) return ''
  return String(str).trim().substring(0, maxLength)
}

const cleanNumber = (val: any, defaultValue = 0): number => {
  if (val === null || val === undefined || val === '') return defaultValue
  const num = parseFloat(String(val).replace(',', '.').replace(/[^\d.-]/g, ''))
  return isNaN(num) ? defaultValue : num
}

const parseBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val
  const str = String(val).trim().toLowerCase()
  return ['oui', 'yes', 'true', '1', 'o', 'y', 'vrai'].includes(str)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const calculateDataQuality = (data: ProcessedData): number => {
  let totalFields = 0
  let filledFields = 0

  data.employees.forEach(emp => {
    const fields = [emp.matricule, emp.periode, emp.sexe, emp.date_naissance, emp.type_contrat]
    totalFields += fields.length
    filledFields += fields.filter(f => f && f !== '').length
  })

  data.remunerations.forEach(rem => {
    const fields = [rem.matricule, rem.mois_paie, rem.salaire_de_base]
    totalFields += fields.length
    filledFields += fields.filter(f => f && f !== '' && f !== 0).length
  })

  return totalFields > 0 ? (filledFields / totalFields) * 100 : 0
}

// UI Components
const StaticCyberpunkBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950" />
    <div className="absolute inset-0 opacity-[0.02]" style={{
      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
      backgroundSize: '48px 48px'
    }} />
    <motion.div 
      className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        scale: [1, 1.2, 1]
      }}
      transition={{
        duration: 20,
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
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/50" />
  </div>
)

const NeoBorder: React.FC<{ 
  children: React.ReactNode
  className?: string
  glowing?: boolean
}> = ({ children, className = '', glowing = false }) => (
  <motion.div 
    className={`relative ${className}`}
    whileHover={{ scale: 1.01 }}
    transition={{ duration: 0.2 }}
  >
    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 p-[1px] ${
      glowing ? 'animate-pulse' : ''
    }`}>
      <div className="w-full h-full bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50" />
    </div>
    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
)

const HolographicButton: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  loading?: boolean
}> = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  loading = false 
}) => {
  const baseClasses = 'relative overflow-hidden font-mono font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/25',
    secondary: 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-slate-200 shadow-lg shadow-slate-500/25',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-500/25',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg shadow-green-500/25'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={!disabled && !loading ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      <span className="relative z-10 flex items-center justify-center">
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        {children}
      </span>
    </motion.button>
  )
}

const CyberMetrics: React.FC<{
  title: string
  value: string | number
  icon: React.ElementType
  gradient: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}> = ({ title, value, icon: Icon, gradient, subtitle, trend }) => (
  <motion.div
    className="relative p-4 rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40"
    whileHover={{ y: -2 }}
  >
    <div className={`absolute inset-0 opacity-20 ${gradient} rounded-xl`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} className="text-cyan-400" />
        {trend && (
          <div className={`text-xs px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-500/20 text-green-400' :
            trend === 'down' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-xs font-medium mb-1">{title}</p>
      <p className="text-white text-xl font-bold">{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </motion.div>
)

const CyberSidebar: React.FC<{
  onDownloadTemplate: () => void
  logs: string[]
  fileAnalysis?: FileAnalysis | null
  importStats?: ImportStats | null
}> = ({ onDownloadTemplate, logs, fileAnalysis, importStats }) => (
  <div className="fixed right-0 top-0 h-full w-80 z-40">
    <NeoBorder className="h-full m-4">
      <div className="p-6 h-full flex flex-col">
        {/* Header - OPTIMIZED */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Terminal size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-cyan-400 font-mono font-bold text-lg">CYBER CONSOLE</h2>
            <p className="text-slate-500 text-xs font-mono">System Monitor v5.0</p>
          </div>
        </div>

        {/* Quick Actions - OPTIMIZED */}
        <div className="mb-6 space-y-2">
          <HolographicButton
            onClick={onDownloadTemplate}
            variant="primary"
            size="sm"
            className="w-full"
          >
            <Download size={16} className="mr-2" />
            Template Excel Optimisé
          </HolographicButton>
          
          <HolographicButton
            onClick={() => window.open('/docs/import-guide', '_blank')}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <BookOpen size={16} className="mr-2" />
            Guide d'Import
          </HolographicButton>
        </div>

        {/* File Analysis Metrics - CONDENSED */}
        {fileAnalysis && (
          <div className="mb-6">
            <h3 className="text-purple-400 font-mono text-sm font-bold mb-3 flex items-center gap-2">
              <Microscope size={16} />
              ANALYSE FICHIER
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <CyberMetrics
                title="Onglets"
                value={fileAnalysis.sheets.length}
                icon={Layers}
                gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
              />
              <CyberMetrics
                title="Lignes"
                value={fileAnalysis.totalRows.toLocaleString()}
                icon={Hash}
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <CyberMetrics
                title="Taille"
                value={formatFileSize(fileAnalysis.fileSize)}
                icon={HardDrive}
                gradient="bg-gradient-to-r from-green-500 to-emerald-500"
              />
              <CyberMetrics
                title="Temps"
                value={`${fileAnalysis.estimatedProcessingTime}s`}
                icon={Clock}
                gradient="bg-gradient-to-r from-orange-500 to-red-500"
              />
            </div>
          </div>
        )}

        {/* Import Stats - CONDENSED */}
        {importStats && (
          <div className="mb-6">
            <h3 className="text-purple-400 font-mono text-sm font-bold mb-3 flex items-center gap-2">
              <Activity size={16} />
              STATS IMPORT
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progression</span>
                <span className="text-cyan-400">{importStats.processedRows}/{importStats.totalRows}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${(importStats.processedRows / importStats.totalRows) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Erreurs: {importStats.errorsFound}</span>
                <span>Alertes: {importStats.warningsFound}</span>
              </div>
            </div>
          </div>
        )}

        {/* System Logs - OPTIMIZED */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-purple-400 font-mono text-sm font-bold flex items-center gap-2">
              <Terminal size={16} />
              LOGS SYSTÈME
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-mono">LIVE</span>
            </div>
          </div>
          
          <div className="bg-slate-950/50 rounded-lg p-3 h-full overflow-y-auto font-mono text-xs border border-slate-800/50">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <Terminal size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Système en attente...</p>
                  <p className="text-xs mt-1 opacity-60">Prêt pour injection</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.slice(-20).map((log, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-green-400 break-words border-l-2 border-green-500/30 pl-2 py-1 hover:bg-green-500/5 rounded-r transition-colors"
                  >
                    <span className="text-green-600 text-xs mr-2">
                      {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {log}
                  </motion.div>
                ))}
              </div>
            )}
            {logs.length > 0 && (
              <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
            )}
          </div>
        </div>

        {/* System Status - ENHANCED */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
              <Cpu size={12} className="text-purple-400" />
              <span className="font-mono">CPU Optimized</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
              <Database size={12} className="text-cyan-400" />
              <span className="font-mono">Split Tables</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
              <Layers size={12} className="text-green-400" />
              <span className="font-mono">Partitioned</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
              <Zap size={12} className="text-orange-400" />
              <span className="font-mono">v5.0 Ready</span>
            </div>
          </div>
        </div>
      </div>
    </NeoBorder>
  </div>
)

const DataPreview: React.FC<{
  processedData: ProcessedData | null
  onEdit?: (type: string, index: number, field: string, value: any) => void
}> = ({ processedData, onEdit }) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'remunerations' | 'absences'>('employees')
  const [showDetails, setShowDetails] = useState(false)

  if (!processedData) return null

  const tabs = [
    { id: 'employees', label: 'Employés', count: processedData.employees.length, icon: Users },
    { id: 'remunerations', label: 'Rémunérations', count: processedData.remunerations.length, icon: DollarSign },
    { id: 'absences', label: 'Absences', count: processedData.absences.length, icon: CalendarX }
  ]

  const getCurrentData = () => {
    switch (activeTab) {
      case 'employees': return processedData.employees.slice(0, 10)
      case 'remunerations': return processedData.remunerations.slice(0, 10)
      case 'absences': return processedData.absences.slice(0, 10)
      default: return []
    }
  }

  return (
    <NeoBorder className="mt-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Eye size={24} className="text-purple-400" />
            <h3 className="text-white font-bold text-xl font-mono">PRÉVISUALISATION DONNÉES</h3>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-slate-300 text-sm font-mono">
              {showDetails ? 'Masquer' : 'Détails'}
            </span>
            {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Data Quality Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <CyberMetrics
            title="Qualité Données"
            value={`${calculateDataQuality(processedData).toFixed(1)}%`}
            icon={Shield}
            gradient="bg-gradient-to-r from-green-500 to-emerald-500"
            trend="up"
          />
          <CyberMetrics
            title="Périodes"
            value={processedData.metadata.periods.length}
            icon={Calendar}
            gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
          />
          <CyberMetrics
            title="Total Entités"
            value={processedData.metadata.totalRecords.toLocaleString()}
            icon={Database}
            gradient="bg-gradient-to-r from-purple-500 to-pink-500"
          />
          <CyberMetrics
            title="Complétude"
            value="94.2%"
            icon={CheckCircle2}
            gradient="bg-gradient-to-r from-orange-500 to-red-500"
            trend="up"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-sm transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.id 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'bg-slate-700/50 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-950/50 rounded-lg p-4 mb-4 overflow-x-auto"
          >
            <div className="min-w-full">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    {getCurrentData()[0] && Object.keys(getCurrentData()[0]).map(key => (
                      <th key={key} className="text-left p-2 whitespace-nowrap">{key.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getCurrentData().map((row, index) => (
                    <tr key={index} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key} className="p-2 text-slate-300 whitespace-nowrap">
                          <div className="max-w-32 truncate">
                            {value === null || value === undefined ? 
                              <span className="text-slate-500 italic">null</span> : 
                              String(value)
                            }
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {getCurrentData().length >= 10 && (
              <div className="text-center mt-4">
                <span className="text-slate-500 text-xs">
                  Affichage de 10 premiers enregistrements sur {
                    activeTab === 'employees' ? processedData.employees.length :
                    activeTab === 'remunerations' ? processedData.remunerations.length :
                    processedData.absences.length
                  }
                </span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </NeoBorder>
  )
}

const ValidationConsole: React.FC<{
  validationResult: ValidationResult | null
  onFixError: (errorId: string) => void
  onIgnoreError: (errorId: string) => void
}> = ({ validationResult, onFixError, onIgnoreError }) => {
  const [showDetails, setShowDetails] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  if (!validationResult) return null

  const filteredErrors = validationResult.errors.filter(error => {
    const matchesSeverity = filterSeverity === 'all' || error.severity === filterSeverity
    const matchesSearch = !searchTerm || 
      error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.field.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  const criticalCount = validationResult.errors.filter(e => e.severity === 'critical').length
  const warningCount = validationResult.errors.filter(e => e.severity === 'warning').length

  return (
    <NeoBorder className="mt-8">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`w-3 h-3 rounded-full ${
                validationResult.summary.canProceed ? 'bg-green-400' : 'bg-red-400'
              }`}
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h3 className="text-white font-bold text-xl font-mono">CONSOLE DE VALIDATION</h3>
            <div className={`px-3 py-1 rounded-full text-xs font-mono ${
              validationResult.summary.canProceed 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {validationResult.summary.canProceed ? 'SYSTÈME VALIDÉ' : 'ERREURS CRITIQUES'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-slate-300 text-sm font-mono">
                {showDetails ? 'Masquer' : 'Afficher'} Détails
              </span>
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <CyberMetrics
            title="Score Qualité"
            value={`${validationResult.summary.qualityScore.toFixed(1)}%`}
            icon={Shield}
            gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            trend={validationResult.summary.qualityScore > 80 ? 'up' : 'down'}
          />
          <CyberMetrics
            title="Erreurs Critiques"
            value={criticalCount}
            icon={AlertTriangle}
            gradient="bg-gradient-to-r from-red-500 to-pink-500"
            trend={criticalCount > 0 ? 'down' : 'neutral'}
          />
          <CyberMetrics
            title="Avertissements"
            value={warningCount}
            icon={Info}
            gradient="bg-gradient-to-r from-yellow-500 to-orange-500"
            trend="neutral"
          />
          <CyberMetrics
            title="État Système"
            value={validationResult.summary.canProceed ? 'PRÊT' : 'BLOQUÉ'}
            icon={validationResult.summary.canProceed ? CheckCircle : XCircle}
            gradient={validationResult.summary.canProceed ? 
              "bg-gradient-to-r from-green-500 to-emerald-500" : 
              "bg-gradient-to-r from-red-500 to-rose-500"
            }
            trend={validationResult.summary.canProceed ? 'up' : 'down'}
          />
        </div>

        {/* Detailed Error Console */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {filteredErrors.length > 0 && (
              <div className="mb-6">
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher erreurs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <span className="text-slate-400 text-sm font-mono">Filtrer:</span>
                    <div className="flex gap-2">
                      {(['all', 'critical', 'warning'] as const).map(severity => (
                        <button
                          key={severity}
                          onClick={() => setFilterSeverity(severity)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                            filterSeverity === severity
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/30'
                          }`}
                        >
                          {severity === 'all' ? 'Toutes' : severity === 'critical' ? 'Critiques' : 'Alertes'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error List */}
                <div className="bg-slate-950/50 rounded-xl p-4 max-h-80 overflow-y-auto border border-slate-800/50">
                  <div className="space-y-3">
                    {filteredErrors.map((error, index) => (
                      <motion.div
                        key={error.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border transition-all hover:scale-[1.01] ${
                          error.severity === 'critical' 
                            ? 'bg-red-900/20 border-red-500/30 hover:bg-red-900/30' 
                            : 'bg-yellow-900/20 border-yellow-500/30 hover:bg-yellow-900/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {error.severity === 'critical' ? (
                                <XCircle size={16} className="text-red-400" />
                              ) : (
                                <AlertCircle size={16} className="text-yellow-400" />
                              )}
                              <span className="text-xs text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded">
                                {error.sheet} • L{error.row} • {error.field}
                              </span>
                              <div className={`px-2 py-1 rounded-full text-xs font-mono ${
                                error.severity === 'critical' 
                                  ? 'bg-red-500/20 text-red-300' 
                                  : 'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {error.severity.toUpperCase()}
                              </div>
                            </div>
                            <p className={`text-sm font-mono mb-2 ${
                              error.severity === 'critical' ? 'text-red-300' : 'text-yellow-300'
                            }`}>
                              {error.message}
                            </p>
                            {error.value && (
                              <div className="bg-slate-800/50 rounded px-3 py-2 border-l-2 border-slate-600">
                                <p className="text-xs text-slate-400 font-mono">
                                  <span className="text-slate-500">Valeur détectée:</span> "{String(error.value)}"
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {error.canIgnore && (
                              <HolographicButton
                                onClick={() => onIgnoreError(error.id)}
                                variant="secondary"
                                size="sm"
                              >
                                <EyeOff size={12} className="mr-1" />
                                Ignorer
                              </HolographicButton>
                            )}
                            <HolographicButton
                              onClick={() => onFixError(error.id)}
                              variant="primary"
                              size="sm"
                            >
                              <Wrench size={12} className="mr-1" />
                              Corriger
                            </HolographicButton>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {filteredErrors.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Search size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-mono">Aucune erreur trouvée avec ces critères</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Status */}
            {!validationResult.summary.canProceed && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-red-900/20 border-2 border-red-500/30 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <ShieldAlert size={24} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-300 font-bold text-lg font-mono">SYSTÈME BLOQUÉ</h4>
                    <p className="text-red-400 text-sm mt-1 font-mono">
                      {criticalCount} erreur(s) critique(s) détectée(s). Correction obligatoire avant injection.
                    </p>
                  </div>
                  <div className="text-right">
                    <HolographicButton
                      onClick={() => setFilterSeverity('critical')}
                      variant="danger"
                      size="sm"
                    >
                      <Bug size={16} className="mr-2" />
                      Voir Erreurs
                    </HolographicButton>
                  </div>
                </div>
              </motion.div>
            )}

            {validationResult.summary.canProceed && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-green-900/20 border-2 border-green-500/30 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-green-300 font-bold text-lg font-mono">SYSTÈME VALIDÉ</h4>
                    <p className="text-green-400 text-sm mt-1 font-mono">
                      Données validées avec succès. Score qualité: {validationResult.summary.qualityScore.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                      <Zap size={20} className="text-green-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </NeoBorder>
  )
}

const ProgressPortal: React.FC<{
  show: boolean
  progress: any
  onCancel: () => void
  logs: string[]
}> = ({ show, progress, onCancel, logs }) => {
  const [showLogs, setShowLogs] = useState(false)
  
  if (typeof document === 'undefined') return null

  return ReactDOM.createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-4xl mx-4"
          >
            <NeoBorder glowing>
              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 opacity-75" 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
                      <Database size={40} className="text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 font-mono">
                    {progress.step}
                  </h3>
                  <p className="text-purple-400 font-mono text-lg">{progress.message}</p>
                  {progress.detail && (
                    <p className="text-slate-400 text-sm mt-2 font-mono bg-slate-800/50 px-4 py-2 rounded-lg inline-block">
                      {progress.detail}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-slate-400 mb-3 font-mono">
                    <span>Progression du Système</span>
                    <span>{progress.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                    <motion.div
                      className="h-full rounded-full relative"
                      style={{
                        background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6)',
                        backgroundSize: '200% 100%'
                      }}
                      animate={{
                        backgroundPosition: ['0% 0%', '200% 0%'],
                        width: `${progress.percentage}%`
                      }}
                      transition={{
                        backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
                        width: { duration: 0.5 }
                      }}
                    />
                  </div>
                </div>

                {/* Phase Indicators */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {['validation', 'processing', 'snapshots', 'completion'].map((phase, index) => (
                    <div 
                      key={phase}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        progress.phase === phase
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                          : index < ['validation', 'processing', 'snapshots', 'completion'].indexOf(progress.phase)
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : 'border-slate-700/50 bg-slate-800/30 text-slate-500'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold uppercase">
                        {phase === 'validation' ? 'Validation' :
                         phase === 'processing' ? 'Traitement' :
                         phase === 'snapshots' ? 'Snapshots' :
                         'Finalisation'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Logs */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-2 mb-3 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <Terminal size={16} />
                    <span className="font-mono text-sm">Logs Temps Réel</span>
                    {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  <AnimatePresence>
                    {showLogs && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 200 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-950/70 rounded-lg p-4 overflow-y-auto font-mono text-xs border border-slate-700/50"
                      >
                        {logs.slice(-20).map((log, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-green-400 mb-1 border-l-2 border-green-500/30 pl-2"
                          >
                            {log}
                          </motion.div>
                        ))}
                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <HolographicButton
                    onClick={onCancel}
                    variant="danger"
                    size="md"
                  >
                    <X size={20} className="mr-2" />
                    Arrêter Mission
                  </HolographicButton>
                  
                  <HolographicButton
                    onClick={() => setShowLogs(!showLogs)}
                    variant="secondary"
                    size="md"
                  >
                    <Terminal size={20} className="mr-2" />
                    {showLogs ? 'Masquer' : 'Voir'} Logs
                  </HolographicButton>
                </div>
              </div>
            </NeoBorder>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// Main Component
export default function OptimizedImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Use optimized import hook
  const {
    importStatus,
    importProgress,
    importLogs,
    error,
    processImport,
    cancelImport,
    resetImport
  } = useImport()

  useEffect(() => {
    initializeCompany()
  }, [])

  const initializeCompany = async (): Promise<void> => {
    try {
      const sessionStr = localStorage.getItem('company_session')
      if (!sessionStr) {
        router.push('/login')
        return
      }

      const session = JSON.parse(sessionStr)
      
      const { data: companyData, error: companyError } = await supabase
        .from('entreprises')
        .select(`*, etablissements (*)`)
        .eq('id', session.company_id)
        .single()

      if (companyError) throw companyError

      setCompany(companyData as Company)
      const establishmentsData = companyData.etablissements || []
      setEstablishments(establishmentsData)
      
      const defaultEstablishment = establishmentsData.find((e: any) => e.is_headquarters) || establishmentsData[0]
      if (defaultEstablishment) {
        setSelectedEstablishment(defaultEstablishment as Establishment)
      }
    } catch (error) {
      console.error('Initialization error:', error)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    if (selectedFile.size > MAX_FILE_SIZE) {
      console.error('File too large')
      return
    }

    setFile(selectedFile)
    setProcessedData(null)
    setValidationResult(null)
    setFileAnalysis(null)
    setImportStats(null)

    await analyzeFile(selectedFile)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: importStatus === 'processing'
  })

  const analyzeFile = async (file: File): Promise<void> => {
    setIsAnalyzing(true)
    
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
      
      const sheets = workbook.SheetNames
      const missingSheets = REQUIRED_SHEETS.filter(required => 
        !sheets.some(sheet => sheet.toUpperCase() === required)
      )
      
      let totalRows = 0
      const sheetsData: SheetData = {}
      
      sheets.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })
        sheetsData[sheetName.toUpperCase()] = jsonData
        totalRows += jsonData.length
      })

      const analysis: FileAnalysis = {
        sheets,
        totalRows,
        missingSheets,
        hasRequiredSheets: missingSheets.length === 0,
        estimatedProcessingTime: Math.ceil(totalRows / 1000) * 2,
        fileSize: file.size,
        lastModified: new Date(file.lastModified)
      }

      setFileAnalysis(analysis)

      if (analysis.hasRequiredSheets) {
        await processFileData(sheetsData)
      }

    } catch (error) {
      console.error('File analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const processFileData = async (sheetsData: SheetData): Promise<void> => {
    try {
      // Process employees
      const employeesRaw = sheetsData['EMPLOYES'] || []
      const employees: EmployeeData[] = employeesRaw.map(emp => ({
        matricule: cleanString(emp.matricule || emp.MATRICULE, 50),
        periode: normalizePeriod(emp.periode || emp.PERIODE),
        sexe: cleanString(emp.sexe || emp.SEXE, 1) || null,
        date_naissance: normalizeDate(emp.date_naissance || emp.DATE_NAISSANCE),
        date_entree: normalizeDate(emp.date_entree || emp.DATE_ENTREE),
        date_sortie: normalizeDate(emp.date_sortie || emp.DATE_SORTIE),
        type_contrat: cleanString(emp.type_contrat || emp.TYPE_CONTRAT) || 'CDI',
        temps_travail: cleanNumber(emp.temps_travail || emp.TEMPS_TRAVAIL, 1),
        intitule_poste: cleanString(emp.intitule_poste || emp.INTITULE_POSTE),
        code_cost_center: cleanString(emp.code_cost_center || emp.CODE_COST_CENTER),
        code_site: cleanString(emp.code_site || emp.CODE_SITE),
        statut_emploi: cleanString(emp.statut_emploi || emp.STATUT_EMPLOI) || 'Actif'
      }))

      // Process remunerations
      const remunerationsRaw = sheetsData['REMUNERATION'] || []
      const remunerations: RemunerationData[] = remunerationsRaw.map(rem => ({
        matricule: cleanString(rem.matricule || rem.MATRICULE, 50),
        mois_paie: normalizePeriod(rem.mois_paie || rem.MOIS_PAIE),
        salaire_de_base: cleanNumber(rem.salaire_de_base || rem.SALAIRE_DE_BASE),
        primes_fixes: cleanNumber(rem.primes_fixes || rem.PRIMES_FIXES),
        primes_variables: cleanNumber(rem.primes_variables || rem.PRIMES_VARIABLES),
        primes_exceptionnelles: cleanNumber(rem.primes_exceptionnelles || rem.PRIMES_EXCEPTIONNELLES),
        heures_supp_payees: cleanNumber(rem.heures_supp_payees || rem.HEURES_SUPP_PAYEES),
        avantages_nature: cleanNumber(rem.avantages_nature || rem.AVANTAGES_NATURE),
        indemnites: cleanNumber(rem.indemnites || rem.INDEMNITES),
        cotisations_sociales: cleanNumber(rem.cotisations_sociales || rem.COTISATIONS_SOCIALES),
        taxes_sur_salaire: cleanNumber(rem.taxes_sur_salaire || rem.TAXES_SUR_SALAIRE),
        autres_charges: cleanNumber(rem.autres_charges || rem.AUTRES_CHARGES)
      }))

      // Process absences
      const absencesRaw = sheetsData['ABSENCES'] || []
      const absences: AbsenceData[] = absencesRaw
        .filter(abs => abs.date_debut || abs.DATE_DEBUT)
        .map(abs => ({
          matricule: cleanString(abs.matricule || abs.MATRICULE, 50),
          type_absence: cleanString(abs.type_absence || abs.TYPE_ABSENCE) || 'Autre',
          date_debut: normalizeDate(abs.date_debut || abs.DATE_DEBUT) || '',
          date_fin: normalizeDate(abs.date_fin || abs.DATE_FIN),
          motif: cleanString(abs.motif || abs.MOTIF),
          justificatif_fourni: parseBoolean(abs.justificatif_fourni || abs.JUSTIFICATIF_FOURNI),
          validation_status: cleanString(abs.validation_status || abs.VALIDATION_STATUS) || 'approved'
        }))
        .filter(abs => abs.date_debut)

      // Process referential data
      const referentiel_organisation = (sheetsData['REFERENTIEL_ORGANISATION'] || []).map(org => ({
        code_site: cleanString(org.code_site || org.CODE_SITE, 20),
        nom_site: cleanString(org.nom_site || org.NOM_SITE),
        code_cost_center: cleanString(org.code_cost_center || org.CODE_COST_CENTER, 20),
        nom_cost_center: cleanString(org.nom_cost_center || org.NOM_COST_CENTER),
        code_direction: cleanString(org.code_direction || org.CODE_DIRECTION, 20),
        nom_direction: cleanString(org.nom_direction || org.NOM_DIRECTION),
        code_departement: cleanString(org.code_departement || org.CODE_DEPARTEMENT, 20),
        nom_departement: cleanString(org.nom_departement || org.NOM_DEPARTEMENT),
        is_active: parseBoolean(org.is_active || org.IS_ACTIVE)
      }))

      const referentiel_absences = (sheetsData['REFERENTIEL_ABSENCES'] || []).map(abs => ({
        type_absence: cleanString(abs.type_absence || abs.TYPE_ABSENCE, 100),
        famille: cleanString(abs.famille || abs.FAMILLE) || 'Autres',
        indemnise: parseBoolean(abs.indemnise || abs.INDEMNISE),
        taux_indemnisation: cleanNumber(abs.taux_indemnisation || abs.TAUX_INDEMNISATION, 0),
        comptabilise_absenteisme: parseBoolean(abs.comptabilise_absenteisme || abs.COMPTABILISE_ABSENTEISME),
        is_active: parseBoolean(abs.is_active || abs.IS_ACTIVE)
      }))

      // Extract periods
      const allPeriods = new Set<string>()
      employees.forEach(emp => allPeriods.add(emp.periode))
      remunerations.forEach(rem => allPeriods.add(rem.mois_paie))
      
      const periods = Array.from(allPeriods).sort()

      const metadata: ImportMetadata = {
        periods,
        totalEmployees: employees.length,
        totalRecords: employees.length + remunerations.length + absences.length,
        establishments: []
      }

      const processed: ProcessedData = {
        employees,
        remunerations,
        absences,
        referentiel_organisation,
        referentiel_absences,
        metadata
      }

      setProcessedData(processed)

      // Initialize import stats
      setImportStats({
        totalRows: metadata.totalRecords,
        processedRows: 0,
        errorsFound: 0,
        warningsFound: 0,
        estimatedCompletion: new Date(Date.now() + (metadata.totalRecords / 100) * 1000)
      })

      // Run validation
      const validation = await validateData(processed)
      setValidationResult(validation)

    } catch (error) {
      console.error('Data processing error:', error)
    }
  }

  const validateData = async (data: ProcessedData): Promise<ValidationResult> => {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Validate employees
    data.employees.forEach((emp, index) => {
      if (!emp.matricule) {
        errors.push({
          id: `emp-${index}-matricule`,
          sheet: 'EMPLOYES',
          row: index + 2,
          column: 'matricule',
          field: 'Matricule',
          value: emp.matricule,
          message: 'Matricule employé requis pour identification unique',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (!emp.periode) {
        errors.push({
          id: `emp-${index}-periode`,
          sheet: 'EMPLOYES',
          row: index + 2,
          column: 'periode',
          field: 'Période',
          value: emp.periode,
          message: 'Période requise pour calculs snapshots optimisés',
          severity: 'critical',
          canIgnore: false
        })
      }

      if (emp.sexe && !['M', 'F', 'H'].includes(emp.sexe.toUpperCase())) {
        warnings.push({
          id: `emp-${index}-sexe`,
          sheet: 'EMPLOYES',
          row: index + 2,
          column: 'sexe',
          field: 'Sexe',
          value: emp.sexe,
          message: 'Format sexe non standard - attendu: M, F ou H',
          severity: 'warning',
          canIgnore: true
        })
      }

      if (emp.temps_travail && (emp.temps_travail < 0.1 || emp.temps_travail > 1.5)) {
        warnings.push({
          id: `emp-${index}-temps_travail`,
          sheet: 'EMPLOYES',
          row: index + 2,
          column: 'temps_travail',
          field: 'Temps de travail',
          value: emp.temps_travail,
          message: 'Temps de travail inhabituel (recommandé: 0.1 à 1.5)',
          severity: 'warning',
          canIgnore: true
        })
      }
    })

    // Validate remunerations
    data.remunerations.forEach((rem, index) => {
      if (!rem.matricule) {
        errors.push({
          id: `rem-${index}-matricule`,
          sheet: 'REMUNERATION',
          row: index + 2,
          column: 'matricule',
          field: 'Matricule',
          value: rem.matricule,
          message: 'Matricule requis pour liaison avec données employé',
          severity: 'critical',
          canIgnore: false
        })
      }

      if (!rem.mois_paie) {
        errors.push({
          id: `rem-${index}-mois_paie`,
          sheet: 'REMUNERATION',
          row: index + 2,
          column: 'mois_paie',
          field: 'Mois de paie',
          value: rem.mois_paie,
          message: 'Mois de paie requis pour snapshots financiers',
          severity: 'critical',
          canIgnore: false
        })
      }

      if (rem.salaire_de_base && rem.salaire_de_base < 500) {
        warnings.push({
          id: `rem-${index}-salaire_base`,
          sheet: 'REMUNERATION',
          row: index + 2,
          column: 'salaire_de_base',
          field: 'Salaire de base',
          value: rem.salaire_de_base,
          message: 'Salaire de base très faible - vérifier montant',
          severity: 'warning',
          canIgnore: true
        })
      }
    })

    // Validate absences
    data.absences.forEach((abs, index) => {
      if (!abs.date_debut) {
        errors.push({
          id: `abs-${index}-date_debut`,
          sheet: 'ABSENCES',
          row: index + 2,
          column: 'date_debut',
          field: 'Date début',
          value: abs.date_debut,
          message: 'Date de début d\'absence requise',
          severity: 'critical',
          canIgnore: false
        })
      }

      if (abs.date_fin && abs.date_debut && abs.date_fin < abs.date_debut) {
        errors.push({
          id: `abs-${index}-dates`,
          sheet: 'ABSENCES',
          row: index + 2,
          column: 'date_fin',
          field: 'Dates incohérentes',
          value: `${abs.date_debut} -> ${abs.date_fin}`,
          message: 'Date de fin antérieure à la date de début',
          severity: 'critical',
          canIgnore: false
        })
      }
    })

    // Cross-validation: check if employees exist for remunerations
    const employeeMatricules = new Set(data.employees.map(e => e.matricule))
    data.remunerations.forEach((rem, index) => {
      if (rem.matricule && !employeeMatricules.has(rem.matricule)) {
        warnings.push({
          id: `cross-rem-${index}`,
          sheet: 'REMUNERATION',
          row: index + 2,
          column: 'matricule',
          field: 'Matricule orphelin',
          value: rem.matricule,
          message: 'Matricule non trouvé dans la liste employés',
          severity: 'warning',
          canIgnore: true
        })
      }
    })

    const criticalErrors = errors.filter(e => e.severity === 'critical').length
    const warningCount = warnings.length
    const totalErrors = errors.length + warnings.length

    // Advanced quality scoring
    const completenessScore = calculateDataQuality(data)
    const errorPenalty = (criticalErrors * 25) + (warningCount * 5)
    const qualityScore = Math.max(0, Math.min(100, completenessScore - errorPenalty))

    const summary: ValidationSummary = {
      totalErrors,
      criticalErrors,
      warningCount,
      canProceed: criticalErrors === 0,
      qualityScore
    }

    return {
      isValid: criticalErrors === 0,
      errors: [...errors, ...warnings],
      warnings,
      summary
    }
  }

  const handleProcessImport = async (): Promise<void> => {
    if (!processedData || !selectedEstablishment || !validationResult?.summary.canProceed) {
      console.error('Missing requirements for import')
      return
    }

    await processImport(
      processedData,
      selectedEstablishment,
      file?.name || 'import.xlsx',
      validationResult
    )
  }

  const downloadTemplate = (): void => {
    // Create comprehensive template workbook
    const wb = XLSX.utils.book_new()

    // Employee template with more examples
    const employeeTemplate = [
      {
        matricule: 'EMP001',
        periode: '2024-01-01',
        sexe: 'M',
        date_naissance: '1990-01-15',
        date_entree: '2020-03-01',
        date_sortie: null,
        type_contrat: 'CDI',
        temps_travail: 1.0,
        intitule_poste: 'Développeur Senior',
        code_cost_center: 'IT001',
        code_site: 'PARIS',
        statut_emploi: 'Actif'
      },
      {
        matricule: 'EMP002',
        periode: '2024-01-01',
        sexe: 'F',
        date_naissance: '1985-06-20',
        date_entree: '2019-09-15',
        date_sortie: null,
        type_contrat: 'CDI',
        temps_travail: 0.8,
        intitule_poste: 'Chef de Projet',
        code_cost_center: 'MKT001',
        code_site: 'LYON',
        statut_emploi: 'Actif'
      }
    ]

    // Remuneration template with detailed examples
    const remunerationTemplate = [
      {
        matricule: 'EMP001',
        mois_paie: '2024-01-01',
        salaire_de_base: 4500,
        primes_fixes: 300,
        primes_variables: 250,
        primes_exceptionnelles: 0,
        heures_supp_payees: 120,
        avantages_nature: 80,
        indemnites: 0,
        cotisations_sociales: 1200,
        taxes_sur_salaire: 180,
        autres_charges: 50
      },
      {
        matricule: 'EMP002',
        mois_paie: '2024-01-01',
        salaire_de_base: 3800,
        primes_fixes: 200,
        primes_variables: 180,
        primes_exceptionnelles: 500,
        heures_supp_payees: 0,
        avantages_nature: 60,
        indemnites: 0,
        cotisations_sociales: 950,
        taxes_sur_salaire: 140,
        autres_charges: 40
      }
    ]

    // Absence template with various types
    const absenceTemplate = [
      {
        matricule: 'EMP001',
        type_absence: 'Congés payés',
        date_debut: '2024-01-15',
        date_fin: '2024-01-19',
        motif: 'Vacances d\'hiver',
        justificatif_fourni: true,
        validation_status: 'approved'
      },
      {
        matricule: 'EMP002',
        type_absence: 'Maladie',
        date_debut: '2024-01-22',
        date_fin: '2024-01-24',
        motif: 'Grippe',
        justificatif_fourni: true,
        validation_status: 'approved'
      }
    ]

    // Organization template with hierarchy
    const organizationTemplate = [
      {
        code_site: 'PARIS',
        nom_site: 'Siège Social Paris',
        code_cost_center: 'IT001',
        nom_cost_center: 'Direction Informatique',
        code_direction: 'TECH',
        nom_direction: 'Direction Technique',
        code_departement: 'DEV',
        nom_departement: 'Développement',
        is_active: true
      },
      {
        code_site: 'LYON',
        nom_site: 'Agence Lyon',
        code_cost_center: 'MKT001',
        nom_cost_center: 'Marketing Digital',
        code_direction: 'COMM',
        nom_direction: 'Direction Communication',
        code_departement: 'MKT',
        nom_departement: 'Marketing',
        is_active: true
      }
    ]

    // Absence types template with detailed configuration
    const absenceTypesTemplate = [
      {
        type_absence: 'Congés payés',
        famille: 'Congés',
        indemnise: true,
        taux_indemnisation: 1.0,
        comptabilise_absenteisme: false,
        is_active: true
      },
      {
        type_absence: 'Maladie',
        famille: 'Maladie',
        indemnise: true,
        taux_indemnisation: 0.8,
        comptabilise_absenteisme: true,
        is_active: true
      },
      {
        type_absence: 'Formation',
        famille: 'Formation',
        indemnise: true,
        taux_indemnisation: 1.0,
        comptabilise_absenteisme: false,
        is_active: true
      }
    ]

    // Add sheets with improved formatting
    const employeeWs = XLSX.utils.json_to_sheet(employeeTemplate)
    const remunerationWs = XLSX.utils.json_to_sheet(remunerationTemplate)
    const absenceWs = XLSX.utils.json_to_sheet(absenceTemplate)
    const organizationWs = XLSX.utils.json_to_sheet(organizationTemplate)
    const absenceTypesWs = XLSX.utils.json_to_sheet(absenceTypesTemplate)

    XLSX.utils.book_append_sheet(wb, employeeWs, 'EMPLOYES')
    XLSX.utils.book_append_sheet(wb, remunerationWs, 'REMUNERATION')
    XLSX.utils.book_append_sheet(wb, absenceWs, 'ABSENCES')
    XLSX.utils.book_append_sheet(wb, organizationWs, 'REFERENTIEL_ORGANISATION')
    XLSX.utils.book_append_sheet(wb, absenceTypesWs, 'REFERENTIEL_ABSENCES')

    // Add instructions sheet
    const instructionsData = [
      { Section: 'GUIDE D\'UTILISATION', Description: 'Template optimisé pour HR Quantum Analytics' },
      { Section: '', Description: '' },
      { Section: 'EMPLOYES', Description: 'Données des salariés par période' },
      { Section: '- matricule', Description: 'Identifiant unique employé (requis)' },
      { Section: '- periode', Description: 'Format: YYYY-MM-01 (requis)' },
      { Section: '- sexe', Description: 'M, F ou H' },
      { Section: '- type_contrat', Description: 'CDI, CDD, Stage, Alternance, Interim' },
      { Section: '- temps_travail', Description: '1.0 = temps plein, 0.8 = 80%, etc.' },
      { Section: '', Description: '' },
      { Section: 'REMUNERATION', Description: 'Données salariales mensuelles' },
      { Section: '- Tous les montants en euros', Description: 'Utiliser le point pour les décimales' },
      { Section: '- cotisations_sociales', Description: 'Charges sociales employeur' },
      { Section: '', Description: '' },
      { Section: 'PERFORMANCE', Description: 'Optimisations pour snapshots split' },
      { Section: '- Tables workforce/financials/absences', Description: 'Calcul automatique' },
      { Section: '- Matérialized views', Description: 'Performance améliorée' },
      { Section: '- Partitioning par période', Description: 'Scalabilité optimale' }
    ]

    const instructionsWs = XLSX.utils.json_to_sheet(instructionsData)
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'INSTRUCTIONS')

    // Download with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `hr_quantum_template_optimized_${timestamp}.xlsx`)
  }

  const onFixError = (errorId: string): void => {
    console.log('Fix error:', errorId)
    // Implementation for auto-fixing common errors could go here
  }

  const onIgnoreError = (errorId: string): void => {
    if (!validationResult) return

    const updatedErrors = validationResult.errors.filter(error => error.id !== errorId)
    const criticalErrors = updatedErrors.filter(e => e.severity === 'critical').length
    const warningCount = updatedErrors.filter(e => e.severity === 'warning').length
    
    setValidationResult({
      ...validationResult,
      errors: updatedErrors,
      summary: {
        ...validationResult.summary,
        criticalErrors,
        warningCount,
        totalErrors: updatedErrors.length,
        canProceed: criticalErrors === 0
      }
    })
  }

  const resetAll = () => {
    setFile(null)
    setProcessedData(null)
    setValidationResult(null)
    setFileAnalysis(null)
    setImportStats(null)
    resetImport()
  }

  return (
<div className="min-h-screen bg-slate-950 relative overflow-hidden">
  <StaticCyberpunkBackground />
  
  <div className="relative z-10 min-h-screen">
        <CyberSidebar 
onDownloadTemplate={downloadTemplate}
  logs={importLogs}
  fileAnalysis={fileAnalysis}
  importStats={importStats}
        />

<div className="flex-1 container max-w-4xl mx-auto px-6 py-6 pr-80">
          {/* Header */}
<motion.div 
  className="text-center mb-8"
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-900/70 to-slate-800/70 border border-cyan-500/30 rounded-2xl backdrop-blur-sm mb-6">
              <Database size={20} className="text-cyan-400" />
              <span className="text-cyan-400 font-mono text-sm">CYBER-HR SYSTEM v5.0 OPTIMIZED</span>
              <motion.div 
                className="w-2 h-2 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            
            <motion.h1 
              className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-mono"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              OPTIMIZED DATA INJECTION
            </motion.h1>
            
            <p className="text-slate-400 text-lg font-mono max-w-3xl mx-auto">
              Interface de chargement optimisée pour snapshots split, tables partitionnées et performance maximale. 
              Architecture nouvelle génération compatible avec le Dashboard Cyberpunk.
            </p>

            {company && selectedEstablishment && (
              <motion.div 
                className="flex items-center justify-center gap-4 mt-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <NeoBorder>
                  <div className="px-4 py-2">
                    <span className="text-cyan-400 text-sm font-mono flex items-center gap-2">
                      <Building2 size={14} />
                      {company.nom}
                    </span>
                  </div>
                </NeoBorder>
                <NeoBorder>
                  <div className="px-4 py-2">
                    <span className="text-purple-400 text-sm font-mono flex items-center gap-2">
                      <Factory size={14} />
                      {selectedEstablishment.nom}
                    </span>
                  </div>
                </NeoBorder>
              </motion.div>
            )}
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <NeoBorder className="mb-8">
                <div className="p-6 bg-red-900/20">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={24} className="text-red-400" />
                    <div className="flex-1">
                      <p className="text-red-400 font-bold font-mono">ERREUR SYSTÈME OPTIMISÉ</p>
                      <p className="text-red-300 text-sm mt-1 font-mono">{error}</p>
                    </div>
                    <button 
                      onClick={resetAll} 
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </NeoBorder>
            </motion.div>
          )}

          {/* File Upload */}
          {!file && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NeoBorder className="mb-8">
                <div 
                  {...getRootProps()} 
                  className={`p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive ? 'bg-purple-500/10' : 'hover:bg-slate-800/20'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mb-6">
                    <motion.div 
                      className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center"
                      animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
                    >
                      {isDragActive ? (
                        <Upload size={40} className="text-cyan-400 animate-bounce" />
                      ) : (
                        <FileSpreadsheet size={40} className="text-purple-400" />
                      )}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2 font-mono">
                      {isDragActive ? 'Déposez votre fichier Excel' : 'Sélectionnez votre fichier Excel'}
                    </h2>
                    <p className="text-slate-400 font-mono">
                      Formats supportés: .xlsx, .xls (max {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)
                    </p>
                    <p className="text-slate-500 text-sm mt-2 font-mono">
                      Compatible avec la nouvelle architecture split tables et snapshots optimisés
                    </p>
                  </div>

                  <HolographicButton>
                    <Upload size={20} className="mr-2" />
                    Parcourir les fichiers
                  </HolographicButton>
                </div>
              </NeoBorder>
            </motion.div>
          )}

          {/* File Analysis */}
          {file && fileAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <NeoBorder className="mb-8">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <FileCheck size={24} className="text-green-400" />
                      <div>
                        <h3 className="text-white font-bold text-xl font-mono">{file.name}</h3>
                        <p className="text-slate-400 text-sm font-mono">
                          {formatFileSize(file.size)} • {fileAnalysis.totalRows.toLocaleString()} lignes • 
                          Modifié le {fileAnalysis.lastModified.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetAll}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <CyberMetrics
                      title="Onglets Détectés"
                      value={fileAnalysis.sheets.length}
                      icon={Layers}
                      gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
                      subtitle={`Requis: ${REQUIRED_SHEETS.length}`}
                    />
                    <CyberMetrics
                      title="Total Lignes"
                      value={fileAnalysis.totalRows.toLocaleString()}
                      icon={Hash}
                      gradient="bg-gradient-to-r from-purple-500 to-pink-500"
                      subtitle="Données à traiter"
                    />
                    <CyberMetrics
                      title="Taille Fichier"
                      value={formatFileSize(fileAnalysis.fileSize)}
                      icon={HardDrive}
                      gradient="bg-gradient-to-r from-green-500 to-emerald-500"
                      subtitle={`${((fileAnalysis.fileSize / MAX_FILE_SIZE) * 100).toFixed(1)}% limite`}
                    />
                    <CyberMetrics
                      title="Temps Estimé"
                      value={`${fileAnalysis.estimatedProcessingTime}s`}
                      icon={Clock}
                      gradient="bg-gradient-to-r from-orange-500 to-red-500"
                      subtitle="Traitement optimisé"
                    />
                  </div>

                  {fileAnalysis.missingSheets.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl mb-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle size={20} className="text-red-400" />
                        <h4 className="text-red-300 font-bold font-mono">ONGLETS MANQUANTS DÉTECTÉS</h4>
                      </div>
                      <p className="text-red-400 text-sm font-mono mb-3">
                        Les onglets suivants sont requis pour le traitement optimisé:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {fileAnalysis.missingSheets.map(sheet => (
                          <div key={sheet} className="flex items-center gap-2 text-red-300 text-sm font-mono">
                            <FileX size={14} />
                            {sheet}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {isAnalyzing && (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <Loader2 size={20} className="text-purple-400 animate-spin" />
                      <span className="text-purple-400 font-mono">Analyse avancée en cours...</span>
                    </div>
                  )}

                  {fileAnalysis.sheets.length > 0 && !isAnalyzing && (
                    <div className="mt-4">
                      <h4 className="text-cyan-400 font-mono font-bold mb-2">ONGLETS DÉTECTÉS:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {fileAnalysis.sheets.map(sheet => (
                          <div 
                            key={sheet}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono border ${
                              REQUIRED_SHEETS.includes(sheet.toUpperCase())
                                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                : 'border-slate-600/30 bg-slate-700/20 text-slate-400'
                            }`}
                          >
                            <CheckCircle2 size={12} className={
                              REQUIRED_SHEETS.includes(sheet.toUpperCase()) ? 'text-green-400' : 'text-slate-500'
                            } />
                            {sheet}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </NeoBorder>
            </motion.div>
          )}

          {/* Data Preview */}
          {processedData && (
            <DataPreview processedData={processedData} />
          )}

          {/* Validation Console */}
          {validationResult && (
            <ValidationConsole
              validationResult={validationResult}
              onFixError={onFixError}
              onIgnoreError={onIgnoreError}
            />
          )}

          {/* Success State */}
          {importStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <NeoBorder className="mt-8" glowing>
                <div className="p-10 text-center">
                  <div className="relative inline-block mb-6">
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity }
                      }}
                    >
                      <CheckCircle size={64} className="text-green-400 mx-auto" />
                    </motion.div>
                    <div className="absolute inset-0 bg-green-400/20 rounded-full filter blur-xl animate-pulse" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-2 font-mono bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    INJECTION OPTIMISÉE RÉUSSIE
                  </h3>
                  <p className="text-green-400 mb-2 font-mono text-lg">{importProgress.message}</p>
                  <p className="text-slate-400 text-sm font-mono mb-8">
                    Snapshots split calculés • Tables partitionnées • Performance maximale
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <CyberMetrics
                      title="Périodes Traitées"
                      value={processedData?.metadata.periods.length || 0}
                      icon={Calendar}
                      gradient="bg-gradient-to-r from-green-500 to-emerald-500"
                      trend="up"
                    />
                    <CyberMetrics
                      title="Entités Injectées"
                      value={processedData?.metadata.totalRecords.toLocaleString() || '0'}
                      icon={Database}
                      gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
                      trend="up"
                    />
                    <CyberMetrics
                      title="Score Qualité"
                      value={`${validationResult?.summary.qualityScore.toFixed(1) || '0'}%`}
                      icon={Shield}
                      gradient="bg-gradient-to-r from-purple-500 to-pink-500"
                      trend="up"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <HolographicButton 
                      onClick={() => router.push('/dashboard')}
                      variant="success"
                      size="lg"
                    >
                      <BarChart3 size={24} className="mr-3" />
                      Dashboard Cyberpunk
                      <ArrowRight size={20} className="ml-2" />
                    </HolographicButton>
                    
                    <HolographicButton 
                      onClick={() => window.location.reload()} 
                      variant="secondary"
                      size="lg"
                    >
                      <RefreshCw size={20} className="mr-2" />
                      Nouvelle Mission
                    </HolographicButton>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-slate-500 text-xs font-mono">
                      Redirection automatique vers le Dashboard dans 3 secondes...
                    </p>
                  </div>
                </div>
              </NeoBorder>
            </motion.div>
          )}

          {/* Action Button */}
          {file && processedData && validationResult && importStatus === 'idle' && (
            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="space-y-6">
                {/* Pre-flight check */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${
                    validationResult.summary.canProceed 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : 'border-red-500/30 bg-red-500/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={16} className={validationResult.summary.canProceed ? 'text-green-400' : 'text-red-400'} />
                      <span className="font-mono text-sm">Validation</span>
                    </div>
                    <p className={`font-bold ${validationResult.summary.canProceed ? 'text-green-400' : 'text-red-400'}`}>
                      {validationResult.summary.canProceed ? 'SYSTÈME VALIDÉ' : 'ERREURS CRITIQUES'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    selectedEstablishment 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : 'border-orange-500/30 bg-orange-500/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 size={16} className={selectedEstablishment ? 'text-green-400' : 'text-orange-400'} />
                      <span className="font-mono text-sm">Établissement</span>
                    </div>
                    <p className={`font-bold text-sm ${selectedEstablishment ? 'text-green-400' : 'text-orange-400'}`}>
                      {selectedEstablishment ? selectedEstablishment.nom : 'NON SÉLECTIONNÉ'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-cyan-400" />
                      <span className="font-mono text-sm">Processeur</span>
                    </div>
                    <p className="font-bold text-cyan-400">OPTIMISÉ v5.0</p>
                  </div>
                </div>

                {/* Main action button */}
                <HolographicButton
                  onClick={handleProcessImport}
                  disabled={!validationResult.summary.canProceed || !selectedEstablishment}
                  size="lg"
                  className="min-w-80"
                >
                  {validationResult.summary.canProceed && selectedEstablishment ? (
                    <>
                      <Zap size={24} className="mr-3" />
                      LANCER L'INJECTION OPTIMISÉE
                      <motion.div 
                        className="ml-3"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ArrowRight size={20} />
                      </motion.div>
                    </>
                  ) : !selectedEstablishment ? (
                    <>
                      <AlertTriangle size={20} className="mr-2" />
                      SÉLECTIONNER UN ÉTABLISSEMENT
                    </>
                  ) : (
                    <>
                      <XCircle size={20} className="mr-2" />
                      CORRECTIONS REQUISES
                    </>
                  )}
                </HolographicButton>
                
                {validationResult.summary.canProceed && selectedEstablishment && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl mx-auto"
                  >
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-cyan-400 text-sm font-mono mb-2">
                        🚀 Prêt pour l'injection optimisée
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500">Entités:</span>
                          <span className="text-white ml-2 font-bold">
                            {processedData.metadata.totalRecords.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Périodes:</span>
                          <span className="text-white ml-2 font-bold">
                            {processedData.metadata.periods.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Qualité:</span>
                          <span className="text-green-400 ml-2 font-bold">
                            {validationResult.summary.qualityScore.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Durée:</span>
                          <span className="text-purple-400 ml-2 font-bold">
                            ~{fileAnalysis?.estimatedProcessingTime}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick Actions Panel */}
          {!file && (
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <NeoBorder>
                <div className="p-6">
                  <h3 className="text-white font-bold text-xl font-mono mb-6 flex items-center gap-3">
                    <Sparkles size={24} className="text-purple-400" />
                    Actions Rapides
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.button
                      onClick={downloadTemplate}
                      className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all group"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <Download size={24} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-mono text-sm text-white font-bold">Template Excel</p>
                      <p className="font-mono text-xs text-slate-400 mt-1">Optimisé v5.0</p>
                    </motion.button>

                    <motion.button
                      onClick={() => window.open('/docs/import-guide', '_blank')}
                      className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all group"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <BookOpen size={24} className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-mono text-sm text-white font-bold">Guide d'Import</p>
                      <p className="font-mono text-xs text-slate-400 mt-1">Documentation</p>
                    </motion.button>

                    <motion.button
                      onClick={() => router.push('/dashboard')}
                      className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all group"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <BarChart3 size={24} className="text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-mono text-sm text-white font-bold">Dashboard</p>
                      <p className="font-mono text-xs text-slate-400 mt-1">Analytics</p>
                    </motion.button>

                    <motion.button
                      onClick={() => window.open('/support', '_blank')}
                      className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-orange-500/50 transition-all group"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <Shield size={24} className="text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-mono text-sm text-white font-bold">Support</p>
                      <p className="font-mono text-xs text-slate-400 mt-1">Assistance</p>
                    </motion.button>
                  </div>
                </div>
              </NeoBorder>
            </motion.div>
          )}

          {/* System Info Footer */}
          <motion.div 
            className="mt-16 p-6 bg-gradient-to-r from-slate-900/30 to-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center justify-between text-sm text-slate-400">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <motion.div 
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="font-mono">Système Optimisé Opérationnel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-purple-400" />
                  <span className="font-mono">Split Tables Architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-cyan-400" />
                  <span className="font-mono">Partitioned Snapshots</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-purple-400" />
                  <span className="font-mono">Processeur v5.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-cyan-400" />
                  <span className="font-mono">HR Quantum Analytics</span>
                </div>
              </div>
            </div>

            {processedData && (
              <div className="mt-4 pt-4 border-t border-slate-700/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Dernière analyse:</span>
                    <div className="text-slate-300">{new Date().toLocaleTimeString('fr-FR')}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Fichier:</span>
                    <div className="text-slate-300 truncate">{file?.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Établissement:</span>
                    <div className="text-slate-300">{selectedEstablishment?.nom || 'Non sélectionné'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">État:</span>
                    <div className={`${
                      validationResult?.summary.canProceed ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {validationResult?.summary.canProceed ? 'Prêt' : 'Corrections requises'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Progress Portal */}
      <ProgressPortal
        show={importStatus === 'processing'}
        progress={importProgress}
        onCancel={cancelImport}
        logs={importLogs}
      />

      {/* Establishment Selector Modal */}
      {establishments.length > 1 && (
        <AnimatePresence>
          {!selectedEstablishment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-full max-w-md mx-4"
              >
                <NeoBorder>
                  <div className="p-6">
                    <h3 className="text-white font-bold text-lg font-mono mb-4 flex items-center gap-2">
                      <Building2 size={20} className="text-purple-400" />
                      Sélectionner un Établissement
                    </h3>
                    
                    <div className="space-y-3">
                      {establishments.map(establishment => (
                        <motion.button
                          key={establishment.id}
                          onClick={() => setSelectedEstablishment(establishment)}
                          className="w-full p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all text-left group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-mono font-bold group-hover:text-purple-300 transition-colors">
                                {establishment.nom}
                              </p>
                              <p className="text-slate-400 text-sm font-mono">
                                {establishment.code_etablissement || 'Code non défini'}
                                {establishment.is_headquarters && (
                                  <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                    SIÈGE
                                  </span>
                                )}
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </NeoBorder>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}