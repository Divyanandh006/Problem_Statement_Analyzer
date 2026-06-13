import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, FileText, Upload, Image, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { API_BASE } from '../lib/supabase'
import { Spinner } from '../components/ui/Spinner'

const SKILLS = ['Frontend', 'Backend', 'AI/ML', 'Hardware', 'Design', 'Blockchain', 'Mobile', 'DevOps']
const DOMAINS = ['Web', 'Mobile', 'AI/ML', 'IoT', 'Blockchain', 'Social Impact', 'Healthcare', 'EdTech', 'Any']
const TIMELINES = ['24h', '36h', '48h', '72h', '1 week']

const TABS = [
  { id: 'text', label: 'Paste Text', icon: FileText },
  { id: 'file', label: 'Upload File', icon: Upload },
  { id: 'image', label: 'Image', icon: Image },
]

function FileDropZone({ accept, onFile, uploaded, uploading, label }) {
  const onDrop = useCallback((files) => {
    if (files[0]) onFile(files[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-card p-10 text-center cursor-pointer
                 transition-all duration-200
                 ${isDragActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                  : uploaded ? 'border-[var(--success)] bg-[var(--success)]/5'
                  : 'border-[var(--border)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]'}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--text-secondary)]">Extracting text...</p>
        </div>
      ) : uploaded ? (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle size={32} className="text-[var(--success)]" />
          <div>
            <p className="font-medium text-[var(--text-primary)] text-sm">{uploaded.file_name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {uploaded.page_count} page{uploaded.page_count !== 1 ? 's' : ''} · {uploaded.file_type?.toUpperCase()} · Text extracted ✓
            </p>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Drop a different file to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload size={32} className="text-[var(--text-muted)]" />
          <div>
            <p className="font-medium text-[var(--text-primary)] text-sm">{label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">or click to browse · Max 10MB</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewSession() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('text')
  const [psText, setPsText] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [filters, setFilters] = useState({
    team_size: 3,
    skills: [],
    domain: 'Any',
    timeline: '48h',
    novelty: 'balanced',
  })

  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite')
  const [customSkill, setCustomSkill] = useState('')

  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault()
    const trimmed = customSkill.trim().toLowerCase()
    if (trimmed && !filters.skills.includes(trimmed)) {
      setFilters(f => ({ ...f, skills: [...f.skills, trimmed] }))
      setCustomSkill('')
    }
  }

  const handleTimelineChange = (num, unit) => {
    setFilters(f => ({ ...f, timeline: `${num} ${unit}` }))
  }

  const handleFileUpload = async (file, isImage = false) => {
    setUploading(true)
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
      if (isImage) setUploadedImage(data)
      else setUploadedFile(data)
      toast.success('File uploaded and text extracted!')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getPsContext = () => {
    if (activeTab === 'text') return psText.trim()
    if (activeTab === 'file') return uploadedFile?.extracted_text || ''
    if (activeTab === 'image') return uploadedImage?.extracted_text || ''
    return ''
  }

  const isReady = getPsContext().length > 10

  const handleAnalyze = async () => {
    const psContext = getPsContext()
    if (!psContext) return
    setSubmitting(true)
    try {
      // Count approximate PS (lines starting with number or bullet)
      const psCount = (psContext.match(/^\s*(\d+[\.\):]|[-•*])\s/gm) || []).length || 1

      // Create conversation
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `PS Analysis — ${new Date().toLocaleDateString()}`,
          model: selectedModel,
          ps_raw_input: psContext,
          ps_input_type: activeTab,
          filters,
          ps_count: psCount,
        }),
      })
      if (!res.ok) throw new Error('Failed to create session')
      const conv = await res.json()
      navigate(`/app/session/${conv.id}`, {
        state: { psContext, filters, model: selectedModel, autoStart: true },
      })
    } catch (err) {
      toast.error(err.message || 'Failed to start session')
      setSubmitting(false)
    }
  }

  const toggleSkill = (skill) => {
    const s = skill.toLowerCase()
    setFilters(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
    }))
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <button onClick={() => navigate('/app')} className="btn-ghost p-1.5">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">New PS Session</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Step 1 */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Step 1 of 2 — Submit Your Problem Statements
          </h2>

          {/* Input tabs */}
          <div className="flex gap-1 p-1 bg-[var(--bg-elevated)] rounded-card mb-4 border border-[var(--border)]">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-sm font-medium
                    transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'text' && (
              <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea
                  value={psText}
                  onChange={e => setPsText(e.target.value)}
                  placeholder={"Paste your problem statements here...\n\nExample:\n1. Build a smart waste management system...\n2. Develop an AI-powered mental health app...\n3. Create a blockchain-based land registry..."}
                  className="input min-h-[220px] font-mono text-sm resize-none"
                />
                {psText.trim() && (
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">
                    ~{(psText.match(/^\s*(\d+[\.\):]|[-•*])\s/gm) || []).length || 1} problem statement(s) detected
                  </p>
                )}
              </motion.div>
            )}

            {activeTab === 'file' && (
              <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FileDropZone
                  accept={{ 'application/pdf': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] }}
                  onFile={f => handleFileUpload(f, false)}
                  uploaded={uploadedFile}
                  uploading={uploading}
                  label="Drag & drop PDF or DOCX"
                />
                {uploadedFile?.extracted_text && (
                  <div className="mt-3 p-3 bg-[var(--bg-elevated)] rounded-card border border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Extracted Preview:</p>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-4 font-mono">
                      {uploadedFile.extracted_text.slice(0, 400)}...
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'image' && (
              <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FileDropZone
                  accept={{ 'image/*': [] }}
                  onFile={f => handleFileUpload(f, true)}
                  uploaded={uploadedImage}
                  uploading={uploading}
                  label="Drag & drop image (PNG, JPG, WebP)"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2 — Filters */}
        <div className="border border-[var(--border)] rounded-card overflow-hidden">
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4
                       bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Step 2 of 2 — Set Filters (Optional)
            </span>
            {filtersOpen ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
          </button>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 py-5 space-y-5 border-t border-[var(--border)]">
                  {/* Team size */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Team Size</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5,6].map(n => (
                        <button key={n}
                          onClick={() => setFilters(f => ({ ...f, team_size: n }))}
                          className={`w-9 h-9 rounded-btn text-sm font-medium border transition-all
                            ${filters.team_size === n ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}
                        >{n === 6 ? '6+' : n}</button>
                      ))}
                    </div>
                  </div>
                  {/* Skills */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Team Skills</label>
                    <div className="flex gap-2 flex-wrap">
                      {SKILLS.map(skill => {
                        const sel = filters.skills.includes(skill.toLowerCase())
                        return (
                          <button key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                              ${sel ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}
                          >{skill}</button>
                        )
                      })}
                      {filters.skills.filter(s => !SKILLS.map(x => x.toLowerCase()).includes(s)).map(skill => (
                        <button key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                        >
                          {skill.charAt(0).toUpperCase() + skill.slice(1)} ×
                        </button>
                      ))}
                    </div>
                    {/* Add custom skill input */}
                    <div className="flex gap-2 mt-2 w-full max-w-[320px]">
                      <input
                        type="text"
                        placeholder="Add other skill..."
                        value={customSkill}
                        onChange={e => setCustomSkill(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSkill(); } }}
                        className="input text-xs py-1.5 px-3 rounded-btn flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSkill}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  {/* Domain + Timeline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Domain</label>
                      <input
                        type="text"
                        list="new-session-domain-options"
                        value={filters.domain}
                        onChange={e => setFilters(f => ({ ...f, domain: e.target.value }))}
                        className="input text-sm"
                        placeholder="Select or type domain..."
                      />
                      <datalist id="new-session-domain-options">
                        {DOMAINS.map(d => <option key={d} value={d} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Timeline</label>
                      {(() => {
                        const t = filters.timeline || '48 hours'
                        const numMatch = t.match(/^(\d+)/)
                        const timelineNum = numMatch ? numMatch[1] : ''
                        const timelineUnit = t.includes('day') ? 'days' : t.includes('week') ? 'weeks' : t.includes('month') ? 'months' : 'hours'
                        return (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              value={timelineNum}
                              onChange={e => handleTimelineChange(e.target.value, timelineUnit)}
                              className="input text-sm w-20 flex-shrink-0"
                              placeholder="e.g. 48"
                            />
                            <select
                              value={timelineUnit}
                              onChange={e => handleTimelineChange(timelineNum, e.target.value)}
                              className="input text-sm flex-1"
                            >
                              <option value="hours">Hours (hr)</option>
                              <option value="days">Days</option>
                              <option value="weeks">Weeks</option>
                              <option value="months">Months</option>
                            </select>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  {/* Model selector */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Gemini Model</label>
                    <div className="flex gap-2 flex-wrap">
                      {['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].map(m => (
                        <button key={m}
                          type="button"
                          onClick={() => setSelectedModel(m)}
                          className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-all
                            ${selectedModel === m ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}
                        >{m.replace('gemini-', 'Gemini ').replace('-flash', ' Flash').replace('-lite', ' Lite').replace('-pro', ' Pro').replace('-preview', ' (Preview)')}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!isReady || submitting}
          id="analyze-btn"
          className="btn-primary w-full py-4 text-base shadow-glow"
        >
          {submitting ? <Spinner size="sm" /> : <span>✦</span>}
          {submitting ? 'Starting analysis...' : 'Analyze My Problem Statements'}
        </button>

        {!isReady && (
          <p className="text-xs text-center text-[var(--text-muted)] flex items-center justify-center gap-1">
            <AlertCircle size={12} /> Add your problem statements above to continue
          </p>
        )}
      </div>
    </div>
  )
}
