/**
 * src/components/Browser/PageChat.jsx
 * Floating AI button + chat panel for asking questions about the current page.
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, X, Send, Loader2 } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

const QUICK_PROMPTS = [
  "Summarize this in 3 bullets",
  "What is this page trying to sell me?",
  "What's the bias of this article?",
  "What are the key claims here?",
  "Is there anything misleading?",
]

export default function PageChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const { getActiveTab } = useBrowserStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function getPageContent() {
    // Get text from the active webview
    const wvs = document.querySelectorAll('webview')
    for (const wv of wvs) {
      try {
        const text = await wv.executeJavaScript(`document.body?.innerText?.slice(0, 8000) || ''`)
        if (text) return text
      } catch { /* continue */ }
    }
    return ''
  }

  async function sendMessage(question) {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)

    try {
      const content = await getPageContent()
      const answer = await window.corrode?.ai.chatWithPage(content, q) || 'No response.'
      setMessages(m => [...m, { role: 'assistant', content: answer }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="absolute bottom-5 right-5 w-10 h-10 rounded-full bg-rust-600 text-white flex items-center justify-center shadow-lg hover:bg-rust-500 transition-colors z-20 animate-glow-pulse"
        title="Ask AI about this page"
      >
        <Zap size={18} />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-5 w-80 h-96 glass rounded-xl flex flex-col z-20 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-rust-500" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">Page Intelligence</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--text-muted)] mb-2">Quick questions:</p>
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded bg-void-300 hover:bg-void-400 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-rust-700 text-white'
                      : 'bg-void-300 text-[var(--text-secondary)]'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-void-300 rounded-lg px-3 py-2">
                    <Loader2 size={12} className="text-rust-500 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--glass-border)]">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask anything about this page…"
                className="flex-1 bg-void-300 rounded-md px-2.5 py-1.5 text-xs outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded bg-rust-600 text-white hover:bg-rust-500 disabled:opacity-40 transition-colors"
              >
                <Send size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
