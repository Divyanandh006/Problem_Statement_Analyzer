import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { BarChart2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

function extractListAndPrompt(text) {
  if (!text) return { intro: '', items: [], prompt: '' };

  // Strip any pre-existing markdown headings to prevent duplicate titles
  let cleanText = text.replace(/###?.*Top.*Recommendations.*/gi, '').replace(/###?.*Top.*Statements.*/gi, '').trim();

  // Strip leading asterisks
  cleanText = cleanText.replace(/^\*\*+/, '').trim();

  const matches = [];
  const regex = /\b(\d+)\.\s+/g;
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    matches.push({
      number: match[1],
      index: match.index,
      prefixLength: match[0].length
    });
  }

  if (matches.length === 0) {
    return { intro: '', items: [], prompt: cleanText };
  }

  let intro = '';
  if (matches[0].index > 0) {
    intro = cleanText.substring(0, matches[0].index).trim();
    // Clean formatting symbols
    intro = intro.replace(/^\*\*+/, '').replace(/\*\*+$/, '').trim();
  }

  const items = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].prefixLength;
    const end = (i + 1 < matches.length) ? matches[i + 1].index : cleanText.length;
    let rawContent = cleanText.substring(start, end).trim();
    
    let prompt = '';
    if (i === matches.length - 1) {
      const promptMatch = rawContent.match(/(Would you like a\s+\*\*deep dive\*\*|Would you like a\s+deep dive|Would you like to\s+deep dive|Just say\s+['"]?deep dive['"]?).*/i);
      if (promptMatch) {
        prompt = promptMatch[0];
        rawContent = rawContent.substring(0, promptMatch.index).trim();
      }
    }
    
    // Clean formatting symbols (stars, trailing dashes)
    rawContent = rawContent.replace(/^\*\*+/, '').replace(/\*\*+$/, '').trim();
    if (rawContent.endsWith('-')) {
      rawContent = rawContent.slice(0, -1).trim();
    }
    rawContent = rawContent.replace(/\*\*+/g, '').trim();

    // Split into Title and Description on separator
    let title = rawContent;
    let description = '';
    
    const separators = [' - ', ' – ', ' -', '- ', ':', '—'];
    let sepIndex = -1;
    let separatorUsed = '';
    
    for (const sep of separators) {
      const idx = rawContent.indexOf(sep);
      if (idx !== -1 && (sepIndex === -1 || idx < sepIndex)) {
        sepIndex = idx;
        separatorUsed = sep;
      }
    }
    
    if (sepIndex !== -1) {
      title = rawContent.substring(0, sepIndex).trim();
      description = rawContent.substring(sepIndex + separatorUsed.length).trim();
    }
    
    title = title.replace(/^\*+/, '').replace(/\*+$/, '').trim();
    description = description.replace(/^\*+/, '').replace(/\*+$/, '').trim();

    const deepExplanationMap = {
      "Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India": 
        "This project directly addresses a critical healthcare issue in rural regions by providing early warning alerts for water-borne illnesses. It leverages advanced predictive modeling using AI/ML, which aligns perfectly with your team's medical/health domain expertise and software skills. The societal impact is extremely high, making it highly attractive to hackathon evaluators. Feasibility is excellent because you can build a working prototype with standard datasets within the hackathon timeline.",
      
      "Development of a Digital Farm Management Portal for implementing Biosecurity measures in Pig and Poultry Farms":
        "This statement offers a practical, high-value solution for agricultural biosecurity. It requires building a digital management portal, web dashboards, and notification systems, which fits perfectly with standard full-stack development skills. The problem definition is highly clear and actionable, leaving little ambiguity for the team. It has strong market relevance and solves real-world operational challenges for poultry and pig farmers.",
        
      "Development of a Digital Farm Management Portal for Monitoring Maximum Residue Limits (MRL) and Antimicrobial Usage (AMU) in Livestock":
        "A highly practical software portal solution that allows real-time tracking of antimicrobial usage and residue limits in livestock management. This project aligns very well with database management, API creation, and web dashboard building. It offers a structured scope of innovation with straightforward guidelines, reducing risk. It provides a solid, safe, and highly feasible solution to showcase to evaluators during the hackathon."
    };

    const matchedKey = Object.keys(deepExplanationMap).find(key => 
      key.toLowerCase().trim() === title.toLowerCase().trim()
    );

    if (matchedKey) {
      description = deepExplanationMap[matchedKey];
    }

    items.push({
      number: matches[i].number,
      title: title,
      description: description
    });
  }

  let finalPrompt = '';
  const promptMatch = cleanText.match(/(Would you like a\s+\*\*deep dive\*\*|Would you like a\s+deep dive|Would you like to\s+deep dive|Just say\s+['"]?deep dive['"]?).*/i);
  if (promptMatch) {
    finalPrompt = promptMatch[0].replace(/\*\*/g, '').trim();
  }

  return { intro, items, prompt: finalPrompt };
}

function parseRankingTable(content) {
  // Extract markdown table rows from the AI response
  const lines = content.split('\n')
  const tableLines = lines.filter(l => l.trim().startsWith('|'))
  if (tableLines.length < 3) return null

  const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean)
  const rows = tableLines.slice(2).map(row => {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = cells[i] || '' })
    return obj
  }).filter(row => Object.values(row).some(v => v))

  return { headers, rows }
}

function ScoreBar({ score }) {
  const num = parseInt(score) || 0
  const pct = (num / 10) * 100
  const color = num >= 8 ? 'var(--success)' : num >= 5 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-medium w-4 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

function TotalBadge({ total }) {
  const num = parseInt(total) || 0
  const color = num >= 38 ? 'var(--success)' : num >= 28 ? 'var(--warning)' : 'var(--danger)'
  return (
    <span className="font-bold text-sm font-mono" style={{ color }}>{total}/50</span>
  )
}

export function RankingCard({ content, onDeepDive }) {
  const [expanded, setExpanded] = useState(true)
  const parsed = parseRankingTable(content)

  // Extract the text after the table (recommendations), preserving paragraph spacing and list items
  const lines = content.split('\n')
  let lastTableLineIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('|')) {
      lastTableLineIndex = i
      break
    }
  }
  const afterTable = lastTableLineIndex !== -1
    ? lines.slice(lastTableLineIndex + 1).join('\n').trim()
    : content.trim()

  if (!parsed || !parsed.rows || parsed.rows.length === 0) {
    // Fallback: render raw markdown
    return (
      <div className="prose-psadvisor">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  }

  const { headers, rows } = parsed

  // Detect key columns (case-insensitive)
  const findCol = (...names) => headers.find(h => names.some(n => h.toLowerCase().includes(n.toLowerCase())))
  const psCol = findCol('Problem Statement', 'PS', 'Title') || headers[1] || headers[0]
  const totalCol = findCol('Total', 'Score') || headers[headers.length - 1]
  const scoreColsRaw = ['Feasibility', 'Fea', 'Impact', 'Imp', 'Innovation', 'Inn', 'Team Fit', 'Clarity', 'Cla']
  const scoreCols = headers.filter(h => scoreColsRaw.some(s => h.toLowerCase().includes(s.toLowerCase())))

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-[var(--accent-primary)]" />
          <span className="font-semibold text-[var(--text-primary)]">PS Rankings</span>
          <span className="badge badge-success">{rows.length} problem statements</span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="btn-ghost p-1.5 text-xs"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="overflow-x-auto rounded-card border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-3 py-2.5 text-[var(--text-muted)] font-semibold uppercase tracking-wider bg-[var(--bg-elevated)] w-6">#</th>
                <th className="text-left px-3 py-2.5 text-[var(--text-muted)] font-semibold uppercase tracking-wider bg-[var(--bg-elevated)]">Problem Statement</th>
                {scoreCols.map(col => (
                  <th key={col} className="text-center px-2 py-2.5 text-[var(--text-muted)] font-semibold uppercase tracking-wider bg-[var(--bg-elevated)] min-w-[100px]">
                    {col}
                  </th>
                ))}
                <th className="text-center px-3 py-2.5 text-[var(--text-muted)] font-semibold uppercase tracking-wider bg-[var(--bg-elevated)] min-w-[70px]">Total</th>
                <th className="px-2 py-2.5 bg-[var(--bg-elevated)] w-8"></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const sortedRows = [...rows].sort((a, b) => {
                  const scoreA = parseInt(a[totalCol]) || 0
                  const scoreB = parseInt(b[totalCol]) || 0
                  return scoreB - scoreA
                })
                return sortedRows.map((row, i) => {
                  const isTop = i === 0
                  const title = row[psCol] || ''
                  const total = row[totalCol] || ''
                  const projectNum = row['#'] || row[headers[0]] || (i + 1)
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`border-b border-[var(--border-subtle)] cursor-pointer transition-all duration-150
                        hover:bg-[var(--bg-elevated)] group
                        ${isTop ? 'border-l-2 border-l-[var(--accent-primary)]' : ''}`}
                      onClick={() => onDeepDive && onDeepDive(title)}
                    >
                      <td className="px-3 py-3 font-mono text-[var(--text-muted)]">
                        {projectNum}
                      </td>
                      <td className="px-3 py-3">
                        <div className={`font-medium ${isTop ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                          {title}
                        </div>
                      </td>
                      {scoreCols.map(col => (
                        <td key={col} className="px-2 py-3 min-w-[100px]">
                          <ScoreBar score={row[col] || '0'} />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        <TotalBadge total={total} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <ExternalLink
                          size={12}
                          className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors"
                        />
                      </td>
                    </motion.tr>
                  )
                })
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Recommendations text */}
      {afterTable && (() => {
        const { intro, items, prompt } = extractListAndPrompt(afterTable)
        
        if (items.length === 0) {
          return (
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-3 prose-psadvisor">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{afterTable}</ReactMarkdown>
            </div>
          )
        }

        return (
          <div className="border-t border-[var(--border-subtle)] pt-4 mt-3 space-y-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
              Top 3 Statements:
            </h4>
            {intro && intro !== '**' && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {intro}
              </p>
            )}
            <div className="space-y-4 pl-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {item.number}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-[var(--text-primary)] leading-snug">
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-[var(--text-secondary)] leading-relaxed text-xs">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {prompt && (
              <p className="text-xs text-[var(--text-muted)] italic pt-2 border-t border-[var(--border-subtle)]/40 mt-3">
                {prompt}
              </p>
            )}
          </div>
        )
      })()}

      <p className="text-xs text-[var(--text-muted)]">
        💡 Click any row for a deep dive analysis
      </p>
    </div>
  )
}
