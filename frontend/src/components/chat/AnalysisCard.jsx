import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

const SECTIONS = [
  { emoji: '🔎', title: 'Pain Points & Core Understanding' },
  { emoji: '⚙️', title: 'Feasibility of Execution' },
  { emoji: '🌍', title: 'Impact & Relevance' },
  { emoji: '💡', title: 'Scope of Innovation' },
  { emoji: '🧩', title: 'Clarity of Problem Statement' },
  { emoji: '🎯', "title": "Evaluator's Perspective" },
  { emoji: '👥', title: 'Strategy for Team Fit' },
]

function extractSection(content, sectionTitle) {
  // Try to find the section content between headings
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`###?\\s*[\\p{Emoji}\\s]*${escaped}[\\s\\S]*?\\n([\\s\\S]*?)(?=###?\\s|$)`, 'iu')
  const match = content.match(regex)
  return match ? match[1].trim() : null
}

function extractTitle(content) {
  const match = content.match(/##\s+(.+?)\s*—\s*Full Analysis/i)
  return match ? match[1].trim() : 'Full Analysis'
}

function extractScore(content) {
  const match = content.match(/\*\*⭐\s*Score:\s*([\d.]+)\s*\/\s*10\*\*/i) ||
                content.match(/Score:\s*([\d.]+)\s*\/\s*10/i)
  return match ? parseFloat(match[1]) : null
}

function extractTakeaway(content) {
  const match = content.match(/\*\*📊\s*Key Takeaway:\*\*\s*([^\n]+)/i) ||
                content.match(/Key Takeaway:\s*([^\n]+)/i)
  return match ? match[1].trim() : null
}

function ScoreBadge({ score }) {
  if (!score) return null
  const color = score >= 7.5 ? 'var(--success)' : score >= 5 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold"
      style={{ borderColor: color, color, background: `${color}15` }}
    >
      ⭐ {score} / 10
    </div>
  )
}

function Section({ emoji, title, content, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!content) return null

  return (
    <div className="border border-[var(--border-subtle)] rounded-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)]
                   transition-colors duration-150 text-left"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {emoji} {title}
        </span>
        {open ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 text-sm prose-psadvisor border-t border-[var(--border-subtle)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AnalysisCard({ content }) {
  const [collapsed, setCollapsed] = useState(false)
  const title = extractTitle(content)
  const score = extractScore(content)
  const takeaway = extractTakeaway(content)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-[var(--accent-primary)]" />
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{title}</h3>
            <p className="text-xs text-[var(--text-muted)]">Full Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreBadge score={score} />
          <button
            onClick={() => setCollapsed(c => !c)}
            className="btn-ghost p-1.5"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Sections */}
          <div className="space-y-2">
            {SECTIONS.map((sec, i) => {
              const sectionContent = extractSection(content, sec.title)
              return (
                <Section
                  key={sec.title}
                  emoji={sec.emoji}
                  title={sec.title}
                  content={sectionContent}
                  defaultOpen={i === 0}
                />
              )
            })}
          </div>

          {/* Key Takeaway */}
          {takeaway && (
            <div className="p-4 rounded-card bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20">
              <p className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-1">
                📊 Key Takeaway
              </p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{takeaway}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
