import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Moon, Sun, Monitor, LogOut, User, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { API_BASE } from '../lib/supabase'

const THEMES = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
]

const MODELS = [
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Recommended)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
]

function Section({ title, children }) {
  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-2 border-b border-[var(--border-subtle)]">
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, profile, token, signOut, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const currentTheme = profile?.theme || 'dark'
  const currentModel = profile?.default_model || 'gemini-2.5-flash-lite'

  const updateProfile = async (updates) => {
    if (!token) return
    setSaving(true)
    try {
      await fetch(`${API_BASE}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Call supabase directly via our backend profile update
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        await fetchProfile(token)
        toast.success('Settings saved!')
      }
    } catch (e) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <button onClick={() => navigate('/app')} className="btn-ghost p-1.5">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h1>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-5">
        {/* Account */}
        <Section title="Account">
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-lg font-bold">
                {(user?.user_metadata?.full_name || 'U')[0]}
              </div>
            )}
            <div>
              <p className="font-medium text-[var(--text-primary)]">{user?.user_metadata?.full_name || 'User'}</p>
              <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-secondary w-full mt-2 text-[var(--danger)] border-[var(--danger)]/30 hover:border-[var(--danger)]">
            <LogOut size={14} />
            Sign Out
          </button>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] block mb-3">Theme</label>
            <div className="flex gap-2">
              {THEMES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => updateProfile({ theme: id })}
                  className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-card border text-xs font-medium transition-all
                    ${currentTheme === id
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
                    }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Default Model */}
        <Section title="Default Model">
          <div className="space-y-2">
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => updateProfile({ default_model: m.id })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-card border text-sm transition-all
                  ${currentModel === m.id
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} />
                  <span className="font-medium">{m.label}</span>
                </div>
                {currentModel === m.id && <span className="text-xs">✓ Active</span>}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
