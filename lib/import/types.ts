export interface ProcessedData {
  employees: EmployeeData[]
  remunerations: RemunerationData[]
  absences: AbsenceData[]
  referentiel_organisation: OrganizationData[]
  referentiel_absences: AbsenceTypeData[]
  metadata: ImportMetadata
}

export interface EmployeeData {
  matricule: string
  periode: string
  sexe?: string | null
  date_naissance?: string | null
  date_entree?: string | null
  date_sortie?: string | null
  type_contrat?: string
  temps_travail?: number
  intitule_poste?: string
  code_cost_center?: string
  code_site?: string
  statut_emploi?: string
}

export interface RemunerationData {
  matricule: string
  mois_paie: string
  salaire_de_base?: number
  primes_fixes?: number
  primes_variables?: number
  primes_exceptionnelles?: number
  heures_supp_payees?: number
  avantages_nature?: number
  indemnites?: number
  cotisations_sociales?: number
  taxes_sur_salaire?: number
  autres_charges?: number
}

export interface AbsenceData {
  matricule: string
  type_absence: string
  date_debut: string
  date_fin?: string | null
  motif?: string
  justificatif_fourni?: boolean
  validation_status?: string
}

export interface OrganizationData {
  code_site: string
  nom_site: string
  code_cost_center: string
  nom_cost_center: string
  code_direction?: string
  nom_direction?: string
  code_departement?: string
  nom_departement?: string
  is_active?: boolean
}

export interface AbsenceTypeData {
  type_absence: string
  famille?: string
  indemnise?: boolean
  taux_indemnisation?: number
  comptabilise_absenteisme?: boolean
  is_active?: boolean
}

export interface ImportMetadata {
  periods: string[]
  totalEmployees: number
  totalRecords: number
  establishments: string[]
}

export interface ImportProgress {
  phase: 'validation' | 'processing' | 'snapshots' | 'completion' | 'error'
  step: string
  current: number
  total: number
  percentage: number
  message: string
  detail?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: ValidationSummary
}

export interface ValidationError {
  id: string
  sheet: string
  row: number
  column: string
  field: string
  value: any
  message: string
  severity: 'critical' | 'warning' | 'info'
  canIgnore: boolean
}

export interface ValidationSummary {
  totalErrors: number
  criticalErrors: number
  warningCount: number
  canProceed: boolean
  qualityScore: number
}

export interface Company {
  id: string
  nom: string
  subscription_plan?: string
}

export interface Establishment {
  id: string
  entreprise_id: string
  nom: string
  code_etablissement?: string
  is_headquarters?: boolean
  statut?: string
}

export type LogType = 'info' | 'success' | 'warning' | 'error'