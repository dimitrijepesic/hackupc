import { create } from 'zustand';
import dagre from 'dagre';
import { defaultNodes, defaultEdges } from '../data/mockData';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const LAYOUT_ANIM_MS = 500;

let layoutRaf = null;

// easeInOutCubic
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const useGraphStore = create((set, get) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  selectedNodeId: null,
  selectedFile: null,

  selectNode: (id) => set({ selectedNodeId: id, selectedFile: null }),
  selectFile: (filePath) => set({ selectedFile: filePath }),
  closeFile: () => set({ selectedFile: null }),

  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    return nodes.find((n) => n.id === selectedNodeId) || null;
  },

  addNode: (node) => {
    const id = `node-${Date.now()}`;
    set((state) => ({
      nodes: [...state.nodes, { ...node, id }],
      selectedNodeId: id,
    }));
    return id;
  },

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  moveNode: (id, position) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position } : n,
      ),
    })),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, { ...edge, id: `edge-${Date.now()}` }],
    })),

  removeEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    })),

  autoLayout: ({ animate = true } = {}) => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'LR',
      nodesep: 40,
      ranksep: 100,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((n) => {
      g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });
    edges.forEach((e) => {
      if (e.source !== e.target) g.setEdge(e.source, e.target);
    });

    dagre.layout(g);

    const targets = {};
    nodes.forEach((n) => {
      const p = g.node(n.id);
      if (p) targets[n.id] = { x: Math.round(p.x - NODE_WIDTH / 2), y: Math.round(p.y - NODE_HEIGHT / 2) };
    });

    if (!animate) {
      set((state) => ({
        nodes: state.nodes.map((n) => (targets[n.id] ? { ...n, position: targets[n.id] } : n)),
      }));
      return;
    }

    // Snapshot starting positions and tween to targets
    const starts = {};
    nodes.forEach((n) => { starts[n.id] = { x: n.position.x, y: n.position.y }; });

    if (layoutRaf) cancelAnimationFrame(layoutRaf);
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / LAYOUT_ANIM_MS);
      const k = ease(t);
      set((state) => ({
        nodes: state.nodes.map((n) => {
          const s = starts[n.id];
          const e = targets[n.id];
          if (!s || !e) return n;
          return {
            ...n,
            position: {
              x: Math.round(s.x + (e.x - s.x) * k),
              y: Math.round(s.y + (e.y - s.y) * k),
            },
          };
        }),
      }));
      if (t < 1) {
        layoutRaf = requestAnimationFrame(tick);
      } else {
        layoutRaf = null;
      }
    };
    layoutRaf = requestAnimationFrame(tick);
  },
}));

export default useGraphStore;
