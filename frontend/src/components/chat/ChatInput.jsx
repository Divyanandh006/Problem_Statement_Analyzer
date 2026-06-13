import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { motion } from 'framer-motion'

export function ChatInput({ onSend, disabled, value, setValue, onAttach }) {
  const [charCount, setCharCount] = useState(value?.length || 0)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setCharCount(value?.length || 0)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 144) + 'px'
    }
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    setCharCount(0)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    setValue(e.target.value)
    setCharCount(e.target.value.length)
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onAttach) {
      onAttach(file)
    }
    e.target.value = ''
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="flex items-end gap-2 bg-[var(--bg-elevated)] border border-[var(--border)]
                     rounded-[20px] px-3 py-2 transition-all duration-200
                     focus-within:border-[var(--accent-primary)]">
        {/* Attach button */}
        <button
          type="button"
          onClick={handleAttachClick}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)]
                     transition-colors duration-150 flex-shrink-0 mb-0.5"
          aria-label="Attach file"
        >
          <Paperclip size={16} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,image/*"
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question... (Shift+Enter for new line)"
          className="flex-1 bg-transparent text-[var(--text-primary)] text-sm
                     placeholder-[var(--text-muted)] outline-none resize-none
                     min-h-[36px] max-h-[144px] leading-relaxed py-1"
          rows={1}
          disabled={disabled}
        />

        {/* Character count */}
        {charCount >= 500 && (
          <span className="text-xs text-[var(--text-muted)] flex-shrink-0 mb-1">
            {charCount}
          </span>
        )}

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          whileHover={value.trim() && !disabled ? { scale: 1.05 } : {}}
          whileTap={value.trim() && !disabled ? { scale: 0.95 } : {}}
          className={`p-2 rounded-full flex-shrink-0 transition-all duration-200 mb-0.5
            ${value.trim() && !disabled
              ? 'bg-[var(--accent-primary)] text-white shadow-glow-sm'
              : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] cursor-not-allowed'
            }`}
          aria-label="Send message"
        >
          <Send size={14} />
        </motion.button>
      </div>
      <p className="text-xs text-[var(--text-muted)] text-center mt-1.5">
        PSAdvisor analyses hackathon PS only · Powered by Google Gemini
      </p>
    </div>
  )
}
