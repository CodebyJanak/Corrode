/**
 * src/components/Graph/Graph.jsx
 * Interactive force-directed knowledge graph using D3.js.
 * Shows browsing history as nodes, connected by shared topics.
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, GitBranch, ZoomIn, ZoomOut } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

const TOPIC_COLORS = {
  tech:    '#3b82f6',
  news:    '#ef4444',
  social:  '#a855f7',
  science: '#22c55e',
  finance: '#eab308',
  health:  '#06b6d4',
  art:     '#ec4899',
  default: '#ea580c',
}

function getTopicColor(topics = []) {
  for (const t of topics) {
    const key = Object.keys(TOPIC_COLORS).find(k => t.toLowerCase().includes(k))
    if (key) return TOPIC_COLORS[key]
  }
  return TOPIC_COLORS.default
}

export default function Graph() {
  const { closeGraph, addTab } = useBrowserStore()
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGraph()
  }, [])

  async function loadGraph() {
    const data = await window.corrode?.db.getGraphData() || { nodes: [], links: [] }
    setLoading(false)
    if (data.nodes.length === 0) return
    renderGraph(data)
  }

  function renderGraph({ nodes, links }) {
    // Dynamically import D3
    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const width  = svgRef.current.clientWidth
      const height = svgRef.current.clientHeight

      // Zoom
      const g = svg.append('g')
      svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', e => g.attr('transform', e.transform)))

      // Simulation
      const sim = d3.forceSimulation(nodes)
        .force('link',   d3.forceLink(links).id(d => d.id).distance(80).strength(d => d.strength * 0.1))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide(30))

      // Links
      const link = g.append('g').selectAll('line').data(links).join('line')
        .attr('stroke', 'rgba(234,88,12,0.2)')
        .attr('stroke-width', d => Math.min(d.strength, 3))

      // Nodes
      const node = g.append('g').selectAll('circle').data(nodes).join('circle')
        .attr('r', d => 6 + Math.min(d.weight, 8))
        .attr('fill', d => getTopicColor(d.topics))
        .attr('fill-opacity', 0.8)
        .attr('stroke', 'rgba(255,255,255,0.1)')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .call(d3.drag()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
        )
        .on('mouseover', (e, d) => setTooltip({ x: e.clientX, y: e.clientY, data: d }))
        .on('mouseleave', () => setTooltip(null))
        .on('dblclick', (_, d) => { addTab(d.url); closeGraph() })

      // Labels
      const label = g.append('g').selectAll('text').data(nodes).join('text')
        .text(d => (d.title || d.domain || '').slice(0, 20))
        .attr('font-size', 10)
        .attr('fill', 'rgba(232,232,232,0.7)')
        .attr('text-anchor', 'middle')
        .attr('dy', '2em')
        .style('pointer-events', 'none')

      sim.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
        node.attr('cx', d => d.x).attr('cy', d => d.y)
        label.attr('x', d => d.x).attr('y', d => d.y)
      })
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-void-300">
        <div className="flex items-center gap-3">
          <GitBranch size={18} className="text-rust-500" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Knowledge Graph</h2>
          <span className="text-xs text-[var(--text-muted)]">Double-click a node to open</span>
        </div>
        <button onClick={closeGraph} className="p-2 rounded hover:bg-void-300 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-void-300">
        {Object.entries(TOPIC_COLORS).filter(([k]) => k !== 'default').map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            <span className="text-[10px] text-[var(--text-muted)] capitalize">{k}</span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-rust-600 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-[var(--text-muted)]">Building your knowledge graph…</p>
            </div>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" />
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 glass rounded-lg px-3 py-2 pointer-events-none text-xs max-w-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-medium text-[var(--text-primary)] truncate">{tooltip.data.title}</p>
          <p className="text-[var(--text-muted)] truncate">{tooltip.data.domain}</p>
          {tooltip.data.topics?.length > 0 && (
            <p className="text-rust-400 mt-1">{tooltip.data.topics.join(', ')}</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
