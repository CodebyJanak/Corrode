/**
 * src/components/Browser/WebviewArea.jsx
 * Manages Electron <webview> elements for each tab.
 * Handles page load events, AI analysis, and focus mode friction.
 */

import React, { useEffect, useRef, useCallback } from 'react'
import useBrowserStore from '../../store/useBrowserStore'
import NewTab from '../NewTab/NewTab'
import PageChat from './PageChat'

const SPECIAL_PAGES = ['corrode://newtab', 'corrode://graph', 'corrode://digest']

export default function WebviewArea() {
  const { tabs, activeTabId, updateTab, addRecentPage, manipulationDetectorOn, focusModeOn } = useBrowserStore()
  const webviewRefs = useRef({})

  // Register a webview ref for a tab
  const setRef = useCallback((id, el) => {
    if (el) webviewRefs.current[id] = el
    else delete webviewRefs.current[id]
  }, [])

  // Wire up global nav events from Toolbar
  useEffect(() => {
    const back    = () => webviewRefs.current[activeTabId]?.goBack()
    const forward = () => webviewRefs.current[activeTabId]?.goForward()
    const reload  = () => webviewRefs.current[activeTabId]?.reload()
    const nav     = (e) => webviewRefs.current[activeTabId]?.loadURL(e.detail)

    window.addEventListener('webview:back',    back)
    window.addEventListener('webview:forward', forward)
    window.addEventListener('webview:reload',  reload)
    window.addEventListener('webview:navigate', nav)
    return () => {
      window.removeEventListener('webview:back',    back)
      window.removeEventListener('webview:forward', forward)
      window.removeEventListener('webview:reload',  reload)
      window.removeEventListener('webview:navigate', nav)
    }
  }, [activeTabId])

  function wireWebview(wv, tabId) {
    if (!wv || wv._corrodeWired) return
    wv._corrodeWired = true

    wv.addEventListener('did-start-loading', () => {
      updateTab(tabId, { loading: true })
    })

    wv.addEventListener('did-stop-loading', () => {
      updateTab(tabId, {
        loading: false,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
        url: wv.getURL(),
        title: wv.getTitle() || wv.getURL(),
      })
    })

    wv.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons?.length > 0) updateTab(tabId, { favicon: e.favicons[0] })
    })

    wv.addEventListener('page-title-updated', (e) => {
      updateTab(tabId, { title: e.title })
    })

    wv.addEventListener('did-finish-load', async () => {
      const url = wv.getURL()
      const title = wv.getTitle()

      if (!url || url.startsWith('corrode://') || url === 'about:blank') return

      // Extract page text content for AI
      let content = ''
      try {
        content = await wv.executeJavaScript(`document.body?.innerText?.slice(0, 10000) || ''`)
      } catch { /* ignore */ }

      // Save to DB and run AI summarization
      if (window.corrode && content) {
        const domain = new URL(url).hostname
        const ai = await window.corrode.ai.summarizePage(url, content)
        if (ai) {
          const pageId = await window.corrode.db.savePage({
            url, title, domain,
            summary: ai.summary,
            key_facts: ai.key_facts,
            topics: ai.topics,
          })
          addRecentPage({ url, title, domain, summary: ai.summary, topics: ai.topics, pageId })
        }

        // Run manipulation detector if enabled
        if (manipulationDetectorOn && ai) {
          const flags = await window.corrode.ai.detectManipulation(content)
          if (flags?.length > 0) {
            // Inject highlights into the page
            injectManipulationHighlights(wv, flags)
          }
        }
      }
    })

    wv.addEventListener('new-window', (e) => {
      // Open new URLs as tabs
      window.dispatchEvent(new CustomEvent('open-tab', { detail: e.url }))
    })
  }

  async function injectManipulationHighlights(wv, flags) {
    const colorMap = { emotional: '#eab308', factual: '#ef4444', dark_ux: '#f97316' }
    const script = flags.map(f => {
      const color = colorMap[f.type] || '#eab308'
      const escaped = f.text.replace(/'/g, "\\'").slice(0, 100)
      return `
        (function() {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
          let node
          while (node = walker.nextNode()) {
            if (node.textContent.includes('${escaped}')) {
              const span = document.createElement('span')
              span.style.cssText = 'background:${color}33;border-bottom:2px solid ${color};cursor:help;border-radius:2px'
              span.title = '[Corrode] ${f.reason.replace(/'/g, "\\'")}'
              const range = document.createRange()
              range.selectNode(node)
              try { range.surroundContents(span) } catch(e) {}
              break
            }
          }
        })()
      `
    }).join(';')
    try { await wv.executeJavaScript(script) } catch { /* ignore */ }
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-void">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId
        const isSpecial = SPECIAL_PAGES.includes(tab.url)

        return (
          <div
            key={tab.id}
            className={`absolute inset-0 ${isActive ? 'block' : 'hidden'}`}
          >
            {isSpecial ? (
              <NewTab />
            ) : (
              <webview
                ref={el => {
                  setRef(tab.id, el)
                  if (el) wireWebview(el, tab.id)
                }}
                src={tab.url || 'about:blank'}
                className="w-full h-full"
                allowpopups="true"
                webpreferences="contextIsolation=no"
              />
            )}
          </div>
        )
      })}

      {/* Floating AI page chat button */}
      <PageChat />
    </div>
  )
}
