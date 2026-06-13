import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Spinner'
import { Sparkles } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        )
        if (error) throw error
        navigate('/app', { replace: true })
      } catch (err) {
        console.error('Auth callback error:', err)
        navigate('/?error=auth_failed', { replace: true })
      }
    }
    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={20} className="text-[var(--accent-primary)]" />
        <span className="font-bold text-[var(--text-primary)]">PSAdvisor</span>
      </div>
      <Spinner size="lg" />
      <p className="text-[var(--text-secondary)] text-sm">Signing you in...</p>
    </div>
  )
}
