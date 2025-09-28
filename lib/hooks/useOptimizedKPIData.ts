'use client'

import { useState, useEffect } from 'react'
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

interface KPIData {
  workforce: WorkforceKPIs | null
  financials: PayrollKPIs | null
  absences: AbsenceKPIs | null
}

export const useOptimizedKPIData = (establishmentId: string, period: string) => {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!establishmentId || !period) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [workforceRes, financialRes, absenceRes] = await Promise.all([
          supabase
            .from('snapshots_effectifs')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', period)
            .maybeSingle(),
          
          supabase
            .from('snapshots_masse_salariale')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', period)
            .maybeSingle(),
          
          supabase
            .from('snapshots_absenteisme')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', period)
            .maybeSingle()
        ])

        setData({
          workforce: workforceRes.data ? {
            etpTotal: workforceRes.data.etp_fin_mois || 0,
            headcountActif: workforceRes.data.effectif_fin_mois || 0,
            nbEntrees: workforceRes.data.nb_entrees || 0,
            nbSorties: workforceRes.data.nb_sorties || 0,
            tauxTurnover: workforceRes.data.taux_turnover || 0,
            pctCDI: workforceRes.data.pct_cdi || 0,
            ageMoyen: workforceRes.data.age_moyen || 0,
            ancienneteMoyenne: workforceRes.data.anciennete_moyenne_mois || 0,
            pctHommes: workforceRes.data.pct_hommes || 0,
            pctFemmes: workforceRes.data.pct_femmes || 0
          } : null,
          financials: financialRes.data ? {
            masseBrute: financialRes.data.masse_salariale_brute || 0,
            coutTotal: financialRes.data.cout_total_employeur || 0,
            salaireMoyen: financialRes.data.salaire_base_moyen || 0,
            coutMoyenFTE: financialRes.data.cout_moyen_par_fte || 0,
            partVariable: financialRes.data.part_variable || 0,
            tauxCharges: financialRes.data.taux_charges || 0
          } : null,
          absences: absenceRes.data ? {
            tauxAbsenteisme: absenceRes.data.taux_absenteisme || 0,
            nbJoursAbsence: absenceRes.data.nb_jours_absence || 0,
            nbAbsencesTotal: absenceRes.data.nb_absences_total || 0,
            dureeMoyenne: absenceRes.data.duree_moyenne_absence || 0,
            nbSalariesAbsents: absenceRes.data.nb_salaries_absents || 0,
            nbJoursMaladie: absenceRes.data.nb_jours_maladie || 0
          } : null
        })

      } catch (err) {
        console.error('KPI fetch error:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [establishmentId, period, supabase])

  return { data, loading, error }
}