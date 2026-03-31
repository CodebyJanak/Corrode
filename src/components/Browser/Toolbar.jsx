/**
 * Toolbar.jsx — Corrode Browser — theme-aware
 */
import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Home, Brain, Command, GitBranch, BookOpen, Shield, Focus, Clock, Sun, Moon } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'
import { isElectron } from '../../platform'
import SettingsButton from './Settings'

function normalizeURL(input) {
  const t = input.trim()
  if (t.startsWith('corrode://')) return t
  if (/^https?:\/\//.test(t)) return t
  // Add https if it looks like a domain
  if (/^[\w-]+\.[a-z]{2,}/.test(t)) return `https://${t}`
  return `https://www.google.com/search?q=${encodeURIComponent(t)}`
}

export default function Toolbar() {
  const { activeTabId, updateTab, getActiveTab, toggleSidebar, sidebarOpen, openCommandPalette, openGraph, openDigest, manipulationDetectorOn, toggleManipulationDetector, focusModeOn, toggleFocusMode, theme, toggleTheme } = useBrowserStore()
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef(null)
  const activeTab = getActiveTab()
  const isDark = theme === 'dark'

  useEffect(() => { if (!editing) setInputVal(activeTab?.url || '') }, [activeTab?.url, editing])

  function navigate(url) {
    const final = normalizeURL(url)
    updateTab(activeTabId, { url: final, loading: true })
    setInputVal(final); setEditing(false)
  }

  const iconStyle = (active) => ({
    padding: '6px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center',
    color: active ? 'var(--ember-bright)' : 'var(--text-muted)',
    background: active ? 'rgba(180,60,20,0.2)' : 'transparent',
    border: active ? '1px solid rgba(180,60,20,0.35)' : '1px solid transparent',
  })

  function hoverOn(e) { e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.background='var(--bg-300)' }
  function hoverOff(e, active) {
    e.currentTarget.style.color = active ? 'var(--ember-bright)' : 'var(--text-muted)'
    e.currentTarget.style.background = active ? 'rgba(180,60,20,0.2)' : 'transparent'
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 shrink-0 transition-colors"
      style={{ background:'var(--bg-chrome)', borderBottom:'1px solid var(--border)' }}>

      {/* Nav */}
      {[
        { icon:<ChevronLeft size={16}/>, ev:'webview:back',    title:'Back' },
        { icon:<ChevronRight size={16}/>, ev:'webview:forward', title:'Forward' },
        { icon:<RotateCw size={14}/>,    ev:'webview:reload',  title:'Reload' },
      ].map(({icon,ev,title}) => (
        <button key={title} style={iconStyle(false)} title={title}
          onClick={() => window.dispatchEvent(new CustomEvent(ev))}
          onMouseEnter={hoverOn} onMouseLeave={e=>hoverOff(e,false)}>{icon}</button>
      ))}
      <button style={iconStyle(false)} title="Home"
        onClick={() => navigate('corrode://newtab')}
        onMouseEnter={hoverOn} onMouseLeave={e=>hoverOff(e,false)}>
        <Home size={14}/>
      </button>

      {/* Address bar */}
      <div className="flex-1 flex items-center gap-2 mx-1 px-3 h-7 rounded-lg transition-all"
        style={{ background:'var(--bg-input)', border:'1px solid var(--border)' }}
        onFocusCapture={e => { e.currentTarget.style.borderColor='var(--border-focus)'; e.currentTarget.style.boxShadow='0 0 0 2px rgba(201,74,10,0.12)' }}
        onBlurCapture={e  => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none' }}>
        {!editing && activeTab?.url && !activeTab.url.startsWith('corrode://') && (
          <span style={{ color:'var(--ember)', fontSize:'11px' }}>🔒</span>
        )}
        <input
          ref={inputRef}
          value={editing ? inputVal : (activeTab?.url || '')}
          onChange={e => setInputVal(e.target.value)}
          onFocus={() => { setEditing(true); setInputVal(activeTab?.url||''); setTimeout(()=>inputRef.current?.select(),10) }}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if(e.key==='Enter') navigate(inputVal); if(e.key==='Escape'){setEditing(false);setInputVal(activeTab?.url||'')} }}
          className="flex-1 bg-transparent text-xs outline-none font-mono"
          style={{ color:'var(--text-primary)', caretColor:'var(--ember-bright)' }}
          placeholder="Search or enter URL… (Ctrl+K)"
          spellCheck={false}
        />
      </div>

      <div className="w-px h-4 mx-0.5 shrink-0" style={{ background:'var(--border)' }} />

      {/* Feature buttons */}
      {[
        { icon:<Command size={14}/>,  action:openCommandPalette,         title:'Command Palette (Ctrl+K)', active:false },
        { icon:<Brain size={14}/>,    action:toggleSidebar,              title:'Second Brain',             active:sidebarOpen },
        { icon:<GitBranch size={14}/>,action:openGraph,                   title:'Knowledge Graph',          active:false },
        { icon:<BookOpen size={14}/>, action:openDigest,                  title:'Daily Digest',             active:false },
        { icon:<Shield size={14}/>,   action:toggleManipulationDetector,  title:'Manipulation Detector',    active:manipulationDetectorOn },
        { icon:<Focus size={14}/>,    action:toggleFocusMode,             title:'Focus Mode',               active:focusModeOn },
        { icon:<Clock size={14}/>,    action:() => {
            const url=activeTab?.url
            if(url&&!url.startsWith('corrode://')) window.dispatchEvent(new CustomEvent('webview:navigate',{detail:`https://web.archive.org/web/2010/${url}`}))
          }, title:'Time Warp (Wayback Machine)', active:false },
      ].map(({icon,action,title,active}) => (
        <button key={title} style={iconStyle(active)} title={title} onClick={action}
          onMouseEnter={e=>{if(!active)hoverOn(e)}}
          onMouseLeave={e=>{if(!active)hoverOff(e,false)}}>
          {icon}
        </button>
      ))}

      {/* Theme toggle */}
      <button style={iconStyle(false)} title={isDark?'Light mode':'Dark mode'} onClick={toggleTheme}
        onMouseEnter={hoverOn} onMouseLeave={e=>hoverOff(e,false)}>
        {isDark ? <Sun size={14}/> : <Moon size={14}/>}
      </button>

      <SettingsButton />
    </div>
  )
}
