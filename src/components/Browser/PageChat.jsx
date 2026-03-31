/**
 * PageChat.jsx — Floating AI chat — Corrode Browser
 */
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import { ai } from '../../platform'

const QUICK = ["Summarize in 3 bullets","What is this trying to sell me?","What's the bias here?","Is anything misleading?"]

// Ember flame SVG button
function FlameButton({ onClick }) {
  return (
    <button onClick={onClick}
      className="absolute bottom-5 right-5 w-11 h-11 rounded-full flex items-center justify-center z-20 transition-all animate-crackle"
      style={{ background:'linear-gradient(135deg, #7a2a08, #c94a0a, #e8620c)', border:'1px solid rgba(255,120,40,0.4)' }}
      title="Ask AI about this page">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C12 2 8 7 8 12C8 14.5 9.5 16.5 12 17C14.5 16.5 16 14.5 16 12C16 7 12 2 12 2Z"
          fill="rgba(255,200,100,0.9)" />
        <path d="M12 8C12 8 10 11 10 13C10 14.1 10.9 15 12 15C13.1 15 14 14.1 14 13C14 11 12 8 12 8Z"
          fill="rgba(255,255,180,0.8)" />
      </svg>
    </button>
  )
}

export default function PageChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  async function getPageContent() {
    const wvs = document.querySelectorAll('webview')
    for (const wv of wvs) {
      try { const t = await wv.executeJavaScript(`document.body?.innerText?.slice(0,8000)||''`); if(t) return t } catch {}
    }
    return ''
  }

  async function send(q) {
    if (!q.trim() || loading) return
    setInput('')
    setMessages(m => [...m, { role:'user', content:q }])
    setLoading(true)
    try {
      const content = await getPageContent()
      const answer = await ai.chatWithPage(content, q)
      setMessages(m => [...m, { role:'assistant', content:answer }])
    } catch(e) {
      setMessages(m => [...m, { role:'assistant', content:`Error: ${e.message}` }])
    } finally { setLoading(false) }
  }

  return (
    <>
      <FlameButton onClick={() => setOpen(o => !o)} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:20, scale:0.95 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }}
            className="absolute bottom-16 right-5 w-80 h-96 flex flex-col rounded-2xl z-20"
            style={{ background:'rgba(10,4,5,0.97)', border:'1px solid rgba(150,52,18,0.5)', boxShadow:'0 0 40px rgba(180,60,20,0.2), 0 20px 40px rgba(0,0,0,0.8)' }}
          >
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom:'1px solid rgba(80,28,15,0.4)' }}>
              <div className="flex items-center gap-2">
                <span style={{ color:'var(--ember)', fontSize:'15px' }}>🔥</span>
                <span className="text-xs font-semibold font-sans" style={{ color:'var(--text-primary)' }}>Page Intelligence</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ color:'var(--text-muted)' }}><X size={14} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs mb-2" style={{ color:'var(--text-muted)' }}>Quick questions:</p>
                  {QUICK.map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-all"
                      style={{ background:'rgba(20,8,10,0.8)', border:'1px solid rgba(70,24,12,0.5)', color:'var(--text-secondary)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(150,52,18,0.6)'; e.currentTarget.style.color='var(--text-primary)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(70,24,12,0.5)'; e.currentTarget.style.color='var(--text-secondary)' }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m,i) => (
                <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
                    style={m.role==='user'
                      ? { background:'linear-gradient(135deg,#7a2a08,#c94a0a)', color:'var(--text-primary)' }
                      : { background:'rgba(22,9,11,0.9)', border:'1px solid rgba(70,24,12,0.4)', color:'var(--text-secondary)' }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2" style={{ background:'rgba(22,9,11,0.9)', border:'1px solid rgba(70,24,12,0.4)' }}>
                    <Loader2 size={12} className="animate-spin" style={{ color:'var(--ember)' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop:'1px solid rgba(70,24,12,0.4)' }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(input)}
                placeholder="Ask anything…"
                className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                style={{ background:'rgba(20,8,10,0.8)', border:'1px solid rgba(70,24,12,0.5)', color:'var(--text-primary)', caretColor:'var(--ember-bright)' }} />
              <button onClick={()=>send(input)} disabled={loading||!input.trim()}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-40 btn-forge">
                <Send size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
