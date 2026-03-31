import React from 'react'
export default function TitleBar() {
  return (
    <div className="titlebar-drag flex items-center h-8 shrink-0 px-3 transition-colors"
      style={{ background:'var(--bg-chrome)', borderBottom:'1px solid var(--border)' }}>
      <div className="titlebar-no-drag flex items-center gap-1.5">
        <button onClick={() => window.corrode?.close()}   className="w-3 h-3 rounded-full hover:brightness-125 transition-all" style={{ background:'#c94a0a', boxShadow:'0 0 5px rgba(201,74,10,0.5)' }} />
        <button onClick={() => window.corrode?.minimize()} className="w-3 h-3 rounded-full hover:brightness-125 transition-all" style={{ background:'#7a2a08' }} />
        <button onClick={() => window.corrode?.maximize()} className="w-3 h-3 rounded-full hover:brightness-125 transition-all" style={{ background:'#a63a10' }} />
      </div>
      <div className="flex-1 flex justify-center items-center gap-2">
        <img src="/gear.png" className="w-4 h-4" style={{ filter:'drop-shadow(0 0 4px rgba(201,74,10,0.6))', objectFit:'contain' }} alt="" />
        <span className="font-display select-none" style={{ color:'var(--text-muted)', fontSize:'10px', letterSpacing:'0.3em' }}>C O R R O D E</span>
      </div>
    </div>
  )
}
