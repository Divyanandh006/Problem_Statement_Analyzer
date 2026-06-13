import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, User, ChevronDown, ChevronUp, Star, Zap } from 'lucide-react'
import { RankingCard } from './RankingCard'
import { AnalysisCard } from './AnalysisCard'

function detectMessageType(content) {
  if (!content) return 'text'
  const lower = content.toLowerCase()
  // Ranking: has a markdown table with feasibility/impact columns
  if ((lower.includes('| feasibility') || lower.includes('| fea') || lower.includes('total')) &&
      content.includes('|---')) {
    return 'ranking'
  }
  // Analysis: has the structured analysis headings
  if ((lower.includes('pain points') || lower.includes('feasibility of execution')) &&
      lower.includes('evaluator')) {
    return 'analysis'
  }
  return 'text'
}

function UserMessage({ content }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end mb-4"
    >
      <div className="flex items-end gap-2 max-w-[75%]">
        <div
          className="bg-[var(--accent-primary)] text-white px-4 py-3 text-sm leading-relaxed"
          style={{ borderRadius: '18px 18px 4px 18px' }}
        >
          {content}
        </div>
        <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]
                       flex items-center justify-center flex-shrink-0 mb-0.5">
          <User size={14} className="text-[var(--text-secondary)]" />
        </div>
      </div>
    </motion.div>
  )
}

function AiMessage({ content, isStreaming, onDeepDive }) {
  const msgType = detectMessageType(content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4"
    >
      <div className="flex items-start gap-2 max-w-[85%]">
        <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20
                       flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={14} className="text-[var(--accent-primary)]" />
        </div>
        <div
          className="bg-[var(--bg-surface)] border border-[var(--border)] px-5 py-4 text-sm"
          style={{ borderRadius: '18px 18px 18px 4px' }}
        >
          {msgType === 'ranking' ? (
            <RankingCard content={content} onDeepDive={onDeepDive} />
          ) : msgType === 'analysis' ? (
            <AnalysisCard content={content} />
          ) : (
            <div className={`prose-psadvisor ${isStreaming ? 'streaming-cursor' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function MessageList({ messages, isStreaming, streamingContent, onDeepDive }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.map((msg, i) => (
        msg.role === 'user'
          ? <UserMessage key={i} content={msg.content} />
          : <AiMessage key={i} content={msg.content} isStreaming={false} onDeepDive={onDeepDive} />
      ))}

      {/* Streaming AI message */}
      {isStreaming && (
        <AiMessage
          content={streamingContent || ''}
          isStreaming={true}
          onDeepDive={onDeepDive}
        />
      )}

      {/* Streaming dots when empty */}
      {isStreaming && !streamingContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start mb-4"
        >
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20
                           flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-[var(--accent-primary)]" />
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] px-5 py-4"
                 style={{ borderRadius: '18px 18px 18px 4px' }}>
              <div className="flex gap-1 items-center">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, delay }}
                    className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
