import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Settings, LogOut, Sparkles, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { formatDistanceToNow } from '../../lib/timeUtils'

export function Sidebar({ conversations = [], collapsed, onToggle, currentId, onDeleteConversation }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border)] overflow-hidden flex-shrink-0"
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[var(--border-subtle)]">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles size={18} className="text-[var(--accent-primary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">PSAdvisor</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="btn-ghost p-1.5 rounded-btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* New Session */}
      <div className="px-2 py-3">
        <Link
          to="/app/session/new"
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-btn
                     bg-[var(--accent-primary)] text-white text-sm font-medium
                     transition-all duration-200 hover:opacity-90 hover:shadow-glow
                     ${collapsed ? 'justify-center' : ''}`}
        >
          <Plus size={16} />
          {!collapsed && <span>New Session</span>}
        </Link>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {!collapsed && (
          <p className="px-3 py-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Recent Sessions
          </p>
        )}
        <div className="space-y-0.5 mt-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="relative group/sidebar-item"
            >
              <Link
                to={`/app/session/${conv.id}`}
                className={`sidebar-item pr-8 ${currentId === conv.id ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                title={conv.title}
              >
                <MessageSquare size={16} className="flex-shrink-0 text-[var(--text-muted)]" />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{conv.title || 'Untitled Session'}</p>
                    <p className="text-[var(--text-muted)] text-xs">
                      {conv.ps_count ? `${conv.ps_count} PS` : ''}{conv.ps_count && conv.updated_at ? ' · ' : ''}
                      {conv.updated_at ? formatDistanceToNow(conv.updated_at) : ''}
                    </p>
                  </div>
                )}
              </Link>
              {!collapsed && onDeleteConversation && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDeleteConversation(conv.id)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--danger)] opacity-0 group-hover/sidebar-item:opacity-100 transition-opacity duration-150"
                  title="Delete session"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {conversations.length === 0 && !collapsed && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-[var(--text-muted)]">No sessions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Settings + User */}
      <div className="border-t border-[var(--border-subtle)] px-2 py-3 space-y-0.5">
        <Link
          to="/app/settings"
          className={`sidebar-item ${location.pathname === '/app/settings' ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings size={16} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={`sidebar-item w-full text-left ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="flex-shrink-0 text-[var(--danger)]" />
          {!collapsed && <span className="text-[var(--danger)]">Sign Out</span>}
        </button>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1 rounded-btn bg-[var(--bg-elevated)]">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
