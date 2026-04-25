import { create } from 'zustand';
import { defaultNodes, defaultEdges } from '../data/mockData';

const useGraphStore = create((set, get) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  selectedNodeId: 'node-2',

  selectNode: (id) => set({ selectedNodeId: id }),

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

  autoLayout: () =>
    set((state) => {
      const { nodes, edges } = state;
      if (nodes.length === 0) return state;

      const inDeg = {};
      const children = {};
      nodes.forEach((n) => { inDeg[n.id] = 0; children[n.id] = []; });
      edges.forEach((e) => {
        inDeg[e.target] = (inDeg[e.target] || 0) + 1;
        if (children[e.source]) children[e.source].push(e.target);
      });

      // BFS to assign layers
      const roots = nodes.filter((n) => !inDeg[n.id]);
      if (roots.length === 0) roots.push(nodes[0]); // cycle fallback
      const depth = {};
      const visited = new Set();
      const queue = roots.map((n) => ({ id: n.id, d: 0 }));
      while (queue.length) {
        const { id, d } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        depth[id] = d;
        for (const c of children[id] || []) {
          if (!visited.has(c)) queue.push({ id: c, d: d + 1 });
        }
      }
      // Disconnected nodes
      let maxD = Math.max(0, ...Object.values(depth));
      nodes.forEach((n) => { if (!visited.has(n.id)) depth[n.id] = ++maxD; });

      // Group by layer
      const layers = {};
      for (const [id, d] of Object.entries(depth)) {
        (layers[d] = layers[d] || []).push(id);
      }

      const H_GAP = 300;
      const V_GAP = 160;
      const CENTER_Y = 300;
      const START_X = 80;

      const positions = {};
      for (const [d, ids] of Object.entries(layers)) {
        const totalH = (ids.length - 1) * V_GAP;
        const startY = CENTER_Y - totalH / 2;
        ids.forEach((id, i) => {
          positions[id] = { x: START_X + Number(d) * H_GAP, y: Math.round(startY + i * V_GAP) };
        });
      }

      return {
        nodes: nodes.map((n) => ({ ...n, position: positions[n.id] || n.position })),
      };
    }),
}));

export default useGraphStore;
