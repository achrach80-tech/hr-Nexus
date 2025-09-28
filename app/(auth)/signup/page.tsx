'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Sparkles, Building2, Mail, Lock, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    siret: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [companyCode, setCompanyCode] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const generateCompanyCode = (): string => {
    // Generate unique 8-character code: XXX-YYYY where XXX is letters, YYYY is numbers
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    
    // 3 letters
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    
    code += '-'
    
    // 4 numbers
    code += Math.floor(1000 + Math.random() * 9000).toString()
    
    return code
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Step 1: Validate company name
    if (step === 1) {
      if (!formData.companyName.trim()) {
        setError('Le nom de l\'entreprise est requis')
        return
      }
      setStep(2)
      setError(null)
      return
    }

    // Step 2: Create account
    setIsLoading(true)
    setError(null)

    try {
      // Generate unique company code
      const uniqueCode = generateCompanyCode()
      
      console.log('Creating account with company code:', uniqueCode)

      // Create user account WITHOUT email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // No email confirmation
          data: {
            company_name: formData.companyName,
            company_code: uniqueCode
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Cet email est déjà utilisé')
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte')
      }

      console.log('User created:', authData.user.id)

      // Sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        console.log('Auto sign-in failed, user needs to verify email')
        // Email confirmation is required by Supabase
        setSuccess(true)
        setCompanyCode(uniqueCode)
        return
      }

      // Create company (main account with unique code) - UPDATED VERSION
      const { data: company, error: companyError } = await supabase
        .from('entreprises')
        .insert({
          nom: formData.companyName,
          code_entreprise: uniqueCode,
          user_id: authData.user.id, // Proper foreign key
          siret: formData.siret || null,
          subscription_plan: 'starter',
          subscription_status: 'active',
          billing_email: formData.email,
          max_establishments: 5,
          max_employees: 100
        })
        .select()
        .single()

      if (companyError) {
        console.error('Company creation error:', companyError)
        throw new Error('Erreur lors de la création de l\'entreprise')
      }

      console.log('Company created:', company)

      // Create default establishment
      const { data: establishment, error: establishmentError } = await supabase
        .from('etablissements')
        .insert({
          entreprise_id: company.id,
          nom: formData.companyName + ' - Siège',
          code_etablissement: 'SIEGE',
          is_default: true,
          is_headquarters: true,
          statut: 'Actif'
        })
        .select()
        .single()

      if (establishmentError) {
        console.error('Establishment creation error:', establishmentError)
        throw new Error('Erreur lors de la création de l\'établissement')
      }

      console.log('Default establishment created:', establishment)

      // Setup referentials automatically
      const { error: refError } = await supabase.rpc('setup_establishment_referentials', {
        p_etablissement_id: establishment.id
      })

      if (refError) {
        console.log('Referentials setup warning:', refError)
        // Don't throw error - this is not critical
      }

      // Success - redirect to import
      setSuccess(true)
      setCompanyCode(uniqueCode)
      
      setTimeout(() => {
        router.push('/import')
      }, 3000)

    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }

  const prevStep = () => {
    if (step === 2) {
      setStep(1)
      setError(null)
    }
  }

  // Success screen
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '48px 40px',
          textAlign: 'center'
        }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#ffffff'
          }}>
            Compte créé avec succès!
          </h1>
          
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#a78bfa', fontSize: '14px', marginBottom: '8px' }}>
              Votre code d'entreprise unique:
            </p>
            <p style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '2px'
            }}>
              {companyCode}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>
              Conservez ce code, il sera nécessaire pour inviter des collaborateurs
            </p>
          </div>

          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            Si la vérification email est activée, vérifiez votre boîte mail.<br/>
            Sinon, vous serez redirigé automatiquement.
          </p>

          <Link
            href="/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              borderRadius: '10px',
              color: 'white',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '48px 40px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={28} color="white" />
              </div>
              <span style={{
                fontSize: '28px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                RH Quantum
              </span>
            </div>
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
            color: '#ffffff'
          }}>
            Créez votre compte
          </h1>
          <p style={{
            color: '#9ca3af',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            {step === 1 ? 'Informations de votre entreprise' : 'Vos identifiants'}
          </p>

          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', gap: '8px' }}>
            <div style={{
              width: '40px',
              height: '4px',
              background: step >= 1 ? 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px'
            }} />
            <div style={{
              width: '40px',
              height: '4px',
              background: step >= 2 ? 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px'
            }} />
          </div>

          <form onSubmit={handleSignup}>
            {step === 1 ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#e5e7eb'
                  }}>
                    <Building2 size={16} color="#9ca3af" />
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Votre Entreprise"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#e5e7eb'
                  }}>
                    SIRET (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    placeholder="12345678901234"
                    maxLength={14}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {error && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    color: '#f87171',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Continuer
                  <ArrowRight size={20} />
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#e5e7eb'
                  }}>
                    <Mail size={16} color="#9ca3af" />
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vous@entreprise.com"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#e5e7eb'
                  }}>
                    <Lock size={16} color="#9ca3af" />
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 8 caractères"
                      minLength={8}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    color: '#f87171',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={prevStep}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ArrowLeft size={20} />
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: isLoading 
                        ? 'rgba(139, 92, 246, 0.5)' 
                        : 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} />
                        Création...
                      </>
                    ) : (
                      'Créer le compte'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Déjà un compte?{' '}
              <Link 
                href="/login" 
                style={{
                  color: '#a78bfa',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}