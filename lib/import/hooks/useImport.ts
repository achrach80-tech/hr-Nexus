'use client'

import { useState, useCallback, useRef } from 'react'
import { OptimizedProcessor } from '../optimized/optimizedProcessor'
import type { 
  ProcessedData, 
  ImportProgress, 
  ValidationResult, 
  Establishment,
  LogType 
} from '../types'

export const useImport = () => {
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    phase: 'validation',
    step: '',
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  })
  const [importLogs, setImportLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const processorRef = useRef<OptimizedProcessor | null>(null)

  const addLog = useCallback((message: string, type: LogType = 'info'): void => {
    const timestamp = new Date().toLocaleTimeString('fr-FR')
    const icons: Record<LogType, string> = { 
      info: 'ℹ️', 
      success: '✅', 
      warning: '⚠️', 
      error: '❌' 
    }
    const formattedMessage = `${timestamp} ${icons[type]} ${message}`
    setImportLogs(prev => [...prev, formattedMessage])
  }, [])

  const processImport = useCallback(async (
    processedData: ProcessedData,
    selectedEstablishment: Establishment,
    fileName: string,
    validationResult: ValidationResult
  ): Promise<void> => {
    if (!validationResult?.summary?.canProceed) {
      setError('Validation échouée - corrections requises')
      return
    }

    try {
      setImportStatus('processing')
      setError(null)
      setImportLogs([])
      
      processorRef.current = new OptimizedProcessor()
      
      await processorRef.current.processImport(
        processedData,
        selectedEstablishment.id,
        fileName,
        setImportProgress,
        addLog
      )

      setImportStatus('success')
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)

    } catch (error) {
      console.error('Import error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur système'
      setError(errorMessage)
      setImportStatus('error')
      addLog(errorMessage, 'error')
    }
  }, [addLog])

  const cancelImport = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.abort()
    }
    setImportStatus('idle')
    addLog('Import annulé par l\'utilisateur', 'warning')
  }, [addLog])

  const resetImport = useCallback(() => {
    setImportStatus('idle')
    setImportProgress({
      phase: 'validation',
      step: '',
      current: 0,
      total: 0,
      percentage: 0,
      message: ''
    })
    setImportLogs([])
    setError(null)
    processorRef.current = null
  }, [])

  return {
    importStatus,
    importProgress,
    importLogs,
    error,
    processImport,
    cancelImport,
    resetImport,
    addLog
  }
}