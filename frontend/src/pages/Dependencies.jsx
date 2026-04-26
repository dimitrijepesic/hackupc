import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Layout/Header';
import useGraphStore from '../store/graphStore';
import useProjectStore from '../store/projectStore';
import { API_BASE } from '../types/api';

const NODE_W = 220;
const NODE_H = 100;
const HANDLE_GAP = 6;

function computeEdgePath(from, to) {
  const dx = Math.abs(to.x - from.x);
  const cp = Math.max(40, dx * 0.4);
  return `M ${from.x} ${from.y} C ${from.x + cp} ${from.y}, ${to.x - cp} ${to.y}, ${to.x} ${to.y}`;
}

function computeArrowHead(target) {
  const s = 5;
  const tipX = target.x - HANDLE_GAP;
  return `M ${tipX - s} ${target.y - s} L ${tipX} ${target.y} L ${tipX - s} ${target.y + s}`;
}

function coverageColor(ratio) {
  if (ratio >= 0.5) return { bg: 'bg-emerald-50', border: 'border-emerald-300', barColor: 'bg-emerald-400', text: 'text-emerald-700' };
  if (ratio >= 0.2) return { bg: 'bg-amber-50', border: 'border-amber-300', barColor: 'bg-amber-400', text: 'text-amber-700' };
  if (ratio > 0) return { bg: 'bg-orange-50', border: 'border-orange-300', barColor: 'bg-orange-400', text: 'text-orange-700' };
  return { bg: 'bg-red-50', border: 'border-red-300', barColor: 'bg-red-400', text: 'text-red-600' };
}

function roleIcon(node) {
  if (node.fan_in === 0 && node.fan_out > 0) return 'login';
  if (node.fan_out === 0 && node.fan_in > 0) return 'logout';
  if (node.depended_by_count >= 3) return 'star';
  if (node.depends_on_count >= 3) return 'account_tree';
  return 'circle';
}

function roleLabel(node) {
  if (node.fan_in === 0 && node.fan_out > 0) return 'Entry Point';
  if (node.fan_out === 0 && node.fan_in > 0) return 'Leaf';
  if (node.depended_by_count >= 3) return 'Core Dependency';
  if (node.depends_on_count >= 3) return 'Coordinator';
  return 'Internal';
}

// ─── Sidebar: identical icon rail as CallGraph/ControlFlow ──────────
import { Link } from 'react-router-dom';
import RepoFooter from '../components/Layout/RepoFooter';

