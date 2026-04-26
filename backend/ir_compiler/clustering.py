"""
Container-based clustering for call graphs with Louvain mega-grouping.

Level 1: Groups functions by their container (class/struct/protocol/etc).
Level 2: If container count exceeds MEGA_THRESHOLD, runs Louvain community
         detection on the container-level graph to produce mega-groups.

The frontend receives both levels and can drill:
  mega-group → containers → nodes  (when mega-groups exist)
  container → nodes                (when few containers)
"""

from __future__ import annotations

from collections import defaultdict
import re

import networkx as nx
from networkx.algorithms.community import louvain_communities

MEGA_THRESHOLD = 15


# ─── Main entry point ────────────────────────────────────────────────────────

def compute_clusters(graph: dict) -> dict:
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    if not nodes:
        return _empty_result()

    # ── Step 1: Build container-level clusters ────────────────────────
    container_clusters, node_cluster_map = _build_container_clusters(nodes, edges)

    # ── Step 2: Assign graph-topology roles to each node ──────────────
    _assign_roles(nodes, edges)

    container_edges = _compute_cluster_edges(edges, node_cluster_map)

    # ── Step 3: If too many containers, apply Louvain mega-grouping ───
    if len(container_clusters) > MEGA_THRESHOLD:
        mega_groups, mega_edges, container_mega_map = _build_mega_groups(
            container_clusters, container_edges
        )
        return {
            "clusters": mega_groups,
            "cluster_edges": mega_edges,
            "node_cluster_map": node_cluster_map,
            "has_mega_groups": True,
            "container_clusters": container_clusters,
            "container_edges": container_edges,
            "container_mega_map": container_mega_map,
        }

    return {
        "clusters": container_clusters,
        "cluster_edges": container_edges,
        "node_cluster_map": node_cluster_map,
        "has_mega_groups": False,
        "container_clusters": container_clusters,
        "container_edges": container_edges,
        "container_mega_map": {},
    }


def _empty_result() -> dict:
    return {
        "clusters": [],
        "cluster_edges": [],
        "node_cluster_map": {},
        "has_mega_groups": False,
        "container_clusters": [],
        "container_edges": [],
        "container_mega_map": {},
    }


# ─── Container clustering ──────────────────────────────────────────────────

def _build_container_clusters(
    nodes: list[dict], edges: list[dict]
) -> tuple[list[dict], dict[str, str]]:
    by_container: dict[str, list[dict]] = defaultdict(list)
    for node in nodes:
        container = _get_container(node) or "_free"
        by_container[container].append(node)

    container_clusters: list[dict] = []
    node_cluster_map: dict[str, str] = {}

    for container_name, container_nodes in by_container.items():
        cluster_id = _container_cluster_id(container_name)
        node_ids = [n["id"] for n in container_nodes]

        cat_breakdown: dict[str, int] = defaultdict(int)
        for n in container_nodes:
            cat_breakdown[n.get("category", "source")] += 1

        id_set = set(node_ids)
        internal = sum(
            1 for e in edges
            if e["source"] in id_set and e["target"] in id_set
        )

        file_counts: dict[str, int] = defaultdict(int)
        for n in container_nodes:
            f = n.get("file", "")
            if f:
                file_counts[f] += 1
        primary_file = max(file_counts, key=file_counts.get) if file_counts else ""

        label = container_name if container_name != "_free" else "Free Functions"

        container_clusters.append({
            "id": cluster_id,
            "label": label,
            "kind": "container",
            "container": container_name if container_name != "_free" else None,
            "file": primary_file,
            "node_ids": sorted(node_ids),
            "node_count": len(node_ids),
            "internal_edge_count": internal,
            "category_breakdown": dict(cat_breakdown),
        })

        for nid in node_ids:
            node_cluster_map[nid] = cluster_id

    container_clusters.sort(key=lambda c: c["node_count"], reverse=True)
    return container_clusters, node_cluster_map


# ─── Role detection from graph topology ─────────────────────────────────────

def _assign_roles(nodes: list[dict], edges: list[dict]) -> None:
    """Mutate each node dict to add a 'role' field based on in/out degree."""
    in_deg: dict[str, int] = defaultdict(int)
    out_deg: dict[str, int] = defaultdict(int)
    for e in edges:
        if e["source"] != e["target"]:
            out_deg[e["source"]] += 1
            in_deg[e["target"]] += 1

    for n in nodes:
        nid = n["id"]
        ind = in_deg.get(nid, 0)
        outd = out_deg.get(nid, 0)

        if ind == 0 and outd > 0:
            n["role"] = "entry_point"
        elif ind > 0 and outd == 0:
            n["role"] = "leaf"
        elif ind >= 3:
            n["role"] = "shared_dependency"
        elif outd >= 3:
            n["role"] = "coordinator"
        else:
            n["role"] = "internal"


# ─── Louvain mega-grouping ─────────────────────────────────────────────────

