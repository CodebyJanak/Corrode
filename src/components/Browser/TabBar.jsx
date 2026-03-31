import React from 'react'
import { X, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import useBrowserStore from '../../store/useBrowserStore'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useBrowserStore()
  return (
    <div className="flex items-end h-9 shrink-0 px-2 gap-1 overflow-x-auto transition-colors"
      style={{ background:'var(--bg-chrome)', borderBottom:'1px solid var(--border)' }}>
      {tabs.map(tab => {
        const active = tab.id === activeTabId
        return (
          <motion.div key={tab.id} layout initial={{opacity:0,scaleX:0.8}} animate={{opacity:1,scaleX:1}} exit={{opacity:0,scaleX:0.8}} transition={{duration:0.15}}
            onClick={() => setActiveTab(tab.id)}
            className="group relative flex items-center gap-1.5 px-3 h-8 rounded-t-lg min-w-[120px] max-w-[200px] cursor-pointer shrink-0 select-none transition-all"
            style={{
              background: active ? 'var(--bg-200)' : 'transparent',
              border: active ? '1px solid var(--border)' : '1px solid transparent',
              borderBottom: 'none',
            }}>
            {active && <div className="absolute top-0 left-3 right-3 h-px tab-active-bar" />}
            {tab.favicon
              ? <img src={tab.favicon} className="w-3.5 h-3.5 shrink-0" alt="" />
              : <div className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ background:'var(--bg-400)' }} />}
            <span className="text-xs truncate flex-1 font-sans"
              style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 500 : 400 }}>
              {tab.loading ? 'Loading…' : (tab.title || 'New Tab')}
            </span>
            <button onClick={e=>{e.stopPropagation();closeTab(tab.id)}}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all"
              style={{ color:'var(--text-muted)' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--ember-bright)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
              <X size={10}/>
            </button>
            {tab.loading && <div className="absolute bottom-0 left-0 right-0 progress-bar" />}
          </motion.div>
        )
      })}
      <button onClick={() => addTab()} title="New Tab (Ctrl+T)"
        className="flex items-center justify-center w-7 h-7 mb-1 rounded-lg transition-all"
        style={{ color:'var(--text-muted)' }}
        onMouseEnter={e=>{e.currentTarget.style.color='var(--ember-bright)';e.currentTarget.style.background='var(--bg-300)'}}
        onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.background='transparent'}}>
        <Plus size={14}/>
      </button>
    </div>
  )
}
