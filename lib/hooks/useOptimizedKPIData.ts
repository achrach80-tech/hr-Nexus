'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WorkforceKPIs {
  etpTotal: number
  headcountActif: number
  nbEntrees: number
  nbSorties: number
  tauxTurnover: number
  pctCDI: number
  ageMoyen: number
  ancienneteMoyenne: number
  pctHommes: number
  pctFemmes: number
}

interface PayrollKPIs {
  masseBrute: number
  coutTotal: number
  salaireMoyen: number
  coutMoyenFTE: number
  partVariable: number
  tauxCharges: number
}

interface AbsenceKPIs {
  tauxAbsenteisme: number
  nbJoursAbsence: number
  nbAbsencesTotal: number
  dureeMoyenne: number
  nbSalariesAbsents: number
  nbJoursMaladie: number
}

interface OptimizedKPIData {
  workforce: WorkforceKPIs | null
  financials: PayrollKPIs | null
  absences: AbsenceKPIs | null
}

export const useOptimizedKPIData = (establishmentId: string, period: string) => {
  const [data, setData] = useState<OptimizedKPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Validate session before any data fetch
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const sessionStr = localStorage.getItem('company_session')
      if (!sessionStr) return false

      const session = JSON.parse(sessionStr)
      
      // Check expiry
      if (new Date(session.expires_at) < new Date()) {
        localStorage.removeItem('company_session')
        document.cookie = 'company_session=; path=/; max-age=0'
        return false
      }

      // Validate token
      const { data: validationResult } = await supabase
        .rpc('validate_access_token', { p_token: session.access_token })

      return validationResult?.[0]?.is_valid || false
    } catch {
      return false
    }
  }, [supabase])

  const fetchOptimizedKPIs = useCallback(async () => {
    if (!establishmentId || !period) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Validate session first
      const isValidSession = await validateSession()
      if (!isValidSession) {
        setError('Session expirée')
        window.location.href = '/login'
        return
      }

      // Parallel fetch from optimized snapshot tables
      const [workforceRes, financialRes, absenceRes] = await Promise.all([
        supabase
          .from('snapshots_workforce')
          .select(`
            effectif_fin_mois,
            etp_fin_mois,
            nb_entrees,
            nb_sorties,
            taux_turnover,
            pct_cdi,
            age_moyen,
            anciennete_moyenne_mois,
            pct_hommes,
            pct_femmes
          `)
          .eq('etablissement_id', establishmentId)
          .eq('periode', period)
          .maybeSingle(),
        
        supabase
          .from('snapshots_financials')
          .select(`
            masse_salariale_brute,
            cout_total_employeur,
            salaire_base_moyen,
            cout_moyen_par_fte,
            part_variable,
            taux_charges
          `)
          .eq('etablissement_id', establishmentId)
          .eq('periode', period)
          .maybeSingle(),
        
        supabase
          .from('snapshots_absences')
          .select(`
            taux_absenteisme,
            nb_jours_absence,
            nb_absences_total,
            duree_moyenne_absence,
            nb_salaries_absents,
            nb_jours_maladie
          `)
          .eq('etablissement_id', establishmentId)
          .eq('periode', period)
          .maybeSingle()
      ])

      // Check for any errors
      if (workforceRes.error) throw new Error(`Workforce data: ${workforceRes.error.message}`)
      if (financialRes.error) throw new Error(`Financial data: ${financialRes.error.message}`)
      if (absenceRes.error) throw new Error(`Absence data: ${absenceRes.error.message}`)

      // Transform data with safe null handling
      const transformedData: OptimizedKPIData = {
        workforce: workforceRes.data ? {
          etpTotal: Number(workforceRes.data.etp_fin_mois) || 0,
          headcountActif: Number(workforceRes.data.effectif_fin_mois) || 0,
          nbEntrees: Number(workforceRes.data.nb_entrees) || 0,
          nbSorties: Number(workforceRes.data.nb_sorties) || 0,
          tauxTurnover: Number(workforceRes.data.taux_turnover) || 0,
          pctCDI: Number(workforceRes.data.pct_cdi) || 0,
          ageMoyen: Number(workforceRes.data.age_moyen) || 0,
          ancienneteMoyenne: Number(workforceRes.data.anciennete_moyenne_mois) || 0,
          pctHommes: Number(workforceRes.data.pct_hommes) || 0,
          pctFemmes: Number(workforceRes.data.pct_femmes) || 0
        } : null,

        financials: financialRes.data ? {
          masseBrute: Number(financialRes.data.masse_salariale_brute) || 0,
          coutTotal: Number(financialRes.data.cout_total_employeur) || 0,
          salaireMoyen: Number(financialRes.data.salaire_base_moyen) || 0,
          coutMoyenFTE: Number(financialRes.data.cout_moyen_par_fte) || 0,
          partVariable: Number(financialRes.data.part_variable) || 0,
          tauxCharges: Number(financialRes.data.taux_charges) || 0
        } : null,

        absences: absenceRes.data ? {
          tauxAbsenteisme: Number(absenceRes.data.taux_absenteisme) || 0,
          nbJoursAbsence: Number(absenceRes.data.nb_jours_absence) || 0,
          nbAbsencesTotal: Number(absenceRes.data.nb_absences_total) || 0,
          dureeMoyenne: Number(absenceRes.data.duree_moyenne_absence) || 0,
          nbSalariesAbsents: Number(absenceRes.data.nb_salaries_absents) || 0,
          nbJoursMaladie: Number(absenceRes.data.nb_jours_maladie) || 0
        } : null
      }

      setData(transformedData)

      // Update last activity timestamp
      const session = JSON.parse(localStorage.getItem('company_session') || '{}')
      if (session.company_id) {
        await supabase
          .from('entreprises')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', session.company_id)
          .then(() => {}) // Ignore errors for activity tracking
      }

    } catch (err) {
      console.error('KPI fetch error:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement des données')
    } finally {
      setLoading(false)
    }
  }, [establishmentId, period, supabase, validateSession])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchOptimizedKPIs()
  }, [fetchOptimizedKPIs])

  // Return data with refresh capability
  return { 
    data, 
    loading, 
    error, 
    refresh: fetchOptimizedKPIs,
    isValid: data !== null 
  }
}