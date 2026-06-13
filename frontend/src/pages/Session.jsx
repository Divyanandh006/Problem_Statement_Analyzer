import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings2, Zap, ChevronDown, Paperclip, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from '../components/layout/Sidebar'
import { FilterPanel } from '../components/layout/FilterPanel'
import { MessageList } from '../components/chat/MessageList'
import { ChatInput } from '../components/chat/ChatInput'
import { Spinner } from '../components/ui/Spinner'
import { API_BASE } from '../lib/supabase'

const MODELS = [
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', desc: 'Active Free Tier' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Daily limit of 20' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Standard' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Legacy' },
]

function ModelSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = MODELS.find(m => m.id === value) || MODELS[2]
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-[var(--border)]
                   bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] font-medium
                   hover:border-[var(--accent-primary)] transition-colors duration-150"
      >
        <Zap size={12} className="text-[var(--accent-primary)]" />
        {current.label}
        <ChevronDown size={12} className="text-[var(--text-muted)]" />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--bg-surface)] border border-[var(--border)]
                     rounded-card shadow-card z-50 overflow-hidden"
        >
          {MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); toast.success(`Model changed to ${m.label}`) }}
              className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between
                         hover:bg-[var(--bg-elevated)] transition-colors
                         ${m.id === value ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
            >
              <span className="font-medium">{m.label}</span>
              <span className="text-xs text-[var(--text-muted)]">{m.desc}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default function Session() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()

  const [conversation, setConversation] = useState(null)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash-lite')
  const [filters, setFilters] = useState({})
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  )
  const [psContext, setPsContext] = useState(null)
  const psContextSent = useRef(false)
  const [inputValue, setInputValue] = useState('')

  // Load conversation + sidebar list
  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch(`${API_BASE}/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ]).then(([conv, list]) => {
      if (conv.id) {
        setConversation(conv)
        setMessages(conv.messages || [])
        setModel(conv.model || 'gemini-2.5-flash-lite')
        setFilters(conv.filters || {})
      }
      setConversations(list.conversations || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [id, token])

  // Auto-start first ranking when navigating from NewSession
  useEffect(() => {
    const state = location.state
    if (state?.autoStart && state?.psContext && !psContextSent.current) {
      psContextSent.current = true
      setPsContext(state.psContext)
      if (state.model) setModel(state.model)
      if (state.filters) setFilters(state.filters)
      // Auto-send the initial ranking request
      setTimeout(() => {
        sendMessage(
          'Please analyze and rank all the problem statements I submitted. Use Mode 1: Ranking.',
          state.psContext,
          state.filters,
          state.model,
        )
      }, 500)
    }
  }, [location.state])

  const sendMessage = useCallback(async (text, psCtx = psContext, filt = filters, mdl = model) => {
    if (isStreaming) return

    // Optimistic UI: add user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const body = {
        conversation_id: id,
        message: text,
        model: mdl,
        filters: Object.keys(filt || {}).length ? filt : null,
        ps_context: psContextSent.current ? null : psCtx,
      }
      psContextSent.current = true

      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') {
            setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
            setStreamingContent('')
            setIsStreaming(false)
            break
          }
          try {
            const parsed = JSON.parse(raw)
            if (parsed.text) {
              accumulated += parsed.text
              setStreamingContent(accumulated)
            }
            if (parsed.error) {
              toast.error(`Analysis failed: ${parsed.error}`)
            }
          } catch {}
        }
      }
    } catch (err) {
      toast.error('Analysis failed — try again or switch to a different model.')
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [id, token, psContext, filters, model, isStreaming])

  const handleDeepDive = (psTitle) => {
    sendMessage(`Deep dive on: ${psTitle}`)
  }

  const handleAttach = async (file) => {
    const loadingToast = toast.loading(`Uploading and parsing ${file.name}...`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Upload failed')
      }
      const data = await res.json()
      toast.dismiss(loadingToast)
      toast.success('Text extracted successfully!')
      
      if (data.extracted_text) {
        setInputValue(prev => prev + (prev ? "\n\n" : "") + data.extracted_text)
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error(err.message || 'Upload failed')
    }
  }

  const handleFilterApply = async (newFilters) => {
    setFilters(newFilters)
    // Patch conversation
    await fetch(`${API_BASE}/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: newFilters }),
    })
    toast.success('Re-analyzing with new filters...')
    sendMessage('Re-analyze and re-rank all problem statements with the updated team filters.', psContext, newFilters, model)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(v => { localStorage.setItem('sidebar_collapsed', !v); return !v })
  }

  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success('Session deleted')
        if (convId === id) {
          navigate('/app')
        } else {
          setConversations(prev => prev.filter(c => c.id !== convId))
        }
      } else {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      toast.error('Failed to delete session')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[var(--text-secondary)] text-sm">Loading session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar
        conversations={conversations}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentId={id}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]
                       bg-[var(--bg-surface)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/app')} className="btn-ghost p-1.5 flex-shrink-0">
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {conversation?.title || 'PS Analysis Session'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {messages.filter(m => m.role === 'user').length} exchanges
                {conversation?.ps_count ? ` · ${conversation.ps_count} PS` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ModelSelector value={model} onChange={setModel} />
            <button
              onClick={() => setFilterPanelOpen(true)}
              className="btn-ghost p-2"
              aria-label="Open filter panel"
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                <span className="text-2xl">✦</span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Analyzing your problem statements...</h3>
              <p className="text-sm text-[var(--text-secondary)]">The AI ranking will appear here shortly.</p>
            </div>
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onDeepDive={handleDeepDive}
            />
          )}
          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
            value={inputValue}
            setValue={setInputValue}
            onAttach={handleAttach}
          />
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onChange={handleFilterApply}
      />
    </div>
  )
}