def _build_mega_groups(
    container_clusters: list[dict],
    container_edges: list[dict],
) -> tuple[list[dict], list[dict], dict[str, str]]:
    """
    Run Louvain community detection on the container-level graph.
    Returns (mega_group_clusters, mega_edges, container_mega_map).
    """
    G = nx.Graph()
    for c in container_clusters:
        G.add_node(c["id"])
    for ce in container_edges:
        w = ce.get("weight", 1)
        if G.has_edge(ce["source"], ce["target"]):
            G[ce["source"]][ce["target"]]["weight"] += w
        else:
            G.add_edge(ce["source"], ce["target"], weight=w)

    # Louvain needs an undirected graph. resolution controls granularity.
    try:
        communities = louvain_communities(G, weight="weight", resolution=1.0, seed=42)
    except Exception:
        # Fallback: each container is its own "mega-group" (no grouping)
        communities = [{cid} for cid in G.nodes()]

    # Build a lookup from container to its cluster object
    cluster_by_id = {c["id"]: c for c in container_clusters}

    container_mega_map: dict[str, str] = {}
    mega_groups: list[dict] = []

    for i, community in enumerate(sorted(communities, key=len, reverse=True)):
        community_containers = [cluster_by_id[cid] for cid in community if cid in cluster_by_id]
        if not community_containers:
            continue

        # Label: pick the largest container's name, or combine top 2-3
        sorted_by_size = sorted(community_containers, key=lambda c: c["node_count"], reverse=True)
        if len(sorted_by_size) == 1:
            mega_label = sorted_by_size[0]["label"]
        elif len(sorted_by_size) <= 3:
            mega_label = " + ".join(c["label"] for c in sorted_by_size)
        else:
            mega_label = " + ".join(c["label"] for c in sorted_by_size[:2]) + f" +{len(sorted_by_size) - 2}"

        mega_id = f"mega:{i}:{_slugify(mega_label[:40])}"

        # Collect all node_ids from member containers
        all_node_ids = []
        child_cluster_ids = []
        total_internal = 0
        cat_rollup: dict[str, int] = defaultdict(int)

        for c in community_containers:
            all_node_ids.extend(c["node_ids"])
            child_cluster_ids.append(c["id"])
            total_internal += c["internal_edge_count"]
            for cat, count in c.get("category_breakdown", {}).items():
                cat_rollup[cat] += count

        # Also count edges between containers within this mega-group
        member_set = set(child_cluster_ids)
        for ce in container_edges:
            if ce["source"] in member_set and ce["target"] in member_set:
                total_internal += ce.get("weight", 1)

        mega_groups.append({
            "id": mega_id,
            "label": mega_label,
            "kind": "mega",
            "node_ids": sorted(all_node_ids),
            "node_count": len(all_node_ids),
            "child_cluster_ids": sorted(child_cluster_ids),
            "child_count": len(child_cluster_ids),
            "internal_edge_count": total_internal,
            "category_breakdown": dict(cat_rollup),
        })

        for cid in child_cluster_ids:
            container_mega_map[cid] = mega_id

    # Build mega-level edges
    mega_edge_weights: dict[tuple[str, str], int] = defaultdict(int)
    for ce in container_edges:
        src_mega = container_mega_map.get(ce["source"])
        dst_mega = container_mega_map.get(ce["target"])
        if src_mega and dst_mega and src_mega != dst_mega:
            mega_edge_weights[(src_mega, dst_mega)] += ce.get("weight", 1)

    mega_edges = [
        {"source": s, "target": t, "weight": w}
        for (s, t), w in sorted(mega_edge_weights.items(), key=lambda kv: kv[1], reverse=True)
    ]

    return mega_groups, mega_edges, container_mega_map


# ─── Helpers ────────────────────────────────────────────────────────────────

def _get_container(node: dict) -> str | None:
    container = node.get("container")
    if container:
        return container
    qn = node.get("qualified_name", "")
    if "." in qn:
        return qn.rsplit(".", 1)[0]
    return None


def _container_cluster_id(container_name: str) -> str:
    return f"container:{container_name}"


def _slugify(text: str) -> str:
    text = text.replace("/", "_").replace("\\", "_").replace(".", "_")
    text = re.sub(r"[^a-zA-Z0-9_]", "", text)
    text = re.sub(r"_+", "_", text).strip("_").lower()
    return text or "misc"


def _compute_cluster_edges(
    edges: list[dict],
    node_cluster_map: dict[str, str],
) -> list[dict]:
    """Aggregate node-level edges into container-level edges."""
    weights: dict[tuple[str, str], int] = defaultdict(int)
    for edge in edges:
        src = node_cluster_map.get(edge["source"])
        dst = node_cluster_map.get(edge["target"])
        if src and dst and src != dst:
            weights[(src, dst)] += edge.get("weight", 1)

    return [
        {"source": s, "target": t, "weight": w}
        for (s, t), w in sorted(weights.items(), key=lambda kv: kv[1], reverse=True)
    ]


# ─── LLM-assisted labeling ─────────────────────────────────────────────────

def label_clusters_with_llm(clusters: list[dict], graph: dict) -> list[dict]:
    """
    Assign short human-readable labels to container clusters via the LLM.
    Mutates `clusters` in place.
    """
    try:
        from llm.cache import cached_complete
    except ImportError:
        return clusters

    SYSTEM = """You are a senior software architect labeling code containers.
Given a list of function names in a class/struct/module, assign a short (2-4 word) label
describing the container's role. Reply with ONLY the label.

Examples:
- "State Management"
- "HTTP Request Router"
- "Test Helpers"
- "Side Effect Engine"
"""

    for cluster in clusters:
        node_names: list[str] = []
        for nid in cluster.get("node_ids", [])[:15]:
            parts = nid.split(":", 3)
            if len(parts) >= 3:
                node_names.append(parts[2])

        if not node_names:
            continue

        user_prompt = (
            f"Container: {cluster.get('container', cluster.get('label', ''))}\n"
            f"Functions ({cluster['node_count']} total, "
            f"showing first {len(node_names)}):\n"
            + "\n".join(f"  - {n}" for n in node_names)
            + "\n\nLabel this container:"
        )

        try:
            resp = cached_complete(
                use_case="cluster_label",
                params={"cluster_id": cluster["id"]},
                content_signature="|".join(node_names[:10]),
                system=SYSTEM,
                user=user_prompt,
                max_tokens=30,
            )
            label = resp.text.strip().strip('"').strip("'")
            if 1 < len(label) < 60:
                cluster["ai_label"] = label
        except Exception:
            pass

    return clusters
