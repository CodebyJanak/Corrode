/**
 * Settings.jsx — API Key modal for Android/Web
 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings as SettingsIcon, X, Key, Check, ExternalLink } from 'lucide-react'
import { saveAIKey, hasAIKey, isElectron } from '../../platform'

export default function SettingsButton() {
  const [open, setOpen] = useState(false)
  useEffect(() => { if (!isElectron && !hasAIKey()) setOpen(true) }, [])
  if (isElectron) return null

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="p-1.5 rounded transition-colors"
        style={{ color:'var(--text-muted)', border:'1px solid transparent' }}
        onMouseEnter={e=>{ e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='rgba(60,20,10,0.3)' }}
        onMouseLeave={e=>{ e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='transparent' }}
        title="Settings">
        <SettingsIcon size={14} />
      </button>
      <AnimatePresence>{open && <SettingsModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  )
}

function SettingsModal({ onClose }) {
  const [provider, setProvider] = useState(localStorage.getItem('corrode_ai_provider')||'groq')
  const [key, setKey] = useState(localStorage.getItem('corrode_ai_key')||'')
  const [saved, setSaved] = useState(false)

  function save() {
    saveAIKey(key.trim(), provider)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  const info = {
    groq:   { label:'Groq (Fast, Free)', url:'https://console.groq.com', ph:'gsk_xxxxxxxxxxxxxxxx', steps:['console.groq.com','Sign up free','API Keys → Create Key','Paste below'] },
    gemini: { label:'Google Gemini (Free)', url:'https://aistudio.google.com/app/apikey', ph:'AIzaxxxxxxxxxxxxxxxx', steps:['aistudio.google.com','Sign in with Google','Get API Key','Paste below'] },
  }[provider]

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background:'rgba(5,2,3,0.85)', backdropFilter:'blur(12px)' }}>
      <motion.div initial={{ scale:0.95,y:10 }} animate={{ scale:1,y:0 }} exit={{ scale:0.95,y:10 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background:'rgba(12,5,6,0.98)', border:'1px solid rgba(150,52,18,0.5)', boxShadow:'0 0 60px rgba(180,60,20,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={15} style={{ color:'var(--ember)' }} />
            <h2 className="text-sm font-semibold font-sans" style={{ color:'var(--text-primary)' }}>AI Setup</h2>
          </div>
          {hasAIKey() && <button onClick={onClose} style={{ color:'var(--text-muted)' }}><X size={15} /></button>}
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color:'var(--text-muted)' }}>
          Corrode needs a free AI API key. Stored only on your device.
        </p>
        <div className="flex gap-2 mb-4">
          {['groq','gemini'].map(p => (
            <button key={p} onClick={() => setProvider(p)}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
              style={provider===p
                ? { background:'linear-gradient(135deg,#7a2a08,#c94a0a)', color:'var(--text-primary)', border:'1px solid rgba(200,80,20,0.5)' }
                : { background:'rgba(20,8,10,0.8)', color:'var(--text-muted)', border:'1px solid rgba(70,24,12,0.5)' }}>
              {info.label.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="rounded-xl p-3 mb-4" style={{ background:'rgba(18,8,9,0.8)', border:'1px solid rgba(70,24,12,0.4)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color:'var(--text-secondary)' }}>How to get your key:</p>
            <a href={info.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs transition-colors" style={{ color:'var(--ember)' }}>
              Open <ExternalLink size={10} />
            </a>
          </div>
          <ol className="space-y-1">
            {info.steps.map((step,i) => (
              <li key={i} className="text-xs flex items-center gap-2" style={{ color:'var(--text-muted)' }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ background:'rgba(100,35,15,0.5)', color:'var(--ember)', fontSize:'9px' }}>{i+1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder={info.ph}
          className="w-full rounded-xl px-3 py-2.5 text-xs font-mono outline-none mb-4 transition-all"
          style={{ background:'rgba(18,8,9,0.9)', border:'1px solid rgba(80,28,15,0.6)', color:'var(--text-primary)', caretColor:'var(--ember-bright)' }}
          onFocus={e=>e.currentTarget.style.borderColor='rgba(201,74,10,0.7)'}
          onBlur={e=>e.currentTarget.style.borderColor='rgba(80,28,15,0.6)'} />
        <button onClick={save} disabled={!key.trim()}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 btn-forge">
          {saved ? <><Check size={14}/> Saved!</> : 'Save & Start Corrode'}
        </button>
      </motion.div>
    </motion.div>
  )
}
