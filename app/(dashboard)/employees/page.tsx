'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase
} from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'

interface Employee {
  id: string
  matricule: string
  nom: string
  prenom: string
  nom_complet: string
  sexe: string
  date_naissance: string
  age: number
  date_entree: string
  anciennete_mois: number
  type_contrat: string
  temps_travail: number
  intitule_poste: string
  statut_emploi: string
  salaire_base_mensuel: number
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterContract, setFilterContract] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: company } = await supabase
        .from('etablissements')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!company) return

      const { data: employeesData, error } = await supabase
        .from('employes')
        .select('*')
        .eq('etablissement_id', company.id)
        .order('nom', { ascending: true })

      if (!error && employeesData) {
        setEmployees(employeesData)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.intitule_poste?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterContract === 'all' || employee.type_contrat === filterContract
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement des employés...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Employés
          </h1>
          <p className="text-gray-400 mt-2">
            {employees.length} employés dans votre entreprise
          </p>
        </div>
        <button className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Ajouter un employé</span>
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule ou poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <select
          value={filterContract}
          onChange={(e) => setFilterContract(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="all">Tous les contrats</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="Alternance">Alternance</option>
          <option value="Stage">Stage</option>
        </select>
        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Plus de filtres</span>
        </button>
      </motion.div>

      {/* Employees Grid */}
      {filteredEmployees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
        >
          <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucun employé trouvé</p>
          <p className="text-sm text-gray-500 mt-2">
            Importez vos données ou ajoutez un employé pour commencer
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {employee.prenom?.charAt(0)}{employee.nom?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{employee.nom_complet}</h3>
                    <p className="text-xs text-gray-400">#{employee.matricule}</p>
                  </div>
                </div>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Briefcase className="w-4 h-4" />
                  <span>{employee.intitule_poste || 'Non défini'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Building className="w-4 h-4" />
                  <span>{employee.type_contrat}</span>
                  {employee.temps_travail < 1 && (
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded">
                      {(employee.temps_travail * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Depuis {formatDate(employee.date_entree)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(employee.statut_emploi)}`}>
                  {employee.statut_emploi}
                </span>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}