import json
import math
from collections import deque


# ─── Build Call Graph ─────────────────────────────────────────────────────────

def build_call_graph(ir: dict) -> dict:
    qualified_to_id = {}
    name_to_ids = {}
    nodes = []
    raw_edges = []

    for file in ir["files"]:
        path = file["path"]
        category = _get_category(path)

        for fn in file["functions"]:
            node_id = f"func:{path}:{fn['qualified_name']}:{fn['line_start']}"

            node = {
                "id": node_id,
                "type": "function",
                "qualified_name": fn["qualified_name"],
                "name": fn["name"],
                "file": path,
                "line": fn["line_start"],
                "signature": fn["signature"],
                "in_degree": 0,
                "out_degree": 0,
                "category": category,
            }

            nodes.append(node)
            qualified_to_id[fn["qualified_name"]] = node_id

            name = fn["name"]
            if name not in name_to_ids:
                name_to_ids[name] = []
            name_to_ids[name].append(node_id)

            for call in fn["calls"]:
                raw_edges.append((node_id, call))

    edge_counts = {}
    for source_id, call in raw_edges:
        resolved_id = _resolve_call(call, qualified_to_id, name_to_ids)
        if resolved_id is None:
            continue
        if resolved_id == source_id:
            continue

        key = (source_id, resolved_id)
        edge_counts[key] = edge_counts.get(key, 0) + 1

    edges = [
        {"source": src, "target": dst, "type": "calls", "weight": weight}
        for (src, dst), weight in edge_counts.items()
    ]

    node_map = {n["id"]: n for n in nodes}
    for edge in edges:
        node_map[edge["source"]]["out_degree"] += 1
        node_map[edge["target"]]["in_degree"] += 1

    return {
        "graph_id": ir["repo"].split("/")[-1].replace("-swift", ""),
        "nodes": nodes,
        "edges": edges,
    }


# ─── Call Resolution ──────────────────────────────────────────────────────────

def _resolve_call(call: dict, qualified_to_id: dict, name_to_ids: dict) -> str | None:
    """
    Resolution strategy for new IR format with receiver/method/kind fields.

    Priority order:
    1. If kind == "initializer": try to match by method name as a type initializer.
       For "Todo" the qualified name would be "Todo.init".
    2. Try exact qualified_name match using "receiver.method" if receiver is a
       known type (uppercase first letter, not self/super/context/store/etc.)
    3. Try exact qualified_name match on target field directly (backwards compat)
    4. Try unqualified name match on method field (if unique)
    5. Drop
    """
    target = call.get("target", "")
    method = call.get("method", "")
    receiver = call.get("receiver")
    kind = call.get("kind", "call")

    # Always skip unresolved markers
    if target.startswith("?"):
        return None

    # Skip calls with no useful method name
    if not method:
        return None

    # 1. Initializers: try "Method.init" qualified name
    if kind == "initializer":
        init_qname = f"{method}.init"
        if init_qname in qualified_to_id:
            return qualified_to_id[init_qname]
        # Also try just the method name in case it's a free function acting as init
        if method in name_to_ids:
            candidates = name_to_ids[method]
            if len(candidates) == 1:
                return candidates[0]
        return None

    # 2. Receiver is a known type (uppercase = type, not instance variable)
    if receiver and _is_type_receiver(receiver):
        # Try "Receiver.method" as qualified name
        qname = f"{receiver}.{method}"
        if qname in qualified_to_id:
            return qualified_to_id[qname]

    # 3. Try the full target string as a qualified name directly
    #    Handles both old format ("Store.dispatch") and new ("store.dispatch")
    if target in qualified_to_id:
        return qualified_to_id[target]

    # 4. Try method field as unqualified name (unique match only)
    candidates = name_to_ids.get(method, [])
    if len(candidates) == 1:
        return candidates[0]

    return None


