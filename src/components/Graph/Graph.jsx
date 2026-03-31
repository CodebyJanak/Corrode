/**
 * Graph.jsx — Knowledge Graph — Corrode Browser
 */
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, GitBranch } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'
import { db } from '../../platform'

const COLORS = { tech:'#3b82f6', news:'#ef4444', social:'#a855f7', science:'#22c55e', finance:'#eab308', default:'#c94a0a' }
function getColor(topics=[]) {
  for (const t of topics) {
    const k = Object.keys(COLORS).find(k => t.toLowerCase().includes(k))
    if (k) return COLORS[k]
  }
  return COLORS.default
}

export default function Graph() {
  const { closeGraph, addTab } = useBrowserStore()
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getGraphData().then(data => {
      setLoading(false)
      if (data?.nodes?.length > 0) renderGraph(data)
    }).catch(() => setLoading(false))
  }, [])

  function renderGraph({ nodes, links }) {
    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()
      const W = svgRef.current.clientWidth, H = svgRef.current.clientHeight
      const g = svg.append('g')
      svg.call(d3.zoom().scaleExtent([0.3,3]).on('zoom', e => g.attr('transform', e.transform)))

      const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d=>d.id).distance(90).strength(d=>d.strength*0.1))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(W/2, H/2))
        .force('collision', d3.forceCollide(30))

      const link = g.append('g').selectAll('line').data(links).join('line')
        .attr('stroke', 'rgba(150,50,20,0.25)').attr('stroke-width', d=>Math.min(d.strength,2))

      const node = g.append('g').selectAll('circle').data(nodes).join('circle')
        .attr('r', d => 7 + Math.min(d.weight,6))
        .attr('fill', d => getColor(d.topics))
        .attr('fill-opacity', 0.85)
        .attr('stroke', 'rgba(255,255,255,0.1)')
        .attr('stroke-width', 1)
        .style('cursor','pointer')
        .call(d3.drag()
          .on('start', (e,d)=>{ if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y })
          .on('drag',  (e,d)=>{ d.fx=e.x; d.fy=e.y })
          .on('end',   (e,d)=>{ if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null }))
        .on('mouseover', (e,d)=>setTooltip({x:e.clientX,y:e.clientY,data:d}))
        .on('mouseleave', ()=>setTooltip(null))
        .on('dblclick', (_,d)=>{ addTab(d.url); closeGraph() })

      const label = g.append('g').selectAll('text').data(nodes).join('text')
        .text(d=>(d.title||d.domain||'').slice(0,18))
        .attr('font-size',10).attr('fill','rgba(200,140,100,0.6)').attr('text-anchor','middle').attr('dy','2.2em')
        .style('pointer-events','none')

      sim.on('tick',()=>{
        link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y)
        node.attr('cx',d=>d.x).attr('cy',d=>d.y)
        label.attr('x',d=>d.x).attr('y',d=>d.y)
      })
    })
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex flex-col rust-texture">
      <div className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom:'1px solid rgba(100,35,15,0.4)', background:'rgba(8,3,4,0.9)' }}>
        <div className="flex items-center gap-3">
          <GitBranch size={17} style={{ color:'var(--ember)' }} />
          <h2 className="text-sm font-semibold font-sans" style={{ color:'var(--text-primary)' }}>Knowledge Graph</h2>
          <span className="text-xs" style={{ color:'var(--text-muted)' }}>Double-click a node to open</span>
        </div>
        <button onClick={closeGraph} className="p-2 rounded transition-colors" style={{ color:'var(--text-muted)' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 relative">
        {loading
          ? <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 mx-auto mb-3 animate-spin"
                  style={{ borderColor:'var(--ember)', borderTopColor:'transparent' }} />
                <p className="text-xs" style={{ color:'var(--text-muted)' }}>Building graph…</p>
              </div>
            </div>
          : <svg ref={svgRef} className="w-full h-full" />}
      </div>
      {tooltip && (
        <div className="fixed z-50 rounded-xl px-3 py-2 pointer-events-none text-xs"
          style={{ left:tooltip.x+12, top:tooltip.y-40, background:'rgba(12,5,6,0.95)', border:'1px solid rgba(120,40,20,0.5)', maxWidth:200 }}>
          <p className="font-medium truncate" style={{ color:'var(--text-primary)' }}>{tooltip.data.title}</p>
          <p className="truncate" style={{ color:'var(--text-muted)' }}>{tooltip.data.domain}</p>
          {tooltip.data.topics?.length > 0 && <p style={{ color:'var(--ember)' }}>{tooltip.data.topics.join(', ')}</p>}
        </div>
      )}
    </motion.div>
  )
}
