"""
Per-node importance scoring for call graphs.

We use a weighted PageRank (rank flows along caller → callee edges) blended
with a normalized out-degree term so orchestrators — high-fan-out nodes that
may have low in-degree — still surface as important.

Output is normalized to [0, 1] so a frontend slider can threshold uniformly
across graphs of any size.
"""

from __future__ import annotations

from collections import defaultdict


def compute_importance(
    nodes: list[dict],
    edges: list[dict],
    *,
    damping: float = 0.85,
    iterations: int = 30,
) -> dict[str, float]:
    """
    Returns {node_id: importance ∈ [0, 1]}.

    Algorithm:
      1. Weighted PageRank: rank flows from caller to callee proportional to
         edge weight. Dangling nodes (no out-edges) redistribute uniformly.
      2. Out-degree term: each node gets a normalized "fan-out" score.
      3. Final score = 0.7 * pagerank_norm + 0.3 * out_degree_norm.
    """
    if not nodes:
        return {}

    n = len(nodes)
    base = 1.0 / n
    rank: dict[str, float] = {node["id"]: base for node in nodes}

    out_neighbors: dict[str, list[tuple[str, float]]] = defaultdict(list)
    out_weight: dict[str, float] = defaultdict(float)
    for e in edges:
        src, dst = e["source"], e["target"]
        if src == dst or src not in rank or dst not in rank:
            continue
        w = float(e.get("weight", 1) or 1)
        out_neighbors[src].append((dst, w))
        out_weight[src] += w

    teleport = (1.0 - damping) / n

    for _ in range(iterations):
        next_rank = {nid: teleport for nid in rank}
        leaked = 0.0
        for nid, r in rank.items():
            ow = out_weight.get(nid, 0.0)
            if ow == 0.0:
                leaked += damping * r
                continue
            for dst, w in out_neighbors[nid]:
                next_rank[dst] += damping * r * (w / ow)
        if leaked:
            share = leaked / n
            for nid in next_rank:
                next_rank[nid] += share
        rank = next_rank

    max_pr = max(rank.values(), default=1.0) or 1.0
    pr_norm = {nid: r / max_pr for nid, r in rank.items()}

    max_out_w = max(out_weight.values(), default=0.0) or 1.0
    out_norm = {nid: out_weight.get(nid, 0.0) / max_out_w for nid in rank}

    return {nid: 0.7 * pr_norm[nid] + 0.3 * out_norm[nid] for nid in rank}
