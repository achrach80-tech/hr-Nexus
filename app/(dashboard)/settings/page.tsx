'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Settings as SettingsIcon,
  Building2,
  User,
  Bell,
  Shield,
  CreditCard,
  Save,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    nom: '',
    siret: '',
    adresse_siege: '',
    ville: '',
    code_postal: '',
    pays: 'France'
  })

  useEffect(() => {
    loadCompanyData()
  }, [])

  const loadCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: companyData } = await supabase
        .from('etablissements')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (companyData) {
        setCompany(companyData)
        setFormData({
          nom: companyData.nom || '',
          siret: companyData.siret || '',
          adresse_siege: companyData.adresse_siege || '',
          ville: companyData.ville || '',
          code_postal: companyData.code_postal || '',
          pays: companyData.pays || 'France'
        })
      }
    } catch (error) {
      console.error('Error loading company:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('etablissements')
        .update(formData)
        .eq('id', company.id)

      if (!error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Paramètres
        </h1>
        <p className="text-gray-400 mt-2">Gérez les paramètres de votre entreprise</p>
      </motion.div>

      {/* Company Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Building2 className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold">Informations de l'entreprise</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de l'entreprise</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SIRET</label>
            <input
              type="text"
              value={formData.siret}
              onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              maxLength={14}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Adresse du siège</label>
            <input
              type="text"
              value={formData.adresse_siege}
              onChange={(e) => setFormData({ ...formData, adresse_siege: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ville</label>
            <input
              type="text"
              value={formData.ville}
              onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Code postal</label>
            <input
              type="text"
              value={formData.code_postal}
              onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pays</label>
            <input
              type="text"
              value={formData.pays}
              onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saved ? 'Enregistré' : 'Enregistrer'}</span>
          </button>
        </div>
      </motion.div>

      {/* Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-semibold">Abonnement</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20">
          <div>
            <p className="font-semibold">Plan {company?.subscription_plan || 'Starter'}</p>
            <p className="text-sm text-gray-400 mt-1">Statut: {company?.subscription_status || 'Active'}</p>
          </div>
          <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            Changer de plan
          </button>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Alertes de turnover', enabled: true },
            { label: 'Rapports hebdomadaires', enabled: true },
            { label: 'Mises à jour système', enabled: false },
            { label: 'Conseils et astuces', enabled: false }
          ].map((item, index) => (
            <label key={index} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer">
              <span>{item.label}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  defaultChecked={item.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-cyan-500"></div>
              </div>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold">Sécurité</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <p className="font-medium">Changer le mot de passe</p>
            <p className="text-sm text-gray-400 mt-1">Dernière modification: Il y a 30 jours</p>
          </button>
          
          <button className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <p className="font-medium">Authentification à deux facteurs</p>
            <p className="text-sm text-gray-400 mt-1">Non activée</p>
          </button>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Recommandation de sécurité</p>
                <p className="text-xs text-gray-400 mt-1">
                  Activez l'authentification à deux facteurs pour renforcer la sécurité de votre compte
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}