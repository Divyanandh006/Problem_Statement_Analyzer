import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

// Simple standalone toast system (in addition to react-hot-toast)
const icons = {
  success: <CheckCircle size={16} className="text-[var(--success)]" />,
  error: <AlertCircle size={16} className="text-[var(--danger)]" />,
  info: <Info size={16} className="text-[var(--accent-primary)]" />,
}

export function Toast({ message, type = 'info', onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="flex items-center gap-3 px-4 py-3 rounded-card border border-[var(--border)]
                 bg-[var(--bg-surface)] shadow-card max-w-sm"
    >
      {icons[type]}
      <span className="text-sm text-[var(--text-primary)] flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <X size={14} />
        </button>
      )}
    </motion.div>
  )
}
