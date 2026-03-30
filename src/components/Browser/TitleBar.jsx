/**
 * src/components/Browser/TitleBar.jsx
 * Custom frameless window title bar with traffic light controls.
 */

import React from 'react'

export default function TitleBar() {
  const minimize = () => window.corrode?.minimize()
  const maximize = () => window.corrode?.maximize()
  const close    = () => window.corrode?.close()

  return (
    <div className="titlebar-drag flex items-center h-8 bg-void-100 border-b border-void-300 px-3 shrink-0 rust-accent">
      {/* Traffic light controls */}
      <div className="titlebar-no-drag flex items-center gap-1.5">
        <button
          onClick={close}
          className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all border border-black/20"
          title="Close"
        />
        <button
          onClick={minimize}
          className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all border border-black/20"
          title="Minimize"
        />
        <button
          onClick={maximize}
          className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all border border-black/20"
          title="Maximize"
        />
      </div>

      {/* App name — centered */}
      <div className="flex-1 flex justify-center">
        <span className="text-xs font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase select-none">
          C O R R O D E
        </span>
      </div>
    </div>
  )
}
