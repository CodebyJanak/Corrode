/**
 * src/components/Browser/TabBar.jsx
 * Horizontal tab bar with favicons, close buttons, and new tab button.
 */

import React from 'react'
import { X, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import useBrowserStore from '../../store/useBrowserStore'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useBrowserStore()

  return (
    <div className="flex items-end h-9 bg-void-100 border-b border-void-300 px-2 gap-1 overflow-x-auto shrink-0">
      {tabs.map(tab => (
        <motion.div
          key={tab.id}
          layout
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0.8 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveTab(tab.id)}
          className={`
            group relative flex items-center gap-2 px-3 h-8 rounded-t-md min-w-[120px] max-w-[200px]
            cursor-pointer shrink-0 select-none transition-colors
            ${activeTabId === tab.id
              ? 'bg-void-200 text-[var(--text-primary)] border border-b-0 border-void-400'
              : 'bg-void-100 text-[var(--text-muted)] hover:bg-void-200 hover:text-[var(--text-secondary)]'}
          `}
        >
          {/* Active tab rust accent line */}
          {activeTabId === tab.id && (
            <div className="absolute top-0 left-0 right-0 h-px bg-rust-600 rounded-t" />
          )}

          {/* Favicon */}
          {tab.favicon ? (
            <img src={tab.favicon} className="w-3.5 h-3.5 shrink-0" alt="" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-sm bg-void-400 shrink-0" />
          )}

          {/* Title */}
          <span className="text-xs truncate flex-1">
            {tab.loading ? 'Loading…' : (tab.title || 'New Tab')}
          </span>

          {/* Close button */}
          <button
            onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
            className="opacity-0 group-hover:opacity-100 hover:text-[var(--rust)] transition-opacity shrink-0 p-0.5 rounded"
          >
            <X size={10} />
          </button>

          {/* Loading bar */}
          {tab.loading && (
            <div className="absolute bottom-0 left-0 right-0 h-px progress-bar" />
          )}
        </motion.div>
      ))}

      {/* New tab button */}
      <button
        onClick={() => addTab()}
        className="flex items-center justify-center w-7 h-7 mb-1 rounded text-[var(--text-muted)] hover:text-[var(--rust)] hover:bg-void-300 transition-colors shrink-0"
        title="New Tab (Ctrl+T)"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
