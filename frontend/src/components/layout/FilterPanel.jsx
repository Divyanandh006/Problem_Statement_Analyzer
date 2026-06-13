import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'

const SKILLS = ['Frontend', 'Backend', 'AI/ML', 'Hardware', 'Design', 'Blockchain', 'Mobile', 'DevOps']
const DOMAINS = ['Web', 'Mobile', 'AI/ML', 'IoT', 'Blockchain', 'Social Impact', 'Healthcare', 'EdTech', 'FinTech', 'Any']
const TIMELINES = ['24h', '36h', '48h', '72h', '1 week']
const NOVELTY_OPTIONS = [
  { value: 'safe', label: '🛡️ Safe & Feasible' },
  { value: 'balanced', label: '⚖️ Balanced' },
  { value: 'innovative', label: '🚀 Innovative & Risky' },
]

export function FilterPanel({ isOpen, onClose, filters, onChange }) {
  const [local, setLocal] = useState(filters || {
    team_size: 3,
    skills: [],
    domain: 'Any',
    timeline: '48h',
    novelty: 'balanced',
  })
  const [customSkill, setCustomSkill] = useState('')

  const toggleSkill = (skill) => {
    const s = skill.toLowerCase()
    setLocal(prev => ({
      ...prev,
      skills: prev.skills.includes(s)
        ? prev.skills.filter(x => x !== s)
        : [...prev.skills, s],
    }))
  }

  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault()
    const trimmed = customSkill.trim().toLowerCase()
    if (trimmed && !local.skills.includes(trimmed)) {
      setLocal(p => ({ ...p, skills: [...p.skills, trimmed] }))
      setCustomSkill('')
    }
  }

  const handleTimelineChange = (num, unit) => {
    setLocal(p => ({ ...p, timeline: `${num} ${unit}` }))
  }

  const handleApply = () => {
    onChange(local)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-80 bg-[var(--bg-surface)] border-l border-[var(--border)]
                       z-40 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Filter Panel</h3>
              <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close filters">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Team Size */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                  Team Size
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setLocal(p => ({ ...p, team_size: n }))}
                      className={`w-9 h-9 rounded-btn text-sm font-medium transition-all duration-150 border
                        ${local.team_size === n
                          ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-glow-sm'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent-primary)]'
                        }`}
                    >
                      {n === 6 ? '6+' : n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                  Team Skills
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {SKILLS.map(skill => {
                    const isSelected = local.skills.includes(skill.toLowerCase())
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border
                          ${isSelected
                            ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent-primary)]'
                          }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                  {local.skills.filter(s => !SKILLS.map(x => x.toLowerCase()).includes(s)).map(skill => (
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
                <div className="flex gap-2 w-full">
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

              {/* Domain */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                  Domain Preference
                </label>
                <input
                  type="text"
                  list="filter-panel-domain-options"
                  value={local.domain}
                  onChange={e => setLocal(p => ({ ...p, domain: e.target.value }))}
                  className="input text-sm"
                  placeholder="Select or type domain..."
                />
                <datalist id="filter-panel-domain-options">
                  {DOMAINS.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>

              {/* Timeline */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                  Hackathon Timeline
                </label>
                {(() => {
                  const t = local.timeline || '48 hours'
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

              {/* Novelty */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                  Innovation Preference
                </label>
                <div className="space-y-2">
                  {NOVELTY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLocal(p => ({ ...p, novelty: opt.value }))}
                      className={`w-full text-left px-3 py-2.5 rounded-btn text-sm font-medium
                                 transition-all duration-150 border
                        ${local.novelty === opt.value
                          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent-primary)]'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="px-5 py-4 border-t border-[var(--border-subtle)]">
              <button onClick={handleApply} className="btn-primary w-full">
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