def _is_type_receiver(receiver: str) -> bool:
    """
    Returns True if the receiver looks like a type name (class/struct/enum)
    rather than an instance variable or keyword.

    Heuristic: starts with uppercase AND is not a known instance keyword.
    """
    instance_keywords = {
        "self", "super", "store", "context", "state", "queue", "promise",
        "expectation", "notificationCenter", "logic", "item", "middleware",
        "stateUpdater", "sideEffect", "dispatchable", "invocationOrder",
        "invocationResults", "typedContext", "m",
    }
    if not receiver:
        return False
    # Dotted receivers like "DispatchQueue.global" — take the first segment
    first_segment = receiver.split(".")[0]
    if first_segment in instance_keywords:
        return False
    return first_segment[0].isupper()


# ─── Get Node With Neighbors ──────────────────────────────────────────────────

def get_node_with_neighbors(graph: dict, node_id: str) -> dict | None:
    node_map = {n["id"]: n for n in graph["nodes"]}

    if node_id not in node_map:
        return None

    callers = [
        node_map[e["source"]]
        for e in graph["edges"]
        if e["target"] == node_id and e["source"] in node_map
    ]
    callees = [
        node_map[e["target"]]
        for e in graph["edges"]
        if e["source"] == node_id and e["target"] in node_map
    ]

    return {
        "node": node_map[node_id],
        "callers": callers,
        "callees": callees,
    }


# ─── Predict Impact ───────────────────────────────────────────────────────────

def predict_impact(graph: dict, node_id: str) -> list:
    node_map = {n["id"]: n for n in graph["nodes"]}

    if node_id not in node_map:
        return []

    outbound = {}
    inbound = {}
    edge_weight = {}

    for edge in graph["edges"]:
        src, dst = edge["source"], edge["target"]
        outbound.setdefault(src, []).append(dst)
        inbound.setdefault(dst, []).append(src)
        edge_weight[(src, dst)] = edge["weight"]

    visited = {node_id: {"distance": 0, "path": [node_id]}}
    queue = deque([node_id])
    MAX_DISTANCE = 4

    while queue:
        current = queue.popleft()
        current_dist = visited[current]["distance"]

        if current_dist >= MAX_DISTANCE:
            continue

        neighbors = outbound.get(current, []) + inbound.get(current, [])
        for neighbor in neighbors:
            if neighbor not in visited:
                visited[neighbor] = {
                    "distance": current_dist + 1,
                    "path": visited[current]["path"] + [neighbor],
                }
                queue.append(neighbor)

    results = []
    for affected_id, info in visited.items():
        if affected_id == node_id:
            continue

        node = node_map.get(affected_id)
        if node is None:
            continue

        distance = info["distance"]
        path = info["path"]
        w = edge_weight.get(
            (path[-2], path[-1]),
            edge_weight.get((path[-1], path[-2]), 1)
        )
        in_deg = node["in_degree"]
        risk_score = (1.0 / (1 + distance)) * w * (1 + math.log(1 + in_deg))

        results.append({
            "id": affected_id,
            "distance": distance,
            "risk_score": round(risk_score, 4),
            "path": path,
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results[:30]


# ─── Hotspots ─────────────────────────────────────────────────────────────────

def hotspots(graph: dict, top_n: int = 10) -> list:
    sorted_nodes = sorted(graph["nodes"], key=lambda n: n["in_degree"], reverse=True)
    return sorted_nodes[:top_n]


# ─── Dead Code ────────────────────────────────────────────────────────────────

def dead_code(graph: dict) -> list:
    return [
        n for n in graph["nodes"]
        if n["in_degree"] == 0 and n["category"] != "test"
    ]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_category(path: str) -> str:
    if "/Tests/" in path or "Tests/" in path:
        return "test"
    if "/Helpers/" in path or "/Util/" in path:
        return "util"
    return "source"


# ─── Save ─────────────────────────────────────────────────────────────────────

def save_graph(graph: dict, path: str = "backend/cached/katana.graph.json") -> None:
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(graph, f, indent=2)
    print(f"Saved → {path} ({len(graph['nodes'])} nodes, {len(graph['edges'])} edges)")


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import os

    ir_path = os.path.join(os.path.dirname(__file__), "..", "tests", "ir_compiler_tests", "testcase4_katana_renderer.json")
    out_path = os.path.join(os.path.dirname(__file__), "..", "tests", "ir_compiler_tests", "testcase4_output.json")
    with open(ir_path) as f:
        ir = json.load(f)

    graph = build_call_graph(ir)
    save_graph(graph, out_path)