function DepSideNav({ graphId, nodes, selectedNodeId, onFunctionSelect }) {
  const { project } = useProjectStore();
  const [activeTab, setActiveTab] = useState(null);

  const navLinks = [
    { to: '/workspace/call-graph', icon: 'hub', label: 'Call Graph', page: 'call-graph' },
    { to: '/workspace/control-flow', icon: 'fork_right', label: 'Control Flow', page: 'control-flow' },
    { to: '/workspace/dependencies', icon: 'account_tree', label: 'Dependencies', page: 'dependencies' },
  ];

  const tabs = [
    { id: 'functions', icon: 'terminal', label: 'Functions', filled: true },
  ];

  const panelOpen = activeTab === 'functions';
  const railBtnBase = 'w-full flex flex-col items-center py-1.5 sm:py-2 md:py-2.5 rounded transition-all duration-100 ease-in group';
  const railIcon = 'material-symbols-outlined text-[18px] sm:text-[20px] md:text-[22px] md:mb-0.5 group-hover:scale-110 transition-transform';

  return (
    <div className="flex min-h-0 shrink-0 z-40">
      <nav className="w-12 sm:w-12 md:w-14 h-full flex flex-col items-center py-2 sm:py-3 md:py-3 bg-white border-r border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.05)] overflow-y-auto">
        <div className="flex flex-col items-center w-full gap-1 px-0.5 sm:px-1 md:px-2 flex-1">
          {navLinks.map((nl) => (
            <Link
              key={nl.page}
              to={nl.to + (graphId ? `?graph_id=${graphId}` : '')}
              className={`${railBtnBase} ${
                nl.page === 'dependencies'
                  ? 'text-deep-olive bg-soft-sage/30'
                  : 'text-gray-400 hover:bg-soft-sage/20 hover:text-deep-olive'
              }`}
              title={nl.label}
            >
              <span className={railIcon}>{nl.icon}</span>
            </Link>
          ))}

          <div className="w-8 h-px bg-gray-200 my-1" />

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
              className={`${railBtnBase} ${
                activeTab === tab.id
                  ? 'text-deep-olive bg-soft-sage/20'
                  : 'text-gray-400 hover:bg-soft-sage/20 hover:text-deep-olive'
              }`}
              title={tab.label}
            >
              <span
                className={railIcon}
                style={activeTab === tab.id && tab.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
            </button>
          ))}
        </div>

        <RepoFooter
          project={project}
          graphId={graphId}
          onReloaded={() => { if (graphId) useGraphStore.getState().loadGraph(graphId); }}
        />
      </nav>

      {/* Functions panel */}
      <div
        className={`h-full overflow-hidden transition-[width] duration-200 ease-in-out border-r border-gray-200 ${
          panelOpen ? 'w-64 sm:w-72' : 'w-0 border-r-0'
        }`}
      >
        <div className="w-64 sm:w-72 h-full bg-gray-50 flex flex-col">
          <div className="h-10 px-3 flex items-center justify-between border-b border-gray-100 shrink-0">
            <span className="font-label-sm text-gray-500 uppercase tracking-wider text-[10px]">Functions</span>
          </div>
          <div className="flex-1 overflow-y-auto py-1 pr-2 min-h-0">
            <SimpleFunctionList nodes={nodes} selectedNodeId={selectedNodeId} onSelect={onFunctionSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleFunctionList({ nodes, selectedNodeId, onSelect }) {
  const [query, setQuery] = useState('');
  const sorted = useMemo(() => {
    const q = query.toLowerCase();
    return nodes
      .filter((n) => !q || n.functionName.toLowerCase().includes(q) || (n.container || '').toLowerCase().includes(q))
      .sort((a, b) => (a.functionName || '').localeCompare(b.functionName || ''));
  }, [nodes, query]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1.5 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search functions..."
          className="w-full px-2.5 py-1.5 text-[12px] rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-deep-olive/30"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={`w-full text-left px-3 py-1.5 text-[12px] truncate transition-colors ${
              n.id === selectedNodeId
                ? 'bg-deep-olive/10 text-deep-olive font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-gray-400 text-[10px] mr-1">{n.container ? n.container + '.' : ''}</span>
            {n.functionName}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────

export default function Dependencies() {
  const { graphId, nodes, selectedNodeId, selectNode, loading: graphLoading, error: graphError } = useGraphStore();
  const { project, setProject } = useProjectStore();
  const [searchParams] = useSearchParams();

  const [depData, setDepData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDep, setSelectedDep] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const canvasRef = useRef(null);

  const loadGraph = useGraphStore((s) => s.loadGraph);
  useEffect(() => {
    const qGraphId = searchParams.get('graph_id');
    if (qGraphId && qGraphId !== graphId) {
      loadGraph(qGraphId);
      setProject({ name: qGraphId, branch: 'main' });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!graphId) return;
    setLoading(true);
    fetch(`${API_BASE}/graph/${graphId}/dependencies`)
      .then((r) => r.json())
      .then((data) => { setDepData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [graphId]);

  const positions = useMemo(() => {
    if (!depData) return {};
    const pos = {};
    const byLayer = {};
    depData.nodes.forEach((n) => {
      const l = n.layer || 0;
      if (!byLayer[l]) byLayer[l] = [];
      byLayer[l].push(n);
    });
    const GAP_X = 320, GAP_Y = 140;
    Object.entries(byLayer).forEach(([layer, layerNodes]) => {
      const col = Number(layer);
      const totalH = (layerNodes.length - 1) * GAP_Y;
      const startY = 200 - totalH / 2;
      layerNodes.forEach((n, i) => {
        pos[n.id] = { x: 80 + col * GAP_X, y: Math.round(startY + i * GAP_Y) };
      });
    });
    return pos;
  }, [depData]);

  // Auto-fit on every data change and mount
  const _fitDep = useCallback(() => {
    const ids = Object.keys(positions);
    if (ids.length === 0 || !canvasRef.current) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach((id) => {
      const p = positions[id];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + NODE_W > maxX) maxX = p.x + NODE_W;
      if (p.y + NODE_H > maxY) maxY = p.y + NODE_H;
    });
    const cW = maxX - minX, cH = maxY - minY;
    if (cW <= 0 || cH <= 0) return;
    const el = canvasRef.current;
    const w = el.clientWidth - 160, h = el.clientHeight - 160;
    const z = Math.max(0.15, Math.min(1.5, Math.min(w / cW, h / cH)));
    const cx = minX + cW / 2, cy = minY + cH / 2;
    setZoom(z);
    setPan({ x: el.clientWidth / 2 - cx * z, y: el.clientHeight / 2 - cy * z });
  }, [positions]);

  useEffect(() => {
    const t = setTimeout(_fitDep, 100);
    return () => clearTimeout(t);
  }, [_fitDep]);

  useEffect(() => {
    const t = setTimeout(_fitDep, 200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.15, Math.min(3, z + (e.deltaY > 0 ? -0.08 : 0.08))));
  }, []);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e) => { if (e.button !== 0) return; setDragging(true); dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; };
  const handleMouseMove = (e) => { if (!dragging || !dragStart.current) return; setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const handleMouseUp = () => { setDragging(false); dragStart.current = null; };

  const stats = useMemo(() => {
    if (!depData) return null;
    const totalModules = depData.nodes.length;
    const totalEdges = depData.edges.length;
    const avgCoverage = totalModules > 0
      ? Math.round(depData.nodes.reduce((s, n) => s + n.test_coverage, 0) / totalModules * 100) : 0;
    return { totalModules, totalEdges, avgCoverage, layers: depData.layer_count };
  }, [depData]);

  if (graphLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <Header activePage="dependencies" />
        <div className="flex flex-col items-center gap-4 pt-20">
          <span className="material-symbols-outlined text-[48px] text-deep-olive animate-spin">progress_activity</span>
          <p className="text-gray-600 text-lg">Loading graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen font-body-md text-body-md text-on-surface overflow-hidden" style={{ backgroundColor: '#f9fafb' }}>
      <Header activePage="dependencies" />

      <div className="flex flex-1 pt-14 sm:pt-16 min-h-0 overflow-hidden">
        <DepSideNav
          graphId={graphId}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onFunctionSelect={(id) => selectNode(id)}
        />

        <main className="flex-1 flex min-h-0 relative">
          {/* Toolbar */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 flex items-center gap-2">
            <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-3">
              <span className="font-semibold text-[13px] text-gray-800">Dependencies</span>
              {stats && (
                <>
                  <span className="text-[11px] text-gray-500">{stats.totalModules} modules</span>
                  <span className="text-[11px] text-gray-500">{stats.totalEdges} deps</span>
                  <span className="text-[11px] text-gray-500">{stats.layers} layers</span>
                  <span className={`text-[11px] font-semibold ${stats.avgCoverage >= 30 ? 'text-emerald-600' : stats.avgCoverage > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                    {stats.avgCoverage}% avg coverage
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-12 left-2 sm:left-4 z-10 glass-panel rounded-lg px-3 py-2 flex flex-col gap-1.5">
            <div className="text-[10px] font-semibold text-gray-600">Coverage</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-[9px] text-gray-500">&ge;50%</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[9px] text-gray-500">&ge;20%</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" /><span className="text-[9px] text-gray-500">&gt;0%</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-[9px] text-gray-500">0%</span></div>
            </div>
            <div className="text-[10px] font-semibold text-gray-600 mt-1">Role</div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] text-gray-500">login</span><span className="text-[9px] text-gray-500">Entry</span></div>
              <div className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] text-gray-500">logout</span><span className="text-[9px] text-gray-500">Leaf</span></div>
              <div className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] text-gray-500">star</span><span className="text-[9px] text-gray-500">Core</span></div>
              <div className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] text-gray-500">account_tree</span><span className="text-[9px] text-gray-500">Coord</span></div>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 node-canvas-bg relative overflow-hidden h-full"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-[14px] text-gray-500">Loading dependencies...</div>
              </div>
            )}

            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
              {depData && (
                <>
                  <svg className="absolute pointer-events-none" style={{ top: 0, left: 0, width: 8000, height: 8000, overflow: 'visible' }}>
                    {depData.edges.map((edge, i) => {
                      const sp = positions[edge.source];
                      const tp = positions[edge.target];
                      if (!sp || !tp) return null;
                      const from = { x: sp.x + NODE_W, y: sp.y + NODE_H / 2 };
                      const to = { x: tp.x, y: tp.y + NODE_H / 2 };
                      const isSelected = selectedDep === edge.source || selectedDep === edge.target;
                      const strokeW = Math.min(5, Math.max(1.2, Math.log2(edge.weight + 1) * 1.2));
                      return (
                        <g key={`dep-${i}`}>
                          <path className="connection-line" d={computeEdgePath(from, to)}
                            style={{ strokeWidth: strokeW, opacity: selectedDep ? (isSelected ? 0.8 : 0.15) : 0.5, stroke: isSelected ? '#4f46e5' : undefined }} />
                          <path className="connection-line" d={computeArrowHead(to)}
                            style={{ opacity: selectedDep ? (isSelected ? 0.7 : 0.1) : 0.4 }} />
                        </g>
                      );
                    })}
                  </svg>

                  {depData.nodes.map((node) => {
                    const pos = positions[node.id];
                    if (!pos) return null;
                    const cc = coverageColor(node.test_coverage);
                    const isSelected = selectedDep === node.id;
                    const isDimmed = selectedDep && !isSelected;
                    return (
                      <div
                        key={node.id}
                        className={`absolute rounded-xl border-2 ${cc.border} ${cc.bg} transition-all duration-200 cursor-pointer hover:shadow-lg
                          ${isSelected ? 'ring-2 ring-indigo-400 shadow-lg scale-[1.03]' : ''} ${isDimmed ? 'opacity-30' : ''}`}
                        style={{ top: pos.y, left: pos.x, width: NODE_W, height: NODE_H }}
                        onClick={() => setSelectedDep(isSelected ? null : node.id)}
                      >
                        <div className="px-3 py-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-gray-500" title={roleLabel(node)}>{roleIcon(node)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[13px] text-gray-800 truncate">{node.label}</div>
                            <div className="text-[9px] text-gray-400 truncate">{node.file}</div>
                          </div>
                        </div>
                        <div className="px-3 flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">{node.function_count} fn</span>
                          <span className="text-[10px] text-gray-400">|</span>
                          <span className="text-[10px] text-gray-500" title="Depends on">{node.depends_on_count} out</span>
                          <span className="text-[10px] text-gray-400">|</span>
                          <span className="text-[10px] text-gray-500" title="Depended by">{node.depended_by_count} in</span>
                        </div>
                        <div className="px-3 pt-1.5 pb-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className={`h-full rounded-full ${cc.barColor}`}
                              style={{ width: `${Math.max(node.test_coverage * 100, node.test_coverage > 0 ? 8 : 0)}%` }} />
                          </div>
                          <span className={`text-[9px] font-semibold ${cc.text} w-7 text-right`}>{Math.round(node.test_coverage * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-10 glass-panel rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.15, z - 0.15))} className="text-gray-500 hover:text-gray-900 px-0.5 sm:px-1">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">remove</span>
            </button>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-mono w-8 sm:w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} className="text-gray-500 hover:text-gray-900 px-0.5 sm:px-1">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">add</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
