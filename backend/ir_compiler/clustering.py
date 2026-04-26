"""
Hierarchical filesystem-tree clustering for call graphs.

Produces a 2-level tree:
  Top:   each unique directory containing source files
  Leaf:  each file is its own cluster

Functions live inside file clusters. Containers (classes/structs) are kept
as a layout hint (`container_groups`) on each file cluster, not as a separate
cluster level — this matches how engineers actually navigate codebases ("show
me what's in auth/jwt.py") and avoids the singleton-bucket problem the old
(directory, container) grouping created.

Inter-cluster edges are aggregated at the file level so the frontend can
collapse to either dir-level or file-level and recompute visible edges
client-side from the same data.
"""

from __future__ import annotations

from collections import defaultdict
import re


# ─── Main entry point ────────────────────────────────────────────────────────

def compute_clusters(graph: dict) -> dict:
    """
    Build hierarchical clusters from a call graph.

    Returns:
        {
          "tree": [
            {
              "id": "dir:Sources/Foo",
              "label": "Foo",
              "kind": "dir",
              "directory": "Sources/Foo",
              "node_count": <transitive>,
              "file_count": <int>,
              "category_breakdown": {...},   # rolled up from children
              "children": [<file cluster>, ...]
            }, ...
          ],
          "clusters": [<file cluster>, ...],   # flat list, file-level only
          "cluster_edges": [
            {"source": "file:...", "target": "file:...", "weight": int}
          ],
          "node_cluster_map": {"func:...": "file:..."}
        }

    Each file cluster:
        {
          "id": "file:Sources/Foo/Bar.swift",
          "label": "Bar.swift",
          "kind": "file",
          "directory": "Sources/Foo",
          "file": "Sources/Foo/Bar.swift",
          "container": "ClassName" | None,    # set only if file holds one
          "node_ids": [...],
          "node_count": int,
          "internal_edge_count": int,
          "category_breakdown": {...},
          "container_groups": {"ClassName": [ids], "_free": [ids]}
        }
    """
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    if not nodes:
        return {
            "tree": [],
            "clusters": [],
            "cluster_edges": [],
            "node_cluster_map": {},
        }

    # ── Group nodes by file ─────────────────────────────────────────────
    by_file: dict[str, list[dict]] = defaultdict(list)
    for node in nodes:
        f = node.get("file") or "_root"
        by_file[f].append(node)

    # ── Build file-level clusters ───────────────────────────────────────
    file_clusters: list[dict] = []
    node_cluster_map: dict[str, str] = {}

    for file_path, file_nodes in by_file.items():
        cluster_id = _file_cluster_id(file_path)
        directory = _get_directory(file_path)
        node_ids = [n["id"] for n in file_nodes]

        cat_breakdown: dict[str, int] = defaultdict(int)
        for n in file_nodes:
            cat_breakdown[n.get("category", "source")] += 1

        container_groups: dict[str, list[str]] = defaultdict(list)
        for n in file_nodes:
            container = _get_container(n) or "_free"
            container_groups[container].append(n["id"])

        # If the file holds exactly one named container, surface it for
        # the existing UI (which renders `cluster.container` when set).
        named = [k for k in container_groups if k != "_free"]
        single_container = named[0] if len(named) == 1 and not container_groups.get("_free") else None

        id_set = set(node_ids)
        internal = sum(
            1 for e in edges
            if e["source"] in id_set and e["target"] in id_set
        )

        file_clusters.append({
            "id": cluster_id,
            "label": _file_label(file_path),
            "kind": "file",
            "directory": directory,
            "file": file_path,
            "container": single_container,
            "node_ids": sorted(node_ids),
            "node_count": len(node_ids),
            "internal_edge_count": internal,
            "category_breakdown": dict(cat_breakdown),
            "container_groups": {k: sorted(v) for k, v in container_groups.items()},
        })

        for nid in node_ids:
            node_cluster_map[nid] = cluster_id

    # ── Group file clusters by directory into the tree ──────────────────
    by_dir: dict[str, list[dict]] = defaultdict(list)
    for fc in file_clusters:
        by_dir[fc["directory"]].append(fc)

    tree: list[dict] = []
    for directory, files in by_dir.items():
        files_sorted = sorted(files, key=lambda c: c["label"].lower())
        node_count = sum(c["node_count"] for c in files_sorted)
        cat_rollup: dict[str, int] = defaultdict(int)
        for c in files_sorted:
            for cat, n in c["category_breakdown"].items():
                cat_rollup[cat] += n

        tree.append({
            "id": _dir_cluster_id(directory),
            "label": _dir_label(directory),
            "kind": "dir",
            "directory": directory,
            "node_count": node_count,
            "file_count": len(files_sorted),
            "category_breakdown": dict(cat_rollup),
            "children": files_sorted,
        })

    # Biggest dirs first; "_root" pinned to the end.
    tree.sort(key=lambda d: (d["directory"] == "_root", -d["node_count"]))

    # Flat back-compat list: largest files first.
    file_clusters.sort(key=lambda c: c["node_count"], reverse=True)

    cluster_edges = _compute_cluster_edges(edges, node_cluster_map)

    return {
        "tree": tree,
        "clusters": file_clusters,
        "cluster_edges": cluster_edges,
        "node_cluster_map": node_cluster_map,
    }


# ─── Path / label helpers ────────────────────────────────────────────────────

def _get_directory(file_path: str) -> str:
    parts = file_path.replace("\\", "/").split("/")
    return "/".join(parts[:-1]) if len(parts) > 1 else "_root"


def _get_container(node: dict) -> str | None:
    container = node.get("container")
    if container:
        return container
    qn = node.get("qualified_name", "")
    if "." in qn:
        return qn.rsplit(".", 1)[0]
    return None


def _file_label(file_path: str) -> str:
    parts = file_path.replace("\\", "/").split("/")
    return parts[-1] or file_path


def _dir_label(directory: str) -> str:
    if directory == "_root":
        return "Root"
    parts = directory.replace("\\", "/").split("/")
    return parts[-1] or directory


def _slugify(text: str) -> str:
    text = text.replace("/", "_").replace("\\", "_").replace(".", "_")
    text = re.sub(r"[^a-zA-Z0-9_]", "", text)
    text = re.sub(r"_+", "_", text).strip("_").lower()
    return text or "misc"


def _file_cluster_id(file_path: str) -> str:
    return f"file:{file_path}"


def _dir_cluster_id(directory: str) -> str:
    return f"dir:{directory}"


# ─── Inter-cluster edge aggregation ─────────────────────────────────────────

def _compute_cluster_edges(
    edges: list[dict],
    node_cluster_map: dict[str, str],
) -> list[dict]:
    """Aggregate node-level edges into file-level edges."""
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


# ─── LLM-assisted labeling (file-level) ──────────────────────────────────────

def label_clusters_with_llm(clusters: list[dict], graph: dict) -> list[dict]:
    """
    Assign short human-readable labels to file clusters via the LLM.
    Falls back to heuristic file names if the LLM is unavailable.
    Mutates `clusters` in place.
    """
    try:
        from llm.cache import cached_complete
    except ImportError:
        return clusters

    SYSTEM = """You are a senior software architect labeling source files.
Given a list of function names in a file, assign a short (2-4 word) label
describing the file's role. Reply with ONLY the label.

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
            f"File: {cluster.get('file', cluster.get('directory', ''))}\n"
            f"Functions ({cluster['node_count']} total, "
            f"showing first {len(node_names)}):\n"
            + "\n".join(f"  - {n}" for n in node_names)
            + "\n\nLabel this file:"
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
