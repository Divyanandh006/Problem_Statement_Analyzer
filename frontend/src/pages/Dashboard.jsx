import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, MessageSquare, Sparkles, Clock, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from '../components/layout/Sidebar'
import { Spinner } from '../components/ui/Spinner'
import { API_BASE } from '../lib/supabase'
import { formatDistanceToNow } from '../lib/timeUtils'

function SessionCard({ conv, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="card cursor-pointer hover:border-[var(--accent-primary)] transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-card bg-[var(--accent-primary)]/10 flex items-center justify-center">
          <MessageSquare size={16} className="text-[var(--accent-primary)]" />
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          <Clock size={10} className="inline mr-1" />
          {formatDistanceToNow(conv.updated_at || conv.created_at)}
        </span>
      </div>
      <h3 className="font-medium text-[var(--text-primary)] text-sm mb-1 line-clamp-2">
        {conv.title || 'Untitled Session'}
      </h3>
      {conv.top_pick && (
        <p className="text-xs text-[var(--accent-primary)] mb-2 flex items-center gap-1">
          <Target size={10} /> Top pick: {conv.top_pick}
        </p>
      )}
      <div className="flex items-center gap-2 mt-auto">
        <span className="badge badge-success text-xs">
          {conv.ps_count || 0} PS
        </span>
        {conv.ps_input_type && (
          <span className="text-xs text-[var(--text-muted)] capitalize">{conv.ps_input_type}</span>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="w-9 h-9 rounded-card bg-[var(--bg-elevated)] mb-3" />
      <div className="h-3 bg-[var(--bg-elevated)] rounded mb-2 w-3/4" />
      <div className="h-2.5 bg-[var(--bg-elevated)] rounded w-1/2" />
    </div>
  )
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  )

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const toggleSidebar = () => {
    setSidebarCollapsed(v => {
      localStorage.setItem('sidebar_collapsed', !v)
      return !v
    })
  }

  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId))
        toast.success('Session deleted')
      } else {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      toast.error('Failed to delete session')
    }
  }

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar
        conversations={conversations}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                Welcome back, {name}! 👋
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                Ready to pick your next problem statement?
              </p>
            </div>
            <button
              onClick={() => navigate('/app/session/new')}
              id="dashboard-new-session-btn"
              className="btn-primary flex-shrink-0"
            >
              <Plus size={16} />
              New PS Session
            </button>
          </motion.div>

          {/* Sessions grid */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Sessions</h2>
            <span className="text-xs text-[var(--text-muted)]">{conversations.length} sessions</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-12"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-[var(--accent-primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">No sessions yet</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Start by uploading your first PS list and get AI-powered analysis instantly.
              </p>
              <button
                onClick={() => navigate('/app/session/new')}
                className="btn-primary mx-auto"
              >
                <Plus size={14} /> Start your first session
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversations.map((conv, i) => (
                <SessionCard
                  key={conv.id}
                  conv={conv}
                  onClick={() => navigate(`/app/session/${conv.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
