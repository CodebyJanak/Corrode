/**
 * WebviewArea.jsx — Corrode Browser
 *
 * Web mode strategy:
 * - Try loading in iframe directly
 * - If blocked (X-Frame-Options), show a beautiful in-app browser
 *   using a Google AMP cache or mobile-friendly proxy
 * - Last resort: show the page as readable article (fetch + parse)
 */

import React, { useEffect, useRef, useState } from 'react'
import useBrowserStore from '../../store/useBrowserStore'
import { isElectron, db, ai } from '../../platform'
import NewTab from '../NewTab/NewTab'
import PageChat from './PageChat'

const SPECIAL = ['corrode://newtab', 'corrode://graph', 'corrode://digest']

// Proxies that actually work reliably
const PROXIES = [
  (url) => url,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

// ── Electron webview ───────────────────────────────────────────────────────
function ElectronWebview({ tab, updateTab, addRecentPage }) {
  const wvRef = useRef(null)
  useEffect(() => {
    const wv = wvRef.current
    if (!wv || wv._wired) return
    wv._wired = true
    wv.addEventListener('did-start-loading', () => updateTab(tab.id, { loading: true }))
    wv.addEventListener('did-stop-loading', () => {
      updateTab(tab.id, { loading: false, url: wv.getURL(), title: wv.getTitle(), canGoBack: wv.canGoBack(), canGoForward: wv.canGoForward() })
    })
    wv.addEventListener('page-favicon-updated', e => { if (e.favicons?.[0]) updateTab(tab.id, { favicon: e.favicons[0] }) })
    wv.addEventListener('page-title-updated', e => updateTab(tab.id, { title: e.title }))
  }, [])
  return <webview ref={wvRef} src={tab.url || 'about:blank'} className="w-full h-full" allowpopups="true" />
}

// ── Web iframe with fallback ───────────────────────────────────────────────
function IframeTab({ tab, updateTab, addRecentPage }) {
  const [proxyIdx, setProxyIdx] = useState(0)
  const [blocked, setBlocked]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const iframeRef = useRef(null)
  const timer     = useRef(null)

  useEffect(() => {
    setProxyIdx(0); setBlocked(false); setLoading(true)
    updateTab(tab.id, { loading: true })
  }, [tab.url])

  useEffect(() => {
    if (blocked) return
    clearTimeout(timer.current)
    timer.current = setTimeout(tryNext, 7000)
    return () => clearTimeout(timer.current)
  }, [proxyIdx, blocked])

  function tryNext() {
    clearTimeout(timer.current)
    if (proxyIdx + 1 >= PROXIES.length) { setBlocked(true); setLoading(false); updateTab(tab.id, { loading: false }) }
    else { setProxyIdx(i => i + 1); setLoading(true) }
  }

  function handleLoad() {
    clearTimeout(timer.current)
    try {
      const title = iframeRef.current?.contentDocument?.title || ''
      if (title.includes('500') || title.includes('nginx') || title.includes('Error')) { tryNext(); return }
      updateTab(tab.id, { loading: false, title: title || tab.url })
      try { const d = new URL(tab.url).hostname; addRecentPage({ url: tab.url, title: title || d, domain: d, summary: '', topics: [] }) } catch {}
    } catch {
      // cross-origin = loaded successfully
      updateTab(tab.id, { loading: false })
    }
    setLoading(false); setBlocked(false)
  }

  if (!tab.url || SPECIAL.includes(tab.url)) return null
  if (blocked) return <BlockedPage url={tab.url} />

  return (
    <div className="w-full h-full flex flex-col relative">
      {loading && <div className="absolute top-0 left-0 right-0 z-10 progress-bar" />}
      {proxyIdx > 0 && !loading && (
        <div className="flex items-center gap-2 px-3 py-1 text-xs shrink-0"
          style={{ background:'var(--bg-200)', borderBottom:'1px solid var(--border)', color:'var(--text-muted)' }}>
          <span style={{ color:'var(--ember)' }}>⚡</span> Via proxy
          <button onClick={() => window.open(tab.url,'_blank')} className="ml-auto" style={{ color:'var(--ember)' }}>Open directly ↗</button>
        </div>
      )}
      <iframe key={`${tab.url}-${proxyIdx}`} ref={iframeRef}
        src={PROXIES[proxyIdx](tab.url)}
        className="w-full flex-1 border-none" style={{ background:'#fff' }}
        onLoad={handleLoad} onError={tryNext}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        title={tab.title || tab.url} />
    </div>
  )
}

// ── Blocked page — stylish, not ugly ──────────────────────────────────────
function BlockedPage({ url }) {
  let domain = url
  try { domain = new URL(url).hostname } catch {}

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rust-texture px-8 text-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(180,50,10,0.15) 0%, transparent 70%)'
      }}/>

      {/* Gear */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full" style={{
          background:'radial-gradient(circle, rgba(201,74,10,0.3) 0%, transparent 70%)',
          transform:'scale(2)', filter:'blur(20px)'
        }}/>
        <img src="/gear.png" alt="" className="relative w-16 h-16 animate-ember-pulse"
          style={{ objectFit:'contain', filter:'drop-shadow(0 0 16px rgba(201,74,10,0.6))' }} />
      </div>

      <h2 className="font-display mb-2" style={{ color:'var(--ember-bright)', fontSize:'13px', letterSpacing:'0.2em' }}>
        EMBED BLOCKED
      </h2>
      <p className="text-sm mb-1" style={{ color:'var(--text-secondary)' }}>
        <strong>{domain}</strong> cannot be embedded
      </p>
      <p className="text-xs mb-6 max-w-[260px] leading-relaxed" style={{ color:'var(--text-muted)' }}>
        Sites like Google, YouTube, and major banks block all iframes. This is a web-mode limitation — the desktop Electron build loads everything.
      </p>

      <a href={url} target="_blank" rel="noreferrer"
        className="btn-forge px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 mb-3">
        ↗ Open in device browser
      </a>
      <p className="text-xs" style={{ color:'var(--text-muted)', fontSize:'10px' }}>
        Build desktop app via GitHub Actions for unrestricted browsing
      </p>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function WebviewArea() {
  const { tabs, activeTabId, updateTab, addRecentPage, manipulationDetectorOn } = useBrowserStore()

  useEffect(() => {
    const onNav = e => updateTab(activeTabId, { url: e.detail, loading: true })
    window.addEventListener('webview:navigate', onNav)
    return () => window.removeEventListener('webview:navigate', onNav)
  }, [activeTabId])

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background:'var(--bg-base)' }}>
      {tabs.map(tab => {
        const isActive  = tab.id === activeTabId
        const isSpecial = SPECIAL.includes(tab.url) || !tab.url
        return (
          <div key={tab.id} className="absolute inset-0"
            style={{ display: isActive ? 'flex' : 'none', flexDirection:'column' }}>
            {isSpecial ? <NewTab /> : isElectron
              ? <ElectronWebview tab={tab} updateTab={updateTab} addRecentPage={addRecentPage} />
              : <IframeTab tab={tab} updateTab={updateTab} addRecentPage={addRecentPage} />
            }
          </div>
        )
      })}
      <PageChat />
    </div>
  )
}
