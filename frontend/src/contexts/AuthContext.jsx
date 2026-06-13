import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, API_BASE } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Check for developer session first
    const devSession = localStorage.getItem('psadvisor_dev_session')
    if (devSession) {
      try {
        const session = JSON.parse(devSession)
        setUser(session.user)
        setToken(session.access_token)
        fetchProfile(session.access_token)
        setLoading(false)
        return
      } catch (e) {
        localStorage.removeItem('psadvisor_dev_session')
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setToken(session.access_token)
        fetchProfile(session.access_token)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (localStorage.getItem('psadvisor_dev_session')) {
          return
        }
        if (session) {
          setUser(session.user)
          setToken(session.access_token)
          fetchProfile(session.access_token)
        } else {
          setUser(null)
          setToken(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (accessToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/session`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
      }
    } catch (e) {
      console.warn('Could not fetch profile:', e)
    }
  }

  const signUpWithEmail = async (email, password, fullName) => {
    localStorage.removeItem('psadvisor_dev_session')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
        }
      }
    })
    if (error) throw error
    if (data?.session) {
      setUser(data.session.user)
      setToken(data.session.access_token)
      await fetchProfile(data.session.access_token)
    }
    return data
  }

  const signInWithEmail = async (email, password) => {
    localStorage.removeItem('psadvisor_dev_session')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    if (data?.session) {
      setUser(data.session.user)
      setToken(data.session.access_token)
      await fetchProfile(data.session.access_token)
    }
    return data
  }

  const signInAsDeveloper = async () => {
    const mockUser = {
      id: 'd0000000-0000-0000-0000-000000000000',
      email: 'developer@psadvisor.local',
      user_metadata: {
        full_name: 'Dev Guest',
        avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=developer',
      }
    }
    const session = {
      access_token: 'developer-token',
      user: mockUser
    }
    localStorage.setItem('psadvisor_dev_session', JSON.stringify(session))
    setUser(mockUser)
    setToken('developer-token')
    await fetchProfile('developer-token')
  }

  const signOut = async () => {
    localStorage.removeItem('psadvisor_dev_session')
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
    setProfile(null)
  }

  // Apply theme from profile
  useEffect(() => {
    const theme = profile?.theme || 'dark'
    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
      root.classList.toggle('light', !prefersDark)
    } else {
      root.classList.remove('dark', 'light')
      root.classList.add(theme)
    }
  }, [profile])

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, signUpWithEmail, signInWithEmail, signInAsDeveloper, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
