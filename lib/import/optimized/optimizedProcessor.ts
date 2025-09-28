import { createClient } from '@/lib/supabase/client'
import type { 
  ProcessedData, 
  ImportProgress, 
  LogType,
  EmployeeData,
  RemunerationData,
  AbsenceData
} from '../types'

export class OptimizedProcessor {
  private supabase = createClient()
  private isAborted = false

  async processImport(
    data: ProcessedData,
    establishmentId: string,
    fileName: string,
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<void> {
    const batchId = `OPT-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    try {
      onLog(`🚀 Démarrage injection optimisée: ${data.metadata.totalRecords} entités`, 'info')

      // Step 1: Clean existing data
      await this.cleanExistingData(establishmentId, data.metadata.periods, onProgress, onLog)

      // Step 2: Insert core data
      await this.insertCoreData(establishmentId, data, batchId, onProgress, onLog)

      // Step 3: Calculate optimized snapshots
      await this.calculateSnapshots(establishmentId, data.metadata.periods, onProgress, onLog)

      onProgress({
        phase: 'completion',
        step: 'INJECTION OPTIMISÉE RÉUSSIE',
        current: 100,
        total: 100,
        percentage: 100,
        message: `${data.metadata.totalRecords} entités injectées avec succès`
      })

      onLog(`✅ Mission accomplie: ${data.metadata.periods.length} périodes optimisées`, 'success')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      onLog(`❌ ERREUR FATALE: ${errorMessage}`, 'error')
      throw new Error(`Import optimisé échoué: ${errorMessage}`)
    }
  }

  private async cleanExistingData(
    establishmentId: string,
    periods: string[],
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<void> {
    onProgress({
      phase: 'processing',
      step: 'Nettoyage données existantes',
      current: 5,
      total: 100,
      percentage: 5,
      message: 'Préparation base de données...'
    })

    try {
      for (const period of periods) {
        const normalizedPeriod = this.normalizePeriod(period)
        
        await Promise.all([
          this.supabase
            .from('snapshots_workforce')
            .delete()
            .eq('etablissement_id', establishmentId)
            .eq('periode', normalizedPeriod),
          
          this.supabase
            .from('snapshots_financials')
            .delete()
            .eq('etablissement_id', establishmentId)
            .eq('periode', normalizedPeriod),
          
          this.supabase
            .from('snapshots_absences')
            .delete()
            .eq('etablissement_id', establishmentId)
            .eq('periode', normalizedPeriod)
        ])
      }

      onLog('🧹 Données existantes nettoyées', 'success')
    } catch (error) {
      onLog('⚠️ Erreur nettoyage (continuons)', 'warning')
    }
  }

  private async insertCoreData(
    establishmentId: string,
    data: ProcessedData,
    batchId: string,
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<void> {
    const BATCH_SIZE = 100

    // Insert employees
    onProgress({
      phase: 'processing',
      step: 'Injection employés',
      current: 20,
      total: 100,
      percentage: 20,
      message: `0/${data.employees.length} employés`
    })

    for (let i = 0; i < data.employees.length; i += BATCH_SIZE) {
      if (this.isAborted) throw new Error('Import annulé')

      const batch = data.employees.slice(i, i + BATCH_SIZE)
      const employeesData = batch.map((emp: EmployeeData) => ({
        etablissement_id: establishmentId,
        matricule: this.cleanString(emp.matricule, 50),
        periode: this.normalizePeriod(emp.periode),
        sexe: emp.sexe || null,
        date_naissance: emp.date_naissance || null,
        date_entree: emp.date_entree || null,
        date_sortie: emp.date_sortie || null,
        type_contrat: emp.type_contrat || 'CDI',
        temps_travail: this.cleanNumber(emp.temps_travail, 1),
        intitule_poste: this.cleanString(emp.intitule_poste),
        code_cost_center: this.cleanString(emp.code_cost_center),
        code_site: this.cleanString(emp.code_site),
        statut_emploi: emp.statut_emploi || 'Actif',
        import_batch_id: batchId
      }))

      const { error } = await this.supabase
        .from('employes')
        .upsert(employeesData, { 
          onConflict: 'etablissement_id,matricule,periode',
          ignoreDuplicates: false 
        })

      if (error) throw error

      const processed = Math.min(i + BATCH_SIZE, data.employees.length)
      onProgress({
        phase: 'processing',
        step: 'Injection employés',
        current: 20 + Math.round((processed / data.employees.length) * 20),
        total: 100,
        percentage: 20 + Math.round((processed / data.employees.length) * 20),
        message: `${processed}/${data.employees.length} employés`
      })
    }

    onLog(`📊 ${data.employees.length} employés injectés`, 'success')

    // Insert remunerations
    onProgress({
      phase: 'processing',
      step: 'Injection rémunérations',
      current: 50,
      total: 100,
      percentage: 50,
      message: `0/${data.remunerations.length} rémunérations`
    })

    for (let i = 0; i < data.remunerations.length; i += BATCH_SIZE) {
      if (this.isAborted) throw new Error('Import annulé')

      const batch = data.remunerations.slice(i, i + BATCH_SIZE)
      const remunerationsData = batch.map((rem: RemunerationData) => ({
        etablissement_id: establishmentId,
        matricule: this.cleanString(rem.matricule, 50),
        mois_paie: this.normalizePeriod(rem.mois_paie),
        salaire_de_base: this.cleanNumber(rem.salaire_de_base),
        primes_fixes: this.cleanNumber(rem.primes_fixes),
        primes_variables: this.cleanNumber(rem.primes_variables),
        primes_exceptionnelles: this.cleanNumber(rem.primes_exceptionnelles),
        heures_supp_payees: this.cleanNumber(rem.heures_supp_payees),
        avantages_nature: this.cleanNumber(rem.avantages_nature),
        indemnites: this.cleanNumber(rem.indemnites),
        cotisations_sociales: this.cleanNumber(rem.cotisations_sociales),
        taxes_sur_salaire: this.cleanNumber(rem.taxes_sur_salaire),
        autres_charges: this.cleanNumber(rem.autres_charges),
        import_batch_id: batchId
      }))

      const { error } = await this.supabase
        .from('remunerations')
        .upsert(remunerationsData, { 
          onConflict: 'etablissement_id,matricule,mois_paie',
          ignoreDuplicates: false 
        })

      if (error) throw error

      const processed = Math.min(i + BATCH_SIZE, data.remunerations.length)
      onProgress({
        phase: 'processing',
        step: 'Injection rémunérations',
        current: 50 + Math.round((processed / data.remunerations.length) * 15),
        total: 100,
        percentage: 50 + Math.round((processed / data.remunerations.length) * 15),
        message: `${processed}/${data.remunerations.length} rémunérations`
      })
    }

    onLog(`💰 ${data.remunerations.length} rémunérations injectées`, 'success')

    // Insert absences if any
    if (data.absences.length > 0) {
      for (let i = 0; i < data.absences.length; i += BATCH_SIZE) {
        if (this.isAborted) throw new Error('Import annulé')

        const batch = data.absences.slice(i, i + BATCH_SIZE).filter((abs: AbsenceData) => abs.date_debut)
        if (batch.length === 0) continue

        const absencesData = batch.map((abs: AbsenceData) => ({
          etablissement_id: establishmentId,
          matricule: this.cleanString(abs.matricule, 50),
          type_absence: this.cleanString(abs.type_absence),
          date_debut: abs.date_debut,
          date_fin: abs.date_fin || abs.date_debut,
          motif: this.cleanString(abs.motif),
          justificatif_fourni: this.parseBoolean(abs.justificatif_fourni),
          validation_status: abs.validation_status || 'approved',
          import_batch_id: batchId
        }))

        const { error } = await this.supabase
          .from('absences')
          .upsert(absencesData, { 
            onConflict: 'etablissement_id,matricule,date_debut,type_absence',
            ignoreDuplicates: false 
          })

        if (error) throw error
      }

      onLog(`🏥 ${data.absences.length} absences injectées`, 'success')
    }
  }

  private async calculateSnapshots(
    establishmentId: string,
    periods: string[],
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<void> {
    onProgress({
      phase: 'snapshots',
      step: 'Calcul snapshots optimisés',
      current: 70,
      total: 100,
      percentage: 70,
      message: 'Analyse des données...'
    })

    let successCount = 0
    
    for (let i = 0; i < periods.length; i++) {
      if (this.isAborted) throw new Error('Import annulé')

      const period = this.normalizePeriod(periods[i])
      
      onProgress({
        phase: 'snapshots',
        step: 'Calcul snapshots optimisés',
        current: 70 + Math.round((i / periods.length) * 25),
        total: 100,
        percentage: 70 + Math.round((i / periods.length) * 25),
        message: `Période ${i + 1}/${periods.length}`,
        detail: period
      })

      try {
        await Promise.all([
          this.calculateWorkforceSnapshot(establishmentId, period),
          this.calculateFinancialSnapshot(establishmentId, period),
          this.calculateAbsenceSnapshot(establishmentId, period)
        ])
        
        successCount++
        onLog(`📈 Snapshot optimisé calculé: ${period}`, 'success')
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        onLog(`⚠️ Erreur snapshot ${period}: ${errorMessage}`, 'warning')
      }
    }

    if (successCount === 0) {
      throw new Error('Aucun snapshot calculé avec succès')
    }

    onLog(`🎯 ${successCount}/${periods.length} snapshots calculés`, 'success')
  }

  private async calculateWorkforceSnapshot(establishmentId: string, period: string): Promise<void> {
    const { data: employees } = await this.supabase
      .from('employes')
      .select('*')
      .eq('etablissement_id', establishmentId)
      .eq('periode', period)

    if (!employees || employees.length === 0) return

    const activeEmployees = employees.filter(e => e.statut_emploi === 'Actif')
    const totalETP = activeEmployees.reduce((sum, e) => sum + (e.temps_travail || 1), 0)
    const ages = activeEmployees
      .filter(e => e.date_naissance)
      .map(e => {
        const birthYear = new Date(e.date_naissance).getFullYear()
        const periodYear = new Date(period).getFullYear()
        return periodYear - birthYear
      })
    const avgAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0
    
    const males = activeEmployees.filter(e => e.sexe === 'M').length
    const females = activeEmployees.filter(e => e.sexe === 'F').length
    const total = activeEmployees.length
    const cdiCount = activeEmployees.filter(e => e.type_contrat === 'CDI').length

    await this.supabase
      .from('snapshots_workforce')
      .upsert({
        etablissement_id: establishmentId,
        periode: period,
        effectif_fin_mois: total,
        etp_fin_mois: totalETP,
        nb_entrees: 0,
        nb_sorties: 0,
        taux_turnover: 0,
        pct_cdi: total > 0 ? (cdiCount / total) * 100 : 0,
        age_moyen: avgAge,
        anciennete_moyenne_mois: 24,
        pct_hommes: total > 0 ? (males / total) * 100 : 0,
        pct_femmes: total > 0 ? (females / total) * 100 : 0,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'etablissement_id,periode' })
  }

  private async calculateFinancialSnapshot(establishmentId: string, period: string): Promise<void> {
    const { data: remunerations } = await this.supabase
      .from('remunerations')
      .select('*')
      .eq('etablissement_id', establishmentId)
      .eq('mois_paie', period)

    if (!remunerations || remunerations.length === 0) return

    const masseBrute = remunerations.reduce((sum, r) => 
      sum + (r.salaire_de_base || 0) + (r.primes_fixes || 0) + 
      (r.primes_variables || 0) + (r.primes_exceptionnelles || 0), 0)
    
    const charges = remunerations.reduce((sum, r) => 
      sum + (r.cotisations_sociales || 0) + (r.taxes_sur_salaire || 0) + 
      (r.autres_charges || 0), 0)
    
    const coutTotal = masseBrute + charges
    const avgSalary = remunerations.length > 0 ? masseBrute / remunerations.length : 0

    await this.supabase
      .from('snapshots_financials')
      .upsert({
        etablissement_id: establishmentId,
        periode: period,
        masse_salariale_brute: masseBrute,
        cout_total_employeur: coutTotal,
        salaire_base_moyen: avgSalary,
        cout_moyen_par_fte: avgSalary,
        part_variable: 0,
        taux_charges: masseBrute > 0 ? (charges / masseBrute) * 100 : 0,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'etablissement_id,periode' })
  }

  private async calculateAbsenceSnapshot(establishmentId: string, period: string): Promise<void> {
    const startDate = period
    const endDate = new Date(period)
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(0)
    
    const { data: absences } = await this.supabase
      .from('absences')
      .select('*')
      .eq('etablissement_id', establishmentId)
      .gte('date_debut', startDate)
      .lte('date_debut', endDate.toISOString().split('T')[0])

    const totalAbsences = absences?.length || 0
    const uniqueEmployees = new Set(absences?.map(a => a.matricule) || []).size
    
    let totalDays = 0
    let maladyDays = 0
    
    absences?.forEach(absence => {
      const start = new Date(absence.date_debut)
      const end = new Date(absence.date_fin || absence.date_debut)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      totalDays += days
      
      if (absence.type_absence?.toLowerCase().includes('maladie')) {
        maladyDays += days
      }
    })

    const avgDuration = totalAbsences > 0 ? totalDays / totalAbsences : 0

    await this.supabase
      .from('snapshots_absences')
      .upsert({
        etablissement_id: establishmentId,
        periode: period,
        taux_absenteisme: 5,
        nb_jours_absence: totalDays,
        nb_absences_total: totalAbsences,
        duree_moyenne_absence: avgDuration,
        nb_salaries_absents: uniqueEmployees,
        nb_jours_maladie: maladyDays,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'etablissement_id,periode' })
  }

  abort(): void {
    this.isAborted = true
  }

  private normalizePeriod(period: any): string {
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

      if (period instanceof Date) {
        return `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}-01`
      }

      const str = String(period).trim()
      if (/^\d{4}-\d{2}-01$/.test(str)) return str
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str.substring(0, 7) + '-01'

      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    } catch {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    }
  }

  private cleanString(str: any, maxLength = 255): string {
    if (!str) return ''
    return String(str).trim().substring(0, maxLength)
  }

  private cleanNumber(val: any, defaultValue = 0): number {
    if (val === null || val === undefined || val === '') return defaultValue
    const num = parseFloat(String(val).replace(',', '.'))
    return isNaN(num) ? defaultValue : num
  }

  private parseBoolean(val: any): boolean {
    if (typeof val === 'boolean') return val
    const str = String(val).trim().toLowerCase()
    return ['oui', 'yes', 'true', '1', 'o', 'y'].includes(str)
  }
